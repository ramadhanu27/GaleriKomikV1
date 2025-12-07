import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { decryptToken } from '@/lib/encryption'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface SystemSettings {
  site: {
    name: string
    description: string
    logo: string
    favicon: string
    contactEmail: string
    maintenanceMode: boolean
    announcement: string
  }
  features: {
    registrationEnabled: boolean
    commentsEnabled: boolean
    bookmarksEnabled: boolean
    pdfDownloadEnabled: boolean
    searchEnabled: boolean
  }
  limits: {
    maxBookmarksPerUser: number
    maxCommentsPerDay: number
    maxPdfChapters: number
    uploadFileSizeLimit: number
  }
  security: {
    sessionTimeout: number
    maxLoginAttempts: number
    passwordMinLength: number
    requireEmailVerification: boolean
    enableTwoFactor: boolean
  }
  notifications: {
    emailNotifications: boolean
    newCommentNotifications: boolean
    newBookmarkNotifications: boolean
    systemUpdateNotifications: boolean
  }
}

// GET - Fetch system settings
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies()
    const encryptedAccessToken = cookieStore.get('arkomik-access-token')?.value

    if (!encryptedAccessToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Decrypt the access token
    let accessToken: string
    try {
      accessToken = decryptToken(encryptedAccessToken)
    } catch (decryptError) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.email !== 'admin@arkomik.com') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 }
      )
    }

    // Fetch settings from database or return default settings
    const settings = await fetchSystemSettings()

    return NextResponse.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error('Error in settings GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update system settings
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies()
    const encryptedAccessToken = cookieStore.get('arkomik-access-token')?.value

    if (!encryptedAccessToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Decrypt the access token
    let accessToken: string
    try {
      accessToken = decryptToken(encryptedAccessToken)
    } catch (decryptError) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.email !== 'admin@arkomik.com') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { category, settings } = body

    // Validate settings
    if (!category || !settings) {
      return NextResponse.json(
        { success: false, error: 'Category and settings are required' },
        { status: 400 }
      )
    }

    // Update settings in database
    await updateSystemSettings(category, settings)

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      category
    })
  } catch (error) {
    console.error('Error in settings PUT:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Reset settings to default
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies()
    const encryptedAccessToken = cookieStore.get('arkomik-access-token')?.value

    if (!encryptedAccessToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Decrypt the access token
    let accessToken: string
    try {
      accessToken = decryptToken(encryptedAccessToken)
    } catch (decryptError) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.email !== 'admin@arkomik.com') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { category } = body

    // Reset specific category or all settings
    const defaultSettings = getDefaultSettings()
    const settingsToReset = category ? { [category]: defaultSettings[category as keyof SystemSettings] } : defaultSettings

    // Update in database
    for (const [cat, catSettings] of Object.entries(settingsToReset)) {
      await updateSystemSettings(cat, catSettings)
    }

    return NextResponse.json({
      success: true,
      message: `Settings reset to default for ${category || 'all categories'}`,
      settings: settingsToReset
    })
  } catch (error) {
    console.error('Error in settings POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function fetchSystemSettings(): Promise<SystemSettings> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Try to fetch settings from database
    const { data: settingsData, error } = await supabase
      .from('admin_settings')
      .select('category, settings')
      .in('category', ['site', 'features', 'limits', 'security', 'notifications'])

    if (error || !settingsData || settingsData.length === 0) {
      // Return default settings if no data found
      return getDefaultSettings()
    }

    // Merge settings from database
    const settings: any = {}
    settingsData.forEach(item => {
      settings[item.category] = item.settings
    })

    // Fill missing categories with defaults
    const defaultSettings = getDefaultSettings()
    return {
      ...defaultSettings,
      ...settings
    }
  } catch (error) {
    console.error('Error fetching system settings:', error)
    return getDefaultSettings()
  }
}

async function updateSystemSettings(category: string, settings: any) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Upsert settings
    const { error } = await supabase
      .from('admin_settings')
      .upsert({
        category,
        settings,
        updated_at: new Date().toISOString(),
        updated_by: 'admin@arkomik.com'
      }, {
        onConflict: 'category'
      })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error updating system settings:', error)
    throw error
  }
}

function getDefaultSettings(): SystemSettings {
  return {
    site: {
      name: 'ArKomik',
      description: 'Platform baca manga dan komik online terlengkap',
      logo: '/logo.png',
      favicon: '/favicon.ico',
      contactEmail: 'admin@arkomik.com',
      maintenanceMode: false,
      announcement: ''
    },
    features: {
      registrationEnabled: true,
      commentsEnabled: true,
      bookmarksEnabled: true,
      pdfDownloadEnabled: true,
      searchEnabled: true
    },
    limits: {
      maxBookmarksPerUser: 100,
      maxCommentsPerDay: 50,
      maxPdfChapters: 100,
      uploadFileSizeLimit: 10485760 // 10MB
    },
    security: {
      sessionTimeout: 604800, // 7 days in seconds
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireEmailVerification: false,
      enableTwoFactor: false
    },
    notifications: {
      emailNotifications: true,
      newCommentNotifications: true,
      newBookmarkNotifications: false,
      systemUpdateNotifications: true
    }
  }
}
