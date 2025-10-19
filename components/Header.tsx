'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showHeader, setShowHeader] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Check if current page is chapter reading page
  const isChapterPage = pathname?.includes('/chapter/')

  // Realtime search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true)
        const response = await fetch(`/api/komiku/list?search=${encodeURIComponent(searchQuery)}&limit=5&withCovers=true`)
        const data = await response.json()
        if (data.success) {
          setSearchResults(data.data.manhwa)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsSearching(false)
      }
    }, 300) // Debounce 300ms

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/cari?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setIsSearchOpen(false)
      setSearchResults([])
    }
  }

  const handleResultClick = (slug: string) => {
    router.push(`/manhwa/${slug}`)
    setSearchQuery('')
    setIsSearchOpen(false)
    setSearchResults([])
  }

  const closeMenu = () => setIsMenuOpen(false)

  // Auto-hide header on scroll for chapter pages
  useEffect(() => {
    if (!isChapterPage) {
      setShowHeader(true)
      return
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide header
        setShowHeader(false)
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show header
        setShowHeader(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    const handleClick = () => {
      // Show header when clicking anywhere on chapter page
      if (!showHeader) {
        setShowHeader(true)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('click', handleClick)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('click', handleClick)
    }
  }, [lastScrollY, isChapterPage, showHeader])

  return (
    <>
      <header className={`sticky top-0 z-50 bg-white/95 dark:bg-dark-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-dark-800 transition-all duration-300 ${
        isChapterPage && !showHeader ? '-translate-y-full' : 'translate-y-0'
      }`}>
        <nav className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative w-10 h-10">
              <Image
                src="/logo.png"
                alt="Arkomik"
                fill
                className="object-contain transition-transform group-hover:scale-110"
              />
            </div>
            <span className="text-xl font-bold text-gradient hidden sm:block">
              Arkomik
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="nav-link">
              Beranda
            </Link>
            <Link href="/genre" className="nav-link">
              Genre
            </Link>
            <Link href="/populer" className="nav-link">
              Populer
            </Link>
            <Link href="/terbaru" className="nav-link">
              Terbaru
            </Link>
            <Link href="/pencarian" className="nav-link flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Pencarian</span>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-200 dark:hover:bg-dark-800 rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Search Desktop */}
            <div className="relative hidden lg:block">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                type="text"
                placeholder="Cari manhwa..."
                className="input-field w-64 pl-10"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              
              {/* Search Results Dropdown */}
              {searchQuery.length >= 2 && (
                <div className="absolute top-full mt-2 w-full sm:w-96 right-0 bg-white dark:bg-dark-800 rounded-lg shadow-xl border border-gray-200 dark:border-dark-700 max-h-96 overflow-y-auto z-50">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">
                      Mencari...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      {searchResults.map((manhwa) => (
                        <button
                          key={manhwa.slug}
                          onClick={() => handleResultClick(manhwa.slug)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors text-left"
                        >
                          <img
                            src={manhwa.image}
                            alt={manhwa.title}
                            className="w-12 h-16 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {manhwa.manhwaTitle || manhwa.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {manhwa.genres?.slice(0, 2).join(', ')}
                            </p>
                          </div>
                        </button>
                      ))}
                      <div className="border-t border-gray-200 dark:border-dark-700 grid grid-cols-2">
                        <button
                          onClick={handleSearch}
                          className="p-3 text-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                        >
                          Lihat semua →
                        </button>
                        <Link
                          href="/pencarian"
                          className="p-3 text-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-dark-700 border-l border-gray-200 dark:border-dark-700 transition-colors"
                          onClick={() => {
                            setSearchQuery('')
                            setSearchResults([])
                          }}
                        >
                          🔍 Filter
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      Tidak ada hasil
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Search Mobile Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-dark-800 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-200 dark:hover:bg-dark-800 rounded-lg"
            >
              {!isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        {isSearchOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-dark-800">
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                type="text"
                placeholder="Cari manhwa..."
                className="input-field w-full pl-10"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-dark-800 space-y-2">
            <Link href="/" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors" onClick={closeMenu}>
              Beranda
            </Link>
            <Link href="/genre" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors" onClick={closeMenu}>
              Genre
            </Link>
            <Link href="/populer" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors" onClick={closeMenu}>
              Populer
            </Link>
            <Link href="/terbaru" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors" onClick={closeMenu}>
              Terbaru
            </Link>
            <Link href="/pencarian" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors" onClick={closeMenu}>
              🔍 Pencarian Lanjutan
            </Link>
          </div>
        )}
      </nav>
    </header>
    </>
  )
}
