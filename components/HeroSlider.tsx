'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Manhwa } from '@/types'

declare global {
  interface Window {
    $: any;
    jQuery: any;
  }
}

interface HeroSliderProps {
  manhwaList: Manhwa[]
}

export default function HeroSlider({ manhwaList }: HeroSliderProps) {
  // Take top 5 manhwa for slider
  const slides = manhwaList.slice(0, 5)
  useEffect(() => {
    // Wait for jQuery and Owl Carousel to load
    const initCarousel = () => {
      if (typeof window !== 'undefined' && window.$ && window.$.fn.owlCarousel) {
        const $ = window.$
        
        $('.hero-slider').owlCarousel({
          items: 1,
          loop: true,
          autoplay: true,
          autoplayTimeout: 5000,
          autoplayHoverPause: true,
          nav: true,
          dots: true,
          navText: [
            '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>',
            '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>'
          ],
          animateOut: 'fadeOut',
          animateIn: 'fadeIn',
          smartSpeed: 1000,
          responsive: {
            0: {
              nav: false
            },
            768: {
              nav: true
            }
          }
        })
      }
    }

    // Try to initialize immediately
    initCarousel()

    // Fallback: try again after a delay
    const timer = setTimeout(initCarousel, 500)

    return () => clearTimeout(timer)
  }, [])

  if (slides.length === 0) {
    return null
  }

  return (
    <div className="hero-slider-container mb-12 -mx-4 sm:mx-0">
      <div className="owl-carousel owl-theme hero-slider">
        {slides.map((manhwa, index) => {
          // Get the latest chapter (first in array is usually the latest)
          const latestChapter = manhwa.chapters?.[0]
          const chapterNumber = latestChapter?.number || 'Latest'
          const chapterTitle = latestChapter?.title || ''
          
          return (
            <div key={index} className="item">
              <div className="relative h-[400px] md:h-[500px] rounded-none sm:rounded-2xl overflow-hidden">
                {/* Background Image with Blur */}
                <div className="absolute inset-0">
                  <img 
                    src={manhwa.image} 
                    alt={manhwa.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent"></div>
                  <div className="absolute inset-0 backdrop-blur-sm"></div>
                </div>

                {/* Content */}
                <div className="relative h-full container-custom flex items-center">
                  <div className="max-w-2xl text-white z-10">
                    <div className="text-sm font-semibold mb-2 text-yellow-400">
                      {manhwa.chapters && manhwa.chapters.length > 0 ? (
                        <>Chapter {chapterNumber}{chapterTitle && `: ${chapterTitle}`}</>
                      ) : (
                        'New Release'
                      )}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in line-clamp-2">
                      {(manhwa.manhwaTitle || manhwa.title).replace(/^Komik\s+/i, '')}
                    </h1>
                    <p className="text-base md:text-lg opacity-90 mb-2 line-clamp-3">
                      {manhwa.synopsis || 'Baca manhwa seru dengan chapter terbaru yang selalu update setiap hari. Nikmati cerita menarik dengan kualitas terbaik.'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {manhwa.genres?.slice(0, 3).map((genre, i) => (
                        <span key={i} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                          {genre}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <Link
                        href={`/manhwa/${manhwa.slug}`}
                        className="px-6 py-3 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-400 transition-colors shadow-lg flex items-center gap-2"
                      >
                        Start Reading →
                      </Link>
                    </div>
                  </div>

                  {/* Manhwa Cover Image */}
                  <div className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2">
                    <div className="w-64 h-80 relative shadow-2xl rounded-lg overflow-hidden transform hover:scale-105 transition-transform">
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

      <style jsx global>{`
        .hero-slider .owl-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 100%;
          display: flex;
          justify-content: space-between;
          padding: 0 20px;
          pointer-events: none;
        }

        .hero-slider .owl-nav button {
          pointer-events: all;
          background: rgba(255, 255, 255, 0.2) !important;
          backdrop-filter: blur(10px);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white !important;
          transition: all 0.3s;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .hero-slider .owl-nav button:hover {
          background: rgba(255, 255, 255, 0.3) !important;
          transform: scale(1.1);
        }

        .hero-slider .owl-dots {
          position: absolute;
          bottom: 20px;
          width: 100%;
          text-align: center;
        }

        .hero-slider .owl-dot {
          display: inline-block;
          margin: 0 5px;
        }

        .hero-slider .owl-dot span {
          display: block;
          width: 12px;
          height: 12px;
          background: rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          transition: all 0.3s;
          border: 2px solid transparent;
        }

        .hero-slider .owl-dot.active span {
          background: white;
          width: 40px;
          border-radius: 10px;
        }

        .hero-slider .owl-dot:hover span {
          background: rgba(255, 255, 255, 0.7);
        }

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
