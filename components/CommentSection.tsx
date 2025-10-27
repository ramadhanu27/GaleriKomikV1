'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { addComment, getManhwaComments, deleteComment, Comment } from '@/lib/comments'

interface CommentSectionProps {
  manhwaSlug: string
  onAuthRequired?: () => void
}

export default function CommentSection({ manhwaSlug, onAuthRequired }: CommentSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [dbError, setDbError] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [manhwaSlug])

  const fetchComments = async () => {
    try {
      setLoading(true)
      setError('')
      setDbError(false)
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
      
      const dataPromise = getManhwaComments(manhwaSlug)
      
      const data = await Promise.race([dataPromise, timeoutPromise]) as Comment[]
      
      setComments(data || [])
      setDbError(false)
    } catch (error: any) {
      console.error('Error fetching comments:', error)
      setComments([])
      
      // Check if it's a database schema error
      if (error?.message?.includes('column') || error?.message?.includes('schema')) {
        setDbError(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      onAuthRequired?.()
      return
    }

    if (!commentText.trim()) {
      setError('Komentar tidak boleh kosong')
      return
    }

    const trimmedComment = commentText.trim()
    
    // Optimistic UI update - show comment immediately
    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      manhwa_slug: manhwaSlug,
      comment_text: trimmedComment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        username: user.username || user.email?.split('@')[0] || 'User',
        avatar_url: user.avatar_url
      }
    }

    // Add to UI immediately
    setComments([tempComment, ...comments])
    setCommentText('')
    setError('')

    // Send to server in background (don't block UI)
    addComment(user.id, manhwaSlug, trimmedComment).then(result => {
      if (result.success && result.comment) {
        // Replace temp comment with real one
        setComments(prev => 
          prev.map(c => c.id === tempComment.id ? result.comment! : c)
        )
      } else {
        // Remove temp comment on error
        setComments(prev => prev.filter(c => c.id !== tempComment.id))
        setError(result.error || 'Gagal mengirim komentar')
        setCommentText(trimmedComment) // Restore text
      }
    }).catch(error => {
      // Remove temp comment on error
      setComments(prev => prev.filter(c => c.id !== tempComment.id))
      setError('Terjadi kesalahan saat mengirim komentar')
      setCommentText(trimmedComment) // Restore text
    })
  }

  const handleDelete = async (commentId: string) => {
    if (!user) return
    if (!confirm('Hapus komentar ini?')) return

    const result = await deleteComment(commentId, user.id)

    if (result.success) {
      setComments(comments.filter(c => c.id !== commentId))
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffMinutes = Math.ceil(diffTime / (1000 * 60))
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffMinutes < 60) return `${diffMinutes} menit lalu`
    if (diffHours < 24) return `${diffHours} jam lalu`
    if (diffDays === 1) return '1 hari lalu'
    if (diffDays < 30) return `${diffDays} hari lalu`
    const diffMonths = Math.floor(diffDays / 30)
    return `${diffMonths} bulan lalu`
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Komentar</h3>
          <p className="text-sm text-slate-400">{comments.length} komentar</p>
        </div>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          {user && (
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">
                  {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          )}
          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={user ? "Tulis komentar..." : "Login untuk berkomentar"}
              disabled={!user || submitting}
              rows={3}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-slate-500">
                {commentText.length}/500 karakter
              </p>
              <button
                type="submit"
                disabled={!user || submitting || !commentText.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Kirim
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-700 rounded w-1/4"></div>
                <div className="h-16 bg-slate-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                {comment.user?.avatar_url ? (
                  <img src={comment.user.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-white">{comment.user?.username || 'User'}</p>
                    <p className="text-xs text-slate-400">{getTimeAgo(comment.created_at)}</p>
                  </div>
                  {user && user.id === comment.user_id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                      title="Hapus komentar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-slate-300 whitespace-pre-wrap break-words">{comment.comment_text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : dbError ? (
        <div className="text-center py-12 bg-red-500/10 rounded-lg border border-red-500/30">
          <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-400 font-semibold mb-2">Database Schema Error</p>
          <p className="text-sm text-slate-400 mb-4">
            Tabel comments belum memiliki kolom yang diperlukan.
          </p>
          <div className="text-left max-w-md mx-auto bg-slate-800/50 p-4 rounded-lg text-xs">
            <p className="text-slate-300 mb-2">Untuk memperbaiki:</p>
            <ol className="list-decimal list-inside text-slate-400 space-y-1">
              <li>Buka Supabase Dashboard → SQL Editor</li>
              <li>Run script dari file <code className="bg-slate-700 px-1 rounded">fix-comments-table.sql</code></li>
              <li>Refresh halaman ini</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-slate-400">Belum ada komentar</p>
          <p className="text-sm text-slate-500 mt-1">Jadilah yang pertama berkomentar!</p>
        </div>
      )}
    </div>
  )
}
