'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Manhwa } from '@/types'

interface HeroSliderProps {
  manhwaList: Manhwa[]
}

export default function HeroSlider({ manhwaList }: HeroSliderProps) {
  // Take top 5 manhwa for slider
  const slides = manhwaList.slice(0, 5)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  // Navigate to next slide
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  // Navigate to previous slide
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides.length])

  // Go to specific slide
  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return

    const interval = setInterval(() => {
      nextSlide()
    }, 5000) // 5 seconds

    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide, slides.length])

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextSlide()
    }
    if (isRightSwipe) {
      prevSlide()
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  if (slides.length === 0) {
    return null
  }

  return (
    <div 
      className="hero-slider-container mb-12 -mx-4 sm:mx-0 relative group"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative overflow-hidden">
        {slides.map((manhwa, index) => {
          // Get the latest chapter (first in array is usually the latest)
          const latestChapter = manhwa.chapters?.[0]
          const chapterNumber = latestChapter?.number || 'Latest'
          const chapterTitle = latestChapter?.title || ''
          
          return (
            <div 
              key={index} 
              className={`${index === currentSlide ? 'block' : 'hidden'} transition-all duration-500`}
            >
              <div className="relative h-[400px] md:h-[500px] rounded-none sm:rounded-2xl overflow-hidden">
                {/* Background Image with Blur */}
                <div className="absolute inset-0">
                  <img 
                    src={manhwa.image} 
                    alt={manhwa.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/40"></div>
                  <div className="absolute inset-0 backdrop-blur-md"></div>
                </div>

                {/* Content */}
                <div className="relative h-full container-custom flex items-center">
                  <div className="max-w-xl lg:max-w-2xl text-white z-10 pr-4">
                    <div className="text-sm font-semibold mb-3 text-white/90">
                      Chapter: {chapterNumber}
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 animate-fade-in line-clamp-2 leading-tight">
                      {(manhwa.manhwaTitle || manhwa.title).replace(/^Komik\s+/i, '')}
                    </h1>
                    <p className="text-sm md:text-base text-white/80 mb-4 line-clamp-3 leading-relaxed">
                      {manhwa.synopsis || 'Pedang teman terdekat dan ajudan tepercaya menusuk tubuhku ...Ketika saya membuka mata saya lagi, saya telah menjadi seorang wanita bangsawan dari kerajaan musuh. Dalam tubuh orang asing yang tidak'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {manhwa.genres?.slice(0, 5).map((genre, i) => (
                        <span key={i} className="px-3 py-1.5 border border-white/30 backdrop-blur-sm rounded text-xs font-medium text-white/90 hover:bg-white/10 transition-colors">
                          {genre}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <Link
                        href={`/manhwa/${manhwa.slug}`}
                        className="px-6 py-3 bg-yellow-400 text-black rounded font-bold hover:bg-yellow-300 transition-colors shadow-lg flex items-center gap-2 text-sm md:text-base"
                      >
                        Start Reading
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>

                  {/* Manhwa Cover Image - Positioned on Right */}
                  <div className="hidden lg:block absolute right-8 xl:right-16 top-1/2 -translate-y-1/2">
                    <div className="w-56 xl:w-72 h-72 xl:h-96 relative shadow-2xl rounded-lg overflow-hidden transform hover:scale-105 transition-transform">
                      <img 
                        src={manhwa.image} 
                        alt={manhwa.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Navigation */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all ${
                index === currentSlide
                  ? 'w-10 h-3 bg-white'
                  : 'w-3 h-3 bg-white/40 hover:bg-white/70'
              } rounded-full`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  )
}