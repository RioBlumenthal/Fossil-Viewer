'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { SupabaseClient } from '@supabase/supabase-js'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setSupabase(createClient())
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/') // redirect to home after login
      } else {
        // Signup
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              name, // this will be available in the trigger
            }
          }
        })
        
        if (error) {
          // If it's an email sending error, we can still proceed if user was created
          if (error.message.includes('confirmation email') && data?.user) {
            // User was created but email failed - this is okay for development
            setSuccess('Account created successfully! You can now log in.')
            // Still try to update profile
            const userId = (data.user as { id: string }).id
            if (userId) {
              try {
                await supabase
                  .from('profiles')
                  .update({ location })
                  .eq('id', userId)
              } catch (profileError) {
                // Profile update failed, but user is created - continue
                console.error('Profile update error:', profileError)
              }
            }
            // Clear form after a delay
            setTimeout(() => {
              setIsLogin(true)
              setEmail('')
              setPassword('')
              setName('')
              setLocation('')
              setSuccess('')
            }, 3000)
            return
          }
          throw error
        }

        // Update profile with location after signup
        if (data.user) {
          try {
            await supabase
              .from('profiles')
              .update({ location })
              .eq('id', data.user.id)
          } catch (profileError) {
            console.error('Profile update error:', profileError)
            // Don't fail signup if profile update fails
          }
        }

        // Check if email confirmation is required
        if (data.user && !data.session) {
          setSuccess('Please check your email to confirm your account.')
          // Clear form after a delay
          setTimeout(() => {
            setIsLogin(true)
            setEmail('')
            setPassword('')
            setName('')
            setLocation('')
            setSuccess('')
          }, 5000)
        } else {
          // User is signed in immediately (email confirmation disabled)
          router.push('/')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">
          {isLogin ? 'Log in' : 'Sign up'}
        </h2>

        {!mounted ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 h-10 bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 h-10 bg-gray-100" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location (optional)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            {success && (
              <div className="text-green-600 text-sm">{success}</div>
            )}

            <button
              type="submit"
              disabled={loading || !supabase}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : isLogin ? 'Log in' : 'Sign up'}
            </button>
          </form>
        )}

        {mounted && (
          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}