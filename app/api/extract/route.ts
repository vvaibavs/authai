import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import pdfParse from 'pdf-parse'

async function extractWithPdfjsDist(buffer: Buffer): Promise<string> {
  // Polyfill DOMMatrix before pdfjs-dist's canvas.js evaluates.
  // Must happen here (not at module level) so it runs before the dynamic import.
  if (typeof globalThis.DOMMatrix === 'undefined') {
    // @ts-ignore
    globalThis.DOMMatrix = class DOMMatrix {
      a=1;b=0;c=0;d=1;e=0;f=0
      is2D=true;isIdentity=true
      constructor(_?: string | number[]) {}
      static fromMatrix() { return new (globalThis.DOMMatrix as any)() }
      multiply() { return this }
      translate() { return this }
      scale() { return this }
      rotate() { return this }
      inverse() { return this }
      transformPoint(p: { x?: number; y?: number }) { return { x: p.x ?? 0, y: p.y ?? 0, z: 0, w: 1 } }
    }
  }

  // Dynamic import so webpack evaluates pdfjs-dist only after the polyfill is in place.
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjsLib.GlobalWorkerOptions.workerSrc = ''

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    stopAtErrors: false,
  })
  const pdf = await loadingTask.promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => 'str' in item ? item.str : '').join(' '))
  }
  return pages.join('\n')
}

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

  let text: string | undefined

  try {
    const parsed = await pdfParse(buffer)
    text = parsed.text?.trim()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('pdf-parse failed, falling back to pdfjs-dist:', msg)
  }

  // Fall back to pdfjs-dist (tolerates bad xref tables and other corruption)
  if (!text) {
    try {
      text = (await extractWithPdfjsDist(buffer)).trim()
    } catch (err) {
      console.error('pdfjs-dist extraction failed:', err)
    }
  }

  if (!text) {
    return NextResponse.json({ error: 'No text could be extracted from the document' }, { status: 422 })
  }

  return NextResponse.json({ text })
}
