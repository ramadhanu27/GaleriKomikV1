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

interface ScoredManhwa extends Manhwa {
  score: number
}

export default function RecommendedManhwa({ currentManhwa }: RecommendedManhwaProps) {
  const [recommended, setRecommended] = useState<Manhwa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommended()
  }, [currentManhwa.slug])

  /**
   * Calculate recommendation score using multiple factors
   * Algorithm weights:
   * - Genre similarity: 40%
   * - Popularity (chapter count): 30%
   * - Recency (latest chapter): 20%
   * - Diversity bonus: 10%
   */
  const calculateScore = (manhwa: Manhwa, allManhwa: Manhwa[]): number => {
    let score = 0
    
    // 1. Genre Similarity Score (0-40 points)
    if (currentManhwa.genres && manhwa.genres) {
      const matchingGenres = currentManhwa.genres.filter(genre => 
        manhwa.genres?.includes(genre)
      ).length
      const totalGenres = currentManhwa.genres.length
      const genreSimilarity = matchingGenres / totalGenres
      score += genreSimilarity * 40
    }
    
    // 2. Popularity Score (0-30 points)
    // Based on chapter count (more chapters = more popular)
    const chapterCount = manhwa.totalChapters || 0
    const maxChapters = Math.max(...allManhwa.map(m => m.totalChapters || 0))
    if (maxChapters > 0) {
      const popularityScore = (chapterCount / maxChapters) * 30
      score += popularityScore
    }
    
    // 3. Recency Score (0-20 points)
    // Manhwa with more chapters get bonus (indicates active series)
    if (chapterCount > 50) {
      score += 20
    } else if (chapterCount > 20) {
      score += 10
    }
    
    // 4. Diversity Bonus (0-10 points)
    // Bonus for manhwa with unique genre combinations
    const uniqueGenres = manhwa.genres?.filter(g => 
      !currentManhwa.genres?.includes(g)
    ).length || 0
    if (uniqueGenres > 0 && uniqueGenres <= 2) {
      score += 10 // Sweet spot: 1-2 different genres
    }
    
    // 5. Random factor for variety (±5 points)
    score += (Math.random() - 0.5) * 10
    
    return score
  }

  const fetchRecommended = async () => {
    try {
      console.log('🔍 Fetching recommendations with algorithm...')
      const response = await fetch('/api/komiku/list-from-files?limit=100')
      const data = await response.json()
      
      if (data.success) {
        const allManhwa = data.data.manhwa
        
        // Filter and score manhwa
        const scoredManhwa: ScoredManhwa[] = allManhwa
          .filter((m: Manhwa) => {
            // Don't include current manhwa
            if (m.slug === currentManhwa.slug) return false
            
            // Must have at least one matching genre
            if (!currentManhwa.genres || !m.genres) return false
            
            return currentManhwa.genres.some(genre => 
              m.genres?.includes(genre)
            )
          })
          .map((m: Manhwa) => ({
            ...m,
            score: calculateScore(m, allManhwa)
          }))
          .sort((a: ScoredManhwa, b: ScoredManhwa) => b.score - a.score) // Sort by score descending
          .slice(0, 6) // Take top 6
        
        console.log('✅ Top recommendations:', scoredManhwa.map(m => ({
          title: m.title,
          score: m.score.toFixed(2),
          genres: m.genres?.slice(0, 3)
        })))
        
        setRecommended(scoredManhwa)
      }
    } catch (error) {
      console.error('❌ Error fetching recommended:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          🔥 Manhwa Populer
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
        🔥 Manhwa Populer
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
