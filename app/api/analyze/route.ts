import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import {
  TextractClient,
  DetectDocumentTextCommand,
} from '@aws-sdk/client-textract'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const textract = new TextractClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// POST /api/analyze
// Accepts multipart form data with a single "file" field.
// 1. Extracts text from the file using AWS Textract
// 2. Passes the text to Claude to generate a structured prior auth draft
// 3. Returns the 7-field JSON to the frontend
export async function POST(request: NextRequest) {
  // Authenticate the user via their Supabase JWT
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse the uploaded file from form data
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // --- Step 1: Extract text with AWS Textract ---
  const arrayBuffer = await file.arrayBuffer()
  const fileBuffer = Buffer.from(arrayBuffer)

  const textractCommand = new DetectDocumentTextCommand({
    Document: { Bytes: fileBuffer },
  })

  let extractedText: string
  try {
    const textractResponse = await textract.send(textractCommand)
    const lines = (textractResponse.Blocks ?? [])
      .filter((block) => block.BlockType === 'LINE')
      .map((block) => block.Text ?? '')

    extractedText = lines.join('\n')
  } catch (err) {
    console.error('Textract error:', err)
    return NextResponse.json(
      { error: 'Failed to extract text from document' },
      { status: 500 }
    )
  }

  if (!extractedText.trim()) {
    return NextResponse.json(
      { error: 'No text could be extracted from the document' },
      { status: 422 }
    )
  }

  // --- Step 2: Generate structured prior auth draft with Claude ---
  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a medical prior authorization specialist. Extract the following fields from the document text below and return them as a JSON object. If a field cannot be found in the document, use exactly this string as the value: "Not found - please complete manually".

Fields to extract:
- patientName: Patient's full name
- dateOfBirth: Patient's date of birth (format: MM/DD/YYYY if available)
- insuranceId: Insurance ID or policy/member number
- diagnosisCode: Primary diagnosis code in ICD-10 format (e.g. J45.909)
- procedureRequested: Procedure or service being requested (include CPT code if available)
- treatingPhysician: Full name of the treating or requesting physician
- medicalNecessityJustification: Clinical justification for why this procedure is medically necessary

Return ONLY a valid JSON object with these exact 7 keys. Do not include any explanation or markdown outside the JSON.

Document text:
${extractedText}`,
        },
      ],
    })
  } catch (err) {
    console.error('Claude error:', err)
    return NextResponse.json(
      { error: 'Failed to generate prior authorization draft' },
      { status: 500 }
    )
  }

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 })
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return NextResponse.json({ error: 'Failed to parse AI response as JSON' }, { status: 500 })
  }

  let extracted: Record<string, string>
  try {
    extracted = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in AI response' }, { status: 500 })
  }

  return NextResponse.json({ success: true, userId: user.id, data: extracted })
}
