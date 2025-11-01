'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Manhwa } from '@/types'
import { getThumbnail } from '@/lib/imageOptimizer'
import { getFlagByType, getCountryByType } from '@/lib/getFlagByType'
import { getProxiedImageUrl } from '@/lib/imageProxy'

interface LatestUpdateCardProps {
  manhwa: Manhwa
}

export default function LatestUpdateCard({ manhwa }: LatestUpdateCardProps) {
  const cleanTitle = (manhwa.manhwaTitle || manhwa.title)
    .replace(/^Komik\s+/i, '')
    .replace(/\s+Bahasa Indonesia$/i, '')
    .trim()
  const cleanSlug = manhwa.slug.replace(/-bahasa-indonesia$/, '')
  
  // Use CDN optimized image if it's a Supabase URL, otherwise use proxy for komiku.org
  const displayImage = manhwa.image.includes('thumbnail.komiku.org') || manhwa.image.includes('komiku.org')
    ? getProxiedImageUrl(manhwa.image)
    : getThumbnail(manhwa.image)

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
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
          {/* Country Flag Badge */}
          <div className="w-8 h-8 rounded-full overflow-hidden shadow-lg bg-white/90 dark:bg-dark-800/90 flex items-center justify-center">
            <img
              src={getFlagByType(manhwa.type)}
              alt={getCountryByType(manhwa.type)}
              className="w-6 h-6 object-contain"
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

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2.5 pt-6">
          <h3 className="font-bold text-white text-xs line-clamp-2 leading-tight group-hover:text-primary-400 transition-colors">
            {cleanTitle}
          </h3>
        </div>
      </div>

      {/* Info Section - Compact */}
      <div className="bg-gray-50 dark:bg-dark-800 p-2 space-y-1 transition-colors">
        {/* Rating & Total Chapters */}
        <div className="flex items-center justify-between text-[10px]">
          {/* Rating */}
          {manhwa.rating && parseFloat(String(manhwa.rating)) > 0 ? (
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 text-xs">⭐</span>
              <span className="text-gray-700 dark:text-gray-300 font-bold">
                {parseFloat(String(manhwa.rating)).toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-500 text-[9px]">N/A</span>
          )}
          
          {/* Total Chapters */}
          <div className="flex items-center gap-1">
            <span className="text-gray-600 dark:text-gray-400 text-[9px]">Ch:</span>
            <span className="text-primary-500 dark:text-primary-400 font-bold">
              {manhwa.totalChapters || 0}
            </span>
          </div>
        </div>
        
        {/* Genres - Compact */}
        {manhwa.genres && manhwa.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {manhwa.genres.slice(0, 2).map((genre, idx) => (
              <span 
                key={idx} 
                className="text-[9px] px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
