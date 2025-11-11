'use client';

import { useState, useEffect } from 'react';
import { Search, Download, FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Manhwa {
  slug: string;
  title: string;
  image: string;
  type: string;
  status: string;
  totalChapters: number;
  rating?: number;
  genres?: string[];
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
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
9

  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  
  // Modal state for download
  const [showModal, setShowModal] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [pdfReady, setPdfReady] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [progressMessage, setProgressMessage] = useState<string>('Preparing download...');
  
  // Batch download state
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Real-time search with debounce
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // If empty, clear results
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Set new timeout for search
    const timeout = setTimeout(() => {
      handleSearch(value);
    }, 500); // 500ms debounce
    
    setSearchTimeout(timeout);
  };

  // Search manhwa
  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    console.log('[PDF Search] Searching for:', searchTerm);
    
    try {
      // Try list-from-files first (has more complete data)
      let response = await fetch(`/api/komiku/list-from-files?search=${encodeURIComponent(searchTerm)}&limit=20`);
      let data = await response.json();
      
      // Fallback to regular list if list-from-files fails
      if (!data.success || !data.data.manhwa || data.data.manhwa.length === 0) {
        console.log('[PDF Search] Trying fallback API...');
        response = await fetch(`/api/komiku/list?search=${encodeURIComponent(searchTerm)}&limit=20`);
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
            totalChapters: m.totalChapters || m.chapters?.length || 0,
            rating: m.rating ? parseFloat(m.rating) : undefined,
            genres: m.genres || []
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
    setSelectedChapters(new Set()); // Clear selection

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

  // Toggle chapter selection
  const toggleChapterSelection = (chapterNumber: string) => {
    setSelectedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterNumber)) {
        newSet.delete(chapterNumber);
      } else {
        newSet.add(chapterNumber);
      }
      return newSet;
    });
  };

  // Select all chapters
  const selectAllChapters = () => {
    const allChapterNumbers = chapters.map(ch => ch.number);
    setSelectedChapters(new Set(allChapterNumbers));
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedChapters(new Set());
  };

  // Download single chapter
  const downloadChapter = async (chapterNumber: string) => {
    if (!selectedManhwa) return;

    // Show modal
    setCurrentChapter(chapterNumber);
    setShowModal(true);
    setDownloadProgress(0);
    setPdfReady(false);
    setDownloadUrl('');
    setProgressMessage('Preparing download...');

    try {
      console.log('[PDF Download] Starting PDF generation for chapter:', chapterNumber);
      setDownloadProgress(10);
      setProgressMessage('Fetching chapter data...');
      
      // Get chapter data from Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'komiku-data';
      const jsonUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/Chapter/komiku/${selectedManhwa.slug}.json`;
      
      console.log('[PDF Download] Fetching from:', jsonUrl);
      
      const jsonResponse = await fetch(jsonUrl);
      if (!jsonResponse.ok) throw new Error('Failed to fetch chapter data');
      
      const data = await jsonResponse.json();
      setDownloadProgress(20);
      setProgressMessage('Chapter data loaded');
      
      const chapter = data.chapters.find((ch: any) => ch.number === chapterNumber);
      
      if (!chapter || !chapter.images) throw new Error('Chapter not found');
      
      const totalImages = Array.isArray(chapter.images) ? chapter.images.length : 0;
      setDownloadProgress(30);
      setProgressMessage(`Found ${totalImages} images`);

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
      setProgressMessage(`Validating ${imageUrls.length} images`);

      // Build download URL
      const pdfUrl = `/api/chapter/download?chapter=${encodeURIComponent(chapterNumber)}&title=${encodeURIComponent(selectedManhwa.title)}${imageUrls.map(img => `&img=${encodeURIComponent(img)}`).join('')}`;
      
      console.log('[PDF Download] Starting PDF generation on server...');
      setDownloadProgress(50);
      setProgressMessage('Starting PDF generation...');
      
      // Simulate image processing progress
      let currentImage = 0;
      const progressInterval = setInterval(() => {
        currentImage += Math.floor(Math.random() * 3) + 1; // Random 1-3 images
        if (currentImage >= imageUrls.length) {
          currentImage = imageUrls.length;
          clearInterval(progressInterval);
        }
        const progress = 50 + Math.floor((currentImage / imageUrls.length) * 40); // 50% to 90%
        setDownloadProgress(progress);
        setProgressMessage(`Processing image ${currentImage}/${imageUrls.length}`);
      }, 500);
      
      // Actually fetch PDF from server (pre-generate)
      const response = await fetch(pdfUrl);
      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      console.log('[PDF Download] Downloading PDF from server...');
      setDownloadProgress(92);
      setProgressMessage('PDF generated, downloading...');
      
      // Get the blob
      const blob = await response.blob();
      console.log('[PDF Download] PDF downloaded, size:', (blob.size / 1024 / 1024).toFixed(2), 'MB');
      setDownloadProgress(95);
      setProgressMessage(`Downloaded ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
      
      // Create blob URL
      const blobUrl = window.URL.createObjectURL(blob);
      setDownloadUrl(blobUrl);
      
      setDownloadProgress(100);
      setPdfReady(true);
      setProgressMessage('PDF ready for download!');
      console.log('[PDF Download] PDF ready for download!');
    } catch (error) {
      console.error('[PDF Download] Error:', error);
      alert('Failed to generate PDF. Please try again.');
      setShowModal(false);
      setCurrentChapter('');
    }
  };

  // Trigger actual download when user clicks button
  const triggerDownload = () => {
    if (!downloadUrl) return;
    
    console.log('[PDF Download] User clicked download button');
    
    // Create anchor and trigger download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${selectedManhwa?.title} - Chapter ${currentChapter}.pdf`;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    console.log('[PDF Download] Download triggered in browser');
    
    // Cleanup and close modal
    setTimeout(() => {
      document.body.removeChild(a);
      
      // Revoke blob URL to free memory
      if (downloadUrl.startsWith('blob:')) {
        window.URL.revokeObjectURL(downloadUrl);
      }
      
      setShowModal(false);
      setCurrentChapter('');
      setPdfReady(false);
      setDownloadUrl('');
    }, 1000);
  };

  // Batch download selected chapters
  const downloadSelectedChapters = async () => {
    if (selectedChapters.size === 0 || !selectedManhwa) return;
    
    setIsBatchDownloading(true);
    setBatchProgress({ current: 0, total: selectedChapters.size });
    
    const chaptersToDownload = Array.from(selectedChapters).sort((a, b) => {
      return parseInt(a) - parseInt(b);
    });
    
    for (let i = 0; i < chaptersToDownload.length; i++) {
      const chapterNumber = chaptersToDownload[i];
      setBatchProgress({ current: i + 1, total: chaptersToDownload.length });
      
      try {
        await downloadChapter(chapterNumber);
        // Wait for modal to close before next download
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to download chapter ${chapterNumber}:`, error);
      }
    }
    
    setIsBatchDownloading(false);
    setBatchProgress({ current: 0, total: 0 });
    clearAllSelections();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/favpdf.jpg"
                alt="PDF Converter"
                width={48}
                height={48}
                className="rounded-lg shadow-md"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manga PDF Converter</h1>
                <p className="text-sm text-gray-600">Download manga chapters as PDF files</p>
              </div>
            </div>
            <Link 
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">How to Use</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Search for your favorite manga
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Select chapters to download
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Click download and wait for PDF generation
                </li>
              </ul>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                ✓ Free & Unlimited
              </span>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Search Manga
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Type manga title to search and download chapters as PDF
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search manga title... (auto search)"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
              <button
                onClick={() => handleSearch()}
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-3.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span className="hidden sm:inline">Search</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && !selectedManhwa && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <span>Search Results</span>
              <span className="text-sm font-normal text-gray-500">({searchResults.length} found)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchResults.map((manhwa, index) => (
                <button
                  key={manhwa.slug}
                  onClick={() => handleSelectManhwa(manhwa)}
                  className="group text-left bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="aspect-[3/4] relative overflow-hidden bg-slate-900">
                    <Image
                      src={manhwa.image}
                      alt={manhwa.title}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      priority={index < 5}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI2NyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI2NyIgZmlsbD0iIzFhMjAyYyIvPjwvc3ZnPg=="
                    />
                    
                    {/* Type Badge */}
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded shadow-md">
                        {manhwa.type}
                      </span>
                    </div>
                    
                    {/* Rating Badge */}
                    {manhwa.rating && (
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 text-xs font-semibold bg-yellow-400 text-gray-900 rounded shadow-md flex items-center gap-1">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          {manhwa.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute bottom-2 left-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded shadow-md ${
                        manhwa.status === 'Ongoing' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-500 text-white'
                      }`}>
                        {manhwa.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-3 bg-gray-50">
                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                      {manhwa.title}
                    </h4>
                    
                    {/* Genres */}
                    {manhwa.genres && manhwa.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {manhwa.genres.slice(0, 2).map((genre, i) => (
                          <span key={i} className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-700 rounded">
                            {genre}
                          </span>
                        ))}
                        {manhwa.genres.length > 2 && (
                          <span className="px-1.5 py-0.5 text-xs text-gray-500">
                            +{manhwa.genres.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Chapter Count */}
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {manhwa.totalChapters} Chapters
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Manhwa & Chapters */}
        {selectedManhwa && (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            {/* Manhwa Info */}
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
              <img
                src={selectedManhwa.image}
                alt={selectedManhwa.title}
                className="w-24 h-32 object-cover rounded-lg shadow-md"
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {selectedManhwa.title}
                </h3>
                
                {/* Type, Status, Chapters */}
                <div className="flex items-center gap-3 text-sm mb-3 flex-wrap">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full font-medium">
                    {selectedManhwa.type}
                  </span>
                  <span className={`px-3 py-1 rounded-full font-medium ${
                    selectedManhwa.status === 'Ongoing'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {selectedManhwa.status}
                  </span>
                  <span className="text-gray-600 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {selectedManhwa.totalChapters} Chapters
                  </span>
                </div>
                
                {/* Rating */}
                {selectedManhwa.rating && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(selectedManhwa.rating || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-slate-600'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      {selectedManhwa.rating.toFixed(1)}
                    </span>
                  </div>
                )}
                
                {/* Genres */}
                {selectedManhwa.genres && selectedManhwa.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedManhwa.genres.slice(0, 5).map((genre, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 border border-gray-200 rounded-full"
                      >
                        {genre}
                      </span>
                    ))}
                    {selectedManhwa.genres.length > 5 && (
                      <span className="px-2 py-1 text-xs text-gray-500">
                        +{selectedManhwa.genres.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedManhwa(null);
                  setChapters([]);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                ← Change Manga
              </button>
            </div>

            {/* Batch Download Controls */}
            {chapters.length > 0 && (
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={selectAllChapters}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearAllSelections}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                  >
                    Clear
                  </button>
                  <span className="text-sm text-gray-600 font-medium">
                    {selectedChapters.size} selected
                  </span>
                </div>
                <button
                  onClick={downloadSelectedChapters}
                  disabled={selectedChapters.size === 0 || isBatchDownloading}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                >
                  {isBatchDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Downloading {batchProgress.current}/{batchProgress.total}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download {selectedChapters.size > 0 ? `(${selectedChapters.size})` : 'Selected'}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Chapters List */}
            {isLoadingChapters ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : chapters.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.number}
                    className={`border-2 rounded-lg p-4 transition-all flex items-center gap-4 ${
                      selectedChapters.has(chapter.number)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedChapters.has(chapter.number)}
                      onChange={() => toggleChapterSelection(chapter.number)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />

                    {/* Chapter circle icon */}
                    <div className="w-10 h-10 rounded-full border-2 border-blue-500 flex items-center justify-center flex-shrink-0 bg-blue-100">
                      <span className="text-blue-700 font-bold text-sm">
                        {chapter.number}
                      </span>
                    </div>

                    {/* Chapter Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 mb-1">
                        Chapter {chapter.number}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {chapter.title}
                      </div>
                    </div>

                    {/* Download Button */}
                    <button
                      onClick={() => downloadChapter(chapter.number)}
                      className="flex-shrink-0 p-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors group shadow-sm"
                      title="Download PDF"
                    >
                      <Download className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No chapters available
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && !selectedManhwa && !isSearching && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start Searching
            </h3>
            <p className="text-gray-600">
              Type manga title above to search and download chapters
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
                {pdfReady ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {pdfReady ? 'Download PDF ready' : 'Generating PDF'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setPdfReady(false);
                  setDownloadUrl('');
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6">
              {!pdfReady ? (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">
                      Progress: {downloadProgress}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {progressMessage}
                    </p>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-primary-600 to-primary-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <button
                    onClick={triggerDownload}
                    className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-lg hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
