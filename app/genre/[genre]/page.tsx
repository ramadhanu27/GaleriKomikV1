'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ManhwaCard from '@/components/ManhwaCard'
import { Manhwa } from '@/types'
import Link from 'next/link'

export default function GenrePage() {
  const params = useParams()
  const genre = params.genre as string
  const [manhwaList, setManhwaList] = useState<Manhwa[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Format genre untuk display
  const genreDisplay = genre
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  useEffect(() => {
    fetchManhwaByGenre()
  }, [genre, page])

  const fetchManhwaByGenre = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/komiku/list?genre=${encodeURIComponent(genreDisplay)}&page=${page}&limit=30&withCovers=true`)
      const data = await response.json()
      
      if (data.success) {
        setManhwaList(data.data.manhwa)
        setTotalPages(data.data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Error fetching manhwa by genre:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/genre" className="text-primary-600 dark:text-primary-400 hover:underline">
              ← Kembali ke Daftar Genre
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Genre: {genreDisplay}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Ditemukan {manhwaList.length} manhwa
          </p>
        </section>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="skeleton h-80 rounded-lg" />
            ))}
          </div>
        ) : manhwaList.length > 0 ? (
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
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-200 dark:bg-dark-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors"
                >
                  ← Previous
                </button>
                
                <div className="flex gap-2">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          page === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-200 dark:bg-dark-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors"
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
              Tidak ada manhwa
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Belum ada manhwa dengan genre {genreDisplay}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
