'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, ChevronUp, SlidersHorizontal, X, Grid3x3, List } from 'lucide-react'
import { Manhwa } from '@/types'
import { useTheme } from '@/components/ThemeProvider'

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Isekai',
  'Martial Arts', 'Mystery', 'Romance', 'Sci-fi', 'Seinen', 'Shoujo', 'Shounen',
  'Slice of Life', 'Sports', 'Supernatural', 'Thriller', 'Tragedy'
].sort()

const TYPES = ['Manga', 'Manhwa', 'Manhua', 'One-Shot']
const STATUS_OPTIONS = ['Ongoing', 'Completed', 'Hiatus']

function SearchContent() {
  const searchParams = useSearchParams()
  const { theme } = useTheme()
  const darkMode = theme === 'dark'
  
  // State
  const [manhwaList, setManhwaList] = useState<Manhwa[]>([])
  const [filteredList, setFilteredList] = useState<Manhwa[]>([])
  const [paginatedList, setPaginatedList] = useState<Manhwa[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('popular')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 24
  
  // Stats
  const [totalChapters, setTotalChapters] = useState(0)
  const [totalWithSynopsis, setTotalWithSynopsis] = useState(0)
  
  // Filters
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  
  // Accordion state
  const [openSections, setOpenSections] = useState({
    genre: true,
    type: false,
    status: false,
  })

  // Fetch data once on mount
  useEffect(() => {
    fetchManhwa()
  }, [])

  // Apply filters when data or filters change
  useEffect(() => {
    applyFilters()
  }, [manhwaList, searchQuery, selectedGenres, selectedTypes, selectedStatus, sortBy])

  // Apply pagination when filtered list or current page changes
  useEffect(() => {
    applyPagination()
  }, [filteredList, currentPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchQuery, selectedGenres, selectedTypes, selectedStatus, sortBy])

  const fetchManhwa = async () => {
    try {
      setLoading(true)
      setError(null)
      // Use search API - metadata.json already has all data
      const response = await fetch('/api/komiku/search')
      const data = await response.json()
      
      if (data.success) {
        const manhwa = data.data.manhwa
        setManhwaList(manhwa)
        setError(null)
        
        // Calculate stats
        const chapters = manhwa.reduce((sum: number, m: any) => sum + (m.totalChapters || 0), 0)
        const withSynopsis = manhwa.filter((m: any) => m.synopsis && m.synopsis.trim().length > 0).length
        
        setTotalChapters(chapters)
        setTotalWithSynopsis(withSynopsis)
      } else {
        console.error('Search API error:', data.error)
        // Show error to user
        setError(data.error || 'Failed to load manga data')
        setManhwaList([])
      }
    } catch (err) {
      console.error('Error fetching manhwa:', err)
      setError('Failed to connect to server')
      setManhwaList([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let results = [...manhwaList]

    // Search filter
    if (searchQuery) {
      results = results.filter(m =>
        m.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Genre filter
    if (selectedGenres.length > 0) {
      results = results.filter(m =>
        selectedGenres.some(genre =>
          m.genres?.some(g => g.toLowerCase() === genre.toLowerCase())
        )
      )
    }

    // Type filter
    if (selectedTypes.length > 0) {
      results = results.filter(m =>
        selectedTypes.some(type =>
          m.type?.toLowerCase().includes(type.toLowerCase())
        )
      )
    }

    // Status filter
    if (selectedStatus.length > 0) {
      results = results.filter(m =>
        selectedStatus.some(status =>
          m.status?.toLowerCase().includes(status.toLowerCase())
        )
      )
    }

    // Sort
    if (sortBy === 'title') {
      results.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    } else if (sortBy === 'popular') {
      // Sort by rating (highest first)
      results.sort((a, b) => {
        const ratingA = parseFloat(String(a.rating || 0))
        const ratingB = parseFloat(String(b.rating || 0))
        return ratingB - ratingA
      })
    }

    setFilteredList(results)
  }

  const applyPagination = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginated = filteredList.slice(startIndex, endIndex)
    
    console.log(`Pagination: Page ${currentPage}, Items ${startIndex}-${endIndex}, Total: ${filteredList.length}`)
    
    setPaginatedList(paginated)
    setTotalPages(Math.ceil(filteredList.length / itemsPerPage))
  }


  const toggleFilter = (type: 'genre' | 'type' | 'status', value: string) => {
    const setters = {
      genre: setSelectedGenres,
      type: setSelectedTypes,
      status: setSelectedStatus,
    }
    const getters = {
      genre: selectedGenres,
      type: selectedTypes,
      status: selectedStatus,
    }

    const current = getters[type]
    const setter = setters[type]
    
    if (current.includes(value)) {
      setter(current.filter(v => v !== value))
    } else {
      setter([...current, value])
    }
  }

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const clearAllFilters = () => {
    setSelectedGenres([])
    setSelectedTypes([])
    setSelectedStatus([])
    setSearchQuery('')
  }

  return (
    <div className={`min-h-screen font-['Inter'] transition-colors duration-300 ${
      darkMode ? 'bg-[#0a0f1a] text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Main Container - Flex Layout */}
      <div className="flex min-h-screen">
        {/* Sticky Sidebar - Hidden on mobile */}
        <aside className={`hidden lg:block w-64 sticky top-0 self-start h-screen border-r overflow-y-auto transition-colors ${
          darkMode ? 'bg-dark-900 border-gray-800' : 'bg-white border-gray-200'
        }`}>
          <div className="p-4">
      

            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <SlidersHorizontal className="w-4 h-4 text-primary-500" />
                Filters
              </h2>
              {(selectedGenres.length > 0 || selectedTypes.length > 0 || selectedStatus.length > 0) && (
                <button
                  onClick={clearAllFilters}
                  className={`text-xs transition-colors ${
                    darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Genre Accordion */}
            <div className="mb-3">
              <button
                onClick={() => toggleSection('genre')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                  darkMode ? 'bg-dark-800 hover:bg-dark-700' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <span className={`font-semibold text-sm ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Genre</span>
                {openSections.genre ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <AnimatePresence>
                {openSections.genre && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                      {GENRES.map(genre => (
                        <label key={genre} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                          darkMode ? 'hover:bg-dark-800' : 'hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedGenres.includes(genre)}
                            onChange={() => toggleFilter('genre', genre)}
                            className="w-3.5 h-3.5 accent-primary-600"
                          />
                          <span className={`text-xs ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>{genre}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Type Accordion */}
            <div className="mb-3">
              <button
                onClick={() => toggleSection('type')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                  darkMode ? 'bg-dark-800 hover:bg-dark-700' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <span className={`font-semibold text-sm ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Type</span>
                {openSections.type ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <AnimatePresence>
                {openSections.type && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-1">
                      {TYPES.map(type => (
                        <label key={type} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                          darkMode ? 'hover:bg-dark-800' : 'hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedTypes.includes(type)}
                            onChange={() => toggleFilter('type', type)}
                            className="w-3.5 h-3.5 accent-primary-600"
                          />
                          <span className={`text-xs ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>{type}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status Accordion */}
            <div className="mb-3">
              <button
                onClick={() => toggleSection('status')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                  darkMode ? 'bg-dark-800 hover:bg-dark-700' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <span className={`font-semibold text-sm ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Status</span>
                {openSections.status ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <AnimatePresence>
                {openSections.status && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-1">
                      {STATUS_OPTIONS.map(status => (
                        <label key={status} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${
                          darkMode ? 'hover:bg-dark-800' : 'hover:bg-gray-100'
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedStatus.includes(status)}
                            onChange={() => toggleFilter('status', status)}
                            className="w-3.5 h-3.5 accent-primary-600"
                          />
                          <span className={`text-xs ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>{status}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`flex-1 transition-colors ${
          darkMode ? 'bg-dark-950' : 'bg-gray-50'
        }`}>
          {/* Top Bar */}
          <div className={`sticky top-0 z-20 border-b p-4 transition-colors ${
            darkMode ? 'bg-dark-900 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search manga..."
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:border-primary-600 transition-colors ${
                      darkMode 
                        ? 'bg-dark-800 border-gray-700 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className={`flex gap-1 p-1 rounded-lg border ${
                  darkMode ? 'bg-dark-800 border-gray-700' : 'bg-gray-200 border-gray-300'
                }`}>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-primary-600 text-white shadow-lg' 
                        : darkMode
                          ? 'text-gray-400 hover:text-white hover:bg-dark-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'
                    }`}
                    title="Grid View"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-primary-600 text-white shadow-lg' 
                        : darkMode
                          ? 'text-gray-400 hover:text-white hover:bg-dark-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary-600 cursor-pointer transition-colors ${
                    darkMode 
                      ? 'bg-dark-800 border-gray-700 text-white hover:bg-dark-700' 
                      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <option value="popular">Highest Rating</option>
                  <option value="title">A-Z</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedGenres.length > 0 || selectedTypes.length > 0 || selectedStatus.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {[...selectedGenres, ...selectedTypes, ...selectedStatus].map(filter => (
                  <span
                    key={filter}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-600 text-white text-xs rounded-full"
                  >
                    {filter}
                    <button
                      onClick={() => {
                        if (selectedGenres.includes(filter)) toggleFilter('genre', filter)
                        if (selectedTypes.includes(filter)) toggleFilter('type', filter)
                        if (selectedStatus.includes(filter)) toggleFilter('status', filter)
                      }}
                      className="hover:bg-primary-700 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Grid Content */}
          <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(24)].map((_, i) => (
                  <div key={i} className="skeleton h-80 rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <div className={`text-center py-20 rounded-xl border ${
                darkMode ? 'bg-dark-900 border-gray-800' : 'bg-white border-gray-200'
              }`}>
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className={`text-2xl font-bold mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Data Not Available</h3>
                <p className={`mb-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>{error}</p>
                <div className={`max-w-md mx-auto p-4 rounded-lg ${
                  darkMode ? 'bg-dark-800' : 'bg-gray-100'
                }`}>
                  <p className={`text-sm text-left ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    <strong>Required:</strong>.
                  </p>
                  <p className={`text-xs mt-2 text-left ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    
                  </p>
                </div>
                <button
                  onClick={fetchManhwa}
                  className="mt-6 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                >
                  Retry
                </button>
              </div>
            ) : paginatedList.length > 0 ? (
              <>
                {/* Grid View */}
                {viewMode === 'grid' && (
                  <motion.div
                    layout
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                  >
                  <AnimatePresence>
                    {paginatedList.map((manhwa, index) => (
                      <motion.div
                        key={manhwa.slug}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                      >
                        <Link href={`/manhwa/${manhwa.slug}`}>
                          <div className={`group relative rounded-lg overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all duration-300 ${
                            darkMode ? 'bg-dark-900' : 'bg-white shadow-md'
                          }`}>
                            {/* Cover Image */}
                            <div className="relative w-full aspect-[2/3] overflow-hidden">
                              {(() => {
                                const coverImg = manhwa.image
                                return coverImg && (coverImg.startsWith('http://') || coverImg.startsWith('https://')) ? (
                                  <Image
                                    src={coverImg}
                                    alt={manhwa.title || ''}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                    <span className="text-gray-600 text-xs">No Image</span>
                                  </div>
                                )
                              })()}
                              
                              {/* Status Badge */}
                              {manhwa.status && (
                                <div className="absolute top-2 left-2">
                                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                    manhwa.status.toLowerCase().includes('ongoing')
                                      ? 'bg-green-600 text-white'
                                      : 'bg-blue-600 text-white'
                                  }`}>
                                    {manhwa.status}
                                  </span>
                                </div>
                              )}

                              {/* Country Flag */}
                              <div className="absolute top-2 right-2">
                                <div className="w-8 h-5 rounded overflow-hidden shadow-lg">
                                  <Image
                                    src={
                                      manhwa.type?.toLowerCase() === 'manhwa' || manhwa.type?.toLowerCase().includes('korea') ? '/korea.png' : 
                                      manhwa.type?.toLowerCase() === 'manga' || manhwa.type?.toLowerCase().includes('japan') ? '/japan.png' : 
                                      manhwa.type?.toLowerCase() === 'manhua' || manhwa.type?.toLowerCase().includes('china') || manhwa.type?.toLowerCase().includes('chinese') ? '/china.png' : 
                                      '/korea.png'
                                    }
                                    alt="Flag"
                                    width={32}
                                    height={20}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              </div>

                              {/* Chapter Badge */}
                              {manhwa.totalChapters && (
                                <div className="absolute bottom-2 right-2">
                                  <span className="text-xs px-2 py-0.5 bg-black/70 text-white rounded font-medium">
                                    Ch. {manhwa.totalChapters}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Title & Info */}
                            <div className="p-2">
                              <h3 className={`font-medium text-xs line-clamp-2 mb-2 group-hover:text-primary-400 transition-colors ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {manhwa.title?.replace(/^Komik\s+/i, '')}
                              </h3>
                              
                              {/* Rating */}
                              {manhwa.rating && parseFloat(String(manhwa.rating)) > 0 && (
                                <div className="flex items-center gap-1 mb-2">
                                  <span className="text-yellow-500 text-xs">⭐</span>
                                  <span className={`text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {parseFloat(String(manhwa.rating)).toFixed(1)}
                                  </span>
                                </div>
                              )}
                              
                              {/* Genre badges */}
                              {manhwa.genres && manhwa.genres.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {manhwa.genres.slice(0, 2).map((genre, idx) => (
                                    <span key={idx} className={`text-[10px] px-1.5 py-0.5 rounded ${
                                      darkMode ? 'bg-primary-900/50 text-primary-300' : 'bg-primary-100 text-primary-700'
                                    }`}>
                                      {genre}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  </motion.div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <AnimatePresence>
                      {paginatedList.map((manhwa, index) => (
                        <motion.div
                          key={manhwa.slug}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2, delay: index * 0.02 }}
                        >
                          <Link href={`/manhwa/${manhwa.slug}`}>
                            <div className={`flex gap-4 rounded-lg p-3 hover:ring-2 hover:ring-primary-500 transition-all duration-300 ${
                              darkMode ? 'bg-dark-900 hover:bg-dark-800' : 'bg-white hover:bg-gray-50 shadow-md'
                            }`}>
                              {/* Thumbnail */}
                              <div className="relative w-20 h-28 flex-shrink-0 rounded overflow-hidden">
                                {(() => {
                                  const coverImg = manhwa.image
                                  return coverImg && (coverImg.startsWith('http://') || coverImg.startsWith('https://')) ? (
                                    <Image
                                      src={coverImg}
                                      alt={manhwa.title || ''}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                      <span className="text-gray-600 text-xs">No Image</span>
                                    </div>
                                  )
                                })()}
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h3 className={`font-bold text-base line-clamp-1 hover:text-primary-400 transition-colors flex-1 ${
                                    darkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {manhwa.title?.replace(/^Komik\s+/i, '')}
                                  </h3>
                                  {/* Country Flag */}
                                  <div className="w-6 h-6 rounded-full overflow-hidden shadow-lg bg-dark-800 flex-shrink-0">
                                    <Image
                                      src={
                                        manhwa.type?.toLowerCase() === 'manhwa' || manhwa.type?.toLowerCase().includes('korea') ? '/korea.png' : 
                                        manhwa.type?.toLowerCase() === 'manga' || manhwa.type?.toLowerCase().includes('japan') ? '/japan.png' : 
                                        manhwa.type?.toLowerCase() === 'manhua' || manhwa.type?.toLowerCase().includes('china') || manhwa.type?.toLowerCase().includes('chinese') ? '/china.png' : 
                                        '/korea.png'
                                      }
                                      alt="Flag"
                                      width={24}
                                      height={24}
                                      className="object-cover w-full h-full"
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {/* Rating */}
                                  {manhwa.rating && parseFloat(String(manhwa.rating)) > 0 && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold flex items-center gap-1">
                                      ⭐ {parseFloat(String(manhwa.rating)).toFixed(1)}
                                    </span>
                                  )}
                                  {manhwa.status && (
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      manhwa.status.toLowerCase().includes('ongoing')
                                        ? 'bg-green-600 text-white'
                                        : 'bg-blue-600 text-white'
                                    }`}>
                                      {manhwa.status}
                                    </span>
                                  )}
                                  {manhwa.genres && manhwa.genres.slice(0, 3).map((genre, idx) => (
                                    <span key={idx} className="text-xs bg-primary-900/50 text-primary-300 px-2 py-0.5 rounded">
                                      {genre}
                                    </span>
                                  ))}
                                </div>
                                {(() => {
                                  const synopsis = manhwa.synopsis
                                  return synopsis && (
                                    <p className={`text-xs line-clamp-2 mb-2 ${
                                      darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                      {synopsis}
                                    </p>
                                  )
                                })()}
                                <p className={`text-xs ${
                                  darkMode ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                  {manhwa.totalChapters ? `${manhwa.totalChapters} Chapters` : 'No chapters'}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                        darkMode
                          ? 'bg-dark-800 hover:bg-dark-700 disabled:bg-dark-900 disabled:text-gray-600 text-white'
                          : 'bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 text-gray-900 border border-gray-300'
                      } disabled:cursor-not-allowed`}
                    >
                      ← Prev
                    </button>

                    {/* Page Numbers */}
                    <div className="flex gap-2 flex-wrap justify-center">
                      {/* First Page */}
                      {currentPage > 3 && (
                        <>
                          <button
                            onClick={() => setCurrentPage(1)}
                            className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                              darkMode
                                ? 'bg-dark-800 hover:bg-dark-700 text-white'
                                : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
                            }`}
                          >
                            1
                          </button>
                          {currentPage > 4 && <span className={`px-2 py-2 text-sm ${
                            darkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>...</span>}
                        </>
                      )}

                      {/* Current Page Range */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          return page === currentPage || 
                                 page === currentPage - 1 || 
                                 page === currentPage + 1
                        })
                        .map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                              currentPage === page
                                ? 'bg-primary-600 text-white font-bold shadow-lg'
                                : darkMode
                                  ? 'bg-dark-800 hover:bg-dark-700 text-white'
                                  : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        ))}

                      {/* Last Page */}
                      {currentPage < totalPages - 2 && (
                        <>
                          {currentPage < totalPages - 3 && <span className={`px-2 py-2 text-sm ${
                            darkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>...</span>}
                          <button
                            onClick={() => setCurrentPage(totalPages)}
                            className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                              darkMode
                                ? 'bg-dark-800 hover:bg-dark-700 text-white'
                                : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
                            }`}
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                        darkMode
                          ? 'bg-dark-800 hover:bg-dark-700 disabled:bg-dark-900 disabled:text-gray-600 text-white'
                          : 'bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 text-gray-900 border border-gray-300'
                      } disabled:cursor-not-allowed`}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">😢</div>
                <h3 className={`text-2xl font-bold mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>No results found</h3>
                <p className={`${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
