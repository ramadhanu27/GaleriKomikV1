'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

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

  useEffect(() => {
    const handleScroll = () => {
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
  }, [lastScrollY])

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
      }
    } catch (error) {
      console.error('Error fetching chapter:', error)
    } finally {
      setLoading(false)
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
    <div className="py-8" onClick={handlePageClick}>
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <div className="card p-6 mb-6">
          <Link
            href={`/manhwa/${slug}`}
            className="text-primary-600 dark:text-primary-400 hover:underline mb-2 inline-block"
          >
            ← Kembali ke Detail
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {chapter.title || `Chapter ${chapter.number}`}
          </h1>
          {chapter.date && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {chapter.date}
            </p>
          )}
        </div>

        {/* Chapter Images */}
        <div className="space-y-2 mb-6 flex flex-col items-center">
          {images.length > 0 ? (
            images.map((image: any, index: number) => {
              const imageUrl = typeof image === 'string' ? image : image.url
              return (
                <div key={index} className="relative w-full md:w-[77%]">
                  <img
                    src={imageUrl}
                    alt={`Page ${index + 1}`}
                    className="w-full h-auto"
                    loading={index < 3 ? 'eager' : 'lazy'}
                  />
                </div>
              )
            })
          ) : (
            <div className="card p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Gambar chapter belum tersedia
              </p>
            </div>
          )}
        </div>

        {/* Spacer for fixed bottom navigation */}
        <div className="h-20"></div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700 shadow-lg z-40 transition-transform duration-300 ${
        showNav ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="container-custom max-w-4xl">
          <div className="flex items-center justify-between gap-1 sm:gap-2 p-3">
            {/* Home Button */}
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 rounded-lg transition-colors"
              title="Home"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="hidden md:inline text-sm">Home</span>
            </Link>

            {/* Previous Button */}
            <button
              onClick={handlePrevChapter}
              disabled={!chapterData.navigation.prev}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous Chapter"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden md:inline text-sm">Prev</span>
            </button>

            {/* Auto Scroll Button */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                autoScroll 
                  ? 'bg-primary-600 text-white hover:bg-primary-700' 
                  : 'bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600'
              }`}
              title="Auto Scroll"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {autoScroll ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                )}
              </svg>
              <span className="hidden md:inline text-sm">{autoScroll ? 'Stop' : 'Auto'}</span>
            </button>

            {/* Speed Settings Button */}
            <button
              onClick={() => setShowSpeedSettings(!showSpeedSettings)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 rounded-lg transition-colors"
              title="Speed Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="hidden md:inline text-sm">Speed</span>
            </button>

            {/* Chapter List Button */}
            <button
              onClick={() => setShowChapterList(!showChapterList)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 dark:hover:bg-dark-600 rounded-lg transition-colors"
              title="Chapter List"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="hidden md:inline text-sm">List</span>
            </button>

            {/* Next Button */}
            <button
              onClick={handleNextChapter}
              disabled={!chapterData.navigation.next}
              className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next Chapter"
            >
              <span className="hidden md:inline text-sm">Next</span>
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
