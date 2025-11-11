'use client';

import { useState, useEffect } from 'react';
import { Search, Download, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Manhwa {
  slug: string;
  title: string;
  image: string;
  type: string;
  status: string;
  totalChapters: number;
}

interface Chapter {
  number: string;
  title: string;
  url: string;
  date: string;
}

export default function PDFConverterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Manhwa[]>([]);
  const [selectedManhwa, setSelectedManhwa] = useState<Manhwa | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  
  // Modal state for single chapter download
  const [showModal, setShowModal] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Search manhwa
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    console.log('[PDF Search] Searching for:', searchQuery);
    
    try {
      // Try list-from-files first (has more complete data)
      let response = await fetch(`/api/komiku/list-from-files?search=${encodeURIComponent(searchQuery)}&limit=20`);
      let data = await response.json();
      
      // Fallback to regular list if list-from-files fails
      if (!data.success || !data.data.manhwa || data.data.manhwa.length === 0) {
        console.log('[PDF Search] Trying fallback API...');
        response = await fetch(`/api/komiku/list?search=${encodeURIComponent(searchQuery)}&limit=20`);
        data = await response.json();
      }
      
      console.log('[PDF Search] API Response:', data);
      
      if (data.success && data.data.manhwa) {
        const manhwaList = data.data.manhwa;
        console.log('[PDF Search] Found manhwa:', manhwaList.length);
        
        // Map the response to match our interface
        const mappedResults = manhwaList.map((m: any) => {
          // Clean title - remove "Komik" prefix and "Bahasa Indonesia" suffix
          const cleanTitle = (m.manhwaTitle || m.title || '')
            .replace(/^Komik\s+/i, '')
            .replace(/\s+Bahasa Indonesia$/i, '')
            .trim();
          
          return {
            slug: m.slug,
            title: cleanTitle,
            image: m.image,
            type: m.type || 'Manhwa',
            status: m.status || 'Ongoing',
            totalChapters: m.totalChapters || m.chapters?.length || 0
          };
        });
        
        console.log('[PDF Search] Mapped results:', mappedResults);
        setSearchResults(mappedResults);
      } else {
        console.error('[PDF Search] No results found');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('[PDF Search] Error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Load chapters when manhwa selected
  const handleSelectManhwa = async (manhwa: Manhwa) => {
    setSelectedManhwa(manhwa);
    setIsLoadingChapters(true);
    setChapters([]);

    try {
      const response = await fetch(`/api/komiku/${manhwa.slug}/chapters`);
      const data = await response.json();
      
      if (data.success) {
        setChapters(data.data.chapters || []);
      }
    } catch (error) {
      console.error('Load chapters error:', error);
    } finally {
      setIsLoadingChapters(false);
    }
  };

  // Download single chapter
  const downloadChapter = async (chapterNumber: string) => {
    if (!selectedManhwa) return;

    // Show modal
    setCurrentChapter(chapterNumber);
    setShowModal(true);
    setDownloadProgress(0);

    try {
      console.log('[PDF Download] Starting download for chapter:', chapterNumber);
      setDownloadProgress(10);
      
      // Get chapter data from Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'komiku-data';
      const jsonUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/Chapter/komiku/${selectedManhwa.slug}.json`;
      
      console.log('[PDF Download] Fetching from:', jsonUrl);
      
      const jsonResponse = await fetch(jsonUrl);
      if (!jsonResponse.ok) throw new Error('Failed to fetch chapter data');
      setDownloadProgress(20);
      
      const data = await jsonResponse.json();
      const chapter = data.chapters.find((ch: any) => ch.number === chapterNumber);
      
      if (!chapter || !chapter.images) throw new Error('Chapter not found');
      setDownloadProgress(30);

      console.log('[PDF Download] Chapter data:', chapter);
      console.log('[PDF Download] Images type:', typeof chapter.images);
      console.log('[PDF Download] Images:', chapter.images);

      // Ensure images is an array of strings
      let imageUrls: string[] = [];
      
      if (Array.isArray(chapter.images)) {
        imageUrls = chapter.images.map((img: any) => {
          // If img is object with url property
          if (typeof img === 'object' && img.url) {
            return img.url;
          }
          // If img is already a string
          if (typeof img === 'string') {
            return img;
          }
          console.error('[PDF Download] Invalid image format:', img);
          return '';
        }).filter((url: string) => url !== '');
      }

      console.log('[PDF Download] Processed image URLs:', imageUrls);

      if (imageUrls.length === 0) {
        throw new Error('No valid image URLs found');
      }
      setDownloadProgress(40);

      // Build download URL
      const downloadUrl = `/api/chapter/download?chapter=${encodeURIComponent(chapterNumber)}&title=${encodeURIComponent(selectedManhwa.title)}${imageUrls.map(img => `&img=${encodeURIComponent(img)}`).join('')}`;
      
      console.log('[PDF Download] Fetching PDF from API...');
      setDownloadProgress(50);
      
      // Fetch PDF as blob instead of opening new tab
      const pdfResponse = await fetch(downloadUrl);
      if (!pdfResponse.ok) throw new Error('Failed to generate PDF');
      setDownloadProgress(80);
      
      const blob = await pdfResponse.blob();
      setDownloadProgress(90);
      
      // Create download link with proper MIME type
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${selectedManhwa.title} - Chapter ${chapterNumber}.pdf`;
      
      // Add to DOM, click, and cleanup
      document.body.appendChild(a);
      
      // Small delay to ensure browser registers the element
      await new Promise(resolve => setTimeout(resolve, 100));
      a.click();
      
      console.log('[PDF Download] Download triggered');
      setDownloadProgress(100);
      
      // Cleanup after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      // Close modal after 1 second
      setTimeout(() => {
        setShowModal(false);
        setCurrentChapter('');
      }, 1000);
    } catch (error) {
      console.error('[PDF Download] Error:', error);
      alert('Failed to generate PDF. Please try again.');
      setShowModal(false);
      setCurrentChapter('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm shadow-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-500 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/30">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Manga → PDF</h1>
                <p className="text-sm text-slate-400">Cari dan unduh chapter manga secara batch dengan konversi otomatis ke PDF</p>
              </div>
            </div>
            <Link 
              href="/"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              ← Kembali
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Limit Info */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white mb-1">Limit</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Single (hari ini)</span>
                  <span className="text-primary-400 font-medium">Unlimited</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Batch (hari ini)</span>
                  <span className="text-primary-400 font-medium">Unlimited</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400 mb-2">Reset: 00:00 WIB</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                Free Access
              </span>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 p-8 mb-6">
          <h2 className="text-3xl font-bold text-center text-white mb-2">
            Cari Manga/Manhwa Kamu
          </h2>
          <p className="text-center text-slate-400 mb-8">
            Cari dan unduh chapter manga secara batch dengan konversi otomatis ke PDF
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Ketik judul..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border-2 border-slate-600 text-white placeholder-slate-400 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/30"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Cari'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && !selectedManhwa && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Hasil Pencarian ({searchResults.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {searchResults.map((manhwa) => (
                <button
                  key={manhwa.slug}
                  onClick={() => handleSelectManhwa(manhwa)}
                  className="group text-left bg-slate-700/30 border-2 border-slate-600 rounded-lg overflow-hidden hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/20 transition-all"
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-slate-900">
                    <img
                      src={manhwa.image}
                      alt={manhwa.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm text-white line-clamp-2 mb-1">
                      {manhwa.title}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {manhwa.totalChapters} Chapter
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Manhwa & Chapters */}
        {selectedManhwa && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-700/50 p-6">
            {/* Manhwa Info */}
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-700">
              <img
                src={selectedManhwa.image}
                alt={selectedManhwa.title}
                className="w-24 h-32 object-cover rounded-lg shadow-md"
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  {selectedManhwa.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="px-2 py-1 bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded">
                    {selectedManhwa.type}
                  </span>
                  <span>{selectedManhwa.status}</span>
                  <span>{selectedManhwa.totalChapters} Chapter</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedManhwa(null);
                  setChapters([]);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                ← Ganti Manga
              </button>
            </div>

            {/* Chapters List */}
            {isLoadingChapters ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : chapters.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.number}
                    className="border-2 border-slate-600 rounded-lg p-4 transition-all flex items-center gap-4 bg-slate-700/30 hover:border-slate-500"
                  >
                    {/* Chapter circle icon */}
                    <div className="w-10 h-10 rounded-full border-2 border-primary-500 flex items-center justify-center flex-shrink-0 bg-primary-500/10">
                      <span className="text-primary-400 font-bold text-sm">
                        {chapter.number}
                      </span>
                    </div>

                    {/* Chapter Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white mb-1">
                        Chapter {chapter.number}
                      </div>
                      <div className="text-sm text-slate-400 truncate">
                        {chapter.title}
                      </div>
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={() => downloadChapter(chapter.number)}
                      className="flex-shrink-0 p-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors group"
                      title="Download PDF"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                Tidak ada chapter tersedia
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && !selectedManhwa && !isSearching && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Mulai Pencarian
            </h3>
            <p className="text-slate-400">
              Ketik judul manga/manhwa di atas untuk memulai
            </p>
          </div>
        )}
      </main>

      {/* Download Progress Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Generating PDF</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6">
              <p className="text-sm text-gray-600 mb-4">
                Progress: {downloadProgress}%
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-primary-600 to-primary-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
