'use client'

import pdfMake from 'pdfmake/build/pdfmake'
import * as pdfFonts from 'pdfmake/build/vfs_fonts'

// Set fonts
if (pdfMake.vfs === undefined) {
  pdfMake.vfs = (pdfFonts as any).pdfMake?.vfs || {}
}

interface ChapterData {
  manhwaTitle: string
  chapterNumber: string
  chapterTitle?: string
  images: string[]
}

/**
 * Convert image URL to base64 using API route (bypasses CORS)
 */
async function getBase64ImageFromUrl(url: string): Promise<string> {
  try {
    // Use API route to convert image to base64
    const response = await fetch(`/api/image-to-base64?url=${encodeURIComponent(url)}`)
    
    if (!response.ok) {
      throw new Error(`API error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.success || !data.data.base64) {
      throw new Error(data.error || 'Failed to convert image')
    }
    
    return data.data.base64
  } catch (error) {
    console.error('Error converting image to base64:', error)
    throw error
  }
}

/**
 * Generate PDF from chapter images using pdfMake
 */
export async function generateChapterPDF(
  data: ChapterData,
  onProgress?: (current: number, total: number, status: string) => void
): Promise<void> {
  const { manhwaTitle, chapterNumber, chapterTitle, images } = data
  
  try {
    // Report initial status
    if (onProgress) {
      onProgress(0, images.length, 'Memulai...')
    }

    // Convert all images to base64
    const base64Images: string[] = []
    
    for (let i = 0; i < images.length; i++) {
      if (onProgress) {
        onProgress(i + 1, images.length, `Memuat gambar ${i + 1}/${images.length}...`)
      }
      
      try {
        const base64 = await getBase64ImageFromUrl(images[i])
        if (base64 && base64.length > 100) { // Valid base64 should be longer
          base64Images.push(base64)
        } else {
          console.warn(`Image ${i + 1} returned invalid base64`)
          base64Images.push('')
        }
      } catch (error) {
        console.error(`Error loading image ${i + 1}:`, error, images[i])
        // Add placeholder for failed images
        base64Images.push('')
      }
    }
    
    // Check if we got any valid images
    const validImages = base64Images.filter(img => img !== '')
    if (validImages.length === 0) {
      throw new Error('Tidak ada gambar yang berhasil dimuat. Pastikan koneksi internet Anda stabil.')
    }
    
    console.log(`Successfully loaded ${validImages.length} out of ${images.length} images`)

    if (onProgress) {
      onProgress(images.length, images.length, 'Membuat PDF...')
    }

    // Create PDF document definition
    const docDefinition: any = {
      pageSize: {
        width: 595.28,  // A4 width in points
        height: 'auto'  // Auto height to fit content
      },
      pageMargins: [0, 0, 0, 0], // No margins for full-width images
      
      // Footer only
      footer: (currentPage: number, pageCount: number) => {
        if (currentPage === 1) return null // No footer on cover page
        
        return {
          text: `${currentPage - 1}`, // Page number (excluding cover)
          alignment: 'center',
          fontSize: 10,
          color: '#666',
          margin: [0, 10, 0, 10]
        }
      },
      
      content: [
        // Simple title page
        {
          stack: [
            {
              text: manhwaTitle,
              style: 'title',
              alignment: 'center',
              margin: [40, 150, 40, 20]
            },
            {
              text: `Chapter ${chapterNumber}`,
              style: 'subtitle',
              alignment: 'center',
              margin: [40, 0, 40, 10]
            },
            chapterTitle ? {
              text: chapterTitle,
              style: 'chapterTitle',
              alignment: 'center',
              margin: [40, 0, 40, 150]
            } : { text: '', margin: [0, 0, 0, 150] }
          ],
          pageBreak: 'after'
        },
        
        // Images - full width, auto height
        ...base64Images.map((base64, index) => {
          if (!base64) {
            return {
              text: `[Gambar ${index + 1} gagal dimuat]`,
              alignment: 'center',
              margin: [0, 250, 0, 250],
              color: '#999',
              fontSize: 14,
              pageBreak: index < base64Images.length - 1 ? 'after' : undefined
            }
          }
          
          return {
            stack: [
              {
                image: base64,
                width: 595.28, // Full A4 width
                alignment: 'center'
              },
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
          }
        })
      ],
      
      styles: {
        title: {
          fontSize: 24,
          bold: true,
          color: '#1e293b'
        },
        subtitle: {
          fontSize: 18,
          bold: true,
          color: '#475569'
        },
        chapterTitle: {
          fontSize: 14,
          italics: true,
          color: '#64748b'
        },
        metadata: {
          fontSize: 10,
          color: '#94a3b8'
        }
      }
    }

    // Generate and download PDF
    const fileName = `${manhwaTitle.replace(/[^a-z0-9]/gi, '_')}_Ch${chapterNumber}.pdf`
    
    if (onProgress) {
      onProgress(images.length, images.length, 'Mengunduh PDF...')
    }
    
    pdfMake.createPdf(docDefinition).download(fileName)
    
    if (onProgress) {
      onProgress(images.length, images.length, 'Selesai!')
    }
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

/**
 * Open PDF in new tab instead of downloading
 */
export async function openChapterPDF(
  data: ChapterData,
  onProgress?: (current: number, total: number, status: string) => void
): Promise<void> {
  const { manhwaTitle, chapterNumber, chapterTitle, images } = data
  
  try {
    if (onProgress) {
      onProgress(0, images.length, 'Memulai...')
    }

    const base64Images: string[] = []
    
    for (let i = 0; i < images.length; i++) {
      if (onProgress) {
        onProgress(i + 1, images.length, `Memuat gambar ${i + 1}/${images.length}...`)
      }
      
      try {
        const base64 = await getBase64ImageFromUrl(images[i])
        if (base64 && base64.length > 100) {
          base64Images.push(base64)
        } else {
          console.warn(`Image ${i + 1} returned invalid base64`)
          base64Images.push('')
        }
      } catch (error) {
        console.error(`Error loading image ${i + 1}:`, error, images[i])
        base64Images.push('')
      }
    }
    
    const validImages = base64Images.filter(img => img !== '')
    if (validImages.length === 0) {
      throw new Error('Tidak ada gambar yang berhasil dimuat. Pastikan koneksi internet Anda stabil.')
    }
    
    console.log(`Successfully loaded ${validImages.length} out of ${images.length} images`)

    if (onProgress) {
      onProgress(images.length, images.length, 'Membuat PDF...')
    }

    const docDefinition: any = {
      pageSize: {
        width: 595.28,  // A4 width in points
        height: 'auto'  // Auto height to fit content
      },
      pageMargins: [0, 0, 0, 0], // No margins for full-width images
      
      // Footer only
      footer: (currentPage: number, pageCount: number) => {
        if (currentPage === 1) return null // No footer on cover page
        
        return {
          text: `${currentPage - 1}`, // Page number (excluding cover)
          alignment: 'center',
          fontSize: 10,
          color: '#666',
          margin: [0, 10, 0, 10]
        }
      },
      
      content: [
        // Simple title page
        {
          stack: [
            {
              text: manhwaTitle,
              style: 'title',
              alignment: 'center',
              margin: [40, 150, 40, 20]
            },
            {
              text: `Chapter ${chapterNumber}`,
              style: 'subtitle',
              alignment: 'center',
              margin: [40, 0, 40, 10]
            },
            chapterTitle ? {
              text: chapterTitle,
              style: 'chapterTitle',
              alignment: 'center',
              margin: [40, 0, 40, 150]
            } : { text: '', margin: [0, 0, 0, 150] }
          ],
          pageBreak: 'after'
        },
        
        // Images - full width, auto height
        ...base64Images.map((base64, index) => {
          if (!base64) {
            return {
              text: `[Gambar ${index + 1} gagal dimuat]`,
              alignment: 'center',
              margin: [0, 250, 0, 250],
              color: '#999',
              fontSize: 14,
              pageBreak: index < base64Images.length - 1 ? 'after' : undefined
            }
          }
          
          return {
            stack: [
              {
                image: base64,
                width: 595.28, // Full A4 width
                alignment: 'center'
              },
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
          }
        })
      ],
      
      styles: {
        title: {
          fontSize: 24,
          bold: true,
          color: '#1e293b'
        },
        subtitle: {
          fontSize: 18,
          bold: true,
          color: '#475569'
        },
        chapterTitle: {
          fontSize: 14,
          italics: true,
          color: '#64748b'
        },
        metadata: {
          fontSize: 10,
          color: '#94a3b8'
        }
      }
    }
    
    if (onProgress) {
      onProgress(images.length, images.length, 'Membuka PDF...')
    }
    
    pdfMake.createPdf(docDefinition).open()
    
    if (onProgress) {
      onProgress(images.length, images.length, 'Selesai!')
    }
    
  } catch (error) {
    console.error('Error opening PDF:', error)
    throw error
  }
}
