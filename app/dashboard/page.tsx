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
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload prior authorization documents to extract and review key fields.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Upload area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
            isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'
          }`}
        >
          <svg className="mx-auto h-10 w-10 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-gray-500 mb-4">
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
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Document list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Uploaded documents</h2>
            <div className="flex items-center gap-3">
              {loadingDocs && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
              )}
              <span className="text-xs text-gray-400">
                {documents.length} file{documents.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {!loadingDocs && documents.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-gray-400">No documents yet — upload one above.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {documents.map(doc => (
                <li key={doc.id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <svg className="h-5 w-5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{doc.filename}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(doc.uploaded_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}
