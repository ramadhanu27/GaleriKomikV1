"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ManhwaCard from "@/components/ManhwaCard";
import HeroSlider from "@/components/HeroSlider";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { Manhwa } from "@/types";

export default function Home() {
  const [manhwaList, setManhwaList] = useState<Manhwa[]>([]);
  const [recommendedList, setRecommendedList] = useState<Manhwa[]>([]);
  const [selectedType, setSelectedType] = useState<string>("Manhwa");
  const [loading, setLoading] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRandomized, setIsRandomized] = useState(false);
  const itemsPerPage = 20; // Increased from 15 to show more items per page

  useEffect(() => {
    fetchManhwa();
    fetchRecommended();
  }, []);

  const fetchManhwa = async () => {
    try {
      console.log("📥 Fetching manhwa list from metadata...");

      // Use list-from-files which already includes latestChapters (3 chapters)
      // This is much faster than batch API for homepage
      // Direct fetch to bypass both client and edge cache
      const response = await fetch(`/api/komiku/list-from-files?limit=500`)
      const listData = await response.json()

      if (!listData.success) {
        setError(listData.error || "Failed to load manhwa list");
        return;
      }

      const manhwaList = listData.data.manhwa;
      
      console.log(`📊 Received ${manhwaList.length} manhwa from API`)
      console.log(`📦 First 3 items:`, manhwaList.slice(0, 3).map((m: any) => ({ slug: m.slug, title: m.title })))

      // Helper function to parse date DD/MM/YYYY to timestamp
      const parseDate = (dateStr: string): number => {
        if (!dateStr) return 0;
        try {
          const parts = dateStr.split('/');
          if (parts.length !== 3) return 0;
          
          const [day, month, year] = parts;
          const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
          
          // Validate date
          if (isNaN(date.getTime())) {
            return 0;
          }
          
          return date.getTime();
        } catch (error) {
          return 0;
        }
      };

      // Add timestamp for sorting
      const manhwaWithTimestamp = manhwaList.map((m: any) => {
        // Use lastTwoChapters (new format) or fallback to latestChapters or chapters
        let chapters = m.lastTwoChapters || m.latestChapters || []
        
        // If still empty, try to get from chapters array
        if (chapters.length === 0 && m.chapters && m.chapters.length > 0) {
          chapters = m.chapters.slice(-2).reverse()
        }
        
        const latestChapterDate = chapters[0]?.date || null;
        const latestChapterTimestamp = latestChapterDate ? parseDate(latestChapterDate) : 0;

        return {
          ...m,
          latestChapterDate,
          latestChapterTimestamp,
          // Ensure lastTwoChapters is available for ManhwaCard
          lastTwoChapters: chapters,
        };
      });

      // Sort by latest chapter date (newest first)
      const sortedManhwaList = manhwaWithTimestamp.sort((a: any, b: any) => {
        return b.latestChapterTimestamp - a.latestChapterTimestamp;
      });
      
      console.log(`📊 After sorting: ${sortedManhwaList.length} manhwa`)
      console.log(`📊 Items with timestamp > 0: ${sortedManhwaList.filter((m: any) => m.latestChapterTimestamp > 0).length}`)

      // Take top 100 for homepage display
      const topManhwaList = sortedManhwaList.slice(0, 100);
      
      console.log(`📊 Setting ${topManhwaList.length} manhwa to state`)

      setManhwaList(topManhwaList);
      setError(null)
    } catch (error) {
      console.error("Error fetching manhwa:", error);
      setError(error instanceof Error ? error.message : "Gagal memuat data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommended = async (type: string = "Manhwa") => {
    try {
      setLoadingRecommended(true);

      // Fetch recommended manhwa
      const response = await fetch("/api/komiku/recommend?limit=100");
      const data = await response.json();

      if (data.success) {
        // Debug: Check first 10 items with their exact type values
        console.log('First 10 items from API:', data.data.manhwa.slice(0, 10).map((m: Manhwa) => ({
          title: m.title,
          type: m.type,
          typeLength: m.type?.length,
          typeTrimmed: m.type?.trim(),
          typeLower: m.type?.toLowerCase().trim()
        })));
        
        // Filter by type (case-insensitive, exact match with trim)
        const filtered = data.data.manhwa.filter((m: Manhwa) => {
          const manhwaType = (m.type?.toLowerCase() || '').trim();
          const targetType = type.toLowerCase().trim();
          return manhwaType === targetType;
        });
        
        console.log(`Filtering for "${type}": Found ${filtered.length} items out of ${data.data.manhwa.length} total`);
        
        // Debug first 5 items if needed
        if (filtered.length > 0 && filtered.length < 10) {
          console.log(`First ${filtered.length} ${type} items:`, filtered.map((m: Manhwa) => m.title));
        }

        // Fisher-Yates shuffle for random selection
        const shuffled = [...filtered];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // Take up to 6 items from the selected type only
        const randomManhwa = shuffled.slice(0, Math.min(6, shuffled.length));
        
        setRecommendedList(randomManhwa);
      }
    } catch (error) {
      console.error("Error fetching recommended manhwa:", error);
      setRecommendedList([]);
    } finally {
      setLoadingRecommended(false);
    }
  };

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* Hero Slider */}
        {!loading && manhwaList.length > 0 && <HeroSlider manhwaList={manhwaList} />}

        {/* Announcement Banner */}
        <AnnouncementBanner />

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 dark:text-red-200 font-semibold">Error loading data</p>
            </div>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
            <button
              onClick={() => {
                fetchManhwa();
                fetchRecommended();
              }}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline">
              Retry
            </button>
          </div>
        )}

        {/* Recommended Section - Full Width */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-sm rounded-xl p-4 mb-6 border border-purple-700/30">
            <div className="flex flex-col gap-4">
              {/* Header - Mobile Responsive */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">Rekomendasi</h2>
                
                {/* Type Filter Buttons - Responsive */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {["Manhwa", "Manga", "Manhua"].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedType(type);
                        fetchRecommended(type);
                      }}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-all text-sm sm:text-base ${
                        selectedType === type 
                          ? "bg-purple-600 text-white shadow-lg" 
                          : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                      }`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {loadingRecommended ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-72 sm:h-80 rounded-lg" />
              ))}
            </div>
          ) : recommendedList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {recommendedList.map((manhwa, index) => (
                <ManhwaCard key={`${manhwa.slug}-recommended-${index}`} manhwa={manhwa} showNewBadge={false} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-600 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              <p className="text-sm sm:text-base text-slate-400">Belum ada rekomendasi tersedia</p>
            </div>
          )}
        </section>

        {/* Main Content with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 xl:col-span-9">
            {/* Latest Updates */}
            <section className="mb-8">
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Update Terbaru
                  </h2>
                  <Link href="/pencarian?sort=latest" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-primary-900/30 flex items-center gap-2">
                    Lihat Semua
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="skeleton h-80 rounded-lg" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                    {(() => {
                      const currentItems = manhwaList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                      const placeholderCount = Math.max(0, itemsPerPage - currentItems.length);

                      return (
                        <>
                          {currentItems.map((manhwa, index) => (
                            <ManhwaCard key={`${manhwa.slug}-${currentPage}-${index}`} manhwa={manhwa} showNewBadge={true} />
                          ))}
                          {/* Placeholder cards for empty slots */}
                          {Array.from({ length: placeholderCount }).map((_, index) => (
                            <div key={`placeholder-${index}`} className="aspect-[2/3] rounded-lg border-2 border-dashed border-slate-700/50 bg-slate-800/20 flex items-center justify-center">
                              <div className="text-center p-4">
                                <svg className="w-12 h-12 mx-auto text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <p className="text-xs text-slate-500">Coming Soon</p>
                              </div>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>

                  {/* Pagination */}
                  {manhwaList.length > itemsPerPage && (
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium">
                        ← Prev
                      </button>

                      <div className="flex items-center gap-2">
                        {Array.from({ length: Math.ceil(manhwaList.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2.5 rounded-lg font-medium transition-all ${currentPage === page ? "bg-primary-600 text-white shadow-lg" : "bg-slate-700/50 text-white hover:bg-slate-700"}`}>
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(manhwaList.length / itemsPerPage), prev + 1))}
                        disabled={currentPage === Math.ceil(manhwaList.length / itemsPerPage)}
                        className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium">
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}