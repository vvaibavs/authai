import { NextRequest, NextResponse } from 'next/server'
import { uploadFiles, listFiles, deleteFile, getSignedUrl } from '@/utils/storage'

// POST /api/files - Upload files
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const bucket = (formData.get('bucket') as string) || 'auth-documents'
    const folder = (formData.get('folder') as string) || undefined

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    const uploadResults = await uploadFiles(files, bucket, folder)

    const successful = uploadResults.filter(result => result.success)
    const failed = uploadResults.filter(result => !result.success)

    return NextResponse.json({
      success: true,
      uploaded: successful.length,
      failed: failed.length,
      results: uploadResults,
      message: `Successfully uploaded ${successful.length} of ${files.length} files`
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during file upload' },
      { status: 500 }
    )
  }
}

// GET /api/files - List files or get signed URL
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const bucket = searchParams.get('bucket') || 'auth-documents'
  const folder = searchParams.get('folder') || undefined
  const path = searchParams.get('path')

  try {
    if (action === 'signed-url' && path) {
      // Get signed URL for downloading
      const signedUrl = await getSignedUrl(path, bucket)
      if (!signedUrl) {
        return NextResponse.json(
          { error: 'Failed to generate signed URL' },
          { status: 500 }
        )
      }
      return NextResponse.json({ signedUrl })
    } else {
      // List files
      const files = await listFiles(bucket, folder)
      return NextResponse.json({ files })
    }
  } catch (error) {
    console.error('Files API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/files - Delete a file
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  const bucket = searchParams.get('bucket') || 'auth-documents'

  if (!path) {
    return NextResponse.json(
      { error: 'File path is required' },
      { status: 400 }
    )
  }

  try {
    const success = await deleteFile(path, bucket)
    if (success) {
      return NextResponse.json({ message: 'File deleted successfully' })
    } else {
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
