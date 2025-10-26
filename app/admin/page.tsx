'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { getSiteAnalytics, getTrendingManhwa, ViewStats } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'

interface IssueReport {
  id: string
  manhwa_title: string
  issue_type: string
  description: string
  status: string
  created_at: string
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalManhwa: 0,
    totalUsers: 0,
    totalComments: 0
  })
  const [trending, setTrending] = useState<ViewStats[]>([])
  const [reports, setReports] = useState<IssueReport[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'trending'>('overview')

  useEffect(() => {
    if (!authLoading) {
      // Check if user is admin (you can add admin check logic here)
      if (!user) {
        router.push('/')
        return
      }
      fetchData()
    }
  }, [user, authLoading])

  const fetchData = async () => {
    setLoading(true)
    
    try {
      // Fetch analytics with error handling
      try {
        const analyticsData = await getSiteAnalytics()
        setAnalytics(analyticsData)
      } catch (error) {
        console.error('Error fetching analytics:', error)
        // Use default values if error
      }

      // Fetch trending with error handling
      try {
        const trendingData = await getTrendingManhwa(10)
        setTrending(trendingData)
      } catch (error) {
        console.error('Error fetching trending:', error)
        setTrending([])
      }

      // Fetch reports with error handling
      try {
        const { data: reportsData } = await supabase
          .from('issue_reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)

        if (reportsData) {
          setReports(reportsData)
        }
      } catch (error) {
        console.error('Error fetching reports:', error)
        setReports([])
      }
    } catch (error) {
      console.error('Error in fetchData:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolveReport = async (reportId: string) => {
    await supabase
      .from('issue_reports')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString()
      })
      .eq('id', reportId)

    fetchData()
  }

  if (authLoading || loading) {
    return (
      <div className="py-8">
        <div className="container-custom">
          <div className="skeleton h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Manage and monitor your site</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-blue-100 text-sm font-medium">Total Views</h3>
              <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{analytics.totalViews.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-green-100 text-sm font-medium">Total Manhwa</h3>
              <svg className="w-8 h-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{analytics.totalManhwa.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-purple-100 text-sm font-medium">Total Comments</h3>
              <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{analytics.totalComments.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-red-100 text-sm font-medium">Pending Reports</h3>
              <svg className="w-8 h-8 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-white">{reports.filter(r => r.status === 'pending').length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'trending'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Trending
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'reports'
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Reports ({reports.filter(r => r.status === 'pending').length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'trending' && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Top 10 Trending Manhwa</h2>
            <div className="space-y-3">
              {trending.map((item, index) => (
                <div key={item.manhwa_slug} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-lg">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.manhwa_slug}</p>
                    <p className="text-sm text-slate-400">
                      {item.total_views.toLocaleString()} views • {item.unique_views.toLocaleString()} unique
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Issue Reports</h2>
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-medium">{report.manhwa_title}</h3>
                      <p className="text-sm text-slate-400">{report.issue_type}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.status === 'pending' 
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">{report.description}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                    {report.status === 'pending' && (
                      <button
                        onClick={() => handleResolveReport(report.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Mark as Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
