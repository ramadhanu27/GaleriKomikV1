'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface ReportIssueProps {
  manhwaSlug: string
  manhwaTitle: string
  chapterId?: string
  onAuthRequired?: () => void
}

export default function ReportIssue({ manhwaSlug, manhwaTitle, chapterId, onAuthRequired }: ReportIssueProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [issueType, setIssueType] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const issueTypes = [
    'Broken Images',
    'Missing Chapter',
    'Wrong Order',
    'Duplicate Chapter',
    'Wrong Translation',
    'Other'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      onAuthRequired?.()
      return
    }

    if (!issueType || !description.trim()) {
      setError('Please select issue type and provide description')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          manhwa_slug: manhwaSlug,
          manhwa_title: manhwaTitle,
          chapter_id: chapterId,
          issue_type: issueType,
          description: description.trim()
        })
      })

      if (response.ok) {
        setSuccess(true)
        setIssueType('')
        setDescription('')
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
        }, 2000)
      } else {
        setError('Failed to submit report')
      }
    } catch (error) {
      setError('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Report Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-all border border-red-600/30"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Report Issue
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Report Issue</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white font-semibold mb-2">Report Submitted!</p>
                <p className="text-slate-400 text-sm">Thank you for helping us improve</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Manhwa Info */}
                <div className="bg-slate-700/30 rounded-lg p-3">
                  <p className="text-sm text-slate-400">Reporting for:</p>
                  <p className="text-white font-medium">{manhwaTitle}</p>
                  {chapterId && <p className="text-sm text-slate-400">Chapter: {chapterId}</p>}
                </div>

                {/* Issue Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Issue Type *
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select issue type</option>
                    {issueTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    placeholder="Please describe the issue in detail..."
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">{description.length}/500 characters</p>
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
