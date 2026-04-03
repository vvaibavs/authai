import Cursor from '@/components/cursor'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--theme-surface)]">
      <Cursor/>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[var(--theme-primaryLight)] to-[var(--theme-surface)]">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <span className="inline-block bg-[var(--theme-primaryLight)] text-[var(--theme-primaryText)] text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
            Powered by Claude AI
          </span>
          <h1 className="text-5xl font-bold text-[var(--theme-textPrimary)] leading-tight mb-6">
            Prior authorizations,<br />done in seconds.
          </h1>
          <p className="text-xl text-[var(--theme-textMuted)] max-w-2xl mx-auto mb-10">
            Upload your medical documents and let PriorAuthAI extract patient info,
            diagnosis codes, and medical necessity justifications — automatically.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[var(--theme-primary)] text-white text-lg font-semibold px-8 py-4 rounded-xl hover:bg-[var(--theme-primaryHover)] transition-colors shadow-sm"
          >
            Try a free demo now →
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-[var(--theme-textPrimary)] text-center mb-14">How it works</h2>
        <div className="grid md:grid-cols-3 gap-10">
          <div className="text-center">
            <div className="w-12 h-12 bg-[var(--theme-primaryLight)] rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[var(--theme-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h3 className="font-semibold text-[var(--theme-textPrimary)] mb-2">Upload a document</h3>
            <p className="text-sm text-[var(--theme-textMuted)]">Drop any prior auth PDF or image. We accept scanned documents, faxes, and structured forms.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[var(--theme-primaryLight)] rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[var(--theme-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[var(--theme-textPrimary)] mb-2">AI extracts the fields</h3>
            <p className="text-sm text-[var(--theme-textMuted)]">Claude reads the document and pulls out patient name, DOB, insurance ID, diagnosis codes, CPT codes, and more.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-[var(--theme-primaryLight)] rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[var(--theme-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[var(--theme-textPrimary)] mb-2">Review and submit</h3>
            <p className="text-sm text-[var(--theme-textMuted)]">Get a structured prior auth draft ready to review, correct, and submit — in a fraction of the time.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[var(--theme-background)] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-[var(--theme-textPrimary)] text-center mb-14">What we extract</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              ['Patient Name', 'Full legal name from the document'],
              ['Date of Birth', 'Patient DOB for identity verification'],
              ['Insurance ID', 'Member or policy number'],
              ['Diagnosis Code', 'ICD-10 codes from clinical notes'],
              ['Procedure Requested', 'CPT codes and service descriptions'],
              ['Treating Physician', 'Requesting provider name'],
              ['Medical Necessity', 'Clinical justification from the document'],
              ['Missing fields', 'Flagged clearly for manual completion'],
            ].map(([title, desc]) => (
              <div key={title} className="flex gap-3 bg-[var(--theme-surface)] rounded-xl border border-[var(--theme-border)] px-5 py-4">
                <svg className="w-5 h-5 text-[var(--theme-primary)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-[var(--theme-textPrimary)]">{title}</p>
                  <p className="text-xs text-[var(--theme-textMuted)] mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-[var(--theme-textPrimary)] mb-4">Ready to save hours of manual work?</h2>
        <p className="text-[var(--theme-textMuted)] mb-8">Sign in and upload your first document in under a minute.</p>
        <Link
          href="/login"
          className="inline-block bg-[var(--theme-primary)] text-white text-lg font-semibold px-8 py-4 rounded-xl hover:bg-[var(--theme-primaryHover)] transition-colors shadow-sm"
        >
          Try a free demo now →
        </Link>
      </section>

    </div>
  )
}
