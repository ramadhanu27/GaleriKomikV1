'use client'

import { useEffect, useState } from 'react'
import ManhwaCard from '@/components/ManhwaCard'
import { Manhwa } from '@/types'

export default function PopulerPage() {
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
      const response = await fetch(`/api/komiku/list?page=${page}&limit=30&withCovers=true`)
      const data = await response.json()
      
      if (data.success) {
        // Sort by rating or popularity (assuming higher rating = more popular)
        const sorted = [...data.data.manhwa].sort((a, b) => {
          const ratingA = a.rating || 0
          const ratingB = b.rating || 0
          return ratingB - ratingA
        })
        setManhwaList(sorted)
        setTotalPages(data.data.pagination.totalPages)
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
        <section className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔥 Manhwa Populer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manhwa paling populer dan paling banyak dibaca
          </p>
        </section>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="skeleton h-80 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-700 dark:text-gray-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
