'use client'

import { useState, useEffect } from 'react'
import { Download, Trash2, FolderOpen, Clock } from 'lucide-react'

interface DownloadHistoryItem {
  id: string
  manhwaTitle: string
  chapterNumber: string
  format: string
  size: number
  downloadedAt: number
  status: 'completed' | 'failed'
}

export default function DownloadHistoryPanel() {
  const [history, setHistory] = useState<DownloadHistoryItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load history from localStorage
    const savedHistory = localStorage.getItem('download-history')
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    }
  }, [])

  const clearHistory = () => {
    if (confirm('Hapus semua riwayat download?')) {
      localStorage.removeItem('download-history')
      setHistory([])
    }
  }

  const deleteItem = (id: string) => {
    const newHistory = history.filter(item => item.id !== id)
    setHistory(newHistory)
    localStorage.setItem('download-history', JSON.stringify(newHistory))
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'Baru saja'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const totalSize = history.reduce((sum, item) => sum + item.size, 0)
  const completedCount = history.filter(item => item.status === 'completed').length

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 p-3 sm:p-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-full shadow-2xl shadow-purple-900/50 transition-all transform hover:scale-110 group"
        title="Download History"
      >
        <div className="relative">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          {history.length > 0 && (
            <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
              {history.length > 9 ? '9+' : history.length}
            </span>
          )}
        </div>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-32 sm:bottom-40 right-2 sm:right-6 z-50 w-[calc(100vw-1rem)] sm:w-96 max-h-[70vh] sm:max-h-[600px] bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl border-2 border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5 sm:gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate">Riwayat Download</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-purple-100 mt-0.5 sm:mt-1 truncate">
                  {completedCount} berhasil • {formatSize(totalSize)} total
                </p>
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                  title="Hapus Semua"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[calc(70vh-80px)] sm:max-h-[500px] overflow-y-auto">
            {history.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <FolderOpen className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600 mx-auto mb-3 sm:mb-4" />
                <p className="text-slate-400 text-xs sm:text-sm">Belum ada riwayat download</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 sm:p-4 hover:bg-slate-700/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                          {item.manhwaTitle}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
                          Chapter {item.chapterNumber} • {item.format.toUpperCase()}
                        </p>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                          <span className="text-[10px] sm:text-xs text-slate-500">
                            {formatSize(item.size)}
                          </span>
                          <span className="text-[10px] sm:text-xs text-slate-500">
                            {formatDate(item.downloadedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {item.status === 'completed' ? (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Download className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                            <span className="text-red-400 text-[10px] sm:text-xs">✕</span>
                          </div>
                        )}
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 sm:p-1.5 hover:bg-slate-600 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// Helper function to add download to history
export function addToDownloadHistory(item: Omit<DownloadHistoryItem, 'id' | 'downloadedAt'>) {
  const history = JSON.parse(localStorage.getItem('download-history') || '[]')
  const newItem: DownloadHistoryItem = {
    ...item,
    id: Date.now().toString(),
    downloadedAt: Date.now()
  }
  history.unshift(newItem)
  // Keep only last 50 items
  const trimmed = history.slice(0, 50)
  localStorage.setItem('download-history', JSON.stringify(trimmed))
}
