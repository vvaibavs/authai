import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

const BUCKET = 'documents'

export interface Document {
  id: string
  user_id: string
  storage_path: string
  filename: string
  uploaded_at: string
}

/**
 * Upload a file to storage and record it in the documents table.
 */
export async function uploadDocument(
  file: File,
  userId: string
): Promise<{ document: Document } | { error: string }> {
  // 1. Upload to storage
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${userId}/${timestamp}-${safeName}`

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { cacheControl: '3600', upsert: false })

  if (storageError) {
    console.error('Storage upload error:', storageError)
    return { error: storageError.message }
  }

  // 2. Insert a row in the documents table
  const { data, error: dbError } = await supabase
    .from('documents')
    .insert({ user_id: userId, storage_path: storagePath, filename: file.name })
    .select()
    .single()

  if (dbError) {
    console.error('DB insert error:', dbError)
    // Clean up the orphaned file in storage
    await supabase.storage.from(BUCKET).remove([storagePath])
    return { error: dbError.message }
  }

  return { document: data as Document }
}

/**
 * List all documents belonging to the signed-in user, newest first.
 */
export async function listDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('List error:', error)
    return []
  }

  return data as Document[]
}

/**
 * Delete a document from both the database and storage.
 */
export async function deleteDocument(doc: Document): Promise<boolean> {
  // 1. Delete the database row (RLS ensures users can only delete their own)
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', doc.id)

  if (dbError) {
    console.error('DB delete error:', dbError)
    return false
  }

  // 2. Remove from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([doc.storage_path])

  if (storageError) {
    console.error('Storage delete error:', storageError)
    // Row is already gone from DB — not a fatal error
  }

  return true
}
