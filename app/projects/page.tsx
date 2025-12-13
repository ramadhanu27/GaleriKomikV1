"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { SoulScanProjectsResponse, SoulScanProjectResult } from "@/types/soulscan";

// Helper function to proxy external images
const getProxiedImageUrl = (url: string) => {
  if (!url) return "";
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<SoulScanProjectResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`/api/soulscan/projects?page=${page}`);
      const data: SoulScanProjectsResponse = await response.json();

      if (data.success && data.results) {
        if (append) {
          setProjects((prev) => [...prev, ...data.results]);
        } else {
          setProjects(data.results);
        }
        setCurrentPage(data.pagination.currentPage);
        setHasNextPage(data.pagination.hasNextPage);
        setError(null);
      } else {
        setError("Gagal memuat data");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Gagal memuat data. Silakan coba lagi.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects(1);
  }, [fetchProjects]);

  const loadMore = () => {
    if (hasNextPage && !loadingMore) {
      fetchProjects(currentPage + 1, true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] py-8">
        <div className="container-custom">
          <div className="skeleton h-12 w-64 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-slate-800 rounded-lg mb-2" />
                <div className="h-4 bg-slate-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] py-8">
        <div className="container-custom">
          <div className="text-center py-20">
            <svg className="w-20 h-20 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-bold text-white mb-2">Terjadi Kesalahan</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button onClick={() => fetchProjects(1)} className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors">
              Coba Lagi
            </button>
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
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Projects</h1>
              <p className="text-gray-400">Daftar komik yang sedang dikerjakan</p>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {projects.map((project, index) => (
                <Link
                  key={`${project.slug}-${index}`}
                  href={`/soulscan/${project.slug}`}
                  className="group cursor-pointer block rounded-lg overflow-hidden bg-slate-800 hover:ring-2 hover:ring-primary-500 shadow-md hover:shadow-xl transition-all duration-300">
                  {/* Image Container */}
                  <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-800">
                    <img
                      src={getProxiedImageUrl(project.imageUrl)}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />

                    {/* Update Time Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-1 bg-primary-600/90 text-white text-xs font-bold rounded-lg shadow-lg">{project.updateTime}</span>
                    </div>

                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-8">
                      <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight group-hover:text-primary-400 transition-colors">{project.title}</h3>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="p-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      <span className="font-semibold">{project.latestChapter}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2 mx-auto">
                  {loadingMore ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      Muat Lebih Banyak
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-slate-700">
            <svg className="w-20 h-20 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h2 className="text-xl font-bold text-white mb-2">Tidak Ada Project</h2>
            <p className="text-gray-400">Belum ada project yang tersedia</p>
          </div>
        )}
      </div>
    </div>
  );
}
