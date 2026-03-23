'use client'

import { useAuth } from '@/context/authcontext'
import { useRouter } from 'next/navigation'

export default function Nav() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <nav className="flex items-center gap-4 text-sm text-gray-700">
      <a href="/" className="hover:text-blue-600">Home</a>
      <a href="/about" className="hover:text-blue-600">About</a>
      {user ? (
        <>
          <span className="text-gray-400">{user.email}</span>
          <button
            onClick={handleSignOut}
            className="bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
          >
            Sign out
          </button>
        </>
      ) : (
        <a href="/login" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
          Login
        </a>
      )}
    </nav>
  )
}
