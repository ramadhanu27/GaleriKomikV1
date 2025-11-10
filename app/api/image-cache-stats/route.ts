import { NextResponse } from 'next/server'

// Import cache stats from image-to-base64
// Note: This is a simple endpoint to view cache statistics

export async function GET() {
  // Since we can't directly access the cache from another module,
  // we'll return a message to check the console logs
  return NextResponse.json({
    success: true,
    message: 'Cache stats are logged in the console when images are fetched',
    note: 'Check server console for cache hit/miss rates and size'
  })
}
