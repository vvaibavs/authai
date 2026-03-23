'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/authcontext'

interface UploadResult {
  success: boolean
  data?: {
    path: string
    fullPath: string
    id: string
  }
  error?: string
}

interface UploadResponse {
  success: boolean
  uploaded: number
  failed: number
  results: UploadResult[]
  message: string
}

interface PriorAuthDraft {
  patientName: string
  dateOfBirth: string
  insuranceId: string
  diagnosisCode: string
  procedureRequested: string
  treatingPhysician: string
  medicalNecessityJustification: string
}

export default function Home() {
  const { user, session, loading } = useAuth()
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadResults, setUploadResults] = useState<UploadResponse | null>(null)
  const [priorAuthDraft, setPriorAuthDraft] = useState<PriorAuthDraft | null>(null)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return
    setFiles(prev => [...prev, ...Array.from(selectedFiles)])
  }, [])

  const handleUpload = async () => {
    if (files.length === 0) return
    if (!session?.access_token) {
      alert('Please log in to upload files.')
      return
    }

    setIsUploading(true)
    setUploadResults(null)
    setPriorAuthDraft(null)
    setAnalyzeError(null)

    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))

      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      })

      const result: UploadResponse = await response.json()

      if (response.ok) {
        setUploadResults(result)
        setFiles([])
        if (fileInputRef.current) fileInputRef.current.value = ''
        // TODO: wire up analyzeDocument(file) here once upload is confirmed working
      } else {
        alert(`Upload failed: ${(result as { error?: string }).error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const analyzeDocument = async (file: File) => {
    if (!session?.access_token) return

    setIsAnalyzing(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setPriorAuthDraft(result.data)
      } else {
        setAnalyzeError(result.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('Analyze error:', error)
      setAnalyzeError('Failed to analyze document')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
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
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              AI-Powered Insurance Authorization Parsing
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Upload your insurance authorization documents and let our AI extract key information,
              validate coverage, and generate a structured prior authorization draft.
            </p>
            {!loading && !user && (
              <p className="text-sm text-amber-600 mb-4">
                <a href="/login" className="underline font-medium">Log in</a> to upload and analyze documents.
              </p>
            )}
            <a
              href="#upload"
              className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </section>

      <section id="upload" className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Upload Documents</h3>
            <p className="text-gray-600">Drag and drop or select your authorization documents for instant AI analysis</p>
            {user && (
              <p className="text-sm text-gray-500 mt-2">Signed in as <span className="font-medium">{user.email}</span></p>
            )}
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center bg-white transition-colors ${
                isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">
                {isDragOver ? 'Drop files here' : 'Drop files here or click to browse'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                id="file-upload"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <label
                htmlFor="file-upload"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors inline-block"
              >
                Choose Files
              </label>
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="bg-white rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Selected Files ({files.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div className="flex items-center space-x-3">
                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <button
                    onClick={() => {
                      setFiles([])
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading || !user}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
                {!user && (
                  <p className="text-xs text-amber-600 mt-2 text-right">
                    <a href="/login" className="underline">Log in</a> to upload files
                  </p>
                )}
              </div>
            )}

            {/* Upload Results */}
            {uploadResults && (
              <div className={`rounded-lg p-6 ${uploadResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h4 className={`text-lg font-semibold mb-2 ${uploadResults.success ? 'text-green-800' : 'text-red-800'}`}>
                  {uploadResults.success ? 'Upload Successful!' : 'Upload Failed'}
                </h4>
                <p className={`text-sm ${uploadResults.success ? 'text-green-700' : 'text-red-700'}`}>
                  {uploadResults.message}
                </p>
                {uploadResults.results && (
                  <div className="mt-4 space-y-2">
                    {uploadResults.results.map((result, index) => (
                      <div key={index} className={`text-xs p-2 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {result.success ? `✓ ${result.data?.path}` : `✗ ${result.error}`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* AI Analysis Results */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Prior Authorization Draft</h3>
            <p className="text-gray-600">AI-extracted fields from your uploaded document</p>
          </div>

          {isAnalyzing && (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mb-4" />
              <p className="text-gray-600">Analyzing document with AI...</p>
            </div>
          )}

          {analyzeError && (
            <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-700">{analyzeError}</p>
            </div>
          )}

          {priorAuthDraft && !isAnalyzing && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
                Fields marked &quot;Not found - please complete manually&quot; were not detected in the document and require manual entry.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DraftField label="Patient Name" value={priorAuthDraft.patientName} />
                <DraftField label="Date of Birth" value={priorAuthDraft.dateOfBirth} />
                <DraftField label="Insurance ID" value={priorAuthDraft.insuranceId} />
                <DraftField label="Diagnosis Code (ICD-10)" value={priorAuthDraft.diagnosisCode} />
                <DraftField label="Procedure Requested" value={priorAuthDraft.procedureRequested} />
                <DraftField label="Treating Physician" value={priorAuthDraft.treatingPhysician} />
                <div className="md:col-span-2">
                  <DraftField label="Medical Necessity Justification" value={priorAuthDraft.medicalNecessityJustification} multiline />
                </div>
              </div>
            </div>
          )}

          {!priorAuthDraft && !isAnalyzing && !analyzeError && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-40 pointer-events-none">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> [Extracted Name]</p>
                  <p><span className="font-medium">DOB:</span> [Date of Birth]</p>
                  <p><span className="font-medium">Insurance ID:</span> [Policy Number]</p>
                </div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Authorization Details</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Diagnosis Code:</span> [ICD-10]</p>
                  <p><span className="font-medium">Procedure:</span> [CPT Code]</p>
                  <p><span className="font-medium">Physician:</span> [Name]</p>
                </div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Medical Necessity</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Justification:</span> [Upload a document above to extract]</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function DraftField({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  const isMissing = value === 'Not found - please complete manually'
  return (
    <div className={`bg-gray-50 rounded-lg p-5 border ${isMissing ? 'border-amber-200' : 'border-gray-200'}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm ${isMissing ? 'text-amber-600 italic' : 'text-gray-900'} ${multiline ? 'whitespace-pre-wrap' : ''}`}>
        {value}
      </p>
    </div>
  )
}

