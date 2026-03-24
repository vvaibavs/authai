import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract'

const textract = new TextractClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

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

  const buffer = Buffer.from(await file.arrayBuffer())

  const { Blocks } = await textract.send(
    new DetectDocumentTextCommand({ Document: { Bytes: buffer } })
  )

  const text = (Blocks ?? [])
    .filter(b => b.BlockType === 'LINE')
    .map(b => b.Text ?? '')
    .join('\n')

  if (!text.trim()) {
    return NextResponse.json({ error: 'No text could be extracted from the document' }, { status: 422 })
  }

  return NextResponse.json({ text })
}
