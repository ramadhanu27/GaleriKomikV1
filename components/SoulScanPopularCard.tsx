"use client";

import Link from "next/link";
import { SoulScanPopularItem, extractSlugFromUrl } from "@/types/soulscan";

// Helper function to proxy external images
const getProxiedImageUrl = (url: string) => {
  if (!url) return "";
  // Use our image proxy to bypass hotlink protection
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

interface SoulScanPopularCardProps {
  item: SoulScanPopularItem;
  rank?: number;
}

export default function SoulScanPopularCard({ item, rank }: SoulScanPopularCardProps) {
  const slug = extractSlugFromUrl(item.url);

  return (
    <Link href={`/soulscan/${slug}`} className="group cursor-pointer block rounded-lg overflow-hidden bg-white dark:bg-dark-800 hover:ring-2 hover:ring-primary-500 shadow-md hover:shadow-xl transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-800">
        <img
          src={getProxiedImageUrl(item.imageUrl)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />

        {/* Rank Badge */}
        {rank !== undefined && (
          <div className="absolute top-2 left-2 z-10">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                rank === 1
                  ? "bg-gradient-to-br from-yellow-400 to-yellow-600"
                  : rank === 2
                  ? "bg-gradient-to-br from-gray-300 to-gray-500"
                  : rank === 3
                  ? "bg-gradient-to-br from-amber-600 to-amber-800"
                  : "bg-gradient-to-br from-slate-600 to-slate-800"
              }`}>
              {rank}
            </div>
          </div>
        )}

        {/* Rating Badge */}
        {item.rating && parseFloat(item.rating) > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
              <span className="text-yellow-400 text-xs">⭐</span>
              <span className="text-white text-xs font-bold">{parseFloat(item.rating).toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-8">
          <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight mb-1 group-hover:text-primary-400 transition-colors">{item.title}</h3>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-gray-50 dark:bg-dark-800 p-2.5 space-y-1.5 transition-colors">
        {/* Chapter Info */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-gray-700 dark:text-gray-300 font-semibold">{item.chapter}</span>
          </div>

          {/* Rating (if exists and not already shown) */}
          {item.rating && parseFloat(item.rating) > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-500 text-xs">⭐</span>
              <span className="text-gray-700 dark:text-gray-300 font-bold text-xs">{parseFloat(item.rating).toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
