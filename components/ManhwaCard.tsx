'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Manhwa } from '@/types'
import { getThumbnail } from '@/lib/imageOptimizer'

interface ManhwaCardProps {
  manhwa: Manhwa
  showNewBadge?: boolean
}

// Helper function to check if manhwa was updated in last 7 days
const isRecent = (lastModified: string) => {
  const modifiedDate = new Date(lastModified)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - modifiedDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 7
}

export default function ManhwaCard({ manhwa, showNewBadge = false }: ManhwaCardProps) {
  const cleanTitle = (manhwa.manhwaTitle || manhwa.title)
    .replace(/^Komik\s+/i, '')
    .replace(/\s+Bahasa Indonesia$/i, '')
    .trim()
  const cleanSlug = manhwa.slug.replace(/-bahasa-indonesia$/, '')
  
  // Use CDN optimized image if it's a Supabase URL, otherwise use original
  const displayImage = manhwa.image.includes('thumbnail.komiku.org') || manhwa.image.includes('komiku.org')
    ? manhwa.image // External URL, use as is
    : getThumbnail(manhwa.image) // Supabase storage, use CDN
  
  // Get chapter info safely
  const getChapterTitle = (index: number) => {
    if (!manhwa.chapters || manhwa.chapters.length === 0) {
      return `Chapter ${index + 1}`
    }
    const chapter = manhwa.chapters[index]
    return chapter?.title || `Chapter ${chapter?.number || index + 1}`
  }

  return (
    <Link
      href={`/manhwa/${cleanSlug}`}
      className="group cursor-pointer block rounded-lg overflow-hidden bg-white dark:bg-dark-800 hover:ring-2 hover:ring-primary-500 shadow-md hover:shadow-xl transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-100 dark:bg-dark-900">
        <Image
          src={displayImage}
          alt={cleanTitle}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
          {/* Korea Badge */}
          <div className="w-8 h-8 overflow-hidden shadow-lg">
            <img
              src="/korea.png"
              alt="Korea"
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Status Badge */}
          {manhwa.status && (
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded shadow-lg ${
              manhwa.status.toLowerCase().includes('ongoing') 
                ? 'bg-green-500 text-white' 
                : manhwa.status.toLowerCase().includes('complete') || 
                  manhwa.status.toLowerCase().includes('completed') ||
                  manhwa.status.toLowerCase() === 'end'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-500 text-white'
            }`}>
              {manhwa.status.toLowerCase().includes('ongoing') ? 'ONGOING' : 
               manhwa.status.toLowerCase().includes('complete') || manhwa.status.toLowerCase() === 'end' ? 'COMPLETE' : 
               manhwa.status.toUpperCase()}
            </span>
          )}
        </div>

        {/* NEW Badge (if recently modified and showNewBadge is true) */}
        {showNewBadge && manhwa.lastModified && isRecent(manhwa.lastModified) && (
          <div className="absolute top-2 left-12">
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">
              NEW
            </span>
          </div>
        )}

        {/* HOT Badge */}
        {manhwa.isHot && (
          <div className="absolute top-12 left-2">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              🔥 HOT
            </span>
          </div>
        )}

        {/* Rating Badge */}
        {manhwa.rating && (
          <div className="absolute top-2 right-2">
            <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              ⭐ {manhwa.rating}
            </span>
          </div>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-8">
          <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight mb-1 group-hover:text-primary-400 transition-colors">
            {cleanTitle}
          </h3>
        </div>
      </div>

      {/* Chapter Info Section */}
      <div className="bg-gray-50 dark:bg-dark-800 p-2.5 space-y-1.5 transition-colors">
        {/* First Chapter Row */}
        <div className="text-xs flex items-center gap-1">
          <span className="text-gray-700 dark:text-gray-300 font-medium truncate flex-1">
            {manhwa.chapters && manhwa.chapters.length > 0 
              ? getChapterTitle(manhwa.chapters.length - 1)
              : 'Chapter 1'
            }
          </span>
          {showNewBadge && (
            <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0">
              UP
            </span>
          )}
        </div>
        
        {/* Second Chapter Row */}
        <div className="text-xs flex items-center gap-1">
          <span className="text-gray-500 dark:text-gray-400 truncate flex-1">
            {manhwa.chapters && manhwa.chapters.length > 1
              ? getChapterTitle(manhwa.chapters.length - 2)
              : 'Chapter 2'
            }
          </span>
        </div>
      </div>
    </Link>
  )
}
