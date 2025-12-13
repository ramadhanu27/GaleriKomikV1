"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SoulScanDetailResponse, SoulScanDetailResult, extractChapterSlugFromUrl } from "@/types/soulscan";

// Helper function to proxy external images
const getProxiedImageUrl = (url: string) => {
  if (!url) return "";
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

export default function SoulScanDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [manhwa, setManhwa] = useState<SoulScanDetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchManhwaDetail();
    }
  }, [slug]);

  const fetchManhwaDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/soulscan/detail/${slug}`);
      const data: SoulScanDetailResponse = await response.json();

      if (data.success && data.result) {
        setManhwa(data.result);
        setError(null);
      } else {
        setError("Manhwa tidak ditemukan");
      }
    } catch (err) {
      console.error("Error fetching manhwa detail:", err);
      setError("Gagal memuat data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="container-custom">
          <div className="animate-pulse">
            <div className="h-96 bg-slate-800 rounded-2xl mb-8" />
            <div className="h-64 bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !manhwa) {
    return (
      <div className="py-8">
        <div className="container-custom">
          <div className="text-center py-16">
            <svg className="w-24 h-24 mx-auto text-slate-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-white mb-4">{error || "Manhwa tidak ditemukan"}</h1>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get first and last chapter for buttons
  const firstChapter = manhwa.chapters.length > 0 ? manhwa.chapters[manhwa.chapters.length - 1] : null;
  const latestChapter = manhwa.chapters.length > 0 ? manhwa.chapters[0] : null;

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* Hero Section with Cover */}
        <div className="relative mb-8 rounded-2xl overflow-hidden">
          {/* Background Blur Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/98 to-slate-900"></div>
          <div
            className="absolute inset-0 blur-3xl opacity-20"
            style={{
              backgroundImage: `url(${getProxiedImageUrl(manhwa.imageUrl)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}></div>

          {/* Content */}
          <div className="relative p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Cover Image */}
              <div className="relative w-full md:w-64 lg:w-72 flex-shrink-0 mx-auto md:mx-0">
                <div className="relative rounded-xl overflow-hidden shadow-2xl ring-4 ring-slate-700/50">
                  <img src={getProxiedImageUrl(manhwa.imageUrl)} alt={manhwa.title} className="w-full h-auto object-cover" onError={(e) => (e.currentTarget.src = "/placeholder-cover.jpg")} />

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {manhwa.details.type && <span className="text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-sm bg-primary-600/90 text-white">{manhwa.details.type}</span>}
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 text-center md:text-left">
                {/* Title */}
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">{manhwa.title}</h1>

                {manhwa.alternativeNames && <p className="text-lg text-slate-300 mb-6 italic">{manhwa.alternativeNames}</p>}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {manhwa.details.author && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-xs text-slate-400 font-medium">Author</span>
                      </div>
                      <p className="font-semibold text-white text-sm truncate">{manhwa.details.author}</p>
                    </div>
                  )}
                  {manhwa.details.artist && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span className="text-xs text-slate-400 font-medium">Artist</span>
                      </div>
                      <p className="font-semibold text-white text-sm truncate">{manhwa.details.artist}</p>
                    </div>
                  )}
                  {manhwa.details.type && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-xs text-slate-400 font-medium">Type</span>
                      </div>
                      <p className="font-semibold text-white text-sm truncate">{manhwa.details.type}</p>
                    </div>
                  )}
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      <span className="text-xs text-slate-400 font-medium">Chapters</span>
                    </div>
                    <p className="font-semibold text-white text-sm">{manhwa.chapters.length}</p>
                  </div>
                  {manhwa.details.released && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-slate-400 font-medium">Released</span>
                      </div>
                      <p className="font-semibold text-white text-sm truncate">{manhwa.details.released}</p>
                    </div>
                  )}
                </div>

                {/* Tags/Genres */}
                {manhwa.tags && manhwa.tags.length > 0 && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {manhwa.tags.map((tag: string) => (
                        <span key={tag} className="px-3 py-1.5 bg-primary-600/20 border border-primary-500/30 text-primary-300 text-xs font-medium rounded-full hover:bg-primary-600/30 transition-colors">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  {firstChapter && (
                    <Link
                      href={`/soulscan/chapter/${extractChapterSlugFromUrl(firstChapter.url)}`}
                      className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-lg transition-all shadow-lg shadow-primary-900/30 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Baca Chapter 1
                    </Link>
                  )}
                  {latestChapter && manhwa.chapters.length > 1 && (
                    <Link
                      href={`/soulscan/chapter/${extractChapterSlugFromUrl(latestChapter.url)}`}
                      className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all border border-slate-600/50 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                      Chapter Terbaru ({latestChapter.number})
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter List Section */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 mb-8 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
            <svg className="w-7 h-7 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Daftar Chapter ({manhwa.chapters.length})
          </h2>

          {manhwa.chapters && manhwa.chapters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {manhwa.chapters.map((chapter, index) => (
                <Link
                  key={index}
                  href={`/soulscan/chapter/${extractChapterSlugFromUrl(chapter.url)}`}
                  className="flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/60 rounded-lg transition-all group border border-slate-600/30 hover:border-primary-500/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
                      <span className="text-primary-400 font-bold text-sm">{chapter.number}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm group-hover:text-primary-400 transition-colors">{chapter.title}</p>
                      <p className="text-slate-400 text-xs">{chapter.date}</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-400">Belum ada chapter tersedia</p>
            </div>
          )}
        </div>

        {/* Credit Section */}
        <div className="text-center py-4 text-gray-500 text-sm">
          <p>
            Data provided by{" "}
            <a href="https://soulscans.my.id" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
              SoulScans
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
