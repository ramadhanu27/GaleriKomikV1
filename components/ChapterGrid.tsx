'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Chapter } from '@/types'
import DownloadChapterButtonSmall from './DownloadChapterButtonSmall'
import FloatingDownloadBar from './FloatingDownloadBar'

interface ChapterGridProps {
  chapters: Chapter[]
  manhwaSlug: string
  manhwaTitle?: string
}

export default function ChapterGrid({ chapters, manhwaSlug, manhwaTitle }: ChapterGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set())
  const [isDownloadingMultiple, setIsDownloadingMultiple] = useState(false)
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{
    percent: number
    loadedMB: number
    totalMB: number
    currentFile: number
    totalFiles: number
  } | undefined>(undefined)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const itemsPerPage = 50
  
  // Sort and filter chapters
  const processedChapters = useMemo(() => {
    let filtered = [...chapters]
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(chapter => 
        chapter.number?.toString().includes(searchQuery) ||
        chapter.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Sort by chapter number
    filtered.sort((a, b) => {
      const numA = parseFloat(a.number?.toString() || '0')
      const numB = parseFloat(b.number?.toString() || '0')
      
      if (sortOrder === 'newest') {
        return numB - numA // Descending: 89, 88, 64, 52, ...
      } else {
        return numA - numB // Ascending: 1, 2, 3, ...
      }
    })
    
    return filtered
  }, [chapters, searchQuery, sortOrder])
  
  const totalPages = Math.ceil(processedChapters.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentChapters = processedChapters.slice(startIndex, endIndex)

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return ''
    
    try {
      // Parse DD/MM/YYYY format
      let date: Date
      if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/')
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      } else {
        date = new Date(dateString)
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) return ''
      
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
      
      if (diffHours < 24) return `${diffHours} jam lalu`
      if (diffDays === 1) return '1 hari lalu'
      if (diffDays < 30) return `${diffDays} hari lalu`
      if (diffDays < 365) {
        const diffMonths = Math.floor(diffDays / 30)
        return `${diffMonths} bulan lalu`
      }
      const diffYears = Math.floor(diffDays / 365)
      return `${diffYears} tahun lalu`
    } catch (error) {
      return ''
    }
  }

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  // Disable pointer events and body scroll when modal is open
  useEffect(() => {
    const chapterList = document.querySelector('.chapter-grid-container')
    if (chapterList) {
      (chapterList as HTMLElement).style.pointerEvents = isAnyModalOpen ? 'none' : 'auto'
    }
    document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'auto'
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isAnyModalOpen])

  // Multi-select handlers
  const toggleChapterSelection = (chapterNumber: string) => {
    const newSelected = new Set(selectedChapters)
    if (newSelected.has(chapterNumber)) {
      newSelected.delete(chapterNumber)
    } else {
      newSelected.add(chapterNumber)
    }
    setSelectedChapters(newSelected)
  }

  const selectAll = () => {
    const allNumbers = new Set(currentChapters.map(ch => ch.number?.toString() || ''))
    setSelectedChapters(allNumbers)
  }

  const clearSelection = () => {
    setSelectedChapters(new Set())
  }

  const handleMultiDownload = async () => {
    if (selectedChapters.size === 0 || !manhwaTitle) return
    
    // Create new abort controller for this download
    const controller = new AbortController()
    setAbortController(controller)
    setIsDownloadingMultiple(true)
    
    try {
      const selectedArray = Array.from(selectedChapters).sort((a, b) => parseFloat(a) - parseFloat(b))
      
      if (selectedArray.length === 1) {
        // Single chapter - direct PDF download
        const chapterNumber = selectedArray[0]
        await downloadSingleChapter(chapterNumber, controller.signal)
      } else {
        // Multiple chapters - create ZIP
        await downloadMultipleChapters(selectedArray, controller.signal)
      }
      
      clearSelection()
    } catch (error) {
      if (error instanceof Error && error.message === 'Download dihentikan oleh pengguna') {
        console.log('Download stopped by user')
      } else {
        console.error('Multi-download error:', error)
        alert('Gagal mengunduh chapter. Silakan coba lagi.')
      }
    } finally {
      setIsDownloadingMultiple(false)
      setDownloadProgress(undefined)
      setAbortController(null)
    }
  }

  const handleStop = () => {
    if (abortController) {
      abortController.abort()
      setIsDownloadingMultiple(false)
      setDownloadProgress(undefined)
      setAbortController(null)
    }
  }

  const downloadSingleChapter = async (chapterNumber: string, signal?: AbortSignal) => {
    // Import dynamically to avoid SSR issues
    const { generateChapterPDF } = await import('@/lib/pdfMakeGenerator')
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
    
    // Estimate total size (avg 100KB per compressed image)
    const estimatedTotalMB = (images.length * 100) / 1024
    
    await generateChapterPDF({
      manhwaTitle: manhwaTitle || '',
      chapterNumber,
      chapterTitle: chapter.title || `Chapter ${chapterNumber}`,
      images: proxiedImages
    }, (current, total, status) => {
      // Update progress
      const percent = (current / total) * 100
      const loadedMB = (current / total) * estimatedTotalMB
      
      setDownloadProgress({
        percent,
        loadedMB,
        totalMB: estimatedTotalMB,
        currentFile: current,
        totalFiles: total
      })
    })
  }

  const downloadMultipleChapters = async (chapterNumbers: string[], signal?: AbortSignal) => {
    // Import JSZip dynamically
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    const { getProxiedImageUrl } = await import('@/lib/imageProxy')
    const { generateChapterPDFBlob } = await import('@/lib/pdfMakeGenerator')
    
    // Calculate total estimated size
    let totalEstimatedMB = 0
    let processedMB = 0
    
    // Process chapters in parallel batches for faster download
    const maxConcurrency = 3 // Process 3 chapters at once
    const results: { chapterNumber: string, pdfBlob: Blob, estimatedMB: number }[] = []
    
    console.log(`🚀 Processing ${chapterNumbers.length} chapters in parallel batches...`)
    const startTime = Date.now()
    
    for (let i = 0; i < chapterNumbers.length; i += maxConcurrency) {
      // Check if aborted before processing batch
      if (signal?.aborted) {
        throw new Error('Download dihentikan oleh pengguna')
      }
      
      const batch = chapterNumbers.slice(i, i + maxConcurrency)
      const batchPromises = batch.map(async (chapterNumber, batchIndex) => {
        const globalIndex = i + batchIndex
        
        try {
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
          
          // Estimate size for this chapter (reduced estimate for faster processing)
          const chapterEstimatedMB = (images.length * 75) / 1024 // Reduced from 100KB
          
          // Check if aborted before PDF generation
          if (signal?.aborted) {
            throw new Error('Download dihentikan oleh pengguna')
          }
          
          // Generate PDF blob
          const pdfBlob = await generateChapterPDFBlob({
            manhwaTitle: manhwaTitle || 'Unknown Manhwa',
            chapterNumber,
            chapterTitle: chapter.title || `Chapter ${chapterNumber}`,
            images: proxiedImages
          })
          
          return { chapterNumber, pdfBlob, estimatedMB: chapterEstimatedMB }
          
        } catch (error) {
          // Check if error is due to abort
          if (signal?.aborted) {
            throw new Error('Download dihentikan oleh pengguna')
          }
          console.error(`Error downloading chapter ${chapterNumber}:`, error)
          return null // Return null for failed chapters
        }
      })
      
      // Wait for current batch to complete
      const batchResults = await Promise.allSettled(batchPromises)
      
      // Process successful results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value)
          totalEstimatedMB += result.value.estimatedMB
        }
      })
      
      // Update progress
      const completedCount = Math.min(i + maxConcurrency, chapterNumbers.length)
      setDownloadProgress({
        percent: (completedCount / chapterNumbers.length) * 100,
        loadedMB: processedMB,
        totalMB: totalEstimatedMB,
        currentFile: completedCount,
        totalFiles: chapterNumbers.length
      })
    }
    
    // Check if aborted before final ZIP generation
    if (signal?.aborted) {
      throw new Error('Download dihentikan oleh pengguna')
    }
    
    const processingTime = Date.now() - startTime
    console.log(`✅ Parallel chapter processing completed in ${processingTime}ms`)
    
    // Add all successful PDFs to ZIP
    results.forEach(({ chapterNumber, pdfBlob }) => {
      const fileName = `${(manhwaTitle || 'Chapter').replace(/[^a-z0-9]/gi, '_')}_Ch${chapterNumber}.pdf`
      zip.file(fileName, pdfBlob)
    })
    
    // Generate ZIP and download
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const minChapter = Math.min(...chapterNumbers.map(n => parseFloat(n)))
    const maxChapter = Math.max(...chapterNumbers.map(n => parseFloat(n)))
    const zipFileName = `${(manhwaTitle || 'Chapters').replace(/[^a-z0-9]/gi, '_')}_Chapters_${minChapter}-${maxChapter}.zip`
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(zipBlob)
    link.download = zipFileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  // Helper to generate PDF as blob
  const generateChapterPDFBlob = async (data: any): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      try {
        const pdfMake = (await import('pdfmake/build/pdfmake')).default
        const pdfFonts = await import('pdfmake/build/vfs_fonts')
        
        if (typeof window !== 'undefined') {
          pdfMake.vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts.vfs
        }
        
        // Convert images to base64
        const base64Images: string[] = []
        for (const imageUrl of data.images) {
          try {
            const response = await fetch(`/api/image-to-base64?url=${encodeURIComponent(imageUrl)}`)
            const result = await response.json()
            if (result.success && result.data.base64) {
              base64Images.push(result.data.base64)
            }
          } catch (error) {
            console.error('Error converting image:', error)
          }
        }
        
        // Create PDF definition (simplified version)
        const docDefinition: any = {
          pageSize: { width: 595.28, height: 'auto' },
          pageMargins: [0, 0, 0, 0],
          content: [
            {
              text: `${data.manhwaTitle || 'Unknown Manhwa'} - Chapter ${data.chapterNumber}`,
              fontSize: 20,
              bold: true,
              margin: [40, 100, 40, 100],
              alignment: 'center',
              pageBreak: 'after'
            },
            ...base64Images.map((base64, index) => ({
              stack: [
                { image: base64, width: 595.28, alignment: 'center' },
                {
                  text: 'galerikomik.cyou',
                  absolutePosition: { x: 0, y: 50 },
                  alignment: 'center',
                  fontSize: 24,
                  bold: true,
                  color: '#ffffff',
                  opacity: 0.15,
                  width: 595.28
                }
              ],
              pageBreak: index < base64Images.length - 1 ? 'after' : undefined
            }))
          ]
        }
        
        pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
          resolve(blob)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  return (
    <div className="relative">
      {/* Chapter List Container - Can be disabled when modal open */}
      <div className="chapter-grid-container">
      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari chapter... (contoh: 1, 10, 100)"
              className="w-full px-4 py-3 pl-11 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Sort Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSortOrder('newest')
                setCurrentPage(1)
              }}
              className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                sortOrder === 'newest'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Terbaru
            </button>
            <button
              onClick={() => {
                setSortOrder('oldest')
                setCurrentPage(1)
              }}
              className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                sortOrder === 'oldest'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Terlama
            </button>
          </div>
        </div>

        {/* Results Info and Multi-Select Controls */}
        <div className="flex items-center justify-between text-sm flex-wrap gap-3">
          <p className="text-slate-400">
            Menampilkan <span className="font-semibold text-white">{currentChapters.length}</span> dari <span className="font-semibold text-white">{processedChapters.length}</span> chapter
            {selectedChapters.size > 0 && (
              <span className="ml-2 px-2 py-1 bg-primary-600 text-white text-xs rounded-full font-semibold">
                {selectedChapters.size} terpilih
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            {selectedChapters.size > 0 && (
              <>
                {selectedChapters.size < currentChapters.length && (
                  <button
                    onClick={selectAll}
                    className="px-3 py-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-1 font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pilih Semua
                  </button>
                )}
                <button
                  onClick={clearSelection}
                  className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-1 font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Batal
                </button>
              </>
            )}
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Search
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chapter Grid - 5 Columns with Scroll */}
      {currentChapters.length > 0 ? (
        <div className="mb-6">
          {/* Scroll Indicators */}
          {currentChapters.length > 20 && (
            <div className="mb-2 text-xs text-slate-400 flex items-center justify-between">
              <span>📜 Scroll untuk melihat chapter lainnya</span>
              <span className="text-primary-400">
                {currentChapters.length} chapter tersedia
              </span>
            </div>
          )}
          
          {/* Scrollable Chapter Container */}
          <div className="relative">
            {/* Top Scroll Fade Indicator */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-slate-900 to-transparent z-10 pointer-events-none opacity-60"></div>
            
            {/* Scroll Container */}
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 hover:scrollbar-thumb-slate-500 pr-2 pt-2 pb-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {currentChapters.map((chapter, index) => (
                  <div
                    key={index}
                    className={`group relative bg-gradient-to-br from-slate-800/50 to-slate-800/30 hover:from-primary-600/20 hover:to-primary-700/20 border rounded-lg transition-all hover:shadow-lg hover:shadow-primary-900/20 ${
                      selectedChapters.has(chapter.number?.toString() || '')
                        ? 'border-primary-500 ring-2 ring-primary-500/50 bg-primary-900/20'
                        : 'border-slate-700/50 hover:border-primary-500/50'
                    }`}
                  >
                    {/* Checkbox for Multi-Select - Improved visibility */}
                    <div className="absolute top-2 right-2 z-20">
                      <label className="relative flex items-center justify-center cursor-pointer group/checkbox">
                        <input
                          type="checkbox"
                          checked={selectedChapters.has(chapter.number?.toString() || '')}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleChapterSelection(chapter.number?.toString() || '')
                          }}
                          className="sr-only peer"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="w-6 h-6 rounded-md border-2 border-slate-500 bg-slate-800/80 peer-checked:bg-primary-600 peer-checked:border-primary-600 flex items-center justify-center transition-all shadow-lg group-hover/checkbox:border-primary-400 group-hover/checkbox:scale-110">
                          {selectedChapters.has(chapter.number?.toString() || '') && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* Download Button - Only show on hover for desktop, hidden on mobile when checkbox visible */}
                    {manhwaTitle && (
                      <div className="absolute top-2 left-2 z-10 hidden sm:block sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <DownloadChapterButtonSmall
                          manhwaSlug={manhwaSlug}
                          manhwaTitle={manhwaTitle}
                          chapterNumber={chapter.number?.toString() || ''}
                          chapterTitle={chapter.title}
                          onModalStateChange={setIsAnyModalOpen}
                        />
                      </div>
                    )}
                    
                    {/* Chapter Link - Clickable area */}
                    <Link
                      href={`/manhwa/${manhwaSlug}/chapter/${chapter.number}`}
                      className="block p-4 pt-10 hover:scale-105 transition-transform"
                    >

                    {/* Chapter Number */}
                    <div className="text-center mb-2">
                      <div className="text-xs text-slate-400 font-medium mb-1">Chapter</div>
                      <div className="text-2xl font-bold text-white group-hover:text-primary-400 transition-colors">
                        {chapter.number}
                      </div>
                    </div>

                    {/* Chapter Title (if exists and different) */}
                    {chapter.title && chapter.title !== `Chapter ${chapter.number}` && (
                      <div className="text-xs text-slate-400 text-center mb-2 line-clamp-2 min-h-[2rem]">
                        {chapter.title}
                      </div>
                    )}

                    {/* Date */}
                    {chapter.date && (
                      <div className="text-xs text-slate-500 text-center flex items-center justify-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {getTimeAgo(chapter.date)}
                      </div>
                    )}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Bottom Scroll Fade Indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900 to-transparent z-10 pointer-events-none opacity-60"></div>
          </div>
          
          {/* Chapter Count Info */}
          <div className="mt-4 text-center text-sm text-slate-400">
            Menampilkan {startIndex + 1}-{Math.min(endIndex, processedChapters.length)} dari {processedChapters.length} chapter
            {processedChapters.length > itemsPerPage && ` (Halaman ${currentPage} dari ${totalPages})`}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-white mb-2">Tidak ada chapter ditemukan</h3>
          <p className="text-slate-400">Coba ubah kata kunci pencarian</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-slate-700/50 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-slate-700/50 text-white hover:bg-slate-700'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-slate-700/50 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
      </div>
      {/* End of chapter-grid-container */}

      {/* Floating Download Bar - Modern & Clean */}
      <FloatingDownloadBar
        selectedCount={selectedChapters.size}
        onCancel={clearSelection}
        onStop={isDownloadingMultiple ? handleStop : undefined}
        onDownload={handleMultiDownload}
        isDownloading={isDownloadingMultiple}
        estimatedSize={`${(selectedChapters.size * 15).toFixed(1)} MB`}
        downloadProgress={downloadProgress}
      />
    </div>
  )
}
