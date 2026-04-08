import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import pdfParse from 'pdf-parse'

// POST /api/extract
// Body: multipart form data with a single "file" field
// Returns: { text: string }
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

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const mimeType = file.type || 'application/octet-stream'
  if (!mimeType.includes('pdf')) {
    console.log(formData);
    // return NextResponse.json({ error: 'Only PDF files are supported for text extraction' }, { status: 415 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const parsed = await pdfParse(buffer)
  const text = parsed.text?.trim()

  if (!text) {
    return NextResponse.json({ error: 'No text could be extracted from the document' }, { status: 422 })
  }
  console.log(text);

  return NextResponse.json({ text })
}
