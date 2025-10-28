'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getProxiedImageUrl } from '@/lib/imageProxy'
import { useAuth } from '@/contexts/AuthContext'
import { addReadingHistory } from '@/lib/readingHistory'
import PrintChapterButton from '@/components/PrintChapterButton'

interface ChapterData {
  chapter: any
  navigation: {
    prev: { id: string; title: string } | null
    next: { id: string; title: string } | null
  }
}

export default function ChapterPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const slug = params.slug as string
  const chapterId = params.chapterId as string
  
  const [chapterData, setChapterData] = useState<ChapterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoScroll, setAutoScroll] = useState(false)
  const [showChapterList, setShowChapterList] = useState(false)
  const [showSpeedSettings, setShowSpeedSettings] = useState(false)
  const [allChapters, setAllChapters] = useState<any[]>([])
  const [scrollSpeed, setScrollSpeed] = useState(2) // pixels per interval
  const [showNav, setShowNav] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchChapter()
    fetchAllChapters()
  }, [slug, chapterId])

  // Save to history when user logs in and chapter data is available
  useEffect(() => {
    if (user && chapterData?.chapter) {
      saveToHistory(chapterData.chapter)
    }
  }, [user])

  useEffect(() => {
    const handleScroll = () => {
      // Always show nav when autoscroll is active
      if (autoScroll) {
        setShowNav(true)
        return
      }

      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide nav
        setShowNav(false)
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show nav
        setShowNav(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY, autoScroll])

  useEffect(() => {
    if (autoScroll) {
      scrollIntervalRef.current = setInterval(() => {
        window.scrollBy({ top: scrollSpeed, behavior: 'smooth' })
      }, 50)
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }
    }
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }
    }
  }, [autoScroll, scrollSpeed])

  const fetchChapter = async () => {
    try {
      const response = await fetch(`/api/komiku/${slug}/chapter/${chapterId}`)
      const data = await response.json()
      
      if (data.success) {
        setChapterData(data.data)
        
        // Save to reading history if user is logged in
        if (user && data.data.chapter) {
          saveToHistory(data.data.chapter)
        }
      }
    } catch (error) {
      console.error('Error fetching chapter:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveToHistory = async (chapter: any) => {
    if (!user) {
      console.log('⚠️ No user logged in, skipping history save')
      return
    }
    
    try {
      // Get manhwa info from chapter data or fetch it
      const manhwaTitle = chapter.manhwa_title || chapter.title?.split('Chapter')[0]?.trim() || slug
      const manhwaImage = chapter.manhwa_image || chapter.image || ''
      const chapterNumber = chapter.number || chapter.chapter || chapterId
      
      console.log('📚 Saving to history:', {
        userId: user.id,
        slug,
        manhwaTitle,
        chapterNumber,
        chapterId
      })
      
      const result = await addReadingHistory(
        user.id,
        slug,
        manhwaTitle,
        manhwaImage,
        chapterNumber.toString(),
        chapterId,
        'manhwa'
      )
      
      if (result.success) {
        console.log('✅ Reading history saved successfully')
      } else {
        console.error('❌ Failed to save history:', result.error)
      }
    } catch (error) {
      console.error('❌ Error saving reading history:', error)
    }
  }

  const fetchAllChapters = async () => {
    try {
      const response = await fetch(`/api/komiku/${slug}/chapters`)
      const data = await response.json()
      if (data.success) {
        setAllChapters(data.data.chapters)
      }
    } catch (error) {
      console.error('Error fetching chapters:', error)
    }
  }

  const handlePrevChapter = () => {
    if (chapterData?.navigation.prev) {
      router.push(`/manhwa/${slug}/chapter/${chapterData.navigation.prev.id}`)
    }
  }

  const handleNextChapter = () => {
    if (chapterData?.navigation.next) {
      router.push(`/manhwa/${slug}/chapter/${chapterData.navigation.next.id}`)
    }
  }

  if (loading) {
    return (
      <div className="py-8">
        <div className="container-custom">
          <div className="skeleton h-96 rounded-lg" />
        </div>
      </div>
    )
  }

  if (!chapterData) {
    return (
      <div className="py-8">
        <div className="container-custom">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Chapter tidak ditemukan
            </h1>
            <Link href={`/manhwa/${slug}`} className="btn-primary">
              Kembali ke Detail Manhwa
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const chapter = chapterData.chapter
  const images = chapter.images || []

  const handlePageClick = () => {
    if (!showNav) {
      setShowNav(true)
    }
  }

  return (
    <div className="bg-slate-950 min-h-screen" onClick={handlePageClick}>
      {/* Top Navigation Bar */}
      <div className={`fixed top-0 left-0 right-0 bg-gradient-to-b from-slate-900/95 to-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-xl z-40 transition-transform duration-300 ${
        showNav ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="container-custom max-w-5xl">
          <div className="flex items-center justify-between p-4">
            <Link
              href={`/manhwa/${slug}`}
              className="flex items-center gap-2 text-slate-300 hover:text-primary-400 transition-colors group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Kembali</span>
            </Link>
            
            <div className="flex-1 mx-4 text-center">
              <h1 className="text-lg font-bold text-white truncate">
                {chapter.title || `Chapter ${chapter.number}`}
              </h1>
              {chapter.date && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {chapter.date}
                </p>
              )}
            </div>

            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Chapter Images */}
      <div className="pt-20 pb-24">
        <div className="max-w-4xl mx-auto" style={{ zoom: '67%' }}>
          {images.length > 0 ? (
            <div className="space-y-0">
              {images.map((image: any, index: number) => {
                const originalUrl = typeof image === 'string' ? image : image.url
                const imageUrl = getProxiedImageUrl(originalUrl)
                return (
                  <div key={index} className="relative w-full">
                    <img
                      src={imageUrl}
                      alt={`Page ${index + 1}`}
                      className="w-full h-auto"
                      loading={index < 3 ? 'eager' : 'lazy'}
                    />
                    {/* Page Number Overlay */}
                    <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                      <span className="text-white text-sm font-medium">
                        {index + 1} / {images.length}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700">
                <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-400">
                  Gambar chapter belum tersedia
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/95 to-slate-900/80 backdrop-blur-md border-t border-slate-800 shadow-2xl z-40 transition-transform duration-300 ${
        showNav ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="container-custom max-w-5xl">
          <div className="flex items-center justify-center gap-2 p-4">
            {/* Previous Button */}
            <button
              onClick={handlePrevChapter}
              disabled={!chapterData.navigation.prev}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg"
              title="Previous Chapter"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline font-medium">Prev</span>
            </button>

            {/* Auto Scroll Button */}
            <button
              onClick={() => setAutoScroll(true)}
              disabled={autoScroll}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all shadow-lg ${
                autoScroll
                  ? 'bg-primary-600 text-white cursor-default'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title="Start Auto Scroll"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <span className="hidden sm:inline font-medium">Auto</span>
            </button>

            {/* Stop Button - Only visible when autoscroll is active */}
            {autoScroll && (
              <button
                onClick={() => setAutoScroll(false)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all shadow-lg animate-pulse"
                title="Stop Auto Scroll"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                <span className="hidden sm:inline font-medium">Stop</span>
              </button>
            )}

            {/* Speed Settings Button */}
            <button
              onClick={() => setShowSpeedSettings(!showSpeedSettings)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all shadow-lg"
              title="Speed Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="hidden sm:inline font-medium">Speed</span>
            </button>

            {/* Chapter List Button */}
            <button
              onClick={() => setShowChapterList(!showChapterList)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all shadow-lg"
              title="Chapter List"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline font-medium">List</span>
            </button>

            {/* Print Chapter Button */}
            <PrintChapterButton />

            {/* Next Button */}
            <button
              onClick={handleNextChapter}
              disabled={!chapterData.navigation.next}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-900/30"
              title="Next Chapter"
            >
              <span className="hidden sm:inline font-medium">Next</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Speed Settings Modal */}
      {showSpeedSettings && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSpeedSettings(false)}
        >
          <div 
            className="bg-white dark:bg-dark-800 rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Auto Scroll Speed
              </h3>
              <button
                onClick={() => setShowSpeedSettings(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Speed: {scrollSpeed}x
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={scrollSpeed}
                  onChange={(e) => setScrollSpeed(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-dark-700"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 5, 7, 10].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setScrollSpeed(speed)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      scrollSpeed === speed
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter List Modal */}
      {showChapterList && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowChapterList(false)}
        >
          <div 
            className="bg-white dark:bg-dark-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Daftar Chapter
              </h3>
              <button
                onClick={() => setShowChapterList(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(80vh-80px)] p-4">
              <div className="grid gap-2">
                {allChapters.map((ch: any, index: number) => {
                  const isActive = ch.number?.toString() === chapterId
                  return (
                    <Link
                      key={index}
                      href={`/manhwa/${slug}/chapter/${ch.number || ch.id || ch.chapter}`}
                      onClick={() => setShowChapterList(false)}
                      className={`p-4 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {ch.title || `Chapter ${ch.number}`}
                        </span>
                        {ch.date && (
                          <span className="text-sm opacity-75">
                            {ch.date}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
