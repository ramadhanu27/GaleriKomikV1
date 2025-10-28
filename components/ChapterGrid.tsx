'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Chapter } from '@/types'
import DownloadChapterButtonSmall from './DownloadChapterButtonSmall'

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
    
    setIsDownloadingMultiple(true)
    
    try {
      const selectedArray = Array.from(selectedChapters).sort((a, b) => parseFloat(a) - parseFloat(b))
      
      if (selectedArray.length === 1) {
        // Single chapter - direct PDF download
        const chapterNumber = selectedArray[0]
        await downloadSingleChapter(chapterNumber)
      } else {
        // Multiple chapters - create ZIP
        await downloadMultipleChapters(selectedArray)
      }
      
      clearSelection()
    } catch (error) {
      console.error('Multi-download error:', error)
      alert('Gagal mengunduh chapter. Silakan coba lagi.')
    } finally {
      setIsDownloadingMultiple(false)
    }
  }

  const downloadSingleChapter = async (chapterNumber: string) => {
    // Import dynamically to avoid SSR issues
    const { generateChapterPDF } = await import('@/lib/pdfMakeGenerator')
    const { getProxiedImageUrl } = await import('@/lib/imageProxy')
    
    const response = await fetch(`/api/komiku/${manhwaSlug}/chapter/${chapterNumber}`)
    const data = await response.json()
    
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
    
    await generateChapterPDF({
      manhwaTitle: manhwaTitle || '',
      chapterNumber,
      chapterTitle: chapter.title,
      images: proxiedImages
    })
  }

  const downloadMultipleChapters = async (chapterNumbers: string[]) => {
    // Import JSZip dynamically
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    const { getProxiedImageUrl } = await import('@/lib/imageProxy')
    const { generateChapterPDF } = await import('@/lib/pdfMakeGenerator')
    
    // Fetch all chapters
    for (let i = 0; i < chapterNumbers.length; i++) {
      const chapterNumber = chapterNumbers[i]
      
      try {
        const response = await fetch(`/api/komiku/${manhwaSlug}/chapter/${chapterNumber}`)
        const data = await response.json()
        
        if (!data.success || !data.data.chapter) continue
        
        const chapter = data.data.chapter
        const images = chapter.images || []
        
        if (images.length === 0) continue
        
        const proxiedImages = images.map((img: any) => {
          const originalUrl = typeof img === 'string' ? img : img.url
          return getProxiedImageUrl(originalUrl)
        })
        
        // Generate PDF blob instead of downloading
        const pdfBlob = await generateChapterPDFBlob({
          manhwaTitle: manhwaTitle,
          chapterNumber,
          chapterTitle: chapter.title,
          images: proxiedImages
        })
        
        // Add to ZIP
        const fileName = `${(manhwaTitle || 'Chapter').replace(/[^a-z0-9]/gi, '_')}_Ch${chapterNumber}.pdf`
        zip.file(fileName, pdfBlob)
        
      } catch (error) {
        console.error(`Error downloading chapter ${chapterNumber}:`, error)
      }
    }
    
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
              text: `${data.manhwaTitle} - Chapter ${data.chapterNumber}`,
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
    <div>
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

        {/* Results Info */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-400">
            Menampilkan <span className="font-semibold text-white">{currentChapters.length}</span> dari <span className="font-semibold text-white">{processedChapters.length}</span> chapter
          </p>
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Chapter Grid - 5 Columns */}
      {currentChapters.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
          {currentChapters.map((chapter, index) => (
            <div
              key={index}
              className={`group relative bg-gradient-to-br from-slate-800/50 to-slate-800/30 hover:from-primary-600/20 hover:to-primary-700/20 border rounded-lg transition-all hover:shadow-lg hover:shadow-primary-900/20 ${
                selectedChapters.has(chapter.number?.toString() || '')
                  ? 'border-primary-500 ring-2 ring-primary-500/50'
                  : 'border-slate-700/50 hover:border-primary-500/50'
              }`}
            >
              {/* Checkbox for Multi-Select */}
              <div className="absolute top-2 right-2 z-20">
                <input
                  type="checkbox"
                  checked={selectedChapters.has(chapter.number?.toString() || '')}
                  onChange={(e) => {
                    e.stopPropagation()
                    toggleChapterSelection(chapter.number?.toString() || '')
                  }}
                  className="w-5 h-5 rounded border-2 border-slate-600 bg-slate-700 checked:bg-primary-600 checked:border-primary-600 cursor-pointer transition-all"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Download Button - Always visible on mobile, hover on desktop */}
              {manhwaTitle && (
                <div className="absolute top-2 left-2 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <DownloadChapterButtonSmall
                    manhwaSlug={manhwaSlug}
                    manhwaTitle={manhwaTitle}
                    chapterNumber={chapter.number?.toString() || ''}
                    chapterTitle={chapter.title}
                  />
                </div>
              )}
              
              {/* Chapter Link - Clickable area */}
              <Link
                href={`/manhwa/${manhwaSlug}/chapter/${chapter.number}`}
                className="block p-4 hover:scale-105 transition-transform"
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

              {/* Hover Indicator */}
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-600/0 group-hover:bg-primary-600 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              </Link>
            </div>
          ))}
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

      {/* Sticky Toolbar for Multi-Download */}
      {selectedChapters.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900 to-slate-800 border-t-2 border-primary-600 shadow-2xl z-50 animate-slideUp">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Selection Info */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {selectedChapters.size} Chapter Terpilih
                    </p>
                    <p className="text-slate-400 text-xs">
                      {selectedChapters.size === 1 ? 'Akan diunduh sebagai PDF' : 'Akan digabung dalam ZIP'}
                    </p>
                  </div>
                </div>

                {/* Select All / Clear */}
                <div className="hidden sm:flex items-center gap-2">
                  {selectedChapters.size < currentChapters.length ? (
                    <button
                      onClick={selectAll}
                      className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      Pilih Semua
                    </button>
                  ) : null}
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={handleMultiDownload}
                disabled={isDownloadingMultiple}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {isDownloadingMultiple ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Mengunduh...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download Terpilih</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
