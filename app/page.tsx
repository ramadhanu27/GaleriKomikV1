'use client'

import { useEffect, useState } from 'react'
import ManhwaCard from '@/components/ManhwaCard'
import HeroSlider from '@/components/HeroSlider'
import PopularSidebar from '@/components/PopularSidebar'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import { Manhwa } from '@/types'

export default function Home() {
  const [manhwaList, setManhwaList] = useState<Manhwa[]>([])
  const [popularList, setPopularList] = useState<Manhwa[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPopular, setLoadingPopular] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

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
        // Sort by rating and get top 15
        const sorted = [...data.data.manhwa]
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 15)
        
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

        {/* Announcement Banner */}
        <AnnouncementBanner />

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
        <section className="mb-8">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                </div>
                Manhwa Populer
              </h2>
              <a href="/populer" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-primary-900/30 flex items-center gap-2">
                Lihat Semua
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {loadingPopular ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="skeleton h-80 rounded-lg" />
              ))}
            </div>
          ) : popularList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {popularList.map((manhwa) => (
                <ManhwaCard key={manhwa.slug} manhwa={manhwa} showNewBadge={false} />
              ))}
              {/* Placeholder cards for empty slots */}
              {Array.from({ length: Math.max(0, 15 - popularList.length) }).map((_, index) => (
                <div 
                  key={`placeholder-popular-${index}`} 
                  className="aspect-[2/3] rounded-lg border-2 border-dashed border-slate-700/50 bg-slate-800/20 flex items-center justify-center"
                >
                  <div className="text-center p-4">
                    <svg className="w-12 h-12 mx-auto text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-xs text-slate-500">Coming Soon</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-400">Belum ada data populer tersedia</p>
            </div>
          )}
        </section>

        {/* Latest Updates */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Update Terbaru
              </h2>
              <a href="/terbaru" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-primary-900/30 flex items-center gap-2">
                Lihat Semua
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="skeleton h-80 rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                {(() => {
                  const currentItems = manhwaList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  const placeholderCount = Math.max(0, itemsPerPage - currentItems.length)
                  
                  return (
                    <>
                      {currentItems.map((manhwa, index) => (
                        <ManhwaCard 
                          key={`${manhwa.slug}-${currentPage}-${index}`} 
                          manhwa={manhwa} 
                          showNewBadge={true} 
                        />
                      ))}
                      {/* Placeholder cards for empty slots */}
                      {Array.from({ length: placeholderCount }).map((_, index) => (
                        <div 
                          key={`placeholder-${index}`} 
                          className="aspect-[2/3] rounded-lg border-2 border-dashed border-slate-700/50 bg-slate-800/20 flex items-center justify-center"
                        >
                          <div className="text-center p-4">
                            <svg className="w-12 h-12 mx-auto text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <p className="text-xs text-slate-500">Coming Soon</p>
                          </div>
                        </div>
                      ))}
                    </>
                  )
                })()}
              </div>

              {/* Pagination */}
              {manhwaList.length > itemsPerPage && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    ← Prev
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.ceil(manhwaList.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                          currentPage === page
                            ? 'bg-primary-600 text-white shadow-lg'
                            : 'bg-slate-700/50 text-white hover:bg-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(manhwaList.length / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(manhwaList.length / itemsPerPage)}
                    className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
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
