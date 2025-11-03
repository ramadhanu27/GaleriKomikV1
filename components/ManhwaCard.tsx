'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Manhwa } from '@/types'
import { getThumbnail } from '@/lib/imageOptimizer'
import { getFlagByType, getCountryByType } from '@/lib/getFlagByType'
import { getProxiedImageUrl } from '@/lib/imageProxy'

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
  
  // Use CDN optimized image if it's a Supabase URL, otherwise use proxy for komiku.org
  const displayImage = manhwa.image.includes('thumbnail.komiku.org') || manhwa.image.includes('komiku.org')
    ? getProxiedImageUrl(manhwa.image) // External URL from komiku.org, use proxy
    : getThumbnail(manhwa.image) // Supabase storage, use CDN

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
          loading="lazy"
          quality={75}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
          {/* Country Flag Badge */}
          <div className="w-8 h-8 overflow-hidden shadow-lg">
            <img
              src={getFlagByType(manhwa.type)}
              alt={getCountryByType(manhwa.type)}
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
          <div className="absolute top-2 right-2 z-20">
            <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md animate-pulse">
              NEW
            </span>
          </div>
        )}

        {/* HOT Badge */}
        {manhwa.isHot && (
          <div className="absolute top-12 right-2">
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
              🔥 HOT
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

      {/* Info Section */}
      <div className="bg-gray-50 dark:bg-dark-800 p-2.5 space-y-1.5 transition-colors">
        {/* Rating & Total Chapters */}
        <div className="flex items-center justify-between gap-2 text-xs">
          {/* Rating */}
          {manhwa.rating && parseFloat(String(manhwa.rating)) > 0 ? (
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">⭐</span>
              <span className="text-gray-700 dark:text-gray-300 font-bold">
                {parseFloat(String(manhwa.rating)).toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-500 text-[10px]">No rating</span>
          )}
          
          {/* Total Chapters */}
          <div className="flex items-center gap-1">
            <span className="text-gray-600 dark:text-gray-400 text-[10px]">Ch:</span>
            <span className="text-primary-500 dark:text-primary-400 font-bold">
              {manhwa.totalChapters || 0}
            </span>
          </div>
        </div>
        
        {/* Genres */}
        {manhwa.genres && manhwa.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {manhwa.genres.slice(0, 2).map((genre, idx) => (
              <span 
                key={idx} 
                className="text-[10px] px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Latest 2 Chapters */}
        {(() => {
          const chaptersToShow = manhwa.latestChapters || (manhwa.chapters ? manhwa.chapters.slice(-2).reverse() : [])
          const displayChapters = chaptersToShow.slice(0, 2)
          
          return displayChapters.length > 0 ? (
            <div className="pt-1.5 border-t border-gray-200 dark:border-dark-700">
              <div className="space-y-1">
                {displayChapters.map((chapter, idx) => (
                  <Link
                    key={idx}
                    href={`/manhwa/${cleanSlug}/chapter/${chapter.number}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-between text-[10px] hover:bg-primary-50 dark:hover:bg-primary-900/20 px-1.5 py-1 rounded transition-colors group/chapter"
                  >
                    <span className="text-gray-700 dark:text-gray-300 group-hover/chapter:text-primary-600 dark:group-hover/chapter:text-primary-400 font-medium truncate">
                      Ch {chapter.number}
                    </span>
                    {chapter.date && (
                      <span className="text-gray-500 dark:text-gray-500 text-[9px] ml-1 flex-shrink-0">
                        {chapter.date}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ) : null
        })()}
      </div>
    </Link>
  )
}