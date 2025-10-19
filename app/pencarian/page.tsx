'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ManhwaCard from '@/components/ManhwaCard'
import { Manhwa } from '@/types'
import Link from 'next/link'

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports',
  'Supernatural', 'Thriller', 'Martial Arts', 'School Life',
  'Shounen', 'Shoujo', 'Seinen', 'Josei', 'Isekai', 'Harem'
]

const STATUS_OPTIONS = ['All', 'Ongoing', 'Complete']
const SORT_OPTIONS = [
  { value: 'latest', label: 'Terbaru' },
  { value: 'popular', label: 'Populer' },
  { value: 'title', label: 'Judul A-Z' }
]

function AdvancedSearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [manhwaList, setManhwaList] = useState<Manhwa[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [sortBy, setSortBy] = useState('latest')

  useEffect(() => {
    fetchManhwa()
  }, [page, selectedGenres, selectedStatus, sortBy, searchQuery])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [selectedGenres, selectedStatus, sortBy, searchQuery])

  const fetchManhwa = async () => {
    try {
      setLoading(true)
      
      // Progressive loading - load and display results incrementally
      let allManhwa: Manhwa[] = []
      
      // Load multiple pages progressively
      const maxPages = 10
      const promises = []
      
      // Load first 3 pages in parallel for quick initial results
      for (let p = 1; p <= 3; p++) {
        const url = `/api/komiku/list?page=${p}&limit=50&withCovers=true${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`
        promises.push(fetch(url).then(res => res.json()))
      }
      
      // Wait for first batch
      const firstBatch = await Promise.all(promises)
      firstBatch.forEach(data => {
        if (data.success && data.data.manhwa.length > 0) {
          allManhwa = [...allManhwa, ...data.data.manhwa]
        }
      })
      
      // Show initial results immediately
      applyFiltersAndDisplay(allManhwa)
      setLoading(false)
      
      // Continue loading remaining pages in background
      for (let p = 4; p <= maxPages; p++) {
        const url = `/api/komiku/list?page=${p}&limit=50&withCovers=true${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`
        const response = await fetch(url)
        const data = await response.json()
        
        if (data.success && data.data.manhwa.length > 0) {
          allManhwa = [...allManhwa, ...data.data.manhwa]
          applyFiltersAndDisplay(allManhwa) // Update results as more data loads
          
          if (data.data.manhwa.length < 50) break
        } else {
          break
        }
      }
    } catch (error) {
      console.error('Error fetching manhwa:', error)
      setLoading(false)
    }
  }
  
  const applyFiltersAndDisplay = (allManhwa: Manhwa[]) => {
    let results = allManhwa
    
    // Filter by genres (client-side)
    if (selectedGenres.length > 0) {
      results = results.filter((manhwa: Manhwa) =>
        selectedGenres.every(genre =>
          manhwa.genres?.some(g => g.toLowerCase() === genre.toLowerCase())
        )
      )
    }
    
    // Filter by status (client-side)
    if (selectedStatus !== 'All') {
      results = results.filter((manhwa: Manhwa) => {
        const status = manhwa.status?.toLowerCase() || ''
        if (selectedStatus === 'Complete') {
          return status.includes('complete') ||
                 status.includes('completed') ||
                 status === 'end'
        }
        return status.includes(selectedStatus.toLowerCase())
      })
    }
    
    // Sort results
    if (sortBy === 'title') {
      results.sort((a: Manhwa, b: Manhwa) => 
        (a.manhwaTitle || a.title).localeCompare(b.manhwaTitle || b.title)
      )
    }
    
    // Client-side pagination
    const itemsPerPage = 30
    const totalItems = results.length
    const totalPagesCalc = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedResults = results.slice(startIndex, endIndex)
    
    setManhwaList(paginatedResults)
    setTotalPages(totalPagesCalc)
  }

  const handleSearch = () => {
    setPage(1)
    fetchManhwa()
  }

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    )
    setPage(1)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedGenres([])
    setSelectedStatus('All')
    setSortBy('latest')
    setPage(1)
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          🔍 Pencarian Lanjutan
        </h1>

        {/* Search Bar */}
        <div className="card p-6 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Cari judul manhwa..."
              className="input-field flex-1"
            />
            <button
              onClick={handleSearch}
              className="btn-primary px-6"
            >
              Cari
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                  Filter
                </h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Reset
                </button>
              </div>

              {/* Status Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Status
                </h3>
                <div className="space-y-2">
                  {STATUS_OPTIONS.map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={selectedStatus === status}
                        onChange={() => {
                          setSelectedStatus(status)
                          setPage(1)
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Urutkan
                </h3>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value)
                    setPage(1)
                  }}
                  className="input-field w-full"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Genre Filter */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Genre
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {GENRES.map((genre) => (
                    <label key={genre} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGenres.includes(genre)}
                        onChange={() => toggleGenre(genre)}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{genre}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Active Filters */}
              {(selectedGenres.length > 0 || selectedStatus !== 'All') && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Filter Aktif:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedGenres.map((genre) => (
                      <span
                        key={genre}
                        className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-1 rounded"
                      >
                        {genre}
                      </span>
                    ))}
                    {selectedStatus !== 'All' && (
                      <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                        {selectedStatus}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {!loading && (
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-400">
                  {manhwaList.length > 0 ? (
                    <>
                      Menampilkan {manhwaList.length} manhwa
                      {totalPages > 1 && ` (Halaman ${page} dari ${totalPages})`}
                    </>
                  ) : (
                    'Tidak ada hasil'
                  )}
                </p>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="skeleton h-80 rounded-lg" />
                ))}
              </div>
            ) : manhwaList.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {manhwaList.map((manhwa) => (
                    <ManhwaCard key={manhwa.slug} manhwa={manhwa} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-gray-200 dark:bg-dark-700 rounded-lg disabled:opacity-50"
                    >
                      ← Previous
                    </button>
                    <span className="text-gray-700 dark:text-gray-300">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 bg-gray-200 dark:bg-dark-700 rounded-lg disabled:opacity-50"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Tidak ada hasil
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Coba ubah filter atau kata kunci pencarian
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdvancedSearchPage() {
  return (
    <Suspense fallback={
      <div className="py-8">
        <div className="container-custom">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <AdvancedSearchContent />
    </Suspense>
  )
}
