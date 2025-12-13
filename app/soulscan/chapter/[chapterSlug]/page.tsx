"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SoulScanChapterResponse, SoulScanChapterResult } from "@/types/soulscan";
import { addToReadingHistory } from "@/lib/readingHistory";

// Helper function to proxy external images
const getProxiedImageUrl = (url: string) => {
  if (!url) return "";
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

export default function SoulScanChapterPage() {
  const params = useParams();
  const router = useRouter();
  const chapterSlug = params.chapterSlug as string;

  const [chapter, setChapter] = useState<SoulScanChapterResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Extract manga slug from chapter slug for back navigation
  const getMangaSlug = (chapterSlug: string) => {
    // chapter slug format: solo-leveling-arise-hunter-origin-chapter-17
    const match = chapterSlug.match(/^(.+)-chapter-\d+$/);
    return match ? match[1] : "";
  };

  const mangaSlug = getMangaSlug(chapterSlug);

  useEffect(() => {
    if (chapterSlug) {
      fetchChapter();
    }
  }, [chapterSlug]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchChapter = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/soulscan/chapter/${chapterSlug}`);
      const data: SoulScanChapterResponse = await response.json();

      if (data.success && data.result) {
        setChapter(data.result);
        setError(null);

        // Save to reading history
        const chapterMatch = chapterSlug.match(/chapter-(\d+)/);
        const chapterNum = chapterMatch ? chapterMatch[1] : "";

        addToReadingHistory({
          comicSlug: mangaSlug,
          comicTitle: data.result.title
            .replace(" Bahasa Indonesia — Soul Scans", "")
            .replace(/Chapter \d+.*$/, "")
            .trim(),
          comicImageUrl: "", // Will be updated when we have it
          chapterSlug: chapterSlug,
          chapterTitle: data.result.title.replace(" Bahasa Indonesia — Soul Scans", ""),
          chapterNumber: chapterNum,
        });
      } else {
        setError("Chapter tidak ditemukan");
      }
    } catch (err) {
      console.error("Error fetching chapter:", err);
      setError("Gagal memuat chapter. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages((prev) => new Set(prev).add(index));
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Memuat chapter...</p>
        </div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center py-16">
          <svg className="w-24 h-24 mx-auto text-slate-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl font-bold text-white mb-4">{error || "Chapter tidak ditemukan"}</h1>
          <div className="flex gap-4 justify-center">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali
            </button>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors">
              Ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="container-custom py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {mangaSlug && (
                <Link href={`/soulscan/${mangaSlug}`} className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="Kembali ke Detail">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
              )}
              <div>
                <h1 className="text-white font-bold text-sm sm:text-base line-clamp-1">{chapter.title.replace(" Bahasa Indonesia — Soul Scans", "")}</h1>
                <p className="text-slate-400 text-xs">{chapter.totalImages} halaman</p>
              </div>
            </div>
            <Link href="/" className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="Beranda">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Chapter Images */}
      <div className="max-w-4xl mx-auto">
        {chapter.imageUrls.map((imageUrl, index) => (
          <div key={index} className="relative w-full">
            {!loadedImages.has(index) && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900 min-h-[400px]">
                <div className="text-center">
                  <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-slate-500 text-sm">Halaman {index + 1}</p>
                </div>
              </div>
            )}
            <img
              src={getProxiedImageUrl(imageUrl)}
              alt={`Page ${index + 1}`}
              className="w-full h-auto"
              loading={index < 3 ? "eager" : "lazy"}
              onLoad={() => handleImageLoad(index)}
              onError={(e) => {
                // Show fallback on error
                (
                  e.target as HTMLImageElement
                ).src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"><rect fill="%231e293b" width="400" height="600"/><text x="200" y="300" text-anchor="middle" fill="%2394a3b8" font-size="16">Gagal memuat halaman ${
                  index + 1
                }</text></svg>`;
                handleImageLoad(index);
              }}
            />
          </div>
        ))}
      </div>

      {/* End of Chapter */}
      <div className="bg-slate-900 py-12">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Selesai!</h2>
          <p className="text-slate-400 mb-6">Anda telah selesai membaca chapter ini.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            {mangaSlug && (
              <Link href={`/soulscan/${mangaSlug}`} className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Lihat Semua Chapter
              </Link>
            )}
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button onClick={scrollToTop} className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all" title="Scroll ke atas">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Credit */}
      <div className="bg-slate-900 py-4 border-t border-slate-800">
        <div className="text-center text-gray-500 text-sm">
          <p>
            Powered by{" "}
            <a href="https://soulscans.my.id" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
              SoulScans
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
