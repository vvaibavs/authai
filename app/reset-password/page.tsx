'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/utils/storage'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase exchanges the token from the URL hash and establishes a session
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Password updated. Redirecting to sign in...')
      setTimeout(() => router.push('/login'), 2000)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--theme-background)] px-4">
      <div className="w-full max-w-md bg-[var(--theme-surface)] rounded-xl shadow-sm border border-[var(--theme-border)] p-8">
        <h1 className="text-2xl font-bold text-[var(--theme-textPrimary)] mb-2">
          Set a new password
        </h1>
        <p className="text-sm text-[var(--theme-textMuted)] mb-6">
          Choose a strong password for your account.{' '}
          <Link href="/login" className="text-[var(--theme-primaryText)] hover:underline font-medium">
            Back to sign in
          </Link>
        </p>

        {!ready ? (
          <p className="text-sm text-[var(--theme-textMuted)]">
            Verifying your reset link...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--theme-textSecondary)] mb-1">
                New password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-textPrimary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-[var(--theme-textSecondary)] mb-1">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-textPrimary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                placeholder="••••••••"
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
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
