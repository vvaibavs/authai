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
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
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

  function stageFiles(files: FileList | File[] | null) {
    if (!files || files.length === 0) return
    setPendingFiles(Array.from(files))
    setError(null)
  }

  async function handleUpload() {
    if (pendingFiles.length === 0 || !user) return
    setError(null)
    setUploading(true)

    for (const file of pendingFiles) {
      const result = await uploadDocument(file, user.id)
      if ('error' in result) {
        setError(`Failed to upload "${file.name}": ${result.error}`)
      }

    }

    setPendingFiles([])
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
    stageFiles(e.dataTransfer.files)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--theme-spinner)] border-r-transparent" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[var(--theme-background)]">
      {/* Page header */}
      <div className="bg-[var(--theme-surface)] border-b border-[var(--theme-border)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold text-[var(--theme-textPrimary)]">Your Documents</h1>
          <p className="text-sm text-[var(--theme-textMuted)] mt-1">
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
            isDragOver
              ? 'border-[var(--theme-primary)] bg-[var(--theme-primaryLight)]'
              : 'border-[var(--theme-border)] bg-[var(--theme-surface)]'
          }`}
        >
          <svg className="mx-auto h-10 w-10 text-[var(--theme-border)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-[var(--theme-textMuted)] mb-4">
            {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            id="file-input"
            onChange={e => stageFiles(e.target.files)}
            disabled={uploading}
          />
          {pendingFiles.length === 0 ? (
            <label
              htmlFor="file-input"
              className={`inline-block bg-[var(--theme-primary)] text-white px-5 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-[var(--theme-primaryHover)] transition-colors ${
                uploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              Choose files
            </label>
          ) : (
            <div className="space-y-3">
              <ul className="text-sm text-[var(--theme-textSecondary)] space-y-1">
                {pendingFiles.map(f => (
                  <li key={f.name} className="truncate">{f.name}</li>
                ))}
              </ul>
              <div className="flex items-center justify-center gap-3">
                <label
                  htmlFor="file-input"
                  className="text-xs text-[var(--theme-textMuted)] hover:text-[var(--theme-textSecondary)] cursor-pointer underline"
                >
                  Change
                </label>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-[var(--theme-primary)] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[var(--theme-primaryHover)] transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : `Upload ${pendingFiles.length} file${pendingFiles.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-[var(--theme-error)] bg-[var(--theme-errorBg)] border border-[var(--theme-errorBorder)] rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Document list */}
        <div className="bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)] overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--theme-borderLight)]">
            <h2 className="font-semibold text-[var(--theme-textPrimary)]">Uploaded documents</h2>
            <div className="flex items-center gap-3">
              {loadingDocs && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--theme-spinner)] border-r-transparent" />
              )}
              <span className="text-xs text-[var(--theme-textMuted)]">
                {documents.length} file{documents.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {!loadingDocs && documents.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-[var(--theme-textMuted)]">No documents yet — upload one above.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--theme-borderLight)]">
              {documents.map(doc => (
                <li key={doc.id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[var(--theme-surfaceHover)] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <svg className="h-5 w-5 text-[var(--theme-border)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--theme-textPrimary)] truncate">{doc.filename}</p>
                      <p className="text-xs text-[var(--theme-textMuted)] mt-0.5">
                        {new Date(doc.uploaded_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="text-xs text-[var(--theme-textMuted)] hover:text-red-500 transition-colors shrink-0"
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
