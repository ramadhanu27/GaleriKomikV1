'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Chapter } from '@/types'

interface ChapterGridProps {
  chapters: Chapter[]
  manhwaSlug: string
  manhwaTitle?: string
}

export default function ChapterGridSimple({ chapters, manhwaSlug }: ChapterGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const itemsPerPage = 50
  
  // Sort and filter chapters
  const processedChapters = useMemo(() => {
    let filtered = [...chapters]
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(chapter => 
        chapter.number?.toString().includes(searchQuery) ||
        chapter.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Sort by chapter number
    filtered.sort((a, b) => {
      const numA = parseFloat(a.number?.toString() || '0')
      const numB = parseFloat(b.number?.toString() || '0')
      
      if (sortOrder === 'newest') {
        return numB - numA // Descending
      } else {
        return numA - numB // Ascending
      }
    })
    
    return filtered
  }, [chapters, searchQuery, sortOrder])
  
  const totalPages = Math.ceil(processedChapters.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentChapters = processedChapters.slice(startIndex, endIndex)

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return ''
    
    try {
      let date: Date
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/')
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      } else {
        date = new Date(dateString)
      }
      
      if (isNaN(date.getTime())) return ''
      
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
      
      if (diffHours < 24) return `${diffHours} jam lalu`
      if (diffDays === 1) return '1 hari lalu'
      if (diffDays < 30) return `${diffDays} hari lalu`
      if (diffDays < 365) {
        const diffMonths = Math.floor(diffDays / 30)
        return `${diffMonths} bulan lalu`
      }
      const diffYears = Math.floor(diffDays / 365)
      return `${diffYears} tahun lalu`
    } catch (error) {
      return ''
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  return (
    <div>
      {/* PDF Download Info Banner */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-xl">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
              📄 Ingin Download Chapter sebagai PDF?
            </h3>
            <p className="text-slate-300 text-sm mb-3">
              Gunakan fitur PDF Converter untuk download chapter dalam format PDF. Pilih multiple chapters sekaligus!
            </p>
            <Link
              href="/pdf"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-900/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Buka PDF Converter
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cari chapter..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-700/50 border-2 border-slate-600 text-white placeholder-slate-400 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          />
        </div>

        {/* Sort */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortOrder('newest')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
              sortOrder === 'newest'
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Terbaru
          </button>
          <button
            onClick={() => setSortOrder('oldest')}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
              sortOrder === 'oldest'
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Terlama
          </button>
        </div>
      </div>

      {/* Chapter List - Single Column */}
      <div className="space-y-2 mb-6">
        {currentChapters.map((chapter) => (
          <Link
            key={chapter.number}
            href={`/manhwa/${manhwaSlug}/chapter/${chapter.number}`}
            className="block group"
          >
            <div className="flex items-center gap-4 p-4 bg-slate-700/30 hover:bg-slate-700/50 border-2 border-slate-600 hover:border-primary-500 rounded-lg transition-all">
              {/* Chapter Number Badge */}
              <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-primary-600/20 border-2 border-primary-500/50 flex items-center justify-center">
                <span className="text-primary-400 font-bold text-lg">
                  {chapter.number}
                </span>
              </div>

              {/* Chapter Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
                  Chapter {chapter.number}
                </h3>
                {chapter.title && (
                  <p className="text-sm text-slate-400 truncate">
                    {chapter.title}
                  </p>
                )}
                {chapter.date && (
                  <p className="text-xs text-slate-500 mt-1">
                    {getTimeAgo(chapter.date)}
                  </p>
                )}
              </div>

              {/* Arrow Icon */}
              <div className="flex-shrink-0">
                <svg 
                  className="w-6 h-6 text-slate-400 group-hover:text-primary-400 transition-colors" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            ← Prev
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      )}

      {/* No Results */}
      {currentChapters.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-slate-400">Tidak ada chapter yang sesuai</p>
        </div>
      )}
    </div>
  )
}
