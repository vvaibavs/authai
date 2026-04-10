import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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

  const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const result = await model.generateContent(`
You are a medical prior authorization specialist with deep clinical knowledge. Given the document text below, do two things:

1. EXTRACT these fields exactly as they appear in the document. If a field is not found, use exactly: "Not found - please complete manually".
   - patientName
   - dateOfBirth
   - insuranceId
   - diagnosisCode (ICD-10 code and full description)
   - procedureRequested (include CPT code if available)
   - treatingPhysician

2. GENERATE a medicalNecessityJustification. This is the most important output. Write a thorough, professional medical necessity justification paragraph (150–250 words) suitable for submission to an insurance payer. It must:
   - State the patient's diagnosis and relevant clinical findings from the document
   - Explain why the requested procedure is medically necessary given the diagnosis
   - Reference relevant clinical guidelines, standards of care, or evidence-based criteria where applicable
   - Describe what conservative or alternative treatments have been tried or why they are not appropriate
   - Articulate the clinical risk or harm if the procedure is not approved
   - Use formal clinical language appropriate for a prior authorization submission
   - Do NOT use placeholder text — synthesize everything present in the document to make the strongest possible case

Return ONLY valid JSON with these 7 keys, no other text.

Document:
${text}`)

  const responseText = result.response.text()
  console.log('AI response:', responseText);

  const match = responseText.match(/\{[\s\S]*\}/)
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
