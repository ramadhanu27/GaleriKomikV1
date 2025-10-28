'use client'

import { useState } from 'react'
import { generateChapterPDF, openChapterPDF } from '@/lib/pdfMakeGenerator'

interface DownloadChapterButtonProps {
  manhwaTitle: string
  chapterNumber: string
  chapterTitle?: string
  images: string[]
  className?: string
}

export default function DownloadChapterButton({
  manhwaTitle,
  chapterNumber,
  chapterTitle,
  images,
  className = ''
}: DownloadChapterButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' })
  const [showOptions, setShowOptions] = useState(false)

  const handleDownload = async () => {
    if (isGenerating) return
    
    setIsGenerating(true)
    setShowOptions(false)
    
    try {
      await generateChapterPDF(
        {
          manhwaTitle,
          chapterNumber,
          chapterTitle,
          images
        },
        (current, total, status) => {
          setProgress({ current, total, status })
        }
      )
      
      // Reset after a delay
      setTimeout(() => {
        setIsGenerating(false)
        setProgress({ current: 0, total: 0, status: '' })
      }, 2000)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Gagal membuat PDF. Silakan coba lagi.')
      setIsGenerating(false)
      setProgress({ current: 0, total: 0, status: '' })
    }
  }

  const handleOpenPDF = async () => {
    if (isGenerating) return
    
    setIsGenerating(true)
    setShowOptions(false)
    
    try {
      await openChapterPDF(
        {
          manhwaTitle,
          chapterNumber,
          chapterTitle,
          images
        },
        (current, total, status) => {
          setProgress({ current, total, status })
        }
      )
      
      setTimeout(() => {
        setIsGenerating(false)
        setProgress({ current: 0, total: 0, status: '' })
      }, 2000)
      
    } catch (error) {
      console.error('Error opening PDF:', error)
      alert('Gagal membuka PDF. Silakan coba lagi.')
      setIsGenerating(false)
      setProgress({ current: 0, total: 0, status: '' })
    }
  }

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isGenerating}
        className={className || `flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all shadow-lg ${
          isGenerating 
            ? 'bg-slate-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
        } text-white`}
        title="Download Chapter as PDF"
      >
        {isGenerating ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="hidden sm:inline font-medium">
              {progress.status || 'Memproses...'}
            </span>
            {progress.total > 0 && (
              <span className="text-xs">
                ({progress.current}/{progress.total})
              </span>
            )}
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline font-medium">Download PDF</span>
          </>
        )}
      </button>

      {/* Dropdown Options */}
      {showOptions && !isGenerating && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowOptions(false)}
          />
          
          {/* Options Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50 overflow-hidden">
            <button
              onClick={handleDownload}
              className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors flex items-center gap-3 text-white"
            >
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <div>
                <div className="font-medium">Download PDF</div>
                <div className="text-xs text-slate-400">Simpan ke perangkat</div>
              </div>
            </button>
            
            <button
              onClick={handleOpenPDF}
              className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors flex items-center gap-3 text-white border-t border-slate-700"
            >
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <div>
                <div className="font-medium">Buka PDF</div>
                <div className="text-xs text-slate-400">Lihat di tab baru</div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Progress Bar (when generating) */}
      {isGenerating && progress.total > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-lg p-3 shadow-xl border border-slate-700 z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white font-medium">{progress.status}</span>
            <span className="text-xs text-slate-400">
              {Math.round((progress.current / progress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-red-500 to-orange-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
