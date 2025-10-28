'use client'

import { useEffect, useState } from 'react'
import ManhwaCard from './ManhwaCard'
import { Manhwa } from '@/types'
import Link from 'next/link'

export default function PopularManhwa() {
  const [manhwa, setManhwa] = useState<Manhwa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRandomManhwa()
  }, [])

  /**
   * Fetch random manhwa from database
   * Uses Fisher-Yates shuffle algorithm for true randomization
   */
  const fetchRandomManhwa = async () => {
    try {
      console.log('🎲 Fetching random manhwa...')
      
      // Fetch more manhwa to have better randomization pool
      const response = await fetch('/api/komiku/list-from-files?limit=100')
      const data = await response.json()
      
      if (data.success) {
        const allManhwa = data.data.manhwa
        
        // Fisher-Yates shuffle algorithm
        const shuffled = [...allManhwa]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        
        // Take first 12 random manhwa
        const randomManhwa = shuffled.slice(0, 12)
        
        console.log('✅ Random manhwa loaded:', randomManhwa.length)
        setManhwa(randomManhwa)
      }
    } catch (error) {
      console.error('❌ Error fetching random manhwa:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchRandomManhwa()
  }

  if (loading) {
    return (
      <div className="py-8">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                🔥
              </span>
              Manhwa Populer
            </h2>
            <Link 
              href="/populer"
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg"
            >
              Lihat Semua →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="skeleton h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (manhwa.length === 0) {
    return null
  }

  return (
    <div className="py-8 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
              🔥
            </span>
            Manhwa Populer
            <span className="text-sm font-normal text-slate-400 ml-2">
              Random Selection
            </span>
          </h2>
          
          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2"
              title="Refresh random manhwa"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Acak Lagi</span>
            </button>
            
            {/* View All Button */}
            <Link 
              href="/populer"
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg flex items-center gap-2"
            >
              Lihat Semua
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Manhwa Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {manhwa.map((item, index) => (
            <ManhwaCard 
              key={`${item.slug}-${index}`} 
              manhwa={item} 
              showNewBadge={false}
            />
          ))}
        </div>

        {/* Info Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Menampilkan {manhwa.length} manhwa secara acak dari database
          </p>
        </div>
      </div>
    </div>
  )
}
