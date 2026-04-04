'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/authcontext'
import { uploadDocument, listDocuments, deleteDocument, Document, supabase } from '@/utils/storage'

interface PriorAuthDraft {
  patientName: string
  dateOfBirth: string
  insuranceId: string
  diagnosisCode: string
  procedureRequested: string
  treatingPhysician: string
  medicalNecessityJustification: string
}

type AnalysisStatus = 'idle' | 'extracting' | 'analyzing' | 'done' | 'error'

const FIELD_LABELS: Record<keyof PriorAuthDraft, string> = {
  patientName: 'Patient Name',
  dateOfBirth: 'Date of Birth',
  insuranceId: 'Insurance ID',
  diagnosisCode: 'Diagnosis Code (ICD-10)',
  procedureRequested: 'Procedure Requested',
  treatingPhysician: 'Treating Physician',
  medicalNecessityJustification: 'Medical Necessity Justification',
}

const NOT_FOUND = 'Not found - please complete manually'

export default function Dashboard() {
  const { user, session, loading } = useAuth()
  const router = useRouter()

  const [documents, setDocuments] = useState<Document[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [analysisStatus, setAnalysisStatus] = useState<Record<string, AnalysisStatus>>({})
  const [analysisResults, setAnalysisResults] = useState<Record<string, PriorAuthDraft>>({})
  const [analysisErrors, setAnalysisErrors] = useState<Record<string, string>>({})
  const [editedFields, setEditedFields] = useState<Record<string, PriorAuthDraft>>({})
  const [copied, setCopied] = useState(false)

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
    if (ok) {
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
      if (selectedDocId === doc.id) setSelectedDocId(null)
    }
  }

  async function handleAnalyze(doc: Document) {
    if (!session) return
    setSelectedDocId(doc.id)
    setAnalysisStatus(prev => ({ ...prev, [doc.id]: 'extracting' }))
    setAnalysisErrors(prev => { const n = { ...prev }; delete n[doc.id]; return n })

    // 1. Download file from Supabase storage
    const { data: blob, error: dlError } = await supabase.storage
      .from('documents')
      .download(doc.storage_path)

    if (dlError || !blob) {
      setAnalysisStatus(prev => ({ ...prev, [doc.id]: 'error' }))
      setAnalysisErrors(prev => ({ ...prev, [doc.id]: 'Failed to download document from storage' }))
      return
    }

    // 2. Extract text via OCR
    const formData = new FormData()
    formData.append('file', new File([blob], doc.filename))

    const extractRes = await fetch('/api/extract', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: formData,
    })
    console.log(extractRes);

    if (!extractRes.ok) {
      const json = await extractRes.json().catch(() => ({}))
      setAnalysisStatus(prev => ({ ...prev, [doc.id]: 'error' }))
      setAnalysisErrors(prev => ({ ...prev, [doc.id]: json.error ?? 'Text extraction failed' }))
      return
    }

    const { text } = await extractRes.json()

    // 3. Analyze fields with AI
    setAnalysisStatus(prev => ({ ...prev, [doc.id]: 'analyzing' }))

    const analyzeRes = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!analyzeRes.ok) {
      const json = await analyzeRes.json().catch(() => ({}))
      setAnalysisStatus(prev => ({ ...prev, [doc.id]: 'error' }))
      setAnalysisErrors(prev => ({ ...prev, [doc.id]: json.error ?? 'Analysis failed' }))
      return
    }

    const { data } = await analyzeRes.json()
    setAnalysisResults(prev => ({ ...prev, [doc.id]: data }))
    setEditedFields(prev => ({ ...prev, [doc.id]: { ...data } }))
    setAnalysisStatus(prev => ({ ...prev, [doc.id]: 'done' }))
  }

  function updateField(docId: string, field: keyof PriorAuthDraft, value: string) {
    setEditedFields(prev => ({
      ...prev,
      [docId]: { ...prev[docId], [field]: value },
    }))
  }

  async function handleCopy(docId: string) {
    const fields = editedFields[docId]
    if (!fields) return
    const lines = (Object.keys(FIELD_LABELS) as (keyof PriorAuthDraft)[]).map(
      k => `${FIELD_LABELS[k]}: ${fields[k]}`
    )
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

  const selectedDoc = documents.find(d => d.id === selectedDocId) ?? null
  const selectedStatus = selectedDocId ? (analysisStatus[selectedDocId] ?? 'idle') : 'idle'

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold text-[var(--theme-textPrimary)]">Your Documents</h1>
          <p className="text-sm text-[var(--theme-textMuted)] mt-1">
            Upload prior authorization documents to extract and review key fields.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6 items-start">

          {/* Left column: upload + docs list */}
          <div className="space-y-6">
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
                  {documents.map(doc => {
                    const status = analysisStatus[doc.id] ?? 'idle'
                    const isSelected = selectedDocId === doc.id
                    const isRunning = status === 'extracting' || status === 'analyzing'

                    return (
                      <li
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className={`px-5 py-3.5 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[var(--theme-primaryLight)]'
                            : 'hover:bg-[var(--theme-surfaceHover)]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Status dot */}
                          <span className={`shrink-0 h-2 w-2 rounded-full ${
                            status === 'done' ? 'bg-green-500' :
                            status === 'error' ? 'bg-red-500' :
                            isRunning ? 'bg-yellow-400 animate-pulse' :
                            'bg-[var(--theme-border)]'
                          }`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--theme-textPrimary)] truncate">{doc.filename}</p>
                            <p className="text-xs text-[var(--theme-textMuted)] mt-0.5">
                              {new Date(doc.uploaded_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {status === 'idle' || status === 'error' ? (
                            <button
                              onClick={e => { e.stopPropagation(); handleAnalyze(doc) }}
                              className="text-xs bg-[var(--theme-primary)] text-white px-3 py-1 rounded-md hover:bg-[var(--theme-primaryHover)] transition-colors"
                            >
                              {status === 'error' ? 'Retry' : 'Analyze'}
                            </button>
                          ) : isRunning ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--theme-spinner)] border-r-transparent" />
                          ) : (
                            <button
                              onClick={e => { e.stopPropagation(); handleAnalyze(doc) }}
                              className="text-xs text-[var(--theme-textMuted)] hover:text-[var(--theme-textSecondary)] transition-colors"
                            >
                              Re-run
                            </button>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(doc) }}
                            className="text-xs text-[var(--theme-textMuted)] hover:text-red-500 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Right column: analysis panel */}
          <div className="bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)] overflow-hidden sticky top-6">
            {!selectedDoc ? (
              <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <svg className="h-12 w-12 text-[var(--theme-border)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="text-sm font-medium text-[var(--theme-textSecondary)]">No document selected</p>
                <p className="text-xs text-[var(--theme-textMuted)] mt-1">
                  Select a document from the list and click Analyze to extract fields.
                </p>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-[var(--theme-borderLight)] flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--theme-textPrimary)] truncate">{selectedDoc.filename}</p>
                    <p className="text-xs text-[var(--theme-textMuted)] mt-0.5">
                      {selectedStatus === 'extracting' && 'Extracting text from document...'}
                      {selectedStatus === 'analyzing' && 'Analyzing fields with AI...'}
                      {selectedStatus === 'done' && 'Analysis complete — review and edit below'}
                      {selectedStatus === 'idle' && 'Click Analyze to extract fields'}
                      {selectedStatus === 'error' && 'Analysis failed'}
                    </p>
                  </div>
                  {selectedStatus === 'done' && (
                    <button
                      onClick={() => handleCopy(selectedDoc.id)}
                      className="shrink-0 text-xs text-[var(--theme-textMuted)] hover:text-[var(--theme-textSecondary)] border border-[var(--theme-border)] px-3 py-1 rounded-md transition-colors"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>

                {/* Loading state */}
                {(selectedStatus === 'extracting' || selectedStatus === 'analyzing') && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--theme-spinner)] border-r-transparent" />
                    <p className="text-sm text-[var(--theme-textMuted)]">
                      {selectedStatus === 'extracting' ? 'Running OCR...' : 'Extracting fields...'}
                    </p>
                  </div>
                )}

                {/* Error state */}
                {selectedStatus === 'error' && analysisErrors[selectedDoc.id] && (
                  <div className="p-5">
                    <div className="text-sm text-[var(--theme-error)] bg-[var(--theme-errorBg)] border border-[var(--theme-errorBorder)] rounded-lg px-4 py-3">
                      {analysisErrors[selectedDoc.id]}
                    </div>
                    <button
                      onClick={() => handleAnalyze(selectedDoc)}
                      className="mt-4 text-sm bg-[var(--theme-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--theme-primaryHover)] transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Idle state */}
                {selectedStatus === 'idle' && (
                  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                    <button
                      onClick={() => handleAnalyze(selectedDoc)}
                      className="bg-[var(--theme-primary)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--theme-primaryHover)] transition-colors"
                    >
                      Analyze document
                    </button>
                    <p className="text-xs text-[var(--theme-textMuted)] mt-3">
                      Extracts patient, insurance, and procedure details automatically.
                    </p>
                  </div>
                )}

                {/* Results form */}
                {selectedStatus === 'done' && editedFields[selectedDoc.id] && (
                  <div className="p-5 space-y-4">
                    {(Object.keys(FIELD_LABELS) as (keyof PriorAuthDraft)[]).map(field => {
                      const value = editedFields[selectedDoc.id][field]
                      const isMissing = value === NOT_FOUND
                      const isMultiline = field === 'medicalNecessityJustification'

                      return (
                        <div key={field}>
                          <label className="block text-xs font-medium text-[var(--theme-textMuted)] mb-1">
                            {FIELD_LABELS[field]}
                            {isMissing && (
                              <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-normal">needs review</span>
                            )}
                          </label>
                          {isMultiline ? (
                            <textarea
                              value={isMissing ? '' : value}
                              onChange={e => updateField(selectedDoc.id, field, e.target.value)}
                              placeholder={isMissing ? 'Enter manually' : undefined}
                              rows={3}
                              className={`w-full text-sm px-3 py-2 rounded-lg border transition-colors bg-[var(--theme-background)] text-[var(--theme-textPrimary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] ${
                                isMissing
                                  ? 'border-yellow-400 placeholder-yellow-500'
                                  : 'border-[var(--theme-border)]'
                              }`}
                            />
                          ) : (
                            <input
                              type="text"
                              value={isMissing ? '' : value}
                              onChange={e => updateField(selectedDoc.id, field, e.target.value)}
                              placeholder={isMissing ? 'Enter manually' : undefined}
                              className={`w-full text-sm px-3 py-2 rounded-lg border transition-colors bg-[var(--theme-background)] text-[var(--theme-textPrimary)] focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] ${
                                isMissing
                                  ? 'border-yellow-400 placeholder-yellow-500'
                                  : 'border-[var(--theme-border)]'
                              }`}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
