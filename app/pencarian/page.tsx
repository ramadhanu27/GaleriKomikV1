"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { SoulScanSearchResponse, SoulScanSearchResult, SoulScanListResponse, SoulScanListItem, extractSlugFromUrl } from "@/types/soulscan";
import { useTheme } from "@/components/ThemeProvider";

// Helper function to proxy external images
const getProxiedImageUrl = (url: string) => {
  if (!url) return "";
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const initialQuery = searchParams.get("q") || "";

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SoulScanSearchResult[]>([]);
  const [listResults, setListResults] = useState<SoulScanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Fetch initial list when page loads
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    } else {
      fetchList(1);
    }
  }, [initialQuery]);

  const fetchList = useCallback(async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`/api/soulscan/list?page=${page}`);
      const data: SoulScanListResponse = await response.json();

      if (data.success && data.results) {
        if (append) {
          setListResults((prev) => [...prev, ...data.results]);
        } else {
          setListResults(data.results);
        }
        setCurrentPage(data.pagination.currentPage);
        setHasNextPage(data.pagination.hasNextPage);
      }
    } catch (err) {
      console.error("Error fetching list:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSearched(false);
        fetchList(1);
        return;
      }

      try {
        setLoading(true);
        setSearched(true);
        const response = await fetch(`/api/soulscan/search/${encodeURIComponent(searchQuery.trim())}`);
        const data: SoulScanSearchResponse = await response.json();

        if (data.success && data.results) {
          setResults(data.results);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Error searching:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchList]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setQuery(searchInput.trim());
      router.push(`/pencarian?q=${encodeURIComponent(searchInput.trim())}`);
      performSearch(searchInput.trim());
    } else {
      setSearched(false);
      setQuery("");
      router.push(`/pencarian`);
      fetchList(1);
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setQuery("");
    setSearched(false);
    router.push(`/pencarian`);
    fetchList(1);
  };

  const loadMore = () => {
    if (hasNextPage && !loadingMore) {
      fetchList(currentPage + 1, true);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-[#0a0f1a] text-white" : "bg-gray-50 text-gray-900"}`}>
      <div className="container-custom py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-6 flex items-center gap-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
            <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Daftar Komik
          </h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari judul komik..."
                className={`w-full pl-12 pr-12 py-4 border rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                  darkMode ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                }`}
              />
              {searchInput && (
                <button type="button" onClick={handleClearSearch} className={`absolute right-4 top-1/2 -translate-y-1/2 ${darkMode ? "text-slate-400 hover:text-white" : "text-gray-400 hover:text-gray-600"}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button type="submit" disabled={loading} className="px-8 py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              Cari
            </button>
          </form>
        </div>

        {/* View Mode Toggle & Results Count */}
        {!loading && (searched ? results.length > 0 : listResults.length > 0) && (
          <div className={`flex items-center justify-between mb-6 p-4 rounded-xl ${darkMode ? "bg-slate-800/50" : "bg-white shadow-sm"}`}>
            <div className={darkMode ? "text-slate-400" : "text-gray-600"}>
              {searched ? (
                <>
                  Ditemukan <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{results.length}</span> hasil untuk "<span className="text-primary-400">{query}</span>"
                </>
              ) : (
                <>
                  Menampilkan <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{listResults.length}</span> komik
                </>
              )}
            </div>
            <div className={`flex gap-1 p-1 rounded-lg border ${darkMode ? "bg-slate-800 border-slate-700" : "bg-gray-100 border-gray-200"}`}>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-all ${
                  viewMode === "grid" ? "bg-primary-600 text-white shadow-lg" : darkMode ? "text-slate-400 hover:text-white hover:bg-slate-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
                title="Grid View">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition-all ${
                  viewMode === "list" ? "bg-primary-600 text-white shadow-lg" : darkMode ? "text-slate-400 hover:text-white hover:bg-slate-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                }`}
                title="List View">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(18)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className={`aspect-[2/3] rounded-lg mb-2 ${darkMode ? "bg-slate-800" : "bg-gray-200"}`} />
                <div className={`h-4 rounded w-3/4 ${darkMode ? "bg-slate-800" : "bg-gray-200"}`} />
              </div>
            ))}
          </div>
        ) : searched ? (
          // Search Results
          results.length === 0 ? (
            <div className={`text-center py-16 rounded-2xl ${darkMode ? "bg-slate-800/50" : "bg-white shadow-sm"}`}>
              <svg className={`w-24 h-24 mx-auto mb-6 ${darkMode ? "text-slate-600" : "text-gray-300"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className={`text-xl font-bold mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>Tidak Ditemukan</h2>
              <p className={darkMode ? "text-slate-400" : "text-gray-600"}>Tidak ada hasil untuk "{query}"</p>
              <button onClick={handleClearSearch} className="mt-4 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                Lihat Semua Komik
              </button>
            </div>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
              {results.map((item, index) => (
                <ComicCard key={index} item={item} viewMode={viewMode} darkMode={darkMode} isSearchResult />
              ))}
            </div>
          )
        ) : (
          // List Results
          <>
            <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
              {listResults.map((item, index) => (
                <ComicCard key={index} item={item} viewMode={viewMode} darkMode={darkMode} />
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
        )}
      </div>
    </div>
  );
}

// Comic Card Component
interface ComicCardProps {
  item: SoulScanSearchResult | SoulScanListItem;
  viewMode: "grid" | "list";
  darkMode: boolean;
  isSearchResult?: boolean;
}

function ComicCard({ item, viewMode, darkMode, isSearchResult }: ComicCardProps) {
  const slug = isSearchResult ? extractSlugFromUrl((item as SoulScanSearchResult).url) : (item as SoulScanListItem).slug;
  const searchItem = item as SoulScanSearchResult;
  const listItem = item as SoulScanListItem;

  if (viewMode === "grid") {
    return (
      <Link href={`/soulscan/${slug}`} className={`group cursor-pointer block rounded-lg overflow-hidden shadow-md hover:shadow-xl hover:ring-2 hover:ring-primary-500 transition-all duration-300 ${darkMode ? "bg-slate-800" : "bg-white"}`}>
        <div className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-800">
          <img
            src={getProxiedImageUrl(item.imageUrl)}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />

          {isSearchResult && searchItem.isHot && (
            <div className="absolute top-2 left-2 z-10">
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg">🔥 HOT</span>
            </div>
          )}

          {isSearchResult && searchItem.rating && parseFloat(searchItem.rating) > 0 && parseFloat(searchItem.rating) <= 10 && (
            <div className="absolute top-2 right-2 z-10">
              <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                <span className="text-yellow-400 text-xs">⭐</span>
                <span className="text-white text-xs font-bold">{parseFloat(searchItem.rating).toFixed(1)}</span>
              </div>
            </div>
          )}

          {!isSearchResult && (
            <div className="absolute top-2 left-2 z-10">
              <span className="px-2 py-1 bg-primary-600/90 text-white text-xs font-bold rounded-lg shadow-lg">{listItem.updateTime}</span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-8">
            <h3 className="font-bold text-white text-sm line-clamp-2 leading-tight group-hover:text-primary-400 transition-colors">{item.title}</h3>
          </div>
        </div>

        <div className="p-2.5 space-y-1">
          <div className={`flex items-center gap-1.5 text-xs ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="font-semibold">{isSearchResult ? searchItem.chapter : listItem.latestChapter}</span>
          </div>
        </div>
      </Link>
    );
  }

  // List View
  return (
    <Link href={`/soulscan/${slug}`} className={`group flex gap-4 p-4 rounded-xl hover:ring-2 hover:ring-primary-500 transition-all duration-300 ${darkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-white hover:bg-gray-50 shadow-sm"}`}>
      <div className="relative w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-600 to-indigo-800">
        <img src={getProxiedImageUrl(item.imageUrl)} alt={item.title} className="w-full h-full object-cover" loading="lazy" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`font-bold text-base line-clamp-1 group-hover:text-primary-400 transition-colors mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>{item.title}</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          {isSearchResult && searchItem.type && <span className="text-xs px-2 py-0.5 bg-primary-600/20 text-primary-400 rounded font-medium">{searchItem.type}</span>}
          {isSearchResult && searchItem.rating && parseFloat(searchItem.rating) > 0 && parseFloat(searchItem.rating) <= 10 && (
            <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded font-bold flex items-center gap-1">⭐ {parseFloat(searchItem.rating).toFixed(1)}</span>
          )}
          {!isSearchResult && <span className="text-xs px-2 py-0.5 bg-primary-600/20 text-primary-400 rounded font-medium">{listItem.updateTime}</span>}
        </div>
        <p className={`text-sm ${darkMode ? "text-slate-400" : "text-gray-600"}`}>{isSearchResult ? searchItem.chapter : listItem.latestChapter}</p>
      </div>
    </Link>
  );
}

export default function PencarianPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
      <SearchContent />
    </Suspense>
  );
}
