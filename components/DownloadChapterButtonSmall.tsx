'use client'

import { useState } from 'react'
import { generateChapterPDF } from '@/lib/pdfMakeGenerator'
import DownloadListModal from './DownloadListModal'

interface DownloadChapterButtonSmallProps {
  manhwaSlug: string
  manhwaTitle: string
  chapterNumber: string
  chapterTitle?: string
  onClick?: (e: React.MouseEvent) => void
}

export default function DownloadChapterButtonSmall({
  manhwaSlug,
  manhwaTitle,
  chapterNumber,
  chapterTitle,
  onClick
}: DownloadChapterButtonSmallProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showModal, setShowModal] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isGenerating) return
    
    if (onClick) {
      onClick(e)
    }
    
    // Open modal instead of direct download
    setShowModal(true)
  }

  const handleDirectPDFDownload = async () => {
    setIsGenerating(true)
    setShowModal(false)
    
    try {
      // Fetch chapter data
      const response = await fetch(`/api/komiku/${manhwaSlug}/chapter/${chapterNumber}`)
      const data = await response.json()
      
      if (!data.success || !data.data.chapter) {
        throw new Error('Failed to fetch chapter data')
      }
      
      const chapter = data.data.chapter
      const images = chapter.images || []
      
      if (images.length === 0) {
        alert('Chapter ini tidak memiliki gambar')
        setIsGenerating(false)
        return
      }
      
      // Import getProxiedImageUrl dynamically
      const { getProxiedImageUrl } = await import('@/lib/imageProxy')
      
      // Convert images to proxied URLs
      const proxiedImages = images.map((img: any) => {
        const originalUrl = typeof img === 'string' ? img : img.url
        return getProxiedImageUrl(originalUrl)
      })
      
      // Generate PDF
      await generateChapterPDF(
        {
          manhwaTitle,
          chapterNumber,
          chapterTitle: chapterTitle || chapter.title,
          images: proxiedImages
        },
        (current, total, status) => {
          setProgress(Math.round((current / total) * 100))
        }
      )
      
      setTimeout(() => {
        setIsGenerating(false)
        setProgress(0)
      }, 1500)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Gagal membuat PDF. Silakan coba lagi.')
      setIsGenerating(false)
      setProgress(0)
    }
  }

  // Mock download files - in production, fetch from API
  const downloadFiles = [
    {
      id: '1',
      name: `${manhwaTitle}_Ch${chapterNumber}.pdf`,
      type: 'PDF' as const,
      size: '15.2 MB',
      url: '#', // Will be generated on demand
      uploadedAt: 'Baru saja'
    }
  ]

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isGenerating}
        className={`p-2 rounded-lg transition-all ${
          isGenerating 
            ? 'bg-slate-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
        } shadow-lg`}
        title={isGenerating ? `Downloading... ${progress}%` : 'Download Chapter'}
      >
        {isGenerating ? (
          <div className="relative w-5 h-5">
            <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {progress > 0 && (
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-white whitespace-nowrap">
                {progress}%
              </span>
            )}
          </div>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
      </button>

      {/* Download List Modal */}
      <DownloadListModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        manhwaTitle={manhwaTitle}
        chapterNumber={chapterNumber}
        chapterTitle={chapterTitle}
        downloads={downloadFiles}
        onDownloadPDF={handleDirectPDFDownload}
      />
    </>
  )
}
