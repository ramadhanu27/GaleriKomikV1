"use client";

import Link from "next/link";
import { SoulScanProjectResult } from "@/types/soulscan";

interface SoulScanProjectCardProps {
  item: SoulScanProjectResult;
}

// Helper function to proxy external images
const getProxiedImageUrl = (url: string) => {
  if (!url) return "";
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

export default function SoulScanProjectCard({ item }: SoulScanProjectCardProps) {
  return (
    <Link href={`/soulscan/${item.slug}`} className="group flex gap-4 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/50 hover:border-primary-500/50 transition-all duration-300">
      {/* Thumbnail */}
      <div className="relative w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-800 shadow-lg">
        <img
          src={getProxiedImageUrl(item.imageUrl)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2 group-hover:text-primary-400 transition-colors mb-1">{item.title}</h3>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <span className="font-semibold text-white">{item.latestChapter}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{item.updateTime}</span>
        </div>
      </div>
    </Link>
  );
}
