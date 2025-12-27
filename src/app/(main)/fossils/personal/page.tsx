'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Image from 'next/image'
import { useFossilCache, type Fossil } from '@/contexts/FossilCacheContext'
import FossilSearchFilters, { type SearchFilters } from '@/components/FossilSearchFilters'
import FossilDetailModal from '@/components/FossilDetailModal'
import EditFossilModal from '@/components/EditFossilModal'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function PersonalFossilsPage() {
  const [filters, setFilters] = useState<SearchFilters>({})
  const [selectedFossil, setSelectedFossil] = useState<Fossil | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [fossilToEdit, setFossilToEdit] = useState<Fossil | null>(null)
  const [fossilToDelete, setFossilToDelete] = useState<Fossil | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null)
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const {
    userFossils: fossils,
    loadingUser: loading,
    errorUser: error,
    fetchUserFossils,
    clearCache,
  } = useFossilCache()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOpenFor && menuRefs.current[menuOpenFor] && !menuRefs.current[menuOpenFor]?.contains(event.target as Node)) {
        setMenuOpenFor(null)
      }
    }
    if (menuOpenFor) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpenFor])

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

  const handleFossilClick = (fossil: Fossil) => {
    setSelectedFossil(fossil)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedFossil(null)
  }

  const handleEditClick = (fossil: Fossil, e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpenFor(null)
    setFossilToEdit(fossil)
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (fossil: Fossil, e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpenFor(null)
    setFossilToDelete(fossil)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!fossilToDelete) return
    
    setIsDeleting(true)
    setDeleteError('')

    try {
      const supabase = createClient()
      
      // Delete the fossil from the database
      const { error } = await supabase
        .from('fossils')
        .delete()
        .eq('id', fossilToDelete.id)

      if (error) throw error

      // Clear cache and refresh
      clearCache()
      setShowDeleteConfirm(false)
      setFossilToDelete(null)
      await fetchUserFossils(filters)
      window.dispatchEvent(new Event('fossils-refresh'))
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete fossil')
    } finally {
      setIsDeleting(false)
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
                onClick={() => handleFossilClick(fossil)}
                className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="relative h-32 w-full bg-gray-50 dark:bg-gray-900">
                  <Image
                    src={fossil.image_url}
                    alt={fossil.species || 'Fossil'}
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                  {/* 3-dot menu - all user fossils are owned by the user */}
                  <div className="absolute right-2 top-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenFor(menuOpenFor === fossil.id ? null : fossil.id)
                      }}
                      className="cursor-pointer rounded-full bg-white/90 p-1.5 opacity-0 shadow-md transition-opacity hover:bg-white group-hover:opacity-100 dark:bg-gray-800/90 dark:hover:bg-gray-800"
                    >
                      <svg className="h-4 w-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>
                    {/* Dropdown menu */}
                    {menuOpenFor === fossil.id && (
                      <div
                        ref={(el) => (menuRefs.current[fossil.id] = el)}
                        className="absolute right-0 top-8 z-10 w-32 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => handleEditClick(fossil, e)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(fossil, e)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
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

      {/* Fossil Detail Modal */}
      <FossilDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        fossil={selectedFossil}
      />

      {/* Edit Fossil Modal */}
      {user && fossilToEdit && (
        <EditFossilModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setFossilToEdit(null)
          }}
          user={user}
          fossil={fossilToEdit}
          onSuccess={async () => {
            // Clear cache and refresh
            clearCache()
            await fetchUserFossils(filters)
            window.dispatchEvent(new Event('fossils-refresh'))
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && fossilToDelete && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
          onClick={() => {
            setShowDeleteConfirm(false)
            setDeleteError('')
          }}
        >
          <div 
            className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Are you sure?
            </h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              This action cannot be undone. This will permanently delete the fossil &quot;{fossilToDelete.species || 'Unnamed Fossil'}&quot;.
            </p>
            
            {deleteError && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900 dark:text-red-300">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setFossilToDelete(null)
                  setDeleteError('')
                }}
                disabled={isDeleting}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

