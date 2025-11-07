'use client'

import { useState } from 'react'
import { Chapter } from '@/types'
import DownloadOptionsModal, { DownloadOptions } from './DownloadOptionsModal'

interface DownloadAllChaptersButtonProps {
  manhwaSlug: string
  manhwaTitle: string
  chapters: Chapter[]
}

export default function DownloadAllChaptersButton({ 
  manhwaSlug, 
  manhwaTitle, 
  chapters 
}: DownloadAllChaptersButtonProps) {
  const [showOptions, setShowOptions] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{
    percent: number
    loadedMB: number
    totalMB: number
    currentFile: number
    totalFiles: number
  } | undefined>(undefined)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [downloadOptions, setDownloadOptions] = useState<DownloadOptions | null>(null)

  const handleDownloadAll = async () => {
    if (isDownloading || chapters.length === 0) return
    
    // Create new abort controller for this download
    const controller = new AbortController()
    setAbortController(controller)
    setIsDownloading(true)
    
    let successCount = 0
    let failedChapters: string[] = []
    
    try {
      // Import JSZip dynamically
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      
      // Get all chapter numbers sorted
      const chapterNumbers = chapters
        .map(ch => ch.number?.toString() || '')
        .filter(num => num)
        .sort((a, b) => parseFloat(a) - parseFloat(b))
      
      let totalEstimatedMB = 0
      let processedMB = 0
      
      // Estimate total size (avg 100KB per compressed image per chapter)
      chapters.forEach(chapter => {
        const estimatedChapterMB = 50 // Average 50MB per chapter PDF
        totalEstimatedMB += estimatedChapterMB
      })
      
      // Download each chapter and add to ZIP
      for (let i = 0; i < chapterNumbers.length; i++) {
        // Check if download was aborted
        if (controller.signal.aborted) {
          throw new Error('Download dihentikan oleh pengguna')
        }
        
        const chapterNumber = chapterNumbers[i]
        
        try {
          // Update progress
          setDownloadProgress({
            percent: ((i + 1) / chapterNumbers.length) * 100,
            loadedMB: processedMB,
            totalMB: totalEstimatedMB,
            currentFile: i + 1,
            totalFiles: chapterNumbers.length
          })
          
          // Generate PDF for this chapter
          const pdfBlob = await generateChapterPDF(chapterNumber, controller.signal)
          const estimatedChapterMB = totalEstimatedMB / chapterNumbers.length
          processedMB += estimatedChapterMB
          
          // Add to ZIP
          const fileName = `${manhwaTitle.replace(/[^a-z0-9]/gi, '_')}_Chapter_${chapterNumber}.pdf`
          zip.file(fileName, pdfBlob)
          successCount++
          
        } catch (error) {
          // Check if error is due to abort
          if (controller.signal.aborted) {
            throw new Error('Download dihentikan oleh pengguna')
          }
          
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          console.error(`❌ Chapter ${chapterNumber} gagal:`, errorMsg)
          failedChapters.push(chapterNumber)
          
          // Show user-friendly error for this chapter
          const shouldContinue = confirm(
            `⚠️ Chapter ${chapterNumber} Gagal\n\n` +
            `Error: ${errorMsg}\n\n` +
            `Progress: ${successCount}/${chapterNumbers.length} berhasil\n` +
            `Gagal: ${failedChapters.length} chapter\n\n` +
            `Lanjutkan download chapter lainnya?`
          )
          
          if (!shouldContinue) {
            throw new Error('Download dihentikan oleh pengguna')
          }
          
          // Continue with other chapters
        }
      }
      
      // Check if download was aborted before final step
      if (controller.signal.aborted) {
        throw new Error('Download dihentikan oleh pengguna')
      }
      
      // Check if we have any successful downloads
      if (successCount === 0) {
        alert(
          '❌ DOWNLOAD GAGAL\n\n' +
          'Tidak ada chapter yang berhasil didownload.\n\n' +
          'Silakan coba lagi atau hubungi admin.'
        )
        return
      }
      
      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${manhwaTitle.replace(/[^a-z0-9]/gi, '_')}_All_Chapters.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      // Show summary
      const successRate = Math.round((successCount / chapterNumbers.length) * 100)
      const summaryMsg = 
        '✅ DOWNLOAD SELESAI\n\n' +
        `Berhasil: ${successCount}/${chapterNumbers.length} chapter (${successRate}%)\n` +
        (failedChapters.length > 0 ? `Gagal: ${failedChapters.join(', ')}\n\n` : '\n') +
        `File ZIP telah didownload!`
      
      alert(summaryMsg)
      
    } catch (error) {
      if (error instanceof Error && error.message === 'Download dihentikan oleh pengguna') {
        console.log('Download stopped by user')
        alert(`Download dihentikan.\n\n${successCount} chapter berhasil didownload sebelum dibatalkan.`)
      } else {
        console.error('Download all chapters error:', error)
        alert(
          '❌ ERROR\n\n' +
          'Gagal mengunduh chapter.\n\n' +
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
          'Silakan coba lagi.'
        )
      }
    } finally {
      setIsDownloading(false)
      setDownloadProgress(undefined)
      setAbortController(null)
    }
  }

  const handleStop = () => {
    if (abortController) {
      abortController.abort()
      setIsDownloading(false)
      setDownloadProgress(undefined)
      setAbortController(null)
    }
  }

  const generateChapterPDF = async (chapterNumber: string, signal?: AbortSignal) => {
    // Import dynamically to avoid SSR issues
    const { generateChapterPDFBlob } = await import('@/lib/pdfMakeGenerator')
    const { getProxiedImageUrl } = await import('@/lib/imageProxy')
    
    // Check if aborted before making request
    if (signal?.aborted) {
      throw new Error('Download dihentikan oleh pengguna')
    }
    
    const response = await fetch(`/api/komiku/${manhwaSlug}/chapter/${chapterNumber}`, { signal })
    const data = await response.json()
    
    // Check if aborted after request
    if (signal?.aborted) {
      throw new Error('Download dihentikan oleh pengguna')
    }
    
    if (!data.success || !data.data.chapter) {
      throw new Error('Failed to fetch chapter data')
    }
    
    const chapter = data.data.chapter
    const images = chapter.images || []
    
    if (images.length === 0) {
      throw new Error('Chapter tidak memiliki gambar')
    }
    
    const proxiedImages = images.map((img: any) => {
      const originalUrl = typeof img === 'string' ? img : img.url
      return getProxiedImageUrl(originalUrl)
    })
    
    // Generate PDF blob
    return await generateChapterPDFBlob({
      manhwaTitle,
      chapterNumber,
      chapterTitle: chapter.title || `Chapter ${chapterNumber}`,
      images: proxiedImages
    }, () => {
      // Progress callback (not used for individual chapters in bulk download)
    })
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {isDownloading ? (
          <>
            {/* Stop Button */}
            <button
              onClick={handleStop}
              className="px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-900/30"
              title="Stop Download"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
              </svg>
              Stop
            </button>
            
            {/* Downloading Status */}
            <div className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm bg-slate-700/50 text-slate-300">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Downloading... {downloadProgress?.percent.toFixed(0)}%
            </div>
            
            {/* Download Info Badge */}
            {downloadOptions && (
              <div className="px-3 py-1.5 rounded-lg text-xs bg-slate-700/50 text-slate-300 font-medium">
                {downloadOptions.format.toUpperCase()} • {downloadOptions.quality}
              </div>
            )}
          </>
        ) : (
          <button
            onClick={() => setShowOptions(true)}
            disabled={chapters.length === 0}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm ${
              chapters.length === 0
                ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-900/30'
            }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span className="hidden sm:inline">Download All ({chapters.length})</span>
            <span className="sm:hidden">All ({chapters.length})</span>
          </button>
        )}
        
        {/* Progress Info */}
        {downloadProgress && (
          <div className="text-[10px] sm:text-xs text-slate-400">
            <span className="hidden sm:inline">{downloadProgress.currentFile}/{downloadProgress.totalFiles} files • </span>
            {downloadProgress.loadedMB.toFixed(1)}MB/{downloadProgress.totalMB.toFixed(1)}MB
          </div>
        )}
      </div>

      {/* Download Options Modal */}
      <DownloadOptionsModal
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        onDownload={(options) => {
          setDownloadOptions(options)
          setShowOptions(false)
          handleDownloadAll()
        }}
        chapterCount={chapters.length}
      />
    </>
  )
}
