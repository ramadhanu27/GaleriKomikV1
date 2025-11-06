'use client'

import { useState, useEffect } from 'react'
import { Download, Pause, Play, X, Trash2, RotateCcw, ListOrdered } from 'lucide-react'
import { downloadQueue, DownloadTask } from '@/lib/downloadQueue'

export default function DownloadQueuePanel() {
  const [tasks, setTasks] = useState<DownloadTask[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'downloading' | 'completed' | 'failed'>('all')

  useEffect(() => {
    const unsubscribe = downloadQueue.subscribe(setTasks)
    return () => {
      unsubscribe()
    }
  }, [])

  const status = downloadQueue.getStatus()
  const totalProgress = downloadQueue.getTotalProgress()
  const totalSpeed = downloadQueue.getTotalSpeed()

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    if (filter === 'downloading') return task.status === 'downloading' || task.status === 'pending'
    return task.status === filter
  })

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <>
      {/* Floating Button */}
      {tasks.length > 0 && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-36 sm:bottom-40 right-4 sm:right-6 z-50 p-3 sm:p-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-full shadow-2xl shadow-blue-900/50 transition-all transform hover:scale-110"
          title="Download Queue"
        >
          <div className="relative">
            <ListOrdered className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            {status.downloading > 0 && (
              <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-green-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center animate-pulse">
                {status.downloading}
              </span>
            )}
          </div>
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-48 sm:bottom-52 right-2 sm:right-6 z-50 w-[calc(100vw-1rem)] sm:w-[480px] max-h-[75vh] bg-slate-800 rounded-xl sm:rounded-2xl shadow-2xl border-2 border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5 sm:gap-2">
                  <ListOrdered className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="truncate">Download Queue</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-blue-100 mt-0.5 sm:mt-1">
                  {status.downloading} downloading • {status.completed} completed
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>

            {/* Overall Progress */}
            {status.downloading > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] sm:text-xs text-blue-100">
                  <span>Overall Progress</span>
                  <span>{totalProgress}%</span>
                </div>
                <div className="w-full bg-blue-900/50 rounded-full h-1.5 sm:h-2">
                  <div
                    className="bg-white rounded-full h-full transition-all duration-300"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
                <div className="text-[10px] sm:text-xs text-blue-100">
                  Speed: {downloadQueue.formatSpeed(totalSpeed)}
                </div>
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-2 sm:p-3 bg-slate-700/50 border-b border-slate-700 overflow-x-auto">
            {(['all', 'downloading', 'completed', 'failed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'all' && ` (${tasks.length})`}
                {f === 'downloading' && status.downloading > 0 && ` (${status.downloading})`}
                {f === 'completed' && status.completed > 0 && ` (${status.completed})`}
                {f === 'failed' && status.failed > 0 && ` (${status.failed})`}
              </button>
            ))}
          </div>

          {/* Task List */}
          <div className="max-h-[calc(75vh-200px)] overflow-y-auto">
            {filteredTasks.length === 0 ? (
              <div className="p-6 sm:p-8 text-center">
                <Download className="w-12 h-12 sm:w-16 sm:h-16 text-slate-600 mx-auto mb-3 sm:mb-4" />
                <p className="text-slate-400 text-xs sm:text-sm">No tasks in queue</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 sm:p-4 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                          {task.manhwaTitle}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-slate-400">
                          Chapter {task.chapterNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Status Badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            task.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : task.status === 'downloading'
                              ? 'bg-blue-500/20 text-blue-400'
                              : task.status === 'failed'
                              ? 'bg-red-500/20 text-red-400'
                              : task.status === 'paused'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          {task.status}
                        </span>

                        {/* Action Buttons */}
                        {task.status === 'downloading' && (
                          <button
                            onClick={() => downloadQueue.pause(task.id)}
                            className="p-1 hover:bg-slate-600 rounded transition-colors"
                            title="Pause"
                          >
                            <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300" />
                          </button>
                        )}
                        {task.status === 'paused' && (
                          <button
                            onClick={() => downloadQueue.resume(task.id)}
                            className="p-1 hover:bg-slate-600 rounded transition-colors"
                            title="Resume"
                          >
                            <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300" />
                          </button>
                        )}
                        {task.status === 'failed' && (
                          <button
                            onClick={() => downloadQueue.retry(task.id)}
                            className="p-1 hover:bg-slate-600 rounded transition-colors"
                            title="Retry"
                          >
                            <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300" />
                          </button>
                        )}
                        {(task.status === 'completed' || task.status === 'failed') && (
                          <button
                            onClick={() => downloadQueue.remove(task.id)}
                            className="p-1 hover:bg-slate-600 rounded transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {(task.status === 'downloading' || task.status === 'paused') && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{task.progress}%</span>
                          <span>
                            {formatSize(task.downloadedSize)} / {formatSize(task.size)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 rounded-full h-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        {task.status === 'downloading' && (
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>{downloadQueue.formatSpeed(task.speed)}</span>
                            <span>
                              ETA: {downloadQueue.formatTime(task.estimatedTimeRemaining)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error Message */}
                    {task.status === 'failed' && task.error && (
                      <p className="text-[10px] text-red-400 mt-1">{task.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {tasks.length > 0 && (
            <div className="border-t border-slate-700 p-2 sm:p-3 flex items-center justify-between gap-2 bg-slate-700/30">
              <button
                onClick={() => downloadQueue.clearCompleted()}
                disabled={status.completed === 0}
                className="px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Clear Completed
              </button>
              <button
                onClick={() => {
                  if (confirm('Clear all tasks?')) {
                    downloadQueue.clearAll()
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
