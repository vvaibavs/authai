import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// POST /api/analyze
// Body: { text: string }
// Returns: { data: PriorAuthDraft }
export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { text } = await request.json() as { text?: string }
  if (!text?.trim()) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a medical prior authorization specialist. Extract the following fields from the document text and return them as a JSON object. If a field is not found, use exactly: "Not found - please complete manually".

Fields:
- patientName
- dateOfBirth
- insuranceId
- diagnosisCode (ICD-10)
- procedureRequested (include CPT code if available)
- treatingPhysician
- medicalNecessityJustification

Return ONLY valid JSON with these 7 keys, no other text.

Document:
${text}`,
      },
    ],
  })

  const block = message.content[0]
  if (block.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 })
  }

  const match = block.text.match(/\{[\s\S]*\}/)
  if (!match) {
    return NextResponse.json({ error: 'Could not parse AI response as JSON' }, { status: 500 })
  }

  try {
    const data = JSON.parse(match[0])
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in AI response' }, { status: 500 })
  }
}
