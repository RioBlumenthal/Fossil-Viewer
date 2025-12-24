'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useFossilCache } from '@/contexts/FossilCacheContext'
import FossilSearchFilters, { type SearchFilters } from '@/components/FossilSearchFilters'

export default function PersonalFossilsPage() {
  const [filters, setFilters] = useState<SearchFilters>({})
  const {
    userFossils: fossils,
    loadingUser: loading,
    errorUser: error,
    fetchUserFossils,
    clearCache,
  } = useFossilCache()

  // Get unique tags from user fossils for filter options
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    fossils.forEach((fossil) => {
      fossil.tags?.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [fossils])

  useEffect(() => {
    fetchUserFossils(filters)
  }, [filters, fetchUserFossils])

  useEffect(() => {
    // Listen for refresh events (e.g., when a new fossil is added)
    const handleRefresh = () => {
      clearCache()
      fetchUserFossils(filters)
    }
    window.addEventListener('fossils-refresh', handleRefresh)

    return () => {
      window.removeEventListener('fossils-refresh', handleRefresh)
    }
  }, [filters, fetchUserFossils, clearCache])

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Your Fossils
          </h1>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
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

  if (error) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Your Fossils
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
          Your Fossils {fossils.length > 0 && `(${fossils.length})`}
        </h1>

        <FossilSearchFilters
          onFiltersChange={setFilters}
          availableTags={availableTags}
        />

        {fossils.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              You haven't added any fossils yet. Click the + button in the header to add your first fossil!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {fossils.map((fossil) => (
              <div
                key={fossil.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="relative h-32 w-full bg-gray-50 dark:bg-gray-900">
                  <Image
                    src={fossil.image_url}
                    alt={fossil.species || 'Fossil'}
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                </div>
                <div className="p-2">
                  <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                    {fossil.species || 'Unnamed Fossil'}
                  </h3>
                  <div className="space-y-0.5 text-xs text-gray-500 dark:text-gray-500">
                    {fossil.location && (
                      <div className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{fossil.location}</span>
                      </div>
                    )}
                    {fossil.discovery_date && (
                      <div className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{formatDate(fossil.discovery_date)}</span>
                      </div>
                    )}
                  </div>
                  {fossil.tags && fossil.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {fossil.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                      {fossil.tags.length > 2 && (
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          +{fossil.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

