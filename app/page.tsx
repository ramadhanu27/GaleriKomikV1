"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import SoulScanHeroSlider from "@/components/SoulScanHeroSlider";
import SoulScanPopularCard from "@/components/SoulScanPopularCard";
import SoulScanLatestCard from "@/components/SoulScanLatestCard";
import { SoulScanHomeResponse, SoulScanSliderItem, SoulScanPopularItem, SoulScanLatestUpdate } from "@/types/soulscan";

export default function Home() {
  const [sliderData, setSliderData] = useState<SoulScanSliderItem[]>([]);
  const [popularData, setPopularData] = useState<SoulScanPopularItem[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<SoulScanLatestUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      console.log("📥 Fetching data from SoulScan API...");

      const response = await fetch("/api/soulscan/home", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: SoulScanHomeResponse = await response.json();

      if (!data.success) {
        throw new Error("API returned unsuccessful response");
      }

      console.log(`📊 Received data from SoulScan API`);
      console.log(`📦 Slider items: ${data.result.slider.length}`);
      console.log(`📦 Popular items: ${data.result.popularToday.length}`);
      console.log(`📦 Latest updates: ${data.result.latestUpdates.length}`);

      setSliderData(data.result.slider);
      setPopularData(data.result.popularToday);

      // Remove duplicates from latestUpdates based on title
      const uniqueLatestUpdates = data.result.latestUpdates.reduce((acc: SoulScanLatestUpdate[], current) => {
        const exists = acc.find((item) => item.title === current.title);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);

      setLatestUpdates(uniqueLatestUpdates);
      setError(null);
    } catch (err) {
      console.error("Error fetching home data:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Paginate latest updates
  const paginatedUpdates = latestUpdates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(latestUpdates.length / itemsPerPage);

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* Hero Slider */}
        {!loading && sliderData.length > 0 && <SoulScanHeroSlider slides={sliderData} />}

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
            <button onClick={fetchHomeData} className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline">
              Retry
            </button>
          </div>
        )}

        {/* Popular Today Section */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 backdrop-blur-sm rounded-xl p-4 mb-6 border border-orange-700/30">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                  </svg>
                </div>
                🔥 Populer Hari Ini
              </h2>
              <span className="text-sm text-gray-400">{popularData.length} komik</span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="skeleton h-72 sm:h-80 rounded-lg" />
              ))}
            </div>
          ) : popularData.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {popularData.slice(0, 12).map((item, index) => (
                <SoulScanPopularCard key={`popular-${index}`} item={item} rank={index + 1} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-600 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm sm:text-base text-slate-400">Belum ada data populer</p>
            </div>
          )}
        </section>

        {/* Main Content - Latest Updates */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Update Terbaru
              </h2>
              <span className="text-sm text-gray-400">{latestUpdates.length} komik</span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-lg" />
              ))}
            </div>
          ) : paginatedUpdates.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {paginatedUpdates.map((item, index) => (
                  <SoulScanLatestCard key={`latest-${currentPage}-${index}`} item={item} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium">
                    ← Prev
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return pageNum;
                    }).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2.5 rounded-lg font-medium transition-all ${currentPage === page ? "bg-primary-600 text-white shadow-lg" : "bg-slate-700/50 text-white hover:bg-slate-700"}`}>
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-6 py-2.5 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium">
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 sm:py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-600 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm sm:text-base text-slate-400">Belum ada update terbaru</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
