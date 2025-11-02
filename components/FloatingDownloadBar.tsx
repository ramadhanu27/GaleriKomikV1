'use client'

import { useState, useEffect } from 'react'

interface DownloadProgress {
  percent: number
  loadedMB: number
  totalMB: number
  currentFile?: number
  totalFiles?: number
}

interface FloatingDownloadBarProps {
  selectedCount: number
  onCancel: () => void
  onStop?: () => void
  onDownload: () => void
  isDownloading?: boolean
  estimatedSize?: string
  downloadProgress?: DownloadProgress
}

export default function FloatingDownloadBar({
  selectedCount,
  onCancel,
  onStop,
  onDownload,
  isDownloading = false,
  estimatedSize = 'Menghitung...',
  downloadProgress
}: FloatingDownloadBarProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (selectedCount > 0) {
      // Delay untuk smooth animation
      setTimeout(() => setIsVisible(true), 100)
    } else {
      setIsVisible(false)
    }
  }, [selectedCount])

  const handleCancel = () => {
    onCancel()
  }

  const handleStop = () => {
    if (onStop) {
      onStop()
    }
  }

  // Get progress values from downloadProgress or use defaults
  const progress = downloadProgress?.percent || 0
  const downloadedSize = downloadProgress?.loadedMB || 0
  const totalSize = downloadProgress?.totalMB || 0
  const currentFile = downloadProgress?.currentFile || 0
  const totalFiles = downloadProgress?.totalFiles || selectedCount

  if (selectedCount === 0) return null

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      <div className="bg-[#1E293B] border-2 border-[#DC2626] text-white px-6 py-4 rounded-2xl shadow-2xl w-[90vw] max-w-2xl backdrop-blur-xl">
        {/* Main Content */}
        <div className="flex items-center justify-between mb-3">
          {/* Left Side - Info */}
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-[#DC2626] flex items-center justify-center ${isDownloading ? 'animate-pulse' : ''}`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>

            {/* Text Info */}
            <div>
              <p className="text-base font-bold text-white">
                {selectedCount} Chapter Terpilih
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {isDownloading 
                  ? 'Mengunduh...' 
                  : selectedCount === 1 
                    ? 'Akan diunduh sebagai PDF' 
                    : 'Akan digabung dalam ZIP'
                }
              </p>
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center gap-3">
            {/* Cancel Button */}
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5 px-3 py-2 hover:bg-slate-700/50 rounded-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="hidden sm:inline">Batal</span>
            </button>

            {/* Download Button */}
            {!isDownloading && (
              <button
                onClick={onDownload}
                className="bg-[#DC2626] hover:bg-[#B91C1C] px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Sekarang</span>
              </button>
            )}

            {/* Downloading Status */}
            {isDownloading && (
              <div className="flex items-center gap-2">
                <div className="bg-[#DC2626] px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Mengunduh...</span>
                </div>
                
                {/* Stop Button */}
                {onStop && (
                  <button
                    onClick={handleStop}
                    className="bg-orange-600 hover:bg-orange-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    title="Stop Download"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                    </svg>
                    <span className="hidden sm:inline">Stop</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar Section (shown when downloading) */}
        {isDownloading && (
          <div className="space-y-2">
            {/* Progress Info */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {currentFile > 0 ? `Memproses file ${currentFile}/${totalFiles}...` : 'Memproses chapter...'}
              </span>
              <span className="text-white font-semibold">
                {totalSize > 0 
                  ? `${downloadedSize.toFixed(1)} MB / ${totalSize.toFixed(1)} MB`
                  : `${downloadedSize.toFixed(1)} MB / ?? MB`
                }
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-[#DC2626] to-[#EF4444] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>

            {/* File Count & Percentage */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{totalFiles} file</span>
              <span className="font-semibold text-white">{progress.toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
