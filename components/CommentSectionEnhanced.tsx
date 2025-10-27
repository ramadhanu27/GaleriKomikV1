'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { addComment, getManhwaComments, deleteComment, Comment } from '@/lib/comments'
import { 
  toggleCommentLike, 
  addReply, 
  getCommentReplies, 
  editComment,
  getCommentLikesCount,
  getCommentRepliesCount,
  hasUserLikedComment 
} from '@/lib/commentActions'

interface CommentSectionEnhancedProps {
  manhwaSlug: string
  onAuthRequired?: () => void
}

export default function CommentSectionEnhanced({ manhwaSlug, onAuthRequired }: CommentSectionEnhancedProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [dbError, setDbError] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchComments()
  }, [manhwaSlug])

  const fetchComments = async () => {
    try {
      setLoading(true)
      setError('')
      setDbError(false)
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
      
      const dataPromise = getManhwaComments(manhwaSlug)
      const data = await Promise.race([dataPromise, timeoutPromise]) as Comment[]
      
      // Fetch likes and replies count for each comment
      const commentsWithStats = await Promise.all(
        data.map(async (comment) => {
          const [likesCount, repliesCount, userHasLiked] = await Promise.all([
            getCommentLikesCount(comment.id),
            getCommentRepliesCount(comment.id),
            user ? hasUserLikedComment(comment.id, user.id) : Promise.resolve(false)
          ])
          
          return {
            ...comment,
            likes_count: likesCount,
            replies_count: repliesCount,
            user_has_liked: userHasLiked
          }
        })
      )
      
      setComments(commentsWithStats)
      setDbError(false)
    } catch (error: any) {
      console.error('Error fetching comments:', error)
      setComments([])
      
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
    
    const tempComment: Comment = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      manhwa_slug: manhwaSlug,
      comment_text: trimmedComment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 0,
      replies_count: 0,
      user_has_liked: false,
      user: {
        username: user.username || user.email?.split('@')[0] || 'User',
        avatar_url: user.avatar_url
      }
    }

    setComments([tempComment, ...comments])
    setCommentText('')
    setError('')

    addComment(user.id, manhwaSlug, trimmedComment).then(result => {
      if (result.success && result.comment) {
        setComments(prev => 
          prev.map(c => c.id === tempComment.id ? { ...result.comment!, likes_count: 0, replies_count: 0, user_has_liked: false } : c)
        )
      } else {
        setComments(prev => prev.filter(c => c.id !== tempComment.id))
        setError(result.error || 'Gagal mengirim komentar')
        setCommentText(trimmedComment)
      }
    })
  }

  const handleLike = async (commentId: string) => {
    if (!user) {
      onAuthRequired?.()
      return
    }

    // Optimistic update
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const newLiked = !c.user_has_liked
        return {
          ...c,
          user_has_liked: newLiked,
          likes_count: (c.likes_count || 0) + (newLiked ? 1 : -1)
        }
      }
      return c
    }))

    const result = await toggleCommentLike(commentId, user.id)
    
    if (!result.success) {
      // Revert on error
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          const newLiked = !c.user_has_liked
          return {
            ...c,
            user_has_liked: newLiked,
            likes_count: (c.likes_count || 0) + (newLiked ? 1 : -1)
          }
        }
        return c
      }))
    }
  }

  const handleReply = async (parentId: string, replyText: string) => {
    if (!user) {
      onAuthRequired?.()
      return
    }

    if (!replyText.trim()) return

    const result = await addReply(user.id, manhwaSlug, replyText.trim(), parentId)
    
    if (result.success) {
      // Increment replies count
      setComments(prev => prev.map(c => 
        c.id === parentId 
          ? { ...c, replies_count: (c.replies_count || 0) + 1 }
          : c
      ))
      setReplyingTo(null)
      
      // Expand replies to show the new one
      setExpandedReplies(prev => new Set(prev).add(parentId))
    }
  }

  const handleEdit = async (commentId: string) => {
    if (!user) return
    if (!editText.trim()) return

    const result = await editComment(commentId, user.id, editText.trim())
    
    if (result.success) {
      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, comment_text: editText.trim(), is_edited: true }
          : c
      ))
      setEditingId(null)
      setEditText('')
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!user) return
    if (!confirm('Hapus komentar ini?')) return

    const result = await deleteComment(commentId, user.id)

    if (result.success) {
      setComments(comments.filter(c => c.id !== commentId))
    }
  }

  const toggleReplies = async (commentId: string) => {
    const newExpanded = new Set(expandedReplies)
    
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId)
    } else {
      newExpanded.add(commentId)
      
      // Fetch replies if not already loaded
      const comment = comments.find(c => c.id === commentId)
      if (comment && !comment.replies) {
        const replies = await getCommentReplies(commentId)
        setComments(prev => prev.map(c => 
          c.id === commentId ? { ...c, replies } : c
        ))
      }
    }
    
    setExpandedReplies(newExpanded)
  }

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else {
      return (b.likes_count || 0) - (a.likes_count || 0)
    }
  })

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

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-12 mt-3' : ''} p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors`}>
      <div className="flex gap-3">
        {/* Avatar */}
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
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-semibold text-white flex items-center gap-2">
                {comment.user?.username || 'User'}
                {comment.is_edited && (
                  <span className="text-xs text-slate-500">(edited)</span>
                )}
              </p>
              <p className="text-xs text-slate-400">{getTimeAgo(comment.created_at)}</p>
            </div>
            
            {/* Actions Menu */}
            {user && user.id === comment.user_id && (
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditingId(comment.id)
                    setEditText(comment.comment_text)
                  }}
                  className="p-1 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded transition-colors"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="p-1 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded transition-colors"
                  title="Hapus"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Comment Text or Edit Form */}
          {editingId === comment.id ? (
            <div className="mb-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm resize-none focus:ring-2 focus:ring-primary-500 outline-none"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleEdit(comment.id)}
                  className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded transition-colors"
                >
                  Simpan
                </button>
                <button
                  onClick={() => {
                    setEditingId(null)
                    setEditText('')
                  }}
                  className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white text-sm rounded transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-300 whitespace-pre-wrap break-words mb-3">{comment.comment_text}</p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 text-sm">
            {/* Like Button */}
            <button
              onClick={() => handleLike(comment.id)}
              className={`flex items-center gap-1.5 ${
                comment.user_has_liked 
                  ? 'text-red-400 hover:text-red-300' 
                  : 'text-slate-400 hover:text-slate-300'
              } transition-colors`}
            >
              <svg className={`w-4 h-4 ${comment.user_has_liked ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{comment.likes_count || 0}</span>
            </button>

            {/* Reply Button */}
            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Balas</span>
              </button>
            )}

            {/* View Replies */}
            {!isReply && comment.replies_count! > 0 && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="flex items-center gap-1.5 text-primary-400 hover:text-primary-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{comment.replies_count} balasan</span>
                <svg className={`w-3 h-3 transition-transform ${expandedReplies.has(comment.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="mt-3">
              <textarea
                placeholder="Tulis balasan..."
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleReply(comment.id, e.currentTarget.value)
                    e.currentTarget.value = ''
                  }
                }}
              />
              <p className="text-xs text-slate-500 mt-1">Tekan Enter untuk kirim, Shift+Enter untuk baris baru</p>
            </div>
          )}

          {/* Replies */}
          {expandedReplies.has(comment.id) && comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
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

        {/* Sort Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('newest')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              sortBy === 'newest' 
                ? 'bg-primary-600 text-white' 
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Terbaru
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              sortBy === 'popular' 
                ? 'bg-primary-600 text-white' 
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Populer
          </button>
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
              <li>Run script dari file <code className="bg-slate-700 px-1 rounded">add-comment-features.sql</code></li>
              <li>Refresh halaman ini</li>
            </ol>
          </div>
        </div>
      ) : sortedComments.length > 0 ? (
        <div className="space-y-4">
          {sortedComments.filter(c => !c.parent_id).map(comment => renderComment(comment))}
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
