import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

// PUT update manga with local file save
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const body = await request.json()
    
    console.log('Received body:', JSON.stringify(body, null, 2))

    // Get current manga data from list-from-files API
    const listResponse = await fetch('http://localhost:3000/api/komiku/list-from-files')
    if (!listResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch manga list' },
        { status: 500 }
      )
    }

    const listData = await listResponse.json()
    const currentManga = listData.data.manhwa.find((m: any) => m.slug === slug)
    
    if (!currentManga) {
      return NextResponse.json(
        { success: false, error: 'Manga not found' },
        { status: 404 }
      )
    }

    // Update manga with new data - prioritize request body over existing data
    const updatedManga = {
      ...currentManga,
      // Always use request body if provided, even if empty
      title: body.title !== undefined ? body.title : (currentManga.title || currentManga.manhwaTitle),
      manhwaTitle: body.manhwaTitle !== undefined ? body.manhwaTitle : (currentManga.manhwaTitle || currentManga.title),
      alternativeTitle: body.alternativeTitle !== undefined ? body.alternativeTitle : currentManga.alternativeTitle,
      url: body.url !== undefined ? body.url : (currentManga.url || currentManga.manhwaUrl),
      manhwaUrl: body.manhwaUrl !== undefined ? body.manhwaUrl : (currentManga.manhwaUrl || currentManga.url),
      image: body.image !== undefined ? body.image : currentManga.image,
      author: body.author !== undefined ? body.author : currentManga.author,
      type: body.type !== undefined ? body.type : currentManga.type,
      status: body.status !== undefined ? body.status : currentManga.status,
      released: body.released !== undefined ? body.released : currentManga.released,
      genres: body.genres !== undefined ? body.genres : currentManga.genres,
      synopsis: body.synopsis !== undefined ? body.synopsis : currentManga.synopsis,
      totalChapters: body.totalChapters !== undefined ? body.totalChapters : currentManga.totalChapters,
      lastUpdated: new Date().toISOString()
    }
    
    console.log('Updated manga:', JSON.stringify({
      title: updatedManga.title,
      author: updatedManga.author,
      status: updatedManga.status
    }, null, 2))

    // Save to local file system (for testing)
    try {
      const dataDir = join(process.cwd(), 'data', 'manga')
      mkdirSync(dataDir, { recursive: true })
      
      const filePath = join(dataDir, `${slug}.json`)
      writeFileSync(filePath, JSON.stringify(updatedManga, null, 2))
      
      console.log('Manga saved to local file:', filePath)
      
      return NextResponse.json({
        success: true,
        message: 'Manga updated and saved successfully to local file',
        manga: updatedManga,
        filePath: `/data/manga/${slug}.json`
      })
    } catch (fileError) {
      console.error('Error saving to local file:', fileError)
      
      // Fallback to memory only
      return NextResponse.json({
        success: true,
        message: 'Manga updated (memory only - file save failed)',
        manga: updatedManga,
        warning: 'File save failed, data updated in memory only'
      })
    }
  } catch (error) {
    console.error('Error updating manga:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET manga detail by slug (local file version)
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // Try to get manga from local file first
    const fs = require('fs')
    const path = require('path')
    const filePath = path.join(process.cwd(), 'data', 'manga', `${slug}.json`)
    
    let manga = null
    
    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8')
        manga = JSON.parse(fileContent)
        console.log('Manga loaded from local file:', slug)
      }
    } catch (fileError) {
      console.log('Local file not found, trying metadata...')
    }
    
    // Fallback to list-from-files API if local file doesn't exist
    if (!manga) {
      const listResponse = await fetch('http://localhost:3000/api/komiku/list-from-files')
      if (!listResponse.ok) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch manga list' },
          { status: 500 }
        )
      }

      const listData = await listResponse.json()
      manga = listData.data.manhwa.find((m: any) => m.slug === slug)
      
      if (!manga) {
        return NextResponse.json(
          { success: false, error: 'Manga not found' },
          { status: 404 }
        )
      }
      console.log('Manga loaded from metadata:', slug)
    }

    return NextResponse.json({
      success: true,
      manga
    })
  } catch (error) {
    console.error('Error fetching manga detail:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
