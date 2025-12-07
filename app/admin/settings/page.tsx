'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

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

const AdminSettings = () => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'site' | 'features' | 'limits' | 'security' | 'notifications'>('site')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user && user.email !== 'admin@arkomik.com') {
      router.push('/')
      return
    }

    fetchSettings()
  }, [user, loading, router])

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true)
      const response = await fetch('/api/admin/settings')
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const data = await response.json()
      
      if (data.success) {
        setSettings(data.settings)
      } else {
        throw new Error(data.error || 'Failed to fetch settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoadingSettings(false)
    }
  }

  const updateSettings = async (category: string, categorySettings: any) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          settings: categorySettings
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      const data = await response.json()
      
      if (data.success) {
        setSuccess(`${category.charAt(0).toUpperCase() + category.slice(1)} settings updated successfully`)
        await fetchSettings()
      } else {
        throw new Error(data.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = async (category?: string) => {
    if (!confirm(`Are you sure you want to reset ${category || 'all'} settings to default? This action cannot be undone.`)) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category })
      })

      if (!response.ok) {
        throw new Error('Failed to reset settings')
      }

      const data = await response.json()
      
      if (data.success) {
        setSuccess(`${category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All'} settings reset to default`)
        await fetchSettings()
      } else {
        throw new Error(data.error || 'Failed to reset settings')
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to reset settings')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (category: string, field: string, value: any) => {
    if (settings) {
      setSettings({
        ...settings,
        [category]: {
          ...settings[category as keyof SystemSettings],
          [field]: value
        }
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
        <p className="text-gray-600">Configure and manage system-wide settings</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Settings Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {(['site', 'features', 'limits', 'security', 'notifications'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {loadingSettings ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : settings ? (
            <>
              {/* Site Settings */}
              {activeTab === 'site' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Site Configuration</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site Name
                      </label>
                      <input
                        type="text"
                        value={settings.site.name}
                        onChange={(e) => handleInputChange('site', 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={settings.site.contactEmail}
                        onChange={(e) => handleInputChange('site', 'contactEmail', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo URL
                      </label>
                      <input
                        type="text"
                        value={settings.site.logo}
                        onChange={(e) => handleInputChange('site', 'logo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Favicon URL
                      </label>
                      <input
                        type="text"
                        value={settings.site.favicon}
                        onChange={(e) => handleInputChange('site', 'favicon', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Description
                    </label>
                    <textarea
                      value={settings.site.description}
                      onChange={(e) => handleInputChange('site', 'description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site Announcement
                    </label>
                    <textarea
                      value={settings.site.announcement}
                      onChange={(e) => handleInputChange('site', 'announcement', e.target.value)}
                      rows={3}
                      placeholder="Display announcement to all users (leave empty to disable)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={settings.site.maintenanceMode}
                      onChange={(e) => handleInputChange('site', 'maintenanceMode', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
                      Enable Maintenance Mode
                    </label>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => resetSettings('site')}
                      disabled={saving}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Reset to Default
                    </button>
                    <button
                      onClick={() => updateSettings('site', settings.site)}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* Features Settings */}
              {activeTab === 'features' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Feature Toggles</h2>
                  
                  <div className="space-y-4">
                    {Object.entries(settings.features).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="text-sm font-medium text-gray-900">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                          <p className="text-sm text-gray-500">
                            {key === 'registrationEnabled' && 'Allow new users to register accounts'}
                            {key === 'commentsEnabled' && 'Enable commenting system on manga pages'}
                            {key === 'bookmarksEnabled' && 'Allow users to bookmark manga'}
                            {key === 'pdfDownloadEnabled' && 'Enable PDF download for chapters'}
                            {key === 'searchEnabled' && 'Enable search functionality'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleInputChange('features', key, !value)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            value ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => resetSettings('features')}
                      disabled={saving}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Reset to Default
                    </button>
                    <button
                      onClick={() => updateSettings('features', settings.features)}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* Limits Settings */}
              {activeTab === 'limits' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">User Limits & Restrictions</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Bookmarks per User
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={settings.limits.maxBookmarksPerUser}
                        onChange={(e) => handleInputChange('limits', 'maxBookmarksPerUser', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Comments per Day
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={settings.limits.maxCommentsPerDay}
                        onChange={(e) => handleInputChange('limits', 'maxCommentsPerDay', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max PDF Chapters per Download
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={settings.limits.maxPdfChapters}
                        onChange={(e) => handleInputChange('limits', 'maxPdfChapters', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        File Upload Size Limit (bytes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={settings.limits.uploadFileSizeLimit}
                        onChange={(e) => handleInputChange('limits', 'uploadFileSizeLimit', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Current: {(settings.limits.uploadFileSizeLimit / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => resetSettings('limits')}
                      disabled={saving}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Reset to Default
                    </button>
                    <button
                      onClick={() => updateSettings('limits', settings.limits)}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Security Configuration</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (seconds)
                      </label>
                      <input
                        type="number"
                        min="300"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Current: {Math.floor(settings.security.sessionTimeout / 86400)} days
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Login Attempts
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={settings.security.maxLoginAttempts}
                        onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Password Length
                      </label>
                      <input
                        type="number"
                        min="6"
                        max="20"
                        value={settings.security.passwordMinLength}
                        onChange={(e) => handleInputChange('security', 'passwordMinLength', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="requireEmailVerification"
                        checked={settings.security.requireEmailVerification}
                        onChange={(e) => handleInputChange('security', 'requireEmailVerification', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="requireEmailVerification" className="ml-2 block text-sm text-gray-900">
                        Require Email Verification
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableTwoFactor"
                        checked={settings.security.enableTwoFactor}
                        onChange={(e) => handleInputChange('security', 'enableTwoFactor', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="enableTwoFactor" className="ml-2 block text-sm text-gray-900">
                        Enable Two-Factor Authentication
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => resetSettings('security')}
                      disabled={saving}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Reset to Default
                    </button>
                    <button
                      onClick={() => updateSettings('security', settings.security)}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
                  
                  <div className="space-y-4">
                    {Object.entries(settings.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="text-sm font-medium text-gray-900">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                          <p className="text-sm text-gray-500">
                            {key === 'emailNotifications' && 'Enable email notifications for users'}
                            {key === 'newCommentNotifications' && 'Notify users of new comments on their bookmarked manga'}
                            {key === 'newBookmarkNotifications' && 'Notify users when someone bookmarks their content'}
                            {key === 'systemUpdateNotifications' && 'Send notifications about system updates and maintenance'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleInputChange('notifications', key, !value)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            value ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => resetSettings('notifications')}
                      disabled={saving}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Reset to Default
                    </button>
                    <button
                      onClick={() => updateSettings('notifications', settings.notifications)}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
