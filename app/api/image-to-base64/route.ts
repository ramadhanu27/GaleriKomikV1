import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Simple retry helper
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://komiku.org/',
        },
      })

      clearTimeout(timeout)

      // If rate limited, wait and retry
      if (response.status === 429 && i < maxRetries - 1) {
        const waitTime = (i + 1) * 2000 // 2s, 4s, 6s
        console.log(`⚠️ Rate limited, waiting ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        continue
      }

      return response
    } catch (error: any) {
      if (i === maxRetries - 1) throw error
      
      // Wait before retry
      const waitTime = (i + 1) * 1000 // 1s, 2s, 3s
      console.log(`🔄 Retry ${i + 1}/${maxRetries} after ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  throw new Error('Max retries reached')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing image URL' },
        { status: 400 }
      )
    }

    // Fetch the image with retry
    const response = await fetchWithRetry(imageUrl)

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      )
    }

    // Get image as buffer
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Convert to base64
    const base64 = buffer.toString('base64')
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const dataUrl = `data:${contentType};base64,${base64}`

    return NextResponse.json({
      success: true,
      data: {
        base64: dataUrl,
        contentType
      }
    })

  } catch (error: any) {
    console.error('Error converting image to base64:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}