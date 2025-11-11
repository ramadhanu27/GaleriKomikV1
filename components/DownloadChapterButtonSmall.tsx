'use client'

import { useState } from 'react'

interface DownloadChapterButtonSmallProps {
  manhwaSlug: string
  manhwaTitle: string
  chapterNumber: string
  chapterTitle?: string
  onClick?: (e: React.MouseEvent) => void
  onModalStateChange?: (isOpen: boolean) => void
}

export default function DownloadChapterButtonSmall({
  manhwaSlug,
  manhwaTitle,
  chapterNumber,
  chapterTitle,
  onClick,
  onModalStateChange
}: DownloadChapterButtonSmallProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    
    if (isGenerating) return
    
    if (onClick) {
      onClick(e)
      return
    }
    
    // Direct download without modal/panel
    handleDirectPDFDownload()
  }

  const handleDirectPDFDownload = async () => {
    try {
      setIsGenerating(true)
      setProgress(5)
      
      console.log('🚀 Starting server-side PDF download...')
      
      // Get Supabase public URL for chapter JSON
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'komiku-data'
      const jsonUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/Chapter/komiku/${manhwaSlug}.json`
      
      console.log(`📥 Fetching chapter JSON from: ${jsonUrl}`)
      setProgress(10)
      
      // Fetch manhwa JSON directly from Supabase
      const jsonResponse = await fetch(jsonUrl)
      
      if (!jsonResponse.ok) {
        console.error(`❌ Failed to fetch JSON: ${jsonResponse.status} ${jsonResponse.statusText}`)
        throw new Error(`Manhwa data not found (${jsonResponse.status})`)
      }
      
      const manhwaData = await jsonResponse.json()
      console.log(`✅ Manhwa data loaded: ${manhwaData.manhwaTitle || manhwaData.title}`)
      
      // Find specific chapter
      const chapters = manhwaData.chapters || []
      const chapter = chapters.find((ch: any) => ch.number?.toString() === chapterNumber.toString())
      
      if (!chapter) {
        console.error(`❌ Chapter ${chapterNumber} not found in JSON`)
        throw new Error(`Chapter ${chapterNumber} tidak ditemukan di file JSON`)
      }
      
      console.log(`✅ Found chapter: ${chapter.title || `Chapter ${chapterNumber}`}`)
      
      const images = chapter.images || []
      
      if (images.length === 0) {
        throw new Error('Chapter ini tidak memiliki gambar')
      }
      
      console.log(`🖼️  Found ${images.length} images for chapter ${chapterNumber}`)
      setProgress(30)
      
      // Extract image URLs from objects
      const imageUrls = images.map((img: any) => {
        // Handle both string and object format
        if (typeof img === 'string') return img
        return img.url || img.src || img
      })
      
      // Use direct download via server-side API
      const { downloadChapterDirect } = await import('@/lib/directDownload')
      
      downloadChapterDirect({
        manhwaTitle,
        manhwaSlug,
        chapterNumber,
        images: imageUrls
      })
      
      setProgress(100)
      
      setTimeout(() => {
        setIsGenerating(false)
        setProgress(0)
      }, 1000)
      
    } catch (error) {
      console.error('❌ Error generating PDF:', error)
      
      // Show specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        alert(`❌ Gagal mengunduh chapter ${chapterNumber}\n\nFile chapter tidak ditemukan di server.\n\nKemungkinan:\n- Chapter belum tersedia\n- File JSON belum di-upload ke Supabase\n\nSilakan coba chapter lain atau hubungi admin.`)
      } else if (errorMessage.includes('tidak ditemukan di file JSON')) {
        alert(`❌ Chapter ${chapterNumber} tidak ada di file JSON\n\nFile JSON ada, tapi chapter ini tidak tercatat.\n\nSilakan coba chapter lain.`)
      } else {
        alert(`❌ Gagal mengunduh chapter\n\nError: ${errorMessage}\n\nSilakan coba lagi atau hubungi admin.`)
      }
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

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
    </>
  )
}
