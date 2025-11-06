'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface DownloadOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  onDownload: (options: DownloadOptions) => void
  chapterCount: number
}

export interface DownloadOptions {
  format: 'pdf' | 'cbz' | 'images'
  quality: 'low' | 'medium' | 'high' | 'original'
  pageLayout: 'single' | 'double'
  includeMetadata: boolean
  compressZip: boolean
}

export default function DownloadOptionsModal({
  isOpen,
  onClose,
  onDownload,
  chapterCount
}: DownloadOptionsModalProps) {
  const [options, setOptions] = useState<DownloadOptions>({
    format: 'pdf',
    quality: 'medium',
    pageLayout: 'single',
    includeMetadata: true,
    compressZip: true
  })

  const qualityInfo = {
    low: { size: '~2MB', desc: 'Hemat kuota, kualitas standar' },
    medium: { size: '~5MB', desc: 'Seimbang antara ukuran & kualitas' },
    high: { size: '~10MB', desc: 'Kualitas tinggi, ukuran besar' },
    original: { size: '~20MB+', desc: 'Kualitas asli, ukuran sangat besar' }
  }

  const formatInfo = {
    pdf: { icon: '📄', desc: 'Universal, mudah dibaca di semua device' },
    cbz: { icon: '📚', desc: 'Comic Book Archive, untuk comic reader apps' },
    images: { icon: '🖼️', desc: 'Folder berisi gambar JPG/PNG' }
  }

  const handleDownload = () => {
    onDownload(options)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 sm:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-white">Download Options</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {chapterCount} chapter{chapterCount > 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">
              📦 Format File
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(Object.keys(formatInfo) as Array<keyof typeof formatInfo>).map((format) => (
                <button
                  key={format}
                  onClick={() => setOptions({ ...options, format })}
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all text-left ${
                    options.format === format
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-700/30'
                  }`}
                >
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{formatInfo[format].icon}</div>
                  <div className="text-xs sm:text-sm font-semibold text-white uppercase mb-0.5 sm:mb-1">
                    {format}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400 line-clamp-2">
                    {formatInfo[format].desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">
              ⚡ Kualitas Gambar
            </label>
            <div className="space-y-2">
              {(Object.keys(qualityInfo) as Array<keyof typeof qualityInfo>).map((quality) => (
                <button
                  key={quality}
                  onClick={() => setOptions({ ...options, quality })}
                  className={`w-full p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all text-left ${
                    options.quality === quality
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-white capitalize mb-0.5 sm:mb-1">
                        {quality}
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-400 line-clamp-1">
                        {qualityInfo[quality].desc}
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-xs font-mono text-slate-300 bg-slate-700 px-2 sm:px-3 py-1 rounded-lg whitespace-nowrap">
                      {qualityInfo[quality].size}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* PDF-specific Options */}
          {options.format === 'pdf' && (
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">
                📖 Layout Halaman
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={() => setOptions({ ...options, pageLayout: 'single' })}
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
                    options.pageLayout === 'single'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-700/30'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-semibold text-white mb-0.5 sm:mb-1">Single Page</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">1 gambar per halaman</div>
                </button>
                <button
                  onClick={() => setOptions({ ...options, pageLayout: 'double' })}
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all ${
                    options.pageLayout === 'double'
                      ? 'border-red-500 bg-red-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-700/30'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-semibold text-white mb-0.5 sm:mb-1">Double Page</div>
                  <div className="text-[10px] sm:text-xs text-slate-400">2 gambar per halaman</div>
                </button>
              </div>
            </div>
          )}

          {/* Additional Options */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">
              ⚙️ Opsi Tambahan
            </label>
            <div className="space-y-2 sm:space-y-3">
              <label className="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-slate-700 hover:border-slate-600 bg-slate-700/30 cursor-pointer transition-all">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="text-xs sm:text-sm font-semibold text-white mb-0.5 sm:mb-1">
                    Include Metadata
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400 line-clamp-1">
                    Tambahkan info judul, chapter, tanggal
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={options.includeMetadata}
                  onChange={(e) => setOptions({ ...options, includeMetadata: e.target.checked })}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-600 text-red-500 focus:ring-red-500 focus:ring-offset-slate-800 flex-shrink-0"
                />
              </label>

              {chapterCount > 1 && (
                <label className="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-slate-700 hover:border-slate-600 bg-slate-700/30 cursor-pointer transition-all">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="text-xs sm:text-sm font-semibold text-white mb-0.5 sm:mb-1">
                      Compress ZIP
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-400 line-clamp-1">
                      Kurangi ukuran file ZIP (lebih lama)
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={options.compressZip}
                    onChange={(e) => setOptions({ ...options, compressZip: e.target.checked })}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-600 text-red-500 focus:ring-red-500 focus:ring-offset-slate-800 flex-shrink-0"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Estimated Size */}
          <div className="bg-slate-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-slate-600">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs sm:text-sm text-slate-300">
                <span className="font-semibold">Estimasi Ukuran:</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-white">
                ~{(chapterCount * parseInt(qualityInfo[options.quality].size.match(/\d+/)?.[0] || '5')).toFixed(0)} MB
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-4 sm:p-6 flex items-center justify-between gap-2 sm:gap-4">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-base text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 sm:flex-initial px-4 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-base bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg shadow-red-900/30 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Download Sekarang</span>
            <span className="sm:hidden">Download</span>
          </button>
        </div>
      </div>
    </div>
  )
}
