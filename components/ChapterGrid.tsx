'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Chapter } from '@/types'

interface ChapterGridProps {
  chapters: Chapter[]
  manhwaSlug: string
}

export default function ChapterGrid({ chapters, manhwaSlug }: ChapterGridProps) {
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
        return numB - numA // Descending: 89, 88, 64, 52, ...
      } else {
        return numA - numB // Ascending: 1, 2, 3, ...
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
      // Parse DD/MM/YYYY format
      let date: Date
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/')
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      } else {
        date = new Date(dateString)
      }
      
      // Check if date is valid
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

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari chapter... (contoh: 1, 10, 100)"
              className="w-full px-4 py-3 pl-11 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Sort Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSortOrder('newest')
                setCurrentPage(1)
              }}
              className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                sortOrder === 'newest'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Terbaru
            </button>
            <button
              onClick={() => {
                setSortOrder('oldest')
                setCurrentPage(1)
              }}
              className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                sortOrder === 'oldest'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Terlama
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-400">
            Menampilkan <span className="font-semibold text-white">{currentChapters.length}</span> dari <span className="font-semibold text-white">{processedChapters.length}</span> chapter
          </p>
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Chapter Grid - 5 Columns */}
      {currentChapters.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
          {currentChapters.map((chapter, index) => (
            <Link
              key={index}
              href={`/manhwa/${manhwaSlug}/chapter/${chapter.number}`}
              className="group relative bg-gradient-to-br from-slate-800/50 to-slate-800/30 hover:from-primary-600/20 hover:to-primary-700/20 border border-slate-700/50 hover:border-primary-500/50 rounded-lg p-4 transition-all hover:shadow-lg hover:shadow-primary-900/20 hover:scale-105"
            >
              {/* Chapter Number */}
              <div className="text-center mb-2">
                <div className="text-xs text-slate-400 font-medium mb-1">Chapter</div>
                <div className="text-2xl font-bold text-white group-hover:text-primary-400 transition-colors">
                  {chapter.number}
                </div>
              </div>

              {/* Chapter Title (if exists and different) */}
              {chapter.title && chapter.title !== `Chapter ${chapter.number}` && (
                <div className="text-xs text-slate-400 text-center mb-2 line-clamp-2 min-h-[2rem]">
                  {chapter.title}
                </div>
              )}

              {/* Date */}
              {chapter.date && (
                <div className="text-xs text-slate-500 text-center flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {getTimeAgo(chapter.date)}
                </div>
              )}

              {/* Hover Indicator */}
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-600/0 group-hover:bg-primary-600 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-white mb-2">Tidak ada chapter ditemukan</h3>
          <p className="text-slate-400">Coba ubah kata kunci pencarian</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-slate-700/50 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>

          <div className="flex items-center gap-2 flex-wrap">
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
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-slate-700/50 text-white hover:bg-slate-700'
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
            className="px-4 py-2 rounded-lg bg-slate-700/50 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
