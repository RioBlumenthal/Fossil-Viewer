'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Fossil } from '@/contexts/FossilCacheContext'

interface EditFossilModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  fossil: Fossil | null
  onSuccess?: () => void
}

export default function EditFossilModal({ isOpen, onClose, user, fossil, onSuccess }: EditFossilModalProps) {
  const [species, setSpecies] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [discoveryDate, setDiscoveryDate] = useState('')
  const [tags, setTags] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Populate form when fossil data is available
  useEffect(() => {
    if (fossil && isOpen) {
      setSpecies(fossil.species || '')
      setDescription(fossil.description || '')
      setLocation(fossil.location || '')
      setDiscoveryDate(fossil.discovery_date ? fossil.discovery_date.split('T')[0] : '')
      setTags(fossil.tags ? fossil.tags.join(', ') : '')
      setImagePreview(fossil.image_url)
      setImageFile(null)
      setError('')
    }
  }, [fossil, isOpen])

  if (!isOpen || !fossil) return null

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()

      let imageUrl = fossil.image_url

      // If a new image was uploaded, upload it to Supabase Storage
      if (imageFile) {
        // Try to delete old image if it exists in storage (extract path from URL)
        try {
          const urlParts = fossil.image_url.split('/')
          const fileNameIndex = urlParts.findIndex(part => part === 'fossil-images')
          if (fileNameIndex !== -1 && fileNameIndex < urlParts.length - 1) {
            const oldImagePath = urlParts.slice(fileNameIndex + 1).join('/')
            await supabase.storage.from('fossil-images').remove([oldImagePath])
          }
        } catch (err) {
          // If deletion fails, continue anyway - the new image will be uploaded
          console.warn('Failed to delete old image:', err)
        }

        // Upload new image
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('fossil-images')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('fossil-images')
          .getPublicUrl(fileName)
        
        imageUrl = publicUrl
      }

      // Verify ownership before updating
      if (fossil.user_id !== user.id) {
        throw new Error('You do not have permission to edit this fossil')
      }

      // Convert tags string to array
      const tagsArray = tags
        ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : null

      // Update fossil in database (with ownership check)
      const { error: updateError } = await supabase
        .from('fossils')
        .update({
          species: species || null,
          description: description,
          location: location || null,
          discovery_date: discoveryDate || null,
          tags: tagsArray,
          image_url: imageUrl,
        })
        .eq('id', fossil.id)
        .eq('user_id', user.id) // Additional security: verify ownership in query

      if (updateError) throw updateError

      onClose()
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating the fossil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Edit Fossil
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Species <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Location <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Discovery Date <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="date"
              value={discoveryDate}
              onChange={(e) => setDiscoveryDate(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags <span className="text-gray-400">(optional, comma-separated)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., dinosaur, jurassic, complete"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Image <span className="text-gray-400">(optional - leave empty to keep current)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-gray-700 dark:file:text-gray-300"
            />
            {imagePreview && (
              <div className="mt-3">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-64 rounded-md object-contain"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

