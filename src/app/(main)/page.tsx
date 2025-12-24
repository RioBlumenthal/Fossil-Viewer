'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface Fossil {
  id: string
  user_id: string
  species: string | null
  description: string
  location: string | null
  discovery_date: string | null
  tags: string[] | null
  image_url: string
  created_at: string
  updated_at: string
}

const FOSSILS_PER_PAGE = 12

export default function Home() {
  const [fossils, setFossils] = useState<Fossil[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchFossils = useCallback(async (page: number) => {
    try {
      setLoading(true)
      setError('')
      const supabase = createClient()

      // Calculate range for pagination
      const from = (page - 1) * FOSSILS_PER_PAGE
      const to = from + FOSSILS_PER_PAGE - 1

      // Fetch total count
      const { count } = await supabase
        .from('fossils')
        .select('*', { count: 'exact', head: true })

      setTotalCount(count || 0)

      // Fetch fossils for this page
      const { data, error: fetchError } = await supabase
        .from('fossils')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to)

      if (fetchError) throw fetchError

      setFossils(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fossils')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFossils(currentPage)
  }, [currentPage, fetchFossils])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const totalPages = Math.ceil(totalCount / FOSSILS_PER_PAGE)

  if (loading && fossils.length === 0) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            All Fossils
          </h1>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-96 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && fossils.length === 0) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            All Fossils
          </h1>
          <div className="rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900 dark:text-red-300">
            {error}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
          All Fossils {totalCount > 0 && `(${totalCount})`}
        </h1>

        {fossils.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              No fossils have been added yet.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {fossils.map((fossil) => (
                <div
                  key={fossil.id}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="relative h-48 w-full">
                    <Image
                      src={fossil.image_url}
                      alt={fossil.species || 'Fossil'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {fossil.species || 'Unnamed Fossil'}
                    </h3>
                    <p className="mb-3 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
                      {fossil.description}
                    </p>
                    <div className="space-y-1 text-xs text-gray-500 dark:text-gray-500">
                      {fossil.location && (
                        <div className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {fossil.location}
                        </div>
                      )}
                      {fossil.discovery_date && (
                        <div className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(fossil.discovery_date)}
                        </div>
                      )}
                    </div>
                    {fossil.tags && fossil.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {fossil.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`rounded-md px-4 py-2 text-sm font-medium ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

