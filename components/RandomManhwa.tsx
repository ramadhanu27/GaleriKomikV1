'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RandomManhwa() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRandomManhwa = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/komiku/list?limit=100')
      const data = await response.json()
      
      if (data.success && data.data.manhwa.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.data.manhwa.length)
        const randomManhwa = data.data.manhwa[randomIndex]
        const cleanSlug = randomManhwa.slug.replace(/-bahasa-indonesia$/, '')
        router.push(`/manhwa/${cleanSlug}`)
      }
    } catch (error) {
      console.error('Error getting random manhwa:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRandomManhwa}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Finding...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Random Discover
        </>
      )}
    </button>
  )
}
