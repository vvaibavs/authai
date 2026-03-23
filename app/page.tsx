'use client'

import { useState, useCallback, useRef } from 'react'

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

export default function Home() {
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<UploadResponse | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const fileArray = Array.from(selectedFiles)
    setFiles(prev => [...prev, ...fileArray])
  }, [])

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadResults(null)

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      })

      const result: UploadResponse = await response.json()

      if (response.ok) {
        setUploadResults(result)
        // Clear files after successful upload
        setFiles([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        alert(`Upload failed: ${result.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
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
              validate coverage, and provide instant analysis to streamline your authorization process.
            </p>
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
                    disabled={isUploading}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
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

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">AI Analysis Results</h3>
            <p className="text-gray-600">View extracted information and authorization details</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                <p><span className="font-medium">Service:</span> [Service Type]</p>
                <p><span className="font-medium">Effective Date:</span> [Start Date]</p>
                <p><span className="font-medium">Expiration:</span> [End Date]</p>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Coverage Status</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Status:</span> <span className="text-green-600 font-semibold">Approved</span></p>
                <p><span className="font-medium">Limits:</span> [Coverage Limits]</p>
                <p><span className="font-medium">Notes:</span> [Additional Info]</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
