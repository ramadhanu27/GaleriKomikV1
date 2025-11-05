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
 * Compress image to reduce file size while maintaining quality
 * Optimized for manga/comic images to achieve < 5MB total file size
 * Using optimal settings: 800px width @ 50% quality (JPEG) for faster processing
 */
async function compressImage(base64: string, maxWidth: number = 800, quality: number = 0.5): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        // Create canvas for compression
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'medium' // Reduced from 'high' for speed
        
        // Fill white background (for transparency handling)
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to compressed base64 (JPEG format for better compression)
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        
        // Calculate compression ratio
        const originalSize = base64.length
        const compressedSize = compressedBase64.length
        const reduction = Math.round((1 - compressedSize / originalSize) * 100)
        
        console.log(
          `✓ Compressed: ${img.width}x${img.height} → ${width}x${height} @ ${Math.round(quality * 100)}% | ` +
          `Size: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB (${reduction}% smaller)`
        )
        resolve(compressedBase64)
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'))
      }
      
      img.src = base64
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Process multiple images in parallel for faster downloads
 * Uses Promise.allSettled to handle failures gracefully
 */
async function processImagesInParallel(images: string[], maxConcurrency: number = 6, onProgress?: (current: number, total: number, status: string) => void): Promise<string[]> {
  const results: string[] = new Array(images.length).fill('')
  let completed = 0
  
  // Process images in batches
  for (let i = 0; i < images.length; i += maxConcurrency) {
    const batch = images.slice(i, i + maxConcurrency)
    const batchPromises = batch.map(async (imageUrl, batchIndex) => {
      const globalIndex = i + batchIndex
      
      try {
        const response = await fetch(`/api/image-to-base64?url=${encodeURIComponent(imageUrl)}`)
        
        if (!response.ok) {
          throw new Error(`API error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success && result.data.base64) {
          const base64 = result.data.base64
          
          // Validate and compress base64
          if (base64 && base64.length > 100) {
            // Compress image for faster processing
            const compressedBase64 = await compressImage(base64)
            results[globalIndex] = compressedBase64
          } else {
            console.warn(`Image ${globalIndex + 1} returned invalid base64`)
            results[globalIndex] = ''
          }
        } else {
          console.warn(`Image ${globalIndex + 1} failed to convert`)
          results[globalIndex] = ''
        }
      } catch (error) {
        console.error(`Error loading image ${globalIndex + 1}:`, error, imageUrl)
        results[globalIndex] = ''
      } finally {
        completed++
        if (onProgress) {
          onProgress(completed, images.length, `Memuat gambar ${completed}/${images.length}...`)
        }
      }
    })
    
    // Wait for current batch to complete
    await Promise.allSettled(batchPromises)
  }
  
  return results
}
async function getBase64ImageFromUrl(url: string, compress: boolean = true): Promise<string> {
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
    
    let base64 = data.data.base64
    
    // Compress image if enabled (optimal compression: 1080px @ 60% for < 5MB total)
    if (compress) {
      try {
        base64 = await compressImage(base64, 1080, 0.6)
        console.log('Image compressed successfully (1080px @ 60% quality)')
      } catch (compressError) {
        console.warn('Compression failed, using original image:', compressError)
        // Use original if compression fails
      }
    }
    
    return base64
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

    // Process images in parallel for faster download
    console.log(`🚀 Processing ${images.length} images in parallel...`)
    const startTime = Date.now()
    
    const base64Images = await processImagesInParallel(images, 6, onProgress)
    
    const processingTime = Date.now() - startTime
    console.log(`✅ Parallel processing completed in ${processingTime}ms`)

    // Check if we got any valid images
    const validImages = base64Images.filter(img => img !== '')
    const failedCount = images.length - validImages.length
    
    if (validImages.length === 0) {
      throw new Error('❌ Semua gambar gagal dimuat!\n\nPastikan:\n• Koneksi internet stabil\n• Server tidak down\n• Coba lagi beberapa saat')
    }
    
    // Warn user if some images failed
    if (failedCount > 0) {
      const failureRate = (failedCount / images.length * 100).toFixed(0)
      console.warn(`⚠️ ${failedCount}/${images.length} gambar gagal dimuat (${failureRate}%)`)
      
      // Show warning if failure rate is significant (>20%)
      if (failedCount > images.length * 0.2) {
        const shouldContinue = confirm(
          `⚠️ PERINGATAN DOWNLOAD\n\n` +
          `${failedCount} dari ${images.length} gambar gagal dimuat (${failureRate}%).\n\n` +
          `PDF akan dibuat dengan ${validImages.length} gambar yang berhasil.\n\n` +
          `Lanjutkan download?`
        )
        
        if (!shouldContinue) {
          throw new Error('Download dibatalkan oleh user')
        }
      } else {
        // Just show a toast-like alert for minor failures
        console.log(`ℹ️ ${failedCount} gambar gagal, melanjutkan dengan ${validImages.length} gambar`)
      }
    }
    
    console.log(`✅ Successfully loaded ${validImages.length} out of ${images.length} images`)

    if (onProgress) {
      onProgress(images.length, images.length, 'Membuat PDF...')
    }

    // Create PDF document definition with optimized settings
    const docDefinition: any = {
      pageSize: {
        width: 595.28,
        height: 'auto'
      },
      pageMargins: [0, 0, 0, 0], // No margins for full-width images
      compress: true, // Enable PDF compression
      info: {
        title: '', // No title in PDF metadata
      },
      
      content: [
        // All images in one continuous page
        ...base64Images.map((base64, index) => {
          if (!base64) {
            return {
              text: `[Gambar ${index + 1} gagal dimuat]`,
              alignment: 'center',
              margin: [0, 250, 0, 250],
              color: '#999',
              fontSize: 14
            }
          }
          
          return {
            image: base64,
            fit: [595.28, 10000], // Fit to width, unlimited height (no cropping)
            alignment: 'center',
            margin: [0, 0, 0, 0] // No spacing between images
          }
        })
      ]
    }

    // Generate and download PDF
    const fileName = `${manhwaTitle.replace(/[^a-z0-9]/gi, '_')}_Ch${chapterNumber}.pdf`
    
    if (onProgress) {
      onProgress(images.length, images.length, 'Mengunduh PDF...')
    }
    
    const pdfStartTime = Date.now()
    
    pdfMake.createPdf(docDefinition).download(fileName)
    
    const pdfGenerationTime = Date.now() - pdfStartTime
    console.log(`📄 PDF generated and downloaded in ${pdfGenerationTime}ms`)
    
    if (onProgress) {
      onProgress(images.length, images.length, 'Selesai!')
    }
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

/**
 * Generate PDF and return as Blob (for ZIP packaging)
 */
export async function generateChapterPDFBlob(
  data: ChapterData,
  onProgress?: (current: number, total: number, status: string) => void
): Promise<Blob> {
  const { manhwaTitle, chapterNumber, chapterTitle, images } = data
  
  try {
    // Report initial status
    if (onProgress) {
      onProgress(0, images.length, 'Memulai...')
    }

    // Process images in parallel for faster download
    console.log(`🚀 Processing ${images.length} images in parallel...`)
    const startTime = Date.now()
    
    const base64Images = await processImagesInParallel(images, 6, onProgress)
    
    const processingTime = Date.now() - startTime
    console.log(`✅ Parallel processing completed in ${processingTime}ms`)
    
    // Check if we got any valid images
    const validImages = base64Images.filter(img => img !== '')
    const failedCount = images.length - validImages.length
    
    if (validImages.length === 0) {
      throw new Error('❌ Semua gambar gagal dimuat!\n\nPastikan:\n• Koneksi internet stabil\n• Server tidak down\n• Coba lagi beberapa saat')
    }
    
    // Warn user if some images failed (for Blob generation, no confirm dialog)
    if (failedCount > 0) {
      const failureRate = (failedCount / images.length * 100).toFixed(0)
      console.warn(`⚠️ Chapter ${chapterNumber}: ${failedCount}/${images.length} gambar gagal dimuat (${failureRate}%)`)
    }
    
    console.log(`✅ Chapter ${chapterNumber}: Successfully loaded ${validImages.length} out of ${images.length} images`)

    if (onProgress) {
      onProgress(images.length, images.length, 'Membuat PDF...')
    }

    // Create PDF document definition with optimized settings
    const docDefinition: any = {
      pageSize: {
        width: 595.28,
        height: 'auto'
      },
      pageMargins: [0, 0, 0, 0], // No margins for full-width images
      compress: true, // Enable PDF compression
      info: {
        title: '', // No title in PDF metadata
      },
      
      content: [
        // All images in one continuous page
        ...base64Images.map((base64, index) => {
          if (!base64) {
            return {
              text: `[Gambar ${index + 1} gagal dimuat]`,
              alignment: 'center',
              margin: [0, 250, 0, 250],
              color: '#999',
              fontSize: 14
            }
          }
          
          return {
            image: base64,
            fit: [595.28, 10000], // Fit to width, unlimited height (no cropping)
            alignment: 'center',
            margin: [0, 0, 0, 0] // No spacing between images
          }
        })
      ]
    }

    // Generate PDF and return as Blob
    if (onProgress) {
      onProgress(images.length, images.length, 'Membuat PDF...')
    }
    
    return new Promise((resolve, reject) => {
      const pdfStartTime = Date.now()
      
      pdfMake.createPdf(docDefinition).getBlob((blob) => {
        if (blob) {
          const pdfGenerationTime = Date.now() - pdfStartTime
          console.log(`📄 PDF generated in ${pdfGenerationTime}ms`)
          
          if (onProgress) {
            onProgress(images.length, images.length, 'Selesai!')
          }
          resolve(blob)
        } else {
          reject(new Error('Failed to generate PDF blob'))
        }
      })
    })
    
  } catch (error) {
    console.error('Error generating PDF blob:', error)
    throw error
  }
}

/**
 * Generate PDF and download directly
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
    const failedCount = images.length - validImages.length
    
    if (validImages.length === 0) {
      throw new Error('❌ Semua gambar gagal dimuat!\n\nPastikan:\n• Koneksi internet stabil\n• Server tidak down\n• Coba lagi beberapa saat')
    }
    
    // Warn user if some images failed
    if (failedCount > 0) {
      const failureRate = (failedCount / images.length * 100).toFixed(0)
      console.warn(`⚠️ ${failedCount}/${images.length} gambar gagal dimuat (${failureRate}%)`)
      
      alert(
        `⚠️ PERINGATAN\n\n` +
        `${failedCount} dari ${images.length} gambar gagal dimuat.\n\n` +
        `PDF akan dibuka dengan ${validImages.length} gambar yang berhasil.`
      )
    }
    
    console.log(`✅ Successfully loaded ${validImages.length} out of ${images.length} images`)

    if (onProgress) {
      onProgress(images.length, images.length, 'Membuat PDF...')
    }

    const docDefinition: any = {
      pageSize: {
        width: 595.28,
        height: 'auto'
      },
      pageMargins: [0, 0, 0, 0], // No margins for full-width images
      compress: true, // Enable PDF compression
      info: {
        title: '', // No title in PDF metadata
      },
      
      content: [
        // All images in one continuous page
        ...base64Images.map((base64, index) => {
          if (!base64) {
            return {
              text: `[Gambar ${index + 1} gagal dimuat]`,
              alignment: 'center',
              margin: [0, 250, 0, 250],
              color: '#999',
              fontSize: 14
            }
          }
          
          return {
            image: base64,
            fit: [595.28, 10000], // Fit to width, unlimited height (no cropping)
            alignment: 'center',
            margin: [0, 0, 0, 0] // No spacing between images
          }
        })
      ]
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
