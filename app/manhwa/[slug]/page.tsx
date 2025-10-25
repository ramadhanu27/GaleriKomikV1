'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getCover } from '@/lib/imageOptimizer'
import { getFlagByType, getCountryByType } from '@/lib/getFlagByType'
import { getProxiedImageUrl } from '@/lib/imageProxy'
import ChapterGrid from '@/components/ChapterGrid'
import RecommendedManhwa from '@/components/RecommendedManhwa'
import BookmarkButton from '@/components/BookmarkButton'
import AuthModal from '@/components/AuthModal'
import CommentSection from '@/components/CommentSection'

interface ManhwaDetail {
  title: string
  slug: string
  image: string
  url: string
  genres: string[]
  chapters: any[]
  totalChapters: number
  manhwaTitle?: string
  alternativeTitle?: string
  manhwaUrl?: string
  author?: string
  artist?: string
  type?: string
  status?: string
  released?: string
  synopsis?: string
}

export default function ManhwaDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [manhwa, setManhwa] = useState<ManhwaDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    fetchManhwaDetail()
  }, [slug])

  const fetchManhwaDetail = async () => {
    try {
      const response = await fetch(`/api/komiku/${slug}`)
      const data = await response.json()
      
      if (data.success) {
        setManhwa(data.data)
      }
    } catch (error) {
      console.error('Error fetching manhwa detail:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="py-8">
        <div className="container-custom">
          <div className="skeleton h-96 rounded-lg mb-8" />
          <div className="skeleton h-64 rounded-lg" />
        </div>
      </div>
    )
  }

  if (!manhwa) {
    return (
      <div className="py-8">
        <div className="container-custom">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Manhwa tidak ditemukan
            </h1>
            <Link href="/" className="btn-primary">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* Hero Section with Cover */}
        <div className="relative mb-8 rounded-2xl overflow-hidden">
          {/* Background Blur Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/98 to-slate-900"></div>
          <div 
            className="absolute inset-0 blur-3xl opacity-20"
            style={{
              backgroundImage: `url(${manhwa.image.includes('komiku.org') ? getProxiedImageUrl(manhwa.image) : getCover(manhwa.image)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          ></div>

          {/* Content */}
          <div className="relative p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Cover Image */}
              <div className="relative w-full md:w-64 lg:w-72 flex-shrink-0 mx-auto md:mx-0">
                <div className="relative rounded-xl overflow-hidden shadow-2xl ring-4 ring-slate-700/50">
                  <img
                    src={manhwa.image.includes('komiku.org') ? getProxiedImageUrl(manhwa.image) : getCover(manhwa.image)}
                    alt={manhwa.manhwaTitle || manhwa.title}
                    className="w-full h-auto object-cover"
                  />
                  
                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <img
                      src={getFlagByType(manhwa.type)}
                      alt={getCountryByType(manhwa.type)}
                      className="w-12 h-12 shadow-xl rounded-lg"
                    />
                    {manhwa.status && (
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-sm ${
                        manhwa.status.toLowerCase().includes('ongoing') 
                          ? 'bg-green-500/90 text-white' 
                          : manhwa.status.toLowerCase().includes('complete') || 
                            manhwa.status.toLowerCase().includes('completed') ||
                            manhwa.status.toLowerCase() === 'end'
                          ? 'bg-blue-500/90 text-white'
                          : 'bg-gray-500/90 text-white'
                      }`}>
                        {manhwa.status.toLowerCase().includes('ongoing') ? 'ONGOING' : 
                         manhwa.status.toLowerCase().includes('complete') || manhwa.status.toLowerCase() === 'end' ? 'COMPLETE' : 
                         manhwa.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Info Section */}
              <div className="flex-1 text-center md:text-left">
                {/* Title */}
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
                  {(manhwa.manhwaTitle || manhwa.title).replace(/^Komik\s+/i, '')}
                </h1>
                
                {manhwa.alternativeTitle && (
                  <p className="text-lg text-slate-300 mb-6 italic">
                    {manhwa.alternativeTitle}
                  </p>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {manhwa.author && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-xs text-slate-400 font-medium">Author</span>
                      </div>
                      <p className="font-semibold text-white text-sm truncate">{manhwa.author}</p>
                    </div>
                  )}
                  {manhwa.type && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-xs text-slate-400 font-medium">Type</span>
                      </div>
                      <p className="font-semibold text-white text-sm truncate">{manhwa.type}</p>
                    </div>
                  )}
                  {manhwa.status && (
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-slate-400 font-medium">Status</span>
                      </div>
                      <p className="font-semibold text-white text-sm truncate">{manhwa.status}</p>
                    </div>
                  )}
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="text-xs text-slate-400 font-medium">Chapters</span>
                    </div>
                    <p className="font-semibold text-white text-sm">{manhwa.totalChapters || manhwa.chapters?.length || 0}</p>
                  </div>
                </div>
                
                {/* Genres */}
                {manhwa.genres && manhwa.genres.length > 0 && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {manhwa.genres.slice(0, 8).map((genre: string) => (
                        <span
                          key={genre}
                          className="px-3 py-1.5 bg-primary-600/20 border border-primary-500/30 text-primary-300 text-xs font-medium rounded-full hover:bg-primary-600/30 transition-colors"
                        >
                          {genre}
                        </span>
                      ))}
                      {manhwa.genres.length > 8 && (
                        <span className="px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 text-slate-300 text-xs font-medium rounded-full">
                          +{manhwa.genres.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  {manhwa.chapters && manhwa.chapters.length > 0 && (
                    <>
                      <Link
                        href={`/manhwa/${slug}/chapter/${manhwa.chapters[0].number || manhwa.chapters[0].id || manhwa.chapters[0].chapter}`}
                        className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-lg transition-all shadow-lg shadow-primary-900/30 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Baca Chapter 1
                      </Link>
                      {manhwa.chapters.length > 1 && (
                        <Link
                          href={`/manhwa/${slug}/chapter/${manhwa.chapters[manhwa.chapters.length - 1].number}`}
                          className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all border border-slate-600/50 flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                          Chapter Terbaru
                        </Link>
                      )}
                    </>
                  )}
                  
                  {/* Bookmark Button */}
                  <BookmarkButton
                    manhwaSlug={slug}
                    manhwaTitle={manhwa.manhwaTitle || manhwa.title}
                    manhwaImage={manhwa.image}
                    manhwaType={manhwa.type}
                    onAuthRequired={() => setShowAuthModal(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Synopsis Section */}
        {manhwa.synopsis && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 mb-8 border border-slate-700/50">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Synopsis
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {manhwa.synopsis}
            </p>
          </div>
        )}

        {/* Chapter List Section */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 mb-8 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-7 h-7 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Daftar Chapter
          </h2>
          
          {manhwa.chapters && manhwa.chapters.length > 0 ? (
            <ChapterGrid chapters={manhwa.chapters} manhwaSlug={slug} />
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-slate-400">Belum ada chapter tersedia</p>
            </div>
          )}
        </div>

        {/* Comment Section */}
        <div className="mb-8">
          <CommentSection
            manhwaSlug={slug}
            onAuthRequired={() => setShowAuthModal(true)}
          />
        </div>

        {/* Recommended Manhwa */}
        <RecommendedManhwa currentManhwa={{ genres: manhwa.genres, slug: manhwa.slug }} />
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  )
}
