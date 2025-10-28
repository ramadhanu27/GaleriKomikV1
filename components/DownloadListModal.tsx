'use client'

import { useState, useEffect } from 'react'

interface DownloadFile {
  id: string
  name: string
  type: 'PDF' | 'ZIP' | 'CBZ'
  size: string
  url: string
  uploadedAt?: string
}

interface DownloadListModalProps {
  isOpen: boolean
  onClose: () => void
  manhwaTitle: string
  chapterNumber: string
  chapterTitle?: string
  downloads?: DownloadFile[]
  onDownloadPDF?: () => Promise<void>
}

export default function DownloadListModal({
  isOpen,
  onClose,
  manhwaTitle,
  chapterNumber,
  chapterTitle,
  downloads = [],
  onDownloadPDF
}: DownloadListModalProps) {
  const [isDownloading, setIsDownloading] = useState<string | null>(null)

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleDownload = async (file: DownloadFile) => {
    setIsDownloading(file.id)
    try {
      // If PDF and callback provided, use PDF generator
      if (file.type === 'PDF' && onDownloadPDF) {
        await onDownloadPDF()
      } else if (file.url && file.url !== '#') {
        // Regular file download
        const link = document.createElement('a')
        link.href = file.url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      setTimeout(() => {
        setIsDownloading(null)
      }, 1500)
    } catch (error) {
      console.error('Download error:', error)
      alert('Gagal mengunduh file. Silakan coba lagi.')
      setIsDownloading(null)
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return (
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      case 'ZIP':
      case 'CBZ':
        return (
          <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-2xl max-h-[85vh] overflow-hidden pointer-events-auto animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="pr-12">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Daftar Download
              </h2>
              <p className="text-slate-200 text-sm">
                {manhwaTitle} - Chapter {chapterNumber}
              </p>
              {chapterTitle && (
                <p className="text-slate-300 text-xs mt-1 italic">
                  {chapterTitle}
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
            {downloads.length > 0 ? (
              <div className="space-y-3">
                {downloads.map((file) => (
                  <div
                    key={file.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-primary-500/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {/* File Icon */}
                      <div className="flex-shrink-0">
                        {getFileIcon(file.type)}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate group-hover:text-primary-400 transition-colors">
                          {file.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                            {file.type}
                          </span>
                          <span className="text-xs text-slate-400">
                            {file.size}
                          </span>
                          {file.uploadedAt && (
                            <span className="text-xs text-slate-500">
                              {file.uploadedAt}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Download Button */}
                      <button
                        onClick={() => handleDownload(file)}
                        disabled={isDownloading === file.id}
                        className="flex-shrink-0 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                      >
                        {isDownloading === file.id ? (
                          <>
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="hidden sm:inline">Downloading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="hidden sm:inline">Download</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Empty State
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-700/50 mb-4">
                  <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Belum Tersedia untuk Diunduh
                </h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  File download untuk chapter ini belum tersedia. Silakan coba lagi nanti atau hubungi admin untuk informasi lebih lanjut.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-800/50 border-t border-slate-700 p-4 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {downloads.length > 0 ? `${downloads.length} file tersedia` : 'Tidak ada file'}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
