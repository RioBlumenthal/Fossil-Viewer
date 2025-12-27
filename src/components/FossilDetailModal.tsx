'use client'

import Image from 'next/image'
import type { Fossil } from '@/contexts/FossilCacheContext'

interface FossilDetailModalProps {
  isOpen: boolean
  onClose: () => void
  fossil: Fossil | null
}

export default function FossilDetailModal({ isOpen, onClose, fossil }: FossilDetailModalProps) {
  if (!isOpen || !fossil) return null

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

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 text-gray-400 shadow-md hover:bg-gray-100 hover:text-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Image Section */}
          <div className="relative h-64 w-full bg-gray-50 dark:bg-gray-900 lg:h-auto lg:w-1/2">
            <Image
              src={fossil.image_url}
              alt={fossil.species || 'Fossil'}
              fill
              className="object-contain p-4"
              unoptimized
              priority
            />
          </div>

          {/* Content Section */}
          <div className="flex-1 p-6 lg:p-8">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {fossil.species || 'Unnamed Fossil'}
            </h2>

            <div className="space-y-4">
              {/* Description */}
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Description
                </h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {fossil.description}
                </p>
              </div>

              {/* Location */}
              {fossil.location && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Location
                  </h3>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{fossil.location}</span>
                  </div>
                </div>
              )}

              {/* Discovery Date */}
              {fossil.discovery_date && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Discovery Date
                  </h3>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(fossil.discovery_date)}</span>
                  </div>
                </div>
              )}

              {/* Tags */}
              {fossil.tags && fossil.tags.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {fossil.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <p>Added: {formatDateTime(fossil.created_at)}</p>
                  {fossil.updated_at !== fossil.created_at && (
                    <p>Updated: {formatDateTime(fossil.updated_at)}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

