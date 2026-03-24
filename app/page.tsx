'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/authcontext'
import { uploadDocument, listDocuments, deleteDocument, Document } from '@/utils/storage'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [documents, setDocuments] = useState<Document[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  useEffect(() => {
    if (user) fetchDocuments()
  }, [user])

  async function fetchDocuments() {
    setLoadingDocs(true)
    const docs = await listDocuments()
    setDocuments(docs)
    setLoadingDocs(false)
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !user) return
    setError(null)
    setUploading(true)

    for (const file of Array.from(files)) {
      const result = await uploadDocument(file, user.id)
      if ('error' in result) {
        setError(`Failed to upload "${file.name}": ${result.error}`)
      }
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    await fetchDocuments()
  }

  async function handleDelete(doc: Document) {
    const ok = await deleteDocument(doc)
    if (ok) setDocuments(prev => prev.filter(d => d.id !== doc.id))
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 mt-1">Signed in as {user.email}</p>
        </div>

        {/* Upload area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
            isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'
          }`}
        >
          <p className="text-gray-500 mb-4">
            {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            id="file-input"
            onChange={e => handleFiles(e.target.files)}
            disabled={uploading}
          />
          <label
            htmlFor="file-input"
            className={`inline-block bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-700 transition-colors ${
              uploading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {uploading ? 'Uploading...' : 'Choose files'}
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {/* Document list */}
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          <div className="px-5 py-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Your documents</h2>
            {loadingDocs && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
            )}
          </div>

          {!loadingDocs && documents.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No documents yet — upload one above.
            </div>
          )}

          {documents.map(doc => (
            <div key={doc.id} className="px-5 py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-gray-800 truncate">{doc.filename}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(doc.uploaded_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(doc)}
                className="text-xs text-red-500 hover:text-red-700 shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
