"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getContinueReading, ReadingHistoryItem, removeFromHistory } from "@/lib/readingHistory";

// Helper function to proxy external images
const getProxiedImageUrl = (url: string) => {
  if (!url) return "";
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

export default function ContinueReading() {
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHistory(getContinueReading(5));
  }, []);

  const handleRemove = (e: React.MouseEvent, comicSlug: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromHistory(comicSlug);
    setHistory(getContinueReading(5));
  };

  // Don't render on server or if no history
  if (!mounted || history.length === 0) {
    return null;
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return past.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  return (
    <section className="mb-8">
      <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 backdrop-blur-sm rounded-xl p-4 mb-4 border border-emerald-700/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Lanjutkan Membaca
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {history.map((item) => (
          <Link
            key={item.comicSlug}
            href={`/soulscan/chapter/${item.chapterSlug}`}
            className="group relative flex gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300">
            {/* Remove Button */}
            <button
              onClick={(e) => handleRemove(e, item.comicSlug)}
              className="absolute top-2 right-2 z-10 w-6 h-6 bg-slate-700/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Hapus dari riwayat">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Thumbnail */}
            <div className="relative w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-800">
              {item.comicImageUrl ? (
                <img src={getProxiedImageUrl(item.comicImageUrl)} alt={item.comicTitle} className="w-full h-full object-cover" loading="lazy" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
              )}

              {/* Play Icon Overlay */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="font-semibold text-white text-xs sm:text-sm line-clamp-1 group-hover:text-emerald-400 transition-colors">{item.comicTitle || item.chapterTitle.replace(/Chapter \d+.*$/, "").trim()}</h3>
              <p className="text-xs text-emerald-400 font-medium mt-0.5">Chapter {item.chapterNumber}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{formatTimeAgo(item.lastReadAt)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
