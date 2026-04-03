'use client'

import Link from 'next/link'
import { useAuth } from '@/context/authcontext'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/context/themeContext'

export default function Nav() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { isDark, toggle } = useTheme()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <nav className="flex items-center gap-4 text-sm text-[var(--theme-textSecondary)]">
      <button
        onClick={toggle}
        aria-label="Toggle dark mode"
        className="relative w-14 h-7 rounded-full transition-colors duration-300 bg-[var(--theme-border)] hover:bg-[var(--theme-textMuted)]"
      >
        <div
          className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-[var(--theme-surface)] shadow flex items-center justify-center text-sm transition-transform duration-300"
          style={{ transform: isDark ? 'translateX(28px)' : 'translateX(0)' }}
        >
          {isDark ? '🌙' : '☀️'}
        </div>
      </button>

      {user ? (
        <>
          <Link href="/dashboard" className="hover:text-[var(--theme-primaryText)]">Dashboard</Link>
          <button
            onClick={handleSignOut}
            className="bg-[var(--theme-background)] text-[var(--theme-textSecondary)] px-4 py-1.5 rounded-lg hover:bg-[var(--theme-border)] transition-colors"
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="hover:text-[var(--theme-primaryText)]">Sign in</Link>
          <Link
            href="/login"
            className="bg-[var(--theme-primary)] text-white px-4 py-1.5 rounded-lg hover:bg-[var(--theme-primaryHover)] transition-colors"
          >
            Get started
          </Link>
        </>
      )}
    </nav>
  )
}
