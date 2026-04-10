'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/utils/storage'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for a password reset link.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-background)] px-4">
      <div className="w-full max-w-md bg-[var(--theme-surface)] rounded-xl shadow-sm border border-[var(--theme-border)] p-8">
        <h1 className="text-2xl font-bold text-[var(--theme-textPrimary)] mb-2">
          Reset your password
        </h1>
        <p className="text-sm text-[var(--theme-textMuted)] mb-6">
          Enter your email and we'll send you a reset link.{' '}
          <Link href="/login" className="text-[var(--theme-primaryText)] hover:underline font-medium">
            Back to sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--theme-textSecondary)] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-textPrimary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          {error && (
            <p className="text-sm text-[var(--theme-error)] bg-[var(--theme-errorBg)] border border-[var(--theme-errorBorder)] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {message && (
            <p className="text-sm text-[var(--theme-success)] bg-[var(--theme-successBg)] border border-[var(--theme-successBorder)] rounded-lg px-3 py-2">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--theme-primary)] text-white py-2 px-4 rounded-lg font-medium hover:bg-[var(--theme-primaryHover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      </div>
    </div>
  )
}
