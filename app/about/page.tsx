export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About AuthAI</h1>
        <p className="text-lg text-gray-700 mb-6">
          AuthAI is an AI-powered insurance authorization document parsing platform designed to automate and accelerate authorization workflows.
          Upload scanned PDFs and structured documents to extract patient details, coverage rules, authorization scope, and compliance notes.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <h2 className="font-semibold text-gray-900">AI Parsing</h2>
            <p className="text-gray-600 text-sm mt-2">Deep NLP extracts eligibility, service codes, dates, and conditions from uploaded authorizations.</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <h2 className="font-semibold text-gray-900">Validation</h2>
            <p className="text-gray-600 text-sm mt-2">Automatic coverage checks and exception detection minimize manual review effort.</p>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <h2 className="font-semibold text-gray-900">Insights</h2>
            <p className="text-gray-600 text-sm mt-2">Transparency through summary dashboards and export-ready reports for compliance audits.</p>
          </div>
        </div>
      </div>
    </div>
  );
}