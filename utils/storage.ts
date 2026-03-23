import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface UploadResult {
  success: boolean
  data?: {
    path: string
    fullPath: string
    id: string
  }
  error?: string
}

export interface FileInfo {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: Record<string, any>
}

/**
 * Upload a file to Supabase storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name (default: 'auth-documents')
 * @param folder - Optional folder path within the bucket
 * @returns UploadResult
 */
export async function uploadFile(
  file: File,
  bucket: string = 'auth-documents',
  folder?: string
): Promise<UploadResult> {
  try {
    // Generate unique filename to avoid conflicts
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: {
        path: data.path,
        fullPath: `${supabaseUrl}/storage/v1/object/public/${bucket}/${data.path}`,
        id: data.id
      }
    }
  } catch (error) {
    console.error('Upload failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    }
  }
}

/**
 * Upload multiple files to Supabase storage
 * @param files - Array of files to upload
 * @param bucket - The storage bucket name (default: 'auth-documents')
 * @param folder - Optional folder path within the bucket
 * @returns Array of UploadResult
 */
export async function uploadFiles(
  files: File[],
  bucket: string = 'auth-documents',
  folder?: string
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map(file => uploadFile(file, bucket, folder))
  )
  return results
}

/**
 * Get a signed URL for downloading a file
 * @param path - The file path in storage
 * @param bucket - The storage bucket name (default: 'auth-documents')
 * @param expiresIn - URL expiration time in seconds (default: 3600)
 * @returns Signed URL or null if failed
 */
export async function getSignedUrl(
  path: string,
  bucket: string = 'auth-documents',
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('Signed URL error:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Failed to create signed URL:', error)
    return null
  }
}

/**
 * List files in a storage bucket
 * @param bucket - The storage bucket name (default: 'auth-documents')
 * @param folder - Optional folder path to list files from
 * @returns Array of FileInfo or null if failed
 */
export async function listFiles(
  bucket: string = 'auth-documents',
  folder?: string
): Promise<FileInfo[] | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('List files error:', error)
      return null
    }

    return data as FileInfo[]
  } catch (error) {
    console.error('Failed to list files:', error)
    return null
  }
}

/**
 * Delete a file from storage
 * @param path - The file path to delete
 * @param bucket - The storage bucket name (default: 'auth-documents')
 * @returns Success status
 */
export async function deleteFile(
  path: string,
  bucket: string = 'auth-documents'
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Delete file error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to delete file:', error)
    return false
  }
}

