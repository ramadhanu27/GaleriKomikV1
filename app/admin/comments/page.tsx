'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Comment {
  id: string
  user_id: string
  user_email: string
  manhwa_slug: string
  manhwa_title: string
  content: string
  created_at: string
  status: 'approved' | 'pending' | 'deleted'
  reported: boolean
  report_count: number
}

export default function CommentModerator() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'reported'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const itemsPerPage = 20

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user && user.email !== 'admin@arkomik.com') {
      router.push('/')
      return
    }

    fetchComments()
  }, [user, loading, router])

  const fetchComments = async () => {
    try {
      const response = await fetch('/api/admin/comments')
      const data = await response.json()
      
      if (data.success) {
        setComments(data.comments)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingData(false)
    }
  }

  // Filter comments
  const filteredComments = comments.filter(comment => {
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'pending' && comment.status === 'pending') ||
      (filter === 'approved' && comment.status === 'approved') ||
      (filter === 'reported' && comment.reported)
    
    const matchesSearch = 
      comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comment.manhwa_title.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  // Pagination
  const totalPages = Math.ceil(filteredComments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentComments = filteredComments.slice(startIndex, endIndex)

  const handleApprove = async (commentId: string) => {
    try {
      const response = await fetch(`/api/admin/comments/${commentId}/approve`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        await fetchComments()
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error approving comment:', error)
      alert('Failed to approve comment')
    }
  }

  const handleDelete = (comment: Comment) => {
    setSelectedComment(comment)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedComment) return

    try {
      const response = await fetch(`/api/admin/comments/${selectedComment.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        await fetchComments()
        setShowDeleteModal(false)
        setSelectedComment(null)
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const getStatusColor = (status: string, reported: boolean) => {
    if (reported) return 'bg-red-500/20 border-red-500/50 text-red-400'
    if (status === 'approved') return 'bg-green-500/20 border-green-500/50 text-green-400'
    if (status === 'pending') return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
    return 'bg-slate-500/20 border-slate-500/50 text-slate-400'
  }

  const getStatusText = (status: string, reported: boolean) => {
    if (reported) return 'REPORTED'
    if (status === 'approved') return 'APPROVED'
    if (status === 'pending') return 'PENDING'
    return 'DELETED'
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading comments...</p>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-white">Comment Moderation</h1>
            </div>
            <p className="text-slate-400">Moderate user comments and reports</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Filter Tabs */}
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'approved', label: 'Approved' },
              { key: 'reported', label: 'Reported' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  setFilter(key as any)
                  setCurrentPage(1)
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === key
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search comments, users, or manhwa..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-4 py-2.5 bg-slate-700/50 border-2 border-slate-600 text-white placeholder-slate-400 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {currentComments.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border-2 border-slate-700">
              <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-slate-400">
                {searchQuery ? 'No comments found matching your search' : 'No comments found'}
              </p>
            </div>
          ) : (
            currentComments.map((comment) => (
              <div
                key={comment.id}
                className="bg-slate-800/50 border-2 border-slate-700 rounded-xl p-6 transition-all hover:bg-slate-800/70"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(comment.status, comment.reported)}`}>
                        {getStatusText(comment.status, comment.reported)}
                      </span>
                      <span className="text-sm text-slate-500">
                        {getRelativeTime(comment.created_at)}
                      </span>
                      {comment.report_count > 0 && (
                        <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-xs font-medium">
                          {comment.report_count} reports
                        </span>
                      )}
                    </div>

                    {/* User and Manhwa Info */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-sm">
                        <span className="text-slate-400">User: </span>
                        <span className="text-white font-medium">{comment.user_email}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-400">On: </span>
                        <Link 
                          href={`/manhwa/${comment.manhwa_slug}`}
                          className="text-primary-400 hover:text-primary-300 font-medium"
                        >
                          {comment.manhwa_title}
                        </Link>
                      </div>
                    </div>

                    {/* Comment Content */}
                    <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                      <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {comment.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(comment.id)}
                          className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 rounded-lg transition-all text-sm font-medium"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(comment)}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg transition-all text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ← Prev
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next →
            </button>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedComment && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl border-2 border-slate-700 max-w-2xl w-full">
              <div className="p-6 border-b border-slate-700">
                <h2 className="text-2xl font-bold text-white">Delete Comment</h2>
                <p className="text-slate-400 mt-1">Are you sure you want to delete this comment?</p>
              </div>
              
              <div className="p-6">
                <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-slate-400 mb-2">
                    User: {selectedComment.user_email} • On: {selectedComment.manhwa_title}
                  </div>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedComment.content}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all"
                  >
                    Delete Comment
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setSelectedComment(null)
                    }}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
