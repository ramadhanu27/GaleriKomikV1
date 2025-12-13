"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LocalBookmark, getBookmarks, removeBookmark } from "@/lib/localBookmark";

// Helper function to proxy external images
const getProxiedImageUrl = (url: string) => {
  if (!url) return "";
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

export default function BookmarkPage() {
  const [bookmarks, setBookmarks] = useState<LocalBookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBookmarks(getBookmarks());
    setLoading(false);
  }, []);

  const handleRemoveBookmark = (slug: string) => {
    removeBookmark(slug);
    setBookmarks(getBookmarks());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] py-8">
        <div className="container-custom">
          <div className="skeleton h-12 w-64 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="skeleton h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Bookmark Saya</h1>
              <p className="text-gray-400">{bookmarks.length} komik tersimpan</p>
            </div>
          </div>
        </div>

        {/* Bookmarks Grid */}
        {bookmarks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.slug} className="group relative rounded-lg overflow-hidden bg-slate-800 hover:ring-2 hover:ring-primary-500 shadow-md hover:shadow-xl transition-all duration-300">
                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveBookmark(bookmark.slug);
                  }}
                  className="absolute top-2 right-2 z-20 w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Hapus dari bookmark">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <Link href={`/soulscan/${bookmark.slug}`}>
                  {/* Image Container */}
                  <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-800">
                    <img
                      src={getProxiedImageUrl(bookmark.imageUrl)}
                      alt={bookmark.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />

                    {/* Bookmark Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </div>
                    </div>

                    {/* Type Badge */}
                    {bookmark.type && (
                      <div className="absolute bottom-2 left-2 z-10">
                        <span className="px-2 py-1 bg-primary-600/90 text-white text-xs font-bold rounded-lg shadow-lg">{bookmark.type}</span>
                      </div>
                    )}

                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-8">
                      <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight group-hover:text-primary-400 transition-colors">{bookmark.title}</h3>
                    </div>
                  </div>

                  {/* Date Info */}
                  <div className="bg-slate-900 p-2.5">
                    <p className="text-xs text-gray-400">
                      Ditambahkan{" "}
                      {new Date(bookmark.addedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-slate-700">
            <svg className="w-20 h-20 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <h2 className="text-xl font-bold text-white mb-2">Belum Ada Bookmark</h2>
            <p className="text-gray-400 mb-6">Mulai tambahkan komik favorit Anda ke bookmark</p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors">
              Jelajahi Komik
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
