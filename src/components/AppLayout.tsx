'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import AddFossilModal from './AddFossilModal'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showFossilModal, setShowFossilModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const handleProfileClick = () => {
    if (!user) {
      router.push('/auth')
    } else {
      setShowDropdown(!showDropdown)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setShowDropdown(false)
    // The auth state change listener will update the user state
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="relative flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-black">
        <div className="flex-1" />
        {/* Centered buttons */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              pathname === '/'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Home
          </button>
          {user && (
            <button
              onClick={() => router.push('/fossils/personal')}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                pathname === '/fossils/personal'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              Your Fossils
            </button>
          )}
        </div>
        {/* Right side buttons */}
        <div className="flex-1 flex justify-end items-center gap-3">
          {user && (
            <button
              onClick={() => setShowFossilModal(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              title="Add Fossil"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              {loading ? (
                <div className="h-4 w-16 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
              ) : user ? (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.user_metadata?.name || user.email}
                </span>
              ) : (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sign In
                </span>
              )}
            </button>
            
            {/* Dropdown Menu */}
            {showDropdown && user && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-black" />

        {/* Main Content */}
        <main className="flex-1 bg-gray-50 dark:bg-zinc-950 overflow-auto">
          {children}
        </main>
      </div>

      {/* Add Fossil Modal */}
      {user && (
        <AddFossilModal
          isOpen={showFossilModal}
          onClose={() => setShowFossilModal(false)}
          user={user}
          onSuccess={() => {
            // Trigger refresh event for fossils page
            window.dispatchEvent(new Event('fossils-refresh'))
          }}
        />
      )}
    </div>
  )
}

