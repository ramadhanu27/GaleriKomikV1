'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface AnalyticsData {
  overview: {
    totalUsers: number
    totalManga: number
    totalBookmarks: number
    totalComments: number
    activeUsersToday: number
    activeUsersThisWeek: number
    activeUsersThisMonth: number
    newUsersToday: number
    newUsersThisWeek: number
    newUsersThisMonth: number
  }
  userActivity: {
    daily: Array<{ date: string; users: number; newUsers: number }>
    weekly: Array<{ week: string; users: number; newUsers: number }>
    monthly: Array<{ month: string; users: number; newUsers: number }>
  }
  popularManga: Array<{
    slug: string
    title: string
    views: number
    bookmarks: number
    comments: number
    rating: number
  }>
  userEngagement: {
    avgSessionDuration: number
    pagesPerSession: number
    bounceRate: number
    returnUserRate: number
  }
  systemStats: {
    serverUptime: number
    apiCallsToday: number
    storageUsed: number
    cacheHitRate: number
  }
}

const AnalyticsDashboard = () => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [activityView, setActivityView] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user && user.email !== 'admin@arkomik.com') {
      router.push('/')
      return
    }

    fetchAnalytics()
  }, [user, loading, router, timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoadingData(true)
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      
      if (data.success) {
        setAnalyticsData(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoadingData(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatPercentage = (num: number) => {
    return num.toFixed(1) + '%'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive analytics and insights for your platform</p>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {loadingData ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : analyticsData ? (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.overview.totalUsers)}</p>
                  <p className="text-xs text-green-600 mt-1">
                    +{analyticsData.overview.newUsersToday} today
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Manga</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.overview.totalManga)}</p>
                  <p className="text-xs text-gray-500 mt-1">Available titles</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookmarks</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.overview.totalBookmarks)}</p>
                  <p className="text-xs text-gray-500 mt-1">User saves</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Comments</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.overview.totalComments)}</p>
                  <p className="text-xs text-gray-500 mt-1">User interactions</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* User Activity Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">User Activity</h2>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setActivityView(view)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      activityView === view
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="h-64">
              {/* Simple bar chart representation */}
              <div className="flex items-end justify-between h-full px-2">
                {analyticsData.userActivity[activityView].slice(-7).map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="w-full flex flex-col items-center">
                      <div 
                        className="bg-blue-600 w-8 rounded-t"
                        style={{ 
                          height: `${(item.users / Math.max(...analyticsData.userActivity[activityView].map(d => d.users))) * 200}px` 
                        }}
                      ></div>
                      <div 
                        className="bg-green-500 w-8 rounded-t mt-1"
                        style={{ 
                          height: `${(item.newUsers / Math.max(...analyticsData.userActivity[activityView].map(d => d.newUsers))) * 50}px` 
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {activityView === 'daily' ? formatDate((item as any).date) : (item as any).week || (item as any).month}
                    </p>
                    <p className="text-xs text-gray-500">{item.users}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>Active Users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>New Users</span>
                </div>
              </div>
            </div>
          </div>

          {/* Popular Manga & User Engagement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Manga */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Manga</h2>
              <div className="space-y-3">
                {analyticsData.popularManga.slice(0, 5).map((manga, index) => (
                  <div key={manga.slug} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-gray-900">{manga.title}</p>
                        <p className="text-sm text-gray-500">
                          {formatNumber(manga.views)} views • {manga.bookmarks} bookmarks
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium">{manga.rating}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* User Engagement */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Engagement</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Avg. Session Duration</p>
                    <p className="text-sm text-gray-500">Time spent per visit</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {analyticsData.userEngagement.avgSessionDuration}m
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Pages per Session</p>
                    <p className="text-sm text-gray-500">Average pages viewed</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {analyticsData.userEngagement.pagesPerSession}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Bounce Rate</p>
                    <p className="text-sm text-gray-500">Single page visits</p>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    {formatPercentage(analyticsData.userEngagement.bounceRate)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Return User Rate</p>
                    <p className="text-sm text-gray-500">Users coming back</p>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    {formatPercentage(analyticsData.userEngagement.returnUserRate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* System Stats */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <svg className="w-8 h-8 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-600">Server Uptime</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.systemStats.serverUptime} days</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <svg className="w-8 h-8 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-sm text-gray-600">API Calls Today</p>
                <p className="text-lg font-bold text-gray-900">{formatNumber(analyticsData.systemStats.apiCallsToday)}</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <svg className="w-8 h-8 text-yellow-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                <p className="text-sm text-gray-600">Storage Used</p>
                <p className="text-lg font-bold text-gray-900">{analyticsData.systemStats.storageUsed} GB</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <svg className="w-8 h-8 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-600">Cache Hit Rate</p>
                <p className="text-lg font-bold text-gray-900">{formatPercentage(analyticsData.systemStats.cacheHitRate)}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AnalyticsDashboard
