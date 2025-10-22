'use client'

import { useEffect, useState } from 'react'
import ManhwaCard from '@/components/ManhwaCard'
import { Manhwa } from '@/types'

export default function TerbaruPage() {
  const [manhwaList, setManhwaList] = useState<Manhwa[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchManhwa()
  }, [page])

  const fetchManhwa = async () => {
    try {
      setLoading(true)
      // Use list-from-files API which is sorted by scrapedAt (latest updates)
      const response = await fetch(`/api/komiku/list-from-files?limit=100`)
      const data = await response.json()
      
      if (data.success) {
        // Data already sorted by scrapedAt from API
        const allManhwa = data.data.manhwa
        
        // Calculate pagination
        const itemsPerPage = 30
        const startIndex = (page - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginatedManhwa = allManhwa.slice(startIndex, endIndex)
        
        setManhwaList(paginatedManhwa)
        setTotalPages(Math.ceil(allManhwa.length / itemsPerPage))
      }
    } catch (error) {
      console.error('Error fetching manhwa:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* Header Section */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 mb-8 border border-slate-700/50">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Update Terbaru
          </h1>
          <p className="text-slate-300">
            Manhwa dengan chapter terbaru yang baru saja diupdate
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="skeleton h-80 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              {manhwaList.map((manhwa) => (
                <ManhwaCard key={manhwa.slug} manhwa={manhwa} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 flex-wrap">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium shadow-lg">
                    {page}
                  </span>
                  <span className="text-slate-400">of</span>
                  <span className="px-4 py-2.5 bg-slate-700/50 text-white rounded-lg font-medium">
                    {totalPages}
                  </span>
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
