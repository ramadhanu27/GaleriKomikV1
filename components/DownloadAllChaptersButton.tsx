'use client'

import { useState } from 'react'
import { Chapter } from '@/types'

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
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{
    percent: number
    loadedMB: number
    totalMB: number
    currentFile: number
    totalFiles: number
  } | undefined>(undefined)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const handleDownloadAll = async () => {
    if (isDownloading || chapters.length === 0) return
    
    // Create new abort controller for this download
    const controller = new AbortController()
    setAbortController(controller)
    setIsDownloading(true)
    
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
          
        } catch (error) {
          // Check if error is due to abort
          if (controller.signal.aborted) {
            throw new Error('Download dihentikan oleh pengguna')
          }
          console.error(`Error downloading chapter ${chapterNumber}:`, error)
          // Continue with other chapters even if one fails
        }
      }
      
      // Check if download was aborted before final step
      if (controller.signal.aborted) {
        throw new Error('Download dihentikan oleh pengguna')
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
      
    } catch (error) {
      if (error instanceof Error && error.message === 'Download dihentikan oleh pengguna') {
        console.log('Download stopped by user')
      } else {
        console.error('Download all chapters error:', error)
        alert('Gagal mengunduh semua chapter. Silakan coba lagi.')
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
        </>
      ) : (
        <button
          onClick={handleDownloadAll}
          disabled={chapters.length === 0}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm ${
            chapters.length === 0
              ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-900/30'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Download All ({chapters.length})
        </button>
      )}
      
      {/* Progress Info */}
      {downloadProgress && (
        <div className="text-xs text-slate-400">
          {downloadProgress.currentFile}/{downloadProgress.totalFiles} files • {downloadProgress.loadedMB.toFixed(1)}MB/{downloadProgress.totalMB.toFixed(1)}MB
        </div>
      )}
    </div>
  )
}
