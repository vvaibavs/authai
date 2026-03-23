import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { uploadFiles, listFiles, deleteFile, getSignedUrl } from '@/utils/storage'

function getAuthenticatedSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

async function getUserFromToken(token: string) {
  const supabase = getAuthenticatedSupabase(token)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// POST /api/files - Upload files (user-specific)
export async function POST(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await getUserFromToken(token)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const bucket = (formData.get('bucket') as string) || 'auth-documents'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Store files under the user's own folder: {userId}/{filename}
    const uploadResults = await uploadFiles(files, bucket, user.id)

    const successful = uploadResults.filter(result => result.success)
    const failed = uploadResults.filter(result => !result.success)

    return NextResponse.json({
      success: true,
      uploaded: successful.length,
      failed: failed.length,
      results: uploadResults,
      message: `Successfully uploaded ${successful.length} of ${files.length} files`,
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during file upload' },
      { status: 500 }
    )
  }
}

// GET /api/files - List files or get signed URL (user-specific)
export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await getUserFromToken(token)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const bucket = searchParams.get('bucket') || 'auth-documents'
  const path = searchParams.get('path')

  try {
    if (action === 'signed-url' && path) {
      const signedUrl = await getSignedUrl(path, bucket)
      if (!signedUrl) {
        return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
      }
      return NextResponse.json({ signedUrl })
    } else {
      // List only this user's files (their folder)
      const files = await listFiles(bucket, user.id)
      return NextResponse.json({ files })
    }
  } catch (error) {
    console.error('Files API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/files - Delete a file (user-specific)
export async function DELETE(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await getUserFromToken(token)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  const bucket = searchParams.get('bucket') || 'auth-documents'

  if (!path) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 })
  }

  // Ensure the user can only delete their own files
  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const success = await deleteFile(path, bucket)
    if (success) {
      return NextResponse.json({ message: 'File deleted successfully' })
    } else {
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
    }
  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
