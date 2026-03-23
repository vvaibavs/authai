import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">AuthAI</h1>
              <span className="ml-2 text-sm text-gray-500">Insurance Authorization Parser</span>
            </div>
            <nav className="flex space-x-4">
              <a href="#" className="text-gray-700 hover:text-gray-900">Home</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Upload</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Dashboard</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">About</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
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
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Upload Documents</h3>
            <p className="text-gray-600">Drag and drop or select your authorization documents for instant AI analysis</p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-white">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">Drop files here or click to browse</p>
              <input type="file" className="hidden" id="file-upload" multiple />
              <label htmlFor="file-upload" className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                Choose Files
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">&copy; 2024 AuthAI. All rights reserved.</p>
            <div className="mt-4 flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
