'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import MangaEditModal from '@/components/MangaEditModal'
import MangaAddModal from '@/components/MangaAddModal'

interface Manga {
  slug: string
  title: string
  manhwaTitle?: string
  alternativeTitle?: string
  url: string
  manhwaUrl?: string
  image: string
  author: string
  type: string
  status: string
  released: string
  genres: string[]
  synopsis: string
  totalChapters: number
  scrapedAt: string
  lastUpdated?: string
  views?: number
  bookmarks?: number
  comments?: number
  chapters?: any[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const MangaManagement = () => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [manga, setManga] = useState<Manga[]>([])
  const [loadingManga, setLoadingManga] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('title')
  const [sortOrder, setSortOrder] = useState('asc')
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user && user.email !== 'admin@arkomik.com') {
      router.push('/')
      return
    }

    fetchManga()
  }, [user, loading, router, currentPage, searchTerm, sortBy, sortOrder])

  const fetchManga = async () => {
    try {
      setLoadingManga(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/admin/manga?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch manga')
      }

      const data = await response.json()
      
      if (data.success) {
        setManga(data.manga)
        setPagination(data.pagination)
      } else {
        throw new Error(data.error || 'Failed to fetch manga')
      }
    } catch (error) {
      console.error('Error fetching manga:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoadingManga(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
  }

  // Realtime search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchManga()
    }, 300) // 300ms delay for better UX

    return () => clearTimeout(timeoutId)
  }, [searchTerm, sortBy, sortOrder])

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const handleEditManga = (mangaItem: Manga) => {
    setSelectedManga(mangaItem)
    setShowEditModal(true)
  }

  const handleSaveManga = async (updatedManga: Manga) => {
    try {
      // Update the manga in the local state
      setManga(prev => prev.map(m => 
        m.slug === updatedManga.slug ? updatedManga : m
      ))
    } catch (error) {
      console.error('Error updating manga:', error)
      setError(error instanceof Error ? error.message : 'Failed to update manga')
    }
    // Show success message
    setError(null)
    // Refresh data to ensure consistency
    fetchManga()
  }

  const handleAddManga = async (newManga: Manga) => {
    try {
      // Add the new manga to the local state
      setManga(prev => [newManga, ...prev])
      // Update pagination total
      setPagination(prev => ({ ...prev, total: prev.total + 1 }))
      // Show success message
      setError(null)
      // Refresh data to ensure consistency
      fetchManga()
    } catch (error) {
      console.error('Error adding manga:', error)
      setError(error instanceof Error ? error.message : 'Failed to add manga')
    }
  }

  const handleDeleteManga = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this manga? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/manga/${slug}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete manga')
      }

      await fetchManga()
    } catch (error) {
      console.error('Error deleting manga:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete manga')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manga Management</h1>
        <p className="text-gray-800 font-medium">Manage and monitor all manga in the system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg shadow-lg text-white">
          <h3 className="text-sm font-medium text-blue-100">Total Manga</h3>
          <p className="text-2xl font-bold text-white">{pagination.total}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg shadow-lg text-white">
          <h3 className="text-sm font-medium text-green-100">Total Chapters</h3>
          <p className="text-2xl font-bold text-white">
            {manga.reduce((sum, m) => sum + m.totalChapters, 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg shadow-lg text-white">
          <h3 className="text-sm font-medium text-purple-100">Total Bookmarks</h3>
          <p className="text-2xl font-bold text-white">
            {manga.reduce((sum, m) => sum + (m.bookmarks || 0), 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-lg shadow-lg text-white">
          <h3 className="text-sm font-medium text-orange-100">Total Comments</h3>
          <p className="text-2xl font-bold text-white">
            {manga.reduce((sum, m) => sum + (m.comments || 0), 0)}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Search manga by title, author, or alternative title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors text-gray-900 font-medium"
            />
            <p className="text-xs text-gray-600 mt-1 font-medium">Real-time search - results update automatically</p>
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors text-gray-900 font-medium"
            >
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="totalChapters">Chapters</option>
              <option value="views">Views</option>
              <option value="bookmarks">Bookmarks</option>
              <option value="scrapedAt">Date Added</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors text-gray-900 font-medium"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md hover:shadow-lg"
            >
              ➕ Add Manga
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6 shadow-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Manga Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Cover
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('title')}
                >
                  Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('author')}
                >
                  Author {sortBy === 'author' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Status
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('totalChapters')}
                >
                  Chapters {sortBy === 'totalChapters' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('views')}
                >
                  Views {sortBy === 'views' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('bookmarks')}
                >
                  Bookmarks {sortBy === 'bookmarks' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingManga ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      <span className="text-gray-800 font-medium">Loading manga data...</span>
                    </div>
                  </td>
                </tr>
              ) : manga.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <p className="text-lg font-semibold text-gray-800">No manga found</p>
                      <p className="text-sm text-gray-600 font-medium">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                manga.map((mangaItem) => (
                  <tr key={mangaItem.slug} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={mangaItem.image}
                        alt={mangaItem.manhwaTitle}
                        className="h-14 w-14 object-cover rounded-lg shadow-sm border border-gray-200"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">
                        {mangaItem.title || mangaItem.manhwaTitle}
                      </div>
                      {mangaItem.alternativeTitle && (
                        <div className="text-sm text-gray-700 mt-1 font-medium">
                          {mangaItem.alternativeTitle}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {mangaItem.author}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                        mangaItem.status === 'Completed' 
                          ? 'bg-green-100 text-green-900 border border-green-200'
                          : mangaItem.status === 'Ongoing'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : 'bg-yellow-100 text-yellow-900 border border-yellow-200'
                      }`}>
                        {mangaItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {mangaItem.totalChapters}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      <span className="font-bold">{mangaItem.views?.toLocaleString() || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      <span className="font-bold">{mangaItem.bookmarks?.toLocaleString() || '0'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      <button
                        onClick={() => handleEditManga(mangaItem)}
                        className="text-blue-700 hover:text-blue-900 hover:bg-blue-50 px-3 py-1 rounded-md transition-colors mr-2 font-semibold"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteManga(mangaItem.slug)}
                        className="text-red-700 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded-md transition-colors font-semibold"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-800 font-medium">
                  Showing <span className="font-bold text-gray-900">{((currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-bold text-gray-900">{Math.min(currentPage * pagination.limit, pagination.total)}</span> of{' '}
                  <span className="font-bold text-gray-900">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-bold transition-colors ${
                          currentPage === page
                            ? 'z-10 bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Manga Modal */}
      <MangaAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddManga}
      />

      {/* Edit Manga Modal */}
      <MangaEditModal
        manga={selectedManga}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedManga(null)
        }}
        onSave={handleSaveManga}
      />
    </div>
  )
}

export default MangaManagement
