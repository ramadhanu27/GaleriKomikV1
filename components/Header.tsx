'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from './AuthModal'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showHeader, setShowHeader] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const isChapterPage = pathname?.includes('/chapter/')
  const isActive = (path: string) => pathname === path

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
    }, 300)

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

  useEffect(() => {
    if (!isChapterPage) {
      setShowHeader(true)
      return
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false)
      } else if (currentScrollY < lastScrollY) {
        setShowHeader(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    const handleClick = () => {
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
      <header className={`sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 backdrop-blur-md border-b border-slate-700/50 shadow-lg transition-all duration-300 ${
        isChapterPage && !showHeader ? '-translate-y-full' : 'translate-y-0'
      }`}>
        <nav className="container-custom">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden ring-2 ring-primary-500/50 group-hover:ring-primary-500 transition-all">
              <Image
                src="/logo.png"
                alt="Arkomik"
                fill
                className="object-contain transition-transform group-hover:scale-110"
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                Arkomik
              </span>
              <p className="text-[10px] text-slate-400 -mt-1">Baca Manhwa Gratis</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-2">
            {[
              { href: '/', label: 'Beranda', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { href: '/populer', label: 'Populer', icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' },
              { href: '/terbaru', label: 'Terbaru', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { href: '/pencarian', label: 'Pencarian', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }
            ].map(item => (
              <Link 
                key={item.href}
                href={item.href} 
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive(item.href) 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30' 
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {/* Auth Buttons */}
            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700/50 rounded-lg transition-all text-slate-300 hover:text-white"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{user.username || user.email?.split('@')[0]}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 py-2 z-50">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profil
                    </Link>
                    <Link
                      href="/bookmark"
                      className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Bookmark
                    </Link>
                    <Link
                      href="/history"
                      className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Riwayat
                    </Link>
                    <div className="border-t border-slate-700 my-2"></div>
                    <button
                      onClick={() => {
                        signOut()
                        setShowUserMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-slate-700/50 hover:text-red-300 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Masuk
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2.5 hover:bg-slate-700/50 rounded-lg transition-all text-slate-300 hover:text-white"
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

            <div className="relative hidden lg:block">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                type="text"
                placeholder="Cari manhwa..."
                className="w-64 px-4 py-2 pl-10 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              
              {searchQuery.length >= 2 && (
                <div className="absolute top-full mt-2 w-full sm:w-96 right-0 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 max-h-96 overflow-y-auto z-50">
                  {isSearching ? (
                    <div className="p-4 text-center text-slate-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                      Mencari...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      {searchResults.map((manhwa) => (
                        <button
                          key={manhwa.slug}
                          onClick={() => handleResultClick(manhwa.slug)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 transition-colors text-left border-b border-slate-700/50 last:border-0"
                        >
                          <img
                            src={manhwa.image}
                            alt={manhwa.title}
                            className="w-12 h-16 object-cover rounded-lg shadow-md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">
                              {(manhwa.manhwaTitle || manhwa.title).replace(/^Komik\s+/i, '').replace(/\s+Bahasa Indonesia$/i, '').trim()}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {manhwa.genres?.slice(0, 2).join(', ')}
                            </p>
                          </div>
                        </button>
                      ))}
                      <div className="border-t border-slate-700 grid grid-cols-2">
                        <button onClick={handleSearch} className="p-3 text-center text-sm font-medium text-primary-400 hover:bg-slate-700/50 transition-colors">
                          Lihat semua →
                        </button>
                        <Link href="/pencarian" className="p-3 text-center text-sm font-medium text-primary-400 hover:bg-slate-700/50 border-l border-slate-700 transition-colors" onClick={() => { setSearchQuery(''); setSearchResults([]) }}>
                          Filter
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <svg className="w-12 h-12 mx-auto text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-slate-400 text-sm">Tidak ada hasil</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="lg:hidden p-2.5 hover:bg-slate-700/50 rounded-lg transition-all text-slate-300 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2.5 hover:bg-slate-700/50 rounded-lg transition-all text-slate-300 hover:text-white">
              {!isMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="lg:hidden py-4 border-t border-slate-700/50">
            <div className="relative">
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} type="text" placeholder="Cari manhwa..." className="w-full px-4 py-2.5 pl-10 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none" />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-700/50 space-y-1">
            {/* Auth Section for Mobile */}
            {user ? (
              <>
                <div className="px-4 py-3 bg-slate-800/50 rounded-lg mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{user.username || user.email?.split('@')[0]}</p>
                      <p className="text-slate-400 text-xs">{user.email}</p>
                    </div>
                  </div>
                </div>
                <Link href="/profile" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all" onClick={closeMenu}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profil
                </Link>
                <Link href="/bookmark" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all" onClick={closeMenu}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Bookmark
                </Link>
                <Link href="/history" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all" onClick={closeMenu}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Riwayat
                </Link>
                <div className="border-t border-slate-700 my-2"></div>
              </>
            ) : (
              <button
                onClick={() => {
                  setShowAuthModal(true)
                  setIsMenuOpen(false)
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all mb-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Masuk / Daftar
              </button>
            )}

            {/* Navigation Links */}
            {[
              { href: '/', label: 'Beranda', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { href: '/populer', label: 'Populer', icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' },
              { href: '/terbaru', label: 'Terbaru', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
              { href: '/pencarian', label: 'Pencarian', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }
            ].map(item => (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.href) ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}`} onClick={closeMenu}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            ))}

            {/* Logout Button for Mobile */}
            {user && (
              <button
                onClick={() => {
                  signOut()
                  setIsMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-slate-700/50 hover:text-red-300 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            )}
          </div>
        )}
      </nav>
    </header>

    {/* Auth Modal */}
    <AuthModal
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
    />
    </>
  )
}
