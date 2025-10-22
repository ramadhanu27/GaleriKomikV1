'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ManhwaCard from '@/components/ManhwaCard'
import { Manhwa } from '@/types'
import Link from 'next/link'

const GENRES = [
  '4-Koma', 'Actiom', 'Action', 'Action Adventure', 'Actions', 'Adaptasi', 'Adaptation',
  'Adult', 'Adventure', 'Adventure l', 'Age Gap', 'Aliens', 'Animal', 'Animals',
  'Antihero', 'Apocalyptic', 'Artbook', 'Award Winning', 'Bacamanga', 'Beasts',
  'Berwarna Penuh', 'Bloody', 'Bodyswap', 'Borderline H', 'Boys', 'Boys\' Love',
  'Businessman', 'Cartoon', 'Cheating/Infidelity', 'Childhood Friends', 'Clam Protagonist',
  'College life', 'Comedy', 'Comedy. Fantasy. Isekai. Romance', 'Comic', 'COMICS',
  'Coming Soon', 'Cooking', 'Cooming Soon', 'Crime', 'Crossdressing', 'Cultivasi',
  'cultivation', 'Dance', 'Dark Fantasy', 'Delinquents', 'Dementia', 'Demon', 'Demons',
  'Doctor', 'Drama', 'Dungeons', 'Ecchi', 'Emperor\'s daughte', 'Emperor\'s daughter',
  'Fan-Colored', 'Fanstasy', 'Fanstay', 'Fantas', 'Fantasi', 'Fantasy', 'Fetish',
  'Full Color', 'Full Colour', 'Fusion Fantasy', 'Game', 'gaming', 'Gang',
  'Gender Bender', 'Genderswap', 'Genius', 'genre drama', 'Ghosts', 'Girls',
  'Girls\' Love', 'Gore', 'Gyaru', 'H4rem', 'Harem', 'Hentai', 'Hero', 'Historical',
  'History', 'Horror', 'Hot blood', 'Imageset', 'Incest', 'Industri Film', 'Iseka',
  'Isekai', 'Josei', 'Josei(W)', 'kerajaan', 'Kids', 'Kodomo', 'Kombay', 'Komedi',
  'Komikav', 'Komikcast', 'Korean', 'KUMAPAGE', 'Law', 'Leveling', 'Loli', 'Lolicon',
  'Long Strip', 'Mafia', 'Magic', 'Magical', 'Magical Girls', 'Manga', 'Manhua',
  'Manhwa', 'Martial Art', 'Martial Arts', 'Matrial Arts', 'Mature', 'Mecha', 'Medical',
  'MgKomik', 'Milf Lover', 'Military', 'Mirror', 'Modern', 'Monster', 'Monster girls',
  'Monsters', 'Murim', 'Music', 'Mystery', 'Necromancer', 'Netorare/NTR', 'Ninja',
  'Non-human', 'NTR', 'Office Workers', 'One-Shot', 'Oneshot', 'Ongoing', 'Overpowered',
  'Parody', 'Penjahat', 'Pets', 'Philosophical', 'Police', 'Post apocalyptic', 'Project',
  'Psychological', 'Regression', 'Reincanation', 'Reincarnation', 'Returner', 'Revenge',
  'Reverse harem', 'Reverse Isekai', 'Romance', 'Romane', 'Romantis', 'Romcom',
  'Royal family', 'Royalty', 'scholol life', 'School', 'School Life', 'Sci-fi', 'Seinen',
  'Seinen(M)', 'Seinin', 'Sejarah', 'SekteKomik', 'Sexual Violence', 'Shotacon', 'Shoujo',
  'Shoujo Ai', 'Shoujo(G)', 'Shoujom Romance', 'Shounen', 'Shounen Ai', 'Shounen Ai.Yaoi',
  'Shounen(B)', 'Showbiz', 'Silver & Golden', 'Slice of Lie', 'Slice of Life', 'SliLifece of',
  'SM/BDSM/SUB-DOM', 'Smut', 'Space', 'Sport', 'Sports', 'Super Power', 'Superhero',
  'Supernatural', 'Superpowers', 'Supranatural', 'Survival', 'Sutradara', 'System',
  'Thriller', 'Time Travel', 'Traditional Games', 'Tragedy', 'Transmigration', 'Updating',
  'Vampire', 'Vampires', 'Video Games', 'Villainess', 'Violence', 'Virtual Reality',
  'Web Comic', 'Webtoon', 'Webtoons', 'Western', 'Wuxia', 'Xianxia', 'Xuanhuan',
  'Yakuzas', 'Yaoi', 'Yaoi(BL)', 'Yuri', 'Yuri(GL)', 'Zombies'
].sort()

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const fetchManhwa = async () => {
    try {
      setLoading(true)
      
      // Progressive loading - load and display results incrementally
      let allManhwa: Manhwa[] = []
      
      // Optimized: Load fewer pages but faster
      const maxPages = 5 // Reduced from 10 to 5 for faster loading
      const initialBatchSize = 2 // Load 2 pages initially for quick display
      
      // Load first 2 pages in parallel for instant results
      const promises = []
      for (let p = 1; p <= initialBatchSize; p++) {
        const url = `/api/komiku/list?page=${p}&limit=50&withCovers=true${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`
        promises.push(fetch(url).then(res => res.json()))
      }
      
      // Wait for first batch and show immediately
      const firstBatch = await Promise.all(promises)
      firstBatch.forEach(data => {
        if (data.success && data.data.manhwa.length > 0) {
          allManhwa = [...allManhwa, ...data.data.manhwa]
        }
      })
      
      // Show initial results immediately (100 manhwa)
      applyFiltersAndDisplay(allManhwa)
      setLoading(false)
      
      // Load remaining pages in parallel batches (background)
      const remainingPages = []
      for (let p = initialBatchSize + 1; p <= maxPages; p++) {
        const url = `/api/komiku/list?page=${p}&limit=50&withCovers=true${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`
        remainingPages.push(fetch(url).then(res => res.json()))
      }
      
      // Process remaining pages as they arrive
      const remainingBatch = await Promise.all(remainingPages)
      remainingBatch.forEach(data => {
        if (data.success && data.data.manhwa.length > 0) {
          allManhwa = [...allManhwa, ...data.data.manhwa]
        }
      })
      
      // Final update with all data
      applyFiltersAndDisplay(allManhwa)
      
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
    const itemsPerPage = 20
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

  useEffect(() => {
    fetchManhwa()
  }, [page, selectedGenres, selectedStatus, sortBy, searchQuery])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [selectedGenres, selectedStatus, sortBy, searchQuery])

  return (
    <div className="py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          🔍 Pencarian Lanjutan
        </h1>

        {/* Modern Filter Section */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-dark-800 dark:to-dark-900 rounded-2xl shadow-xl p-6 mb-8 border border-slate-700/50">
          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Genre Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 block">Genre</label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    toggleGenre(e.target.value)
                    e.target.value = '' // Reset dropdown
                  }
                }}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none hover:bg-slate-700"
                defaultValue=""
              >
                <option value="" disabled>Genre All ▼</option>
                {GENRES.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 block">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none hover:bg-slate-700"
              >
                <option value="All">Status All ▼</option>
                {STATUS_OPTIONS.filter(s => s !== 'All').map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 block">Urutan</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setPage(1)
                }}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none hover:bg-slate-700"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 block">Cari Manhwa</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Cari judul manhwa..."
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none hover:bg-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-700/50">
            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-lg transition-all shadow-lg shadow-red-900/30 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Text Mode
              </button>
            </div>

            {/* Clear Filters */}
            {(selectedGenres.length > 0 || selectedStatus !== 'All' || sortBy !== 'latest' || searchQuery) && (
              <button
                onClick={clearFilters}
                className="ml-auto px-4 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reset Filters
              </button>
            )}
          </div>

          {/* Active Genre Tags */}
          {selectedGenres.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700/50">
              <span className="text-sm text-slate-400 font-medium mr-2">Genre dipilih:</span>
              {selectedGenres.map((genre) => (
                <span
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium rounded-full cursor-pointer hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg"
                >
                  {genre}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div>
            {/* Results Count */}
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
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' : 'space-y-2'}>
                {[...Array(15)].map((_, i) => (
                  <div key={i} className={viewMode === 'grid' ? 'skeleton h-80 rounded-lg' : 'skeleton h-12 rounded-lg'} />
                ))}
              </div>
            ) : manhwaList.length > 0 ? (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {manhwaList.map((manhwa) => (
                      <ManhwaCard key={manhwa.slug} manhwa={manhwa} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {manhwaList.map((manhwa, index) => {
                      const cleanTitle = (manhwa.manhwaTitle || manhwa.title)
                        .replace(/^Komik\s+/i, '')
                        .replace(/\s+Bahasa Indonesia$/i, '')
                        .trim()
                      const cleanSlug = manhwa.slug.replace(/-bahasa-indonesia$/, '')
                      
                      return (
                        <Link
                          key={manhwa.slug}
                          href={`/manhwa/${cleanSlug}`}
                          className="flex items-center gap-4 p-3 bg-white dark:bg-dark-800 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors group"
                        >
                          <span className="text-gray-500 dark:text-gray-400 font-mono text-sm w-8 text-right flex-shrink-0">
                            {((page - 1) * 30 + index + 1).toString().padStart(2, '0')}
                          </span>
                          <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-1">
                            {cleanTitle}
                          </h3>
                          {manhwa.status && (
                            <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
                              manhwa.status.toLowerCase().includes('ongoing')
                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            }`}>
                              {manhwa.status}
                            </span>
                          )}
                          {manhwa.totalChapters && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                              {manhwa.totalChapters} Ch
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}

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
