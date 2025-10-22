'use client'

import { useEffect, useState } from 'react'
import ManhwaCard from '@/components/ManhwaCard'
import HeroSlider from '@/components/HeroSlider'
import PopularSidebar from '@/components/PopularSidebar'
import { Manhwa } from '@/types'

export default function Home() {
  const [manhwaList, setManhwaList] = useState<Manhwa[]>([])
  const [popularList, setPopularList] = useState<Manhwa[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPopular, setLoadingPopular] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  useEffect(() => {
    fetchManhwa()
    fetchPopular()
  }, [])

  const fetchManhwa = async () => {
    try {
      console.log('Fetching manhwa from API...')
      // Use new API that reads from individual JSON files with scrapedAt
      const response = await fetch('/api/komiku/list-from-files?limit=50')
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('API Response:', data)
      
      if (data.success) {
        console.log('Manhwa count:', data.data.manhwa?.length || 0)
        
        // API already sorted by scrapedAt, just take top 30
        const manhwaData = data.data.manhwa.slice(0, 30)
        
        // Debug: Log top 5 manhwa with scrapedAt and chapters
        console.log('Top 5 manhwa by scrapedAt:')
        manhwaData.slice(0, 5).forEach((m: any, i: number) => {
          console.log(`${i + 1}. ${m.title} - ${m.scrapedAt || 'No date'}`)
          console.log('   Chapters:', m.chapters?.slice(0, 3).map((c: any) => c.number))
        })
        
        setManhwaList(manhwaData)
        setError(null)
      } else {
        console.error('API returned error:', data.error)
        setError(data.error || 'Failed to load manhwa')
      }
    } catch (error) {
      console.error('Error fetching manhwa:', error)
      setError(error instanceof Error ? error.message : 'Failed to load manhwa')
    } finally {
      setLoading(false)
    }
  }

  const fetchPopular = async () => {
    try {
      const response = await fetch('/api/komiku/list?limit=50&withCovers=true')
      const data = await response.json()
      
      if (data.success) {
        // Sort by rating and get top 12
        const sorted = [...data.data.manhwa]
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 12)
        
        setPopularList(sorted)
      }
    } catch (error) {
      console.error('Error fetching popular:', error)
    } finally {
      setLoadingPopular(false)
    }
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* Hero Slider */}
        {!loading && manhwaList.length > 0 && <HeroSlider manhwaList={manhwaList} />}

        {/* Main Content with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 xl:col-span-9">
            {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 dark:text-red-200 font-semibold">Error loading data</p>
            </div>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
            <button 
              onClick={() => { fetchManhwa(); fetchPopular(); }}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Popular Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🔥 Manhwa Populer
            </h2>
            <a href="/populer" className="text-primary-600 dark:text-primary-400 hover:underline text-sm">
              Lihat Semua →
            </a>
          </div>

          {loadingPopular ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="skeleton h-80 rounded-lg" />
              ))}
            </div>
          ) : popularList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {popularList.map((manhwa) => (
                <ManhwaCard key={manhwa.slug} manhwa={manhwa} showNewBadge={false} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              Belum ada data populer tersedia
            </p>
          )}
        </section>

        {/* Latest Updates */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📚 Update Terbaru
            </h2>
            <a href="/terbaru" className="text-primary-600 dark:text-primary-400 hover:underline text-sm">
              Lihat Semua →
            </a>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="skeleton h-80 rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {manhwaList
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((manhwa, index) => (
                    <ManhwaCard 
                      key={`${manhwa.slug}-${currentPage}-${index}`} 
                      manhwa={manhwa} 
                      showNewBadge={true} 
                    />
                  ))}
              </div>

              {/* Pagination */}
              {manhwaList.length > itemsPerPage && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.ceil(manhwaList.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(manhwaList.length / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(manhwaList.length / itemsPerPage)}
                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <PopularSidebar />
          </aside>
        </div>
      </div>
    </div>
  )
}
