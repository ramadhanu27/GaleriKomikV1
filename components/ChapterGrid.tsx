'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Chapter } from '@/types'

interface ChapterGridProps {
  chapters: Chapter[]
  manhwaSlug: string
}

export default function ChapterGrid({ chapters, manhwaSlug }: ChapterGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20 // 3 columns x 6 rows
  
  // Reverse chapters so newest is first
  const reversedChapters = [...chapters].reverse()
  
  // Get random thumbnail from chapter images
  const getRandomThumbnail = (chapter: Chapter) => {
    if (!chapter.images || chapter.images.length === 0) return null
    
    // Get random image from chapter (prefer middle pages)
    const middleIndex = Math.floor(chapter.images.length / 2)
    const randomOffset = Math.floor(Math.random() * 5) - 2 // -2 to +2
    const index = Math.max(0, Math.min(chapter.images.length - 1, middleIndex + randomOffset))
    
    return chapter.images[index]?.url
  }
  
  const totalPages = Math.ceil(reversedChapters.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentChapters = reversedChapters.slice(startIndex, endIndex)

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
    
    if (diffHours < 24) return `${diffHours} jam lalu`
    if (diffDays === 1) return '1 hari lalu'
    return `${diffDays} hari lalu`
  }

  return (
    <div>
      {/* Chapter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
        {currentChapters.map((chapter, index) => (
          <Link
            key={index}
            href={`/manhwa/${manhwaSlug}/chapter/${chapter.number}`}
            className="group relative bg-gray-900 rounded-md overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all"
          >
            {/* Chapter Thumbnail */}
            <div className="aspect-[3/4] bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
              {(() => {
                const thumbnailUrl = getRandomThumbnail(chapter)
                return thumbnailUrl ? (
                  <>
                    {/* Chapter Image */}
                    <img 
                      src={thumbnailUrl} 
                      alt={`Chapter ${chapter.number}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Dark overlay for readability */}
                    <div className="absolute inset-0 bg-black/20"></div>
                  </>
                ) : (
                  /* Placeholder if no image */
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white/10">
                      {chapter.number}
                    </span>
                  </div>
                )
              })()}
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-10 h-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Chapter Info */}
            <div className="p-2 bg-gray-800">
              <h3 className="font-semibold text-white text-xs mb-0.5 group-hover:text-primary-400 transition-colors truncate">
                Chapter {chapter.number}
              </h3>
              {chapter.date && (
                <p className="text-[10px] text-red-400">
                  {getTimeAgo(chapter.date)}
                </p>
              )}
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
            className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
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
            className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
