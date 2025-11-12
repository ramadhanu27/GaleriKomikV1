'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface DashboardStats {
  totalUsers: number
  totalManhwa: number
  totalComments: number
  totalBookmarks: number
  recentUsers: number
  activeToday: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    // Check if user is admin
    if (user && user.email !== 'admin@arkomik.com') {
      router.push('/')
      return
    }

    // Fetch dashboard stats
    fetchStats()
  }, [user, loading, router])

  const fetchStats = async () => {
    try {
      console.log('🔍 Admin: Fetching stats...')
      const response = await fetch('/api/admin/stats')
      console.log('🔍 Admin: Response status:', response.status)
      
      const data = await response.json()
      console.log('🔍 Admin: Response data:', data)
      
      if (data.success) {
        console.log('🔍 Admin: Setting stats:', data.stats)
        setStats(data.stats)
      } else {
        console.error('🔍 Admin: API error:', data.error)
      }
    } catch (error) {
      console.error('🔍 Admin: Fetch error:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Welcome back, {user.email}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-xs text-blue-400 font-medium">USERS</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats?.totalUsers || 0}</div>
            <p className="text-sm text-slate-400">Total registered users</p>
          </div>

          {/* Total Manhwa */}
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-xs text-purple-400 font-medium">MANHWA</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats?.totalManhwa || 0}</div>
            <p className="text-sm text-slate-400">Total manhwa available</p>
          </div>

          {/* Total Comments */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-xs text-green-400 font-medium">COMMENTS</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats?.totalComments || 0}</div>
            <p className="text-sm text-slate-400">Total comments posted</p>
          </div>

          {/* Total Bookmarks */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-2 border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <span className="text-xs text-yellow-400 font-medium">BOOKMARKS</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats?.totalBookmarks || 0}</div>
            <p className="text-sm text-slate-400">Total bookmarks saved</p>
          </div>

          {/* Recent Users */}
          <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/10 border-2 border-pink-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <span className="text-xs text-pink-400 font-medium">NEW</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats?.recentUsers || 0}</div>
            <p className="text-sm text-slate-400">New users (7 days)</p>
          </div>

          {/* Active Today */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-2 border-cyan-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xs text-cyan-400 font-medium">ACTIVE</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats?.activeToday || 0}</div>
            <p className="text-sm text-slate-400">Active users today</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/announcements"
            className="group bg-slate-800/50 hover:bg-slate-800 border-2 border-slate-700 hover:border-primary-500 rounded-xl p-6 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Announcements</h3>
                <p className="text-sm text-slate-400">Manage site announcements</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="group bg-slate-800/50 hover:bg-slate-800 border-2 border-slate-700 hover:border-primary-500 rounded-xl p-6 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Users</h3>
                <p className="text-sm text-slate-400">Manage users & bans</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/comments"
            className="group bg-slate-800/50 hover:bg-slate-800 border-2 border-slate-700 hover:border-primary-500 rounded-xl p-6 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Comments</h3>
                <p className="text-sm text-slate-400">Moderate comments</p>
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="group bg-slate-800/50 hover:bg-slate-800 border-2 border-slate-700 hover:border-red-500 rounded-xl p-6 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Back to Site</h3>
                <p className="text-sm text-slate-400">Return to homepage</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
