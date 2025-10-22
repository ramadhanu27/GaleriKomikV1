'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getCover } from '@/lib/imageOptimizer'
import ChapterGrid from '@/components/ChapterGrid'
import RecommendedManhwa from '@/components/RecommendedManhwa'

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
        {/* Header */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative w-full md:w-72 flex-shrink-0">
              <img
                src={manhwa.image.includes('komiku.org') ? manhwa.image : getCover(manhwa.image)}
                alt={manhwa.manhwaTitle || manhwa.title}
                className="w-full h-auto object-contain rounded-lg shadow-lg"
              />
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {/* Korea Badge */}
                <img
                  src="/korea.png"
                  alt="Korea"
                  className="w-12 h-12 shadow-lg"
                />
                
                {/* Status Badge */}
                {manhwa.status && (
                  <span className={`text-xs font-bold px-3 py-1 rounded shadow-lg ${
                    manhwa.status.toLowerCase().includes('ongoing') 
                      ? 'bg-green-500 text-white' 
                      : manhwa.status.toLowerCase().includes('complete') || 
                        manhwa.status.toLowerCase().includes('completed') ||
                        manhwa.status.toLowerCase() === 'end'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-500 text-white'
                  }`}>
                    {manhwa.status.toLowerCase().includes('ongoing') ? 'ONGOING' : 
                     manhwa.status.toLowerCase().includes('complete') || manhwa.status.toLowerCase() === 'end' ? 'COMPLETE' : 
                     manhwa.status.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {(manhwa.manhwaTitle || manhwa.title).replace(/^Komik\s+/i, '')}
              </h1>
              
              {manhwa.alternativeTitle && (
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                  {manhwa.alternativeTitle}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                {manhwa.author && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Author:</span>
                    <p className="font-semibold text-gray-900 dark:text-white">{manhwa.author}</p>
                  </div>
                )}
                {manhwa.type && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Type:</span>
                    <p className="font-semibold text-gray-900 dark:text-white">{manhwa.type}</p>
                  </div>
                )}
                {manhwa.status && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                    <p className="font-semibold text-gray-900 dark:text-white">{manhwa.status}</p>
                  </div>
                )}
                {manhwa.released && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Usia:</span>
                    <p className="font-semibold text-gray-900 dark:text-white">{manhwa.released}</p>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Genre:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {manhwa.genres?.map((genre: string) => (
                    <Link
                      key={genre}
                      href={`/genre/${genre.toLowerCase().replace(/ /g, '-')}`}
                      className="badge hover:bg-primary-600 hover:text-white transition-colors cursor-pointer"
                    >
                      {genre}
                    </Link>
                  ))}
                </div>
              </div>

              {manhwa.synopsis && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Synopsis:
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                    {manhwa.synopsis}
                  </p>
                </div>
              )}

              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-400">
                  Total Chapter: <span className="font-semibold">{manhwa.totalChapters || manhwa.chapters?.length || 0}</span>
                </p>
              </div>

              <div className="flex gap-4">
                {manhwa.chapters && manhwa.chapters.length > 0 && (
                  <Link
                    href={`/manhwa/${slug}/chapter/${manhwa.chapters[0].number || manhwa.chapters[0].id || manhwa.chapters[0].chapter}`}
                    className="btn-primary"
                  >
                    Baca Chapter 1
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Grid */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            📖 Daftar Chapter
          </h2>
          
          {manhwa.chapters && manhwa.chapters.length > 0 ? (
            <ChapterGrid chapters={manhwa.chapters} manhwaSlug={slug} />
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              Belum ada chapter tersedia
            </p>
          )}
        </div>

        {/* Recommended Manhwa */}
        <RecommendedManhwa currentManhwa={{ genres: manhwa.genres, slug: manhwa.slug }} />
      </div>
    </div>
  )
}
