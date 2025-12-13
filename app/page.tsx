"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import SoulScanHeroSlider from "@/components/SoulScanHeroSlider";
import SoulScanLatestCard from "@/components/SoulScanLatestCard";
import SoulScanProjectCard from "@/components/SoulScanProjectCard";
import ContinueReading from "@/components/ContinueReading";
import { SoulScanHomeResponse, SoulScanSliderItem, SoulScanPopularItem, SoulScanLatestUpdate, SoulScanProjectResult, SoulScanProjectsResponse, extractSlugFromUrl } from "@/types/soulscan";

// Helper function to proxy external images
const getProxiedImageUrl = (url: string) => {
  if (!url) return "";
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

export default function Home() {
  const [sliderData, setSliderData] = useState<SoulScanSliderItem[]>([]);
  const [popularData, setPopularData] = useState<SoulScanPopularItem[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<SoulScanLatestUpdate[]>([]);
  const [projectsData, setProjectsData] = useState<SoulScanProjectResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchHomeData();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/soulscan/projects?page=1", { cache: "no-store" });
      const data: SoulScanProjectsResponse = await response.json();
      if (data.success && data.results) {
        setProjectsData(data.results.slice(0, 15));
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/soulscan/home", { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: SoulScanHomeResponse = await response.json();

      if (!data.success) {
        throw new Error("API returned unsuccessful response");
      }

      setSliderData(data.result.slider);
      setPopularData(data.result.popularToday);

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

        {/* Main Layout with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Continue Reading Section */}
            <ContinueReading />

            {/* Projects Section */}
            {projectsData.length > 0 && (
              <section className="mb-8">
                <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 backdrop-blur-sm rounded-xl p-4 mb-6 border border-purple-700/30">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">Projects</h2>
                    <Link href="/projects" className="text-sm text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1">
                      Lihat Semua
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projectsData.map((item, index) => (
                    <SoulScanProjectCard key={`project-${index}`} item={item} />
                  ))}
                </div>
              </section>
            )}

            {/* Latest Updates Section */}
            <section className="mb-8">
              <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-slate-700/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">Update Terbaru</h2>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="skeleton h-32 rounded-lg" />
                  ))}
                </div>
              ) : paginatedUpdates.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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

          {/* Right Sidebar - Popular */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              {/* Popular Header */}
              <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 backdrop-blur-sm rounded-xl p-4 mb-4 border border-orange-700/30">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">Populer Hari Ini</h2>
              </div>

              {/* Popular List */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                {loading ? (
                  <div className="space-y-0">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="flex gap-3 p-3 border-b border-slate-700/50 last:border-0">
                        <div className="skeleton w-6 h-6 rounded" />
                        <div className="skeleton w-16 h-20 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <div className="skeleton h-4 w-full rounded" />
                          <div className="skeleton h-3 w-3/4 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : popularData.length > 0 ? (
                  <div className="divide-y divide-slate-700/50">
                    {popularData.slice(0, 10).map((item, index) => (
                      <Link key={`popular-${index}`} href={`/soulscan/${extractSlugFromUrl(item.url)}`} className="flex gap-3 p-3 hover:bg-slate-700/50 transition-colors group">
                        {/* Rank */}
                        <div className={`w-6 h-6 flex-shrink-0 rounded flex items-center justify-center text-sm font-bold ${index < 3 ? "bg-gradient-to-br from-yellow-500 to-orange-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                          {index + 1}
                        </div>

                        {/* Thumbnail */}
                        <div className="w-14 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-800">
                          <img
                            src={getProxiedImageUrl(item.imageUrl)}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-primary-400 transition-colors mb-1">{item.title}</h3>
                          <p className="text-xs text-slate-400 line-clamp-1">{item.chapter}</p>
                          {item.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-yellow-400 text-xs">⭐</span>
                              <span className="text-xs text-slate-300 font-medium">{item.rating}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-slate-400 text-sm">Belum ada data</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
