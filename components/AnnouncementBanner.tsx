'use client'

import { useState, useEffect } from 'react'

interface Announcement {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'update'
  date: string
  icon?: string
}

export default function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [announcements] = useState<Announcement[]>([
    {
      id: 'update-2025-10-28',
      title: '🚀 Sekarang bisa download Chapter!',
      message: 'Fitur baru telah hadir! Kini kamu bisa langsung mengunduh chapter favoritmu untuk dibaca secara offline. Coba sekarang dan nikmati pengalaman membaca tanpa koneksi internet!',
      type: 'success',
      date: '28 Oktober 2025'
    }, 
    {
      id: 'update-2025-10-29',
      title: '📦 Download Berhasil!',
      message: 'Chapter yang kamu pilih sudah diunduh dalam satu file ZIP. Selamat membaca!',
      type: 'success',
      date: '29 Oktober 2025'
    }
  ])

  useEffect(() => {
    // Check if user has dismissed this announcement
    const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]')
    const hasUndismissed = announcements.some(ann => !dismissedAnnouncements.includes(ann.id))
    setIsVisible(hasUndismissed)
  }, [])

  const handleDismiss = (announcementId: string) => {
    const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]')
    dismissedAnnouncements.push(announcementId)
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(dismissedAnnouncements))
    
    // Check if there are more announcements
    const hasMore = announcements.some(ann => !dismissedAnnouncements.includes(ann.id))
    if (!hasMore) {
      setIsVisible(false)
    }
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'from-green-600/20 to-emerald-600/20 border-green-500/50'
      case 'warning':
        return 'from-amber-600/20 to-orange-600/20 border-amber-500/50'
      case 'update':
        return 'from-blue-600/20 to-cyan-600/20 border-blue-500/50'
      default:
        return 'from-primary-600/20 to-primary-700/20 border-primary-500/50'
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-400'
      case 'warning':
        return 'text-amber-400'
      case 'update':
        return 'text-blue-400'
      default:
        return 'text-primary-400'
    }
  }

  if (!isVisible) return null

  const dismissedAnnouncements = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]')
  const visibleAnnouncements = announcements.filter(ann => !dismissedAnnouncements.includes(ann.id))

  if (visibleAnnouncements.length === 0) return null

  return (
    <div className="mb-8 space-y-4">
      {visibleAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className={`bg-gradient-to-r ${getTypeStyles(announcement.type)} border rounded-xl p-6 relative overflow-hidden`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>
          </div>

          {/* Content */}
          <div className="relative flex items-start gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 w-12 h-12 ${getIconColor(announcement.type)} bg-white/10 rounded-lg flex items-center justify-center`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {announcement.type === 'update' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                ) : announcement.type === 'success' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : announcement.type === 'warning' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-xl font-bold text-white">
                  {announcement.title}
                </h3>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDismiss(announcement.id)
                  }}
                  className="relative z-10 flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                  aria-label="Tutup"
                  type="button"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed mb-3">
                {announcement.message}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {announcement.date}
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
        </div>
      ))}
    </div>
  )
}
