"use client";

import Link from "next/link";
import { SoulScanLatestUpdate, extractSlugFromUrl } from "@/types/soulscan";

// Helper function to proxy external images
const getProxiedImageUrl = (url: string) => {
  if (!url) return "";
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

interface SoulScanLatestCardProps {
  item: SoulScanLatestUpdate;
}

export default function SoulScanLatestCard({ item }: SoulScanLatestCardProps) {
  const slug = extractSlugFromUrl(item.url);

  return (
    <div className="group flex gap-3 p-3 bg-white dark:bg-dark-800 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors shadow-sm hover:shadow-md">
      {/* Thumbnail */}
      <Link href={`/soulscan/${slug}`} className="flex-shrink-0 w-16 h-24 sm:w-20 sm:h-28 relative rounded-md overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-800">
        <img
          src={getProxiedImageUrl(item.imageUrl)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <Link href={`/soulscan/${slug}`} className="block">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight mb-2 hover:text-primary-500 transition-colors">{item.title}</h3>
        </Link>

        {/* Chapters - still link to external */}
        <div className="space-y-1">
          {item.chapters.slice(0, 2).map((chapter, idx) => (
            <a key={idx} href={chapter.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-xs hover:bg-primary-50 dark:hover:bg-primary-900/20 px-2 py-1 rounded transition-colors group/chapter">
              <span className="text-gray-700 dark:text-gray-300 group-hover/chapter:text-primary-600 dark:group-hover/chapter:text-primary-400 font-medium truncate">{chapter.title}</span>
              <span className="text-gray-500 dark:text-gray-400 text-[10px] ml-2 flex-shrink-0">{chapter.time}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
