'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface MangaAddModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (manga: any) => void
}

export default function MangaAddModal({ isOpen, onClose, onAdd }: MangaAddModalProps) {
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    alternativeTitle: '',
    url: '',
    image: '',
    author: '',
    type: 'Manga',
    status: 'Ongoing',
    released: '',
    genres: [] as string[],
    synopsis: '',
    totalChapters: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [genreInput, setGenreInput] = useState('')
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  // Generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.title])

  // Check slug availability
  useEffect(() => {
    const checkSlugAvailability = async () => {
      if (formData.slug.length < 3) {
        setSlugAvailable(null)
        return
      }

      setCheckingSlug(true)
      try {
        const response = await fetch(`/api/admin/manga/create-local?slug=${encodeURIComponent(formData.slug)}`)
        const result = await response.json()
        
        if (result.success) {
          setSlugAvailable(!result.exists)
        }
      } catch (error) {
        console.error('Error checking slug:', error)
      } finally {
        setCheckingSlug(false)
      }
    }

    const timeoutId = setTimeout(checkSlugAvailability, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.slug])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGenreInput(e.target.value)
  }

  const addGenre = () => {
    if (genreInput.trim() && !formData.genres.includes(genreInput.trim())) {
      setFormData(prev => ({
        ...prev,
        genres: [...prev.genres, genreInput.trim()]
      }))
      setGenreInput('')
    }
  }

  const removeGenre = (genreToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.filter(genre => genre !== genreToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.slug || !formData.title) {
        setError('Slug and Title are required')
        return
      }

      if (slugAvailable === false) {
        setError('Slug already exists. Please choose a different slug.')
        return
      }

      const response = await fetch('/api/admin/manga/create-local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        console.log('Manga created successfully:', result.manga.title)
        
        // Update parent with the new manga data
        onAdd(result.manga)
        
        // Reset form and close modal
        setFormData({
          slug: '',
          title: '',
          alternativeTitle: '',
          url: '',
          image: '',
          author: '',
          type: 'Manga',
          status: 'Ongoing',
          released: '',
          genres: [],
          synopsis: '',
          totalChapters: 0
        })
        onClose()
      } else {
        setError(result.error || 'Failed to create manga')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Add New Manga</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
              <X className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          )}

          {/* Title and Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., One Piece, Naruto, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Slug *
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="e.g., one-piece, naruto, etc."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium ${
                  slugAvailable === false ? 'border-red-300' : 
                  slugAvailable === true ? 'border-green-300' : 
                  'border-gray-300'
                }`}
                required
              />
              {checkingSlug && (
                <p className="text-sm text-gray-500 mt-1">Checking availability...</p>
              )}
              {slugAvailable === true && (
                <p className="text-sm text-green-600 mt-1">✓ Slug is available</p>
              )}
              {slugAvailable === false && (
                <p className="text-sm text-red-600 mt-1">✗ Slug already exists</p>
              )}
            </div>
          </div>

          {/* Alternative Title and URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Alternative Title
              </label>
              <input
                type="text"
                name="alternativeTitle"
                value={formData.alternativeTitle}
                onChange={handleInputChange}
                placeholder="e.g., Japanese title, other names"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                URL
              </label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="e.g., https://example.com/manga"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
              />
            </div>
          </div>

          {/* Image URL and Author */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Image URL
              </label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="e.g., https://example.com/cover.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Author
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                placeholder="e.g., Eiichiro Oda, Masashi Kishimoto"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
              />
            </div>
          </div>

          {/* Type and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
              >
                <option value="Manga">Manga</option>
                <option value="Manhwa">Manhwa</option>
                <option value="Manhua">Manhua</option>
                <option value="Comic">Comic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
              >
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Hiatus">Hiatus</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Released and Total Chapters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Released
              </label>
              <input
                type="text"
                name="released"
                value={formData.released}
                onChange={handleInputChange}
                placeholder="e.g., 2023, 2022, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Total Chapters
              </label>
              <input
                type="number"
                name="totalChapters"
                value={formData.totalChapters}
                onChange={handleInputChange}
                min="0"
                placeholder="e.g., 100, 250, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
              />
            </div>
          </div>

          {/* Genres */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Genres
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={genreInput}
                onChange={handleGenreChange}
                placeholder="Add genre and press Enter or click Add"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
              />
              <button
                type="button"
                onClick={addGenre}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.genres.map((genre, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {genre}
                  <button
                    type="button"
                    onClick={() => removeGenre(genre)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Synopsis */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Synopsis
            </label>
            <textarea
              name="synopsis"
              value={formData.synopsis}
              onChange={handleInputChange}
              placeholder="Enter manga synopsis/description..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium resize-vertical"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || slugAvailable === false}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Creating...' : 'Create Manga'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
