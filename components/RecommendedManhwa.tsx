'use client'

import { useEffect, useState } from 'react'
import ManhwaCard from './ManhwaCard'
import { Manhwa } from '@/types'

interface RecommendedManhwaProps {
  currentManhwa: {
    genres?: string[]
    slug: string
  }
}

export default function RecommendedManhwa({ currentManhwa }: RecommendedManhwaProps) {
  const [recommended, setRecommended] = useState<Manhwa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommended()
  }, [currentManhwa.slug])

  const fetchRecommended = async () => {
    try {
      const response = await fetch('/api/komiku/list-from-files?limit=100')
      const data = await response.json()
      
      if (data.success) {
        // Filter manhwa with similar genres
        const similar = data.data.manhwa
          .filter((m: Manhwa) => {
            // Don't include current manhwa
            if (m.slug === currentManhwa.slug) return false
            
            // Check if has at least one matching genre
            if (!currentManhwa.genres || !m.genres) return false
            
            return currentManhwa.genres.some(genre => 
              m.genres?.includes(genre)
            )
          })
          .sort(() => Math.random() - 0.5) // Randomize
          .slice(0, 6) // Take 6 random similar manhwa
        
        setRecommended(similar)
      }
    } catch (error) {
      console.error('Error fetching recommended:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          📚 Rekomendasi Serupa
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-80 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (recommended.length === 0) {
    return null
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        📚 Rekomendasi Serupa
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {recommended.map((manhwa, index) => (
          <ManhwaCard 
            key={`${manhwa.slug}-${index}`} 
            manhwa={manhwa} 
            showNewBadge={false} 
          />
        ))}
      </div>
    </div>
  )
}
