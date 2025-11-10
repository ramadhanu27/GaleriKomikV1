import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Server-side image fetching with retry
async function fetchImageWithRetry(url: string, maxRetries = 3): Promise<Buffer> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://komiku.org/',
        },
      })

      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error: any) {
      console.error(`Retry ${i + 1}/${maxRetries} for ${url}:`, error.message)
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000))
    }
  }
  throw new Error('Max retries reached')
}

// Process images in parallel on server
async function processImagesParallel(
  images: string[],
  maxConcurrency = 10
): Promise<{ base64: string; contentType: string }[]> {
  const results: { base64: string; contentType: string }[] = []
  
  for (let i = 0; i < images.length; i += maxConcurrency) {
    const batch = images.slice(i, i + maxConcurrency)
    
    const batchResults = await Promise.allSettled(
      batch.map(async (imageUrl) => {
        try {
          const buffer = await fetchImageWithRetry(imageUrl)
          const base64 = buffer.toString('base64')
          const contentType = imageUrl.endsWith('.png') ? 'image/png' : 
                            imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg') ? 'image/jpeg' : 
                            'image/webp'
          
          return {
            base64: `data:${contentType};base64,${base64}`,
            contentType
          }
        } catch (error) {
          console.error(`Failed to fetch ${imageUrl}:`, error)
          return null
        }
      })
    )

    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value)
      } else {
        results.push({ base64: '', contentType: 'image/jpeg' })
      }
    }

    console.log(`Processed ${Math.min(i + maxConcurrency, images.length)}/${images.length} images`)
  }

  return results
}

// Generate PDF using pdfmake
async function generatePDFBuffer(
  chapterData: any,
  images: { base64: string; contentType: string }[]
): Promise<Buffer> {
  const PdfPrinter = require('pdfmake')
  const fonts = {
    Roboto: {
      normal: 'node_modules/pdfmake/build/vfs_fonts.js',
      bold: 'node_modules/pdfmake/build/vfs_fonts.js',
    }
  }

  const printer = new PdfPrinter(fonts)

  // Filter valid images
  const validImages = images.filter(img => img.base64)

  // Create document definition
  const docDefinition: any = {
    pageSize: {
      width: 595.28,
      height: 'auto'
    },
    pageMargins: [0, 0, 0, 0],
    content: validImages.map((img, index) => ({
      image: img.base64,
      width: 595.28,
      pageBreak: index < validImages.length - 1 ? 'after' : undefined
    })),
    info: {
      title: chapterData.title || `Chapter ${chapterData.number}`,
      author: 'Galeri Komik',
      subject: chapterData.title,
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition)
      const chunks: Buffer[] = []

      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk))
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
      pdfDoc.on('error', reject)

      pdfDoc.end()
    } catch (error) {
      reject(error)
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { slug, chapterId } = await request.json()

    if (!slug || !chapterId) {
      return NextResponse.json(
        { success: false, error: 'Missing slug or chapterId' },
        { status: 400 }
      )
    }

    console.log(`📥 Server-side PDF generation started: ${slug}/${chapterId}`)

    // Fetch chapter data from Supabase
    const { data: files, error: listError } = await supabase.storage
      .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
      .list(`komiku-data/${slug}`, {
        search: `${chapterId}.json`
      })

    if (listError || !files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found' },
        { status: 404 }
      )
    }

    // Download chapter JSON
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
      .download(`komiku-data/${slug}/${chapterId}.json`)

    if (downloadError || !fileData) {
      return NextResponse.json(
        { success: false, error: 'Failed to download chapter data' },
        { status: 500 }
      )
    }

    const chapterText = await fileData.text()
    const chapterData = JSON.parse(chapterText)

    // Extract image URLs
    const images = (chapterData.images || []).map((img: any) => 
      typeof img === 'string' ? img : img.url || img.src
    )

    if (images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images found' },
        { status: 404 }
      )
    }

    console.log(`🖼️  Processing ${images.length} images...`)

    // Process images in parallel (server is faster!)
    const startTime = Date.now()
    const processedImages = await processImagesParallel(images, 10)
    const fetchTime = Date.now() - startTime
    console.log(`✅ Images fetched in ${fetchTime}ms`)

    // Generate PDF
    console.log(`📄 Generating PDF...`)
    const pdfStartTime = Date.now()
    const pdfBuffer = await generatePDFBuffer(chapterData, processedImages)
    const pdfTime = Date.now() - pdfStartTime
    console.log(`✅ PDF generated in ${pdfTime}ms`)

    const totalTime = Date.now() - startTime
    console.log(`🎉 Total time: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`)

    // Return PDF
    const filename = `${slug}-chapter-${chapterId}.pdf`
    
    // Convert Buffer to Uint8Array for Response compatibility
    const pdfArray = new Uint8Array(pdfBuffer)
    
    return new Response(pdfArray, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'X-Processing-Time': `${totalTime}ms`,
        'X-Image-Count': images.length.toString(),
      }
    })

  } catch (error: any) {
    console.error('❌ Server-side PDF generation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate PDF',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
