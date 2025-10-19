'use client'

import { useEffect, useState } from 'react'
import ManhwaCard from '@/components/ManhwaCard'
import { Manhwa } from '@/types'

export default function Home() {
  const [manhwaList, setManhwaList] = useState<Manhwa[]>([])
  const [popularList, setPopularList] = useState<Manhwa[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPopular, setLoadingPopular] = useState(true)

  useEffect(() => {
    fetchManhwa()
    fetchPopular()
  }, [])

  const fetchManhwa = async () => {
    try {
      console.log('Fetching manhwa from API...')
      const response = await fetch('/api/komiku/list?limit=50&withCovers=true')
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('API Response:', data)
      
      if (data.success) {
        console.log('Manhwa count:', data.data.manhwa?.length || 0)
        
        // Sort by lastModified date (newest first) and take top 30
        const sorted = [...data.data.manhwa]
          .sort((a, b) => {
            const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0
            const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0
            return dateB - dateA
          })
          .slice(0, 30)
        
        setManhwaList(sorted)
      } else {
        console.error('API returned error:', data.error)
      }
    } catch (error) {
      console.error('Error fetching manhwa:', error)
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
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">Arkomik</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Platform terbaik untuk membaca manhwa bahasa Indonesia. 
            Nikmati koleksi lengkap dengan update terbaru setiap hari.
          </p>
        </section>

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
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="skeleton h-80 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {manhwaList.map((manhwa) => (
                <ManhwaCard key={manhwa.slug} manhwa={manhwa} showNewBadge={true} />
              ))}
            </div>
          )}
        </section>

      
      </div>
    </div>
  )
}
