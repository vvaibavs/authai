'use client'

import Link from 'next/link'
import { useAuth } from '@/context/authcontext'
import { useRouter } from 'next/navigation'

export default function Nav() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <nav className="flex items-center gap-4 text-sm text-gray-700">
      {user ? (
        <>
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <button
            onClick={handleSignOut}
            className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="hover:text-blue-600">Sign in</Link>
          <Link
            href="/login"
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get started
          </Link>
        </>
      )}
    </nav>
  )
}
