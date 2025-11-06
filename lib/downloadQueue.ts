'use client'

interface DownloadTask {
  id: string
  manhwaTitle: string
  chapterNumber: string
  priority: 'high' | 'normal' | 'low'
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused'
  progress: number
  size: number
  downloadedSize: number
  speed: number // bytes per second
  estimatedTimeRemaining: number // seconds
  createdAt: number
  startedAt?: number
  completedAt?: number
  error?: string
  onProgress?: (progress: number) => void
  execute: () => Promise<void>
}

class DownloadQueue {
  private queue: DownloadTask[] = []
  private processing = false
  private maxConcurrent = 2 // Max 2 downloads at once
  private activeDownloads = 0
  private listeners: Set<(queue: DownloadTask[]) => void> = new Set()

  /**
   * Add task to queue
   */
  add(task: DownloadTask) {
    this.queue.push(task)
    this.notifyListeners()
    this.process()
  }

  /**
   * Add multiple tasks
   */
  addBatch(tasks: DownloadTask[]) {
    this.queue.push(...tasks)
    this.notifyListeners()
    this.process()
  }

  /**
   * Remove task from queue
   */
  remove(taskId: string) {
    this.queue = this.queue.filter(t => t.id !== taskId)
    this.notifyListeners()
  }

  /**
   * Pause task
   */
  pause(taskId: string) {
    const task = this.queue.find(t => t.id === taskId)
    if (task && task.status === 'downloading') {
      task.status = 'paused'
      this.notifyListeners()
    }
  }

  /**
   * Resume task
   */
  resume(taskId: string) {
    const task = this.queue.find(t => t.id === taskId)
    if (task && task.status === 'paused') {
      task.status = 'pending'
      this.notifyListeners()
      this.process()
    }
  }

  /**
   * Retry failed task
   */
  retry(taskId: string) {
    const task = this.queue.find(t => t.id === taskId)
    if (task && task.status === 'failed') {
      task.status = 'pending'
      task.progress = 0
      task.downloadedSize = 0
      task.error = undefined
      this.notifyListeners()
      this.process()
    }
  }

  /**
   * Clear completed tasks
   */
  clearCompleted() {
    this.queue = this.queue.filter(t => t.status !== 'completed')
    this.notifyListeners()
  }

  /**
   * Clear all tasks
   */
  clearAll() {
    this.queue = []
    this.notifyListeners()
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(t => t.status === 'pending').length,
      downloading: this.queue.filter(t => t.status === 'downloading').length,
      completed: this.queue.filter(t => t.status === 'completed').length,
      failed: this.queue.filter(t => t.status === 'failed').length,
      paused: this.queue.filter(t => t.status === 'paused').length,
    }
  }

  /**
   * Get all tasks
   */
  getTasks() {
    return [...this.queue]
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(listener: (queue: DownloadTask[]) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Process queue
   */
  private async process() {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0 && this.activeDownloads < this.maxConcurrent) {
      // Sort by priority
      const sortedQueue = this.queue
        .filter(t => t.status === 'pending')
        .sort((a, b) => {
          const priorityOrder = { high: 0, normal: 1, low: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })

      const task = sortedQueue[0]
      if (!task) break

      this.activeDownloads++
      task.status = 'downloading'
      task.startedAt = Date.now()
      this.notifyListeners()

      try {
        await task.execute()
        task.status = 'completed'
        task.completedAt = Date.now()
        task.progress = 100
      } catch (error) {
        task.status = 'failed'
        task.error = error instanceof Error ? error.message : 'Unknown error'
      } finally {
        this.activeDownloads--
        this.notifyListeners()
      }
    }

    this.processing = false

    // Continue processing if there are more tasks
    if (this.queue.some(t => t.status === 'pending') && this.activeDownloads < this.maxConcurrent) {
      this.process()
    }
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.queue]))
  }

  /**
   * Calculate total progress
   */
  getTotalProgress() {
    if (this.queue.length === 0) return 0
    const totalProgress = this.queue.reduce((sum, task) => sum + task.progress, 0)
    return Math.round(totalProgress / this.queue.length)
  }

  /**
   * Calculate total download speed
   */
  getTotalSpeed() {
    return this.queue
      .filter(t => t.status === 'downloading')
      .reduce((sum, task) => sum + task.speed, 0)
  }

  /**
   * Format speed
   */
  formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
    return `${(bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s`
  }

  /**
   * Format time
   */
  formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }
}

// Singleton instance
export const downloadQueue = new DownloadQueue()

// Helper function to create download task
export function createDownloadTask(
  manhwaTitle: string,
  chapterNumber: string,
  downloadFn: () => Promise<void>,
  options?: {
    priority?: 'high' | 'normal' | 'low'
    onProgress?: (progress: number) => void
  }
): DownloadTask {
  return {
    id: `${manhwaTitle}-${chapterNumber}-${Date.now()}`,
    manhwaTitle,
    chapterNumber,
    priority: options?.priority || 'normal',
    status: 'pending',
    progress: 0,
    size: 0,
    downloadedSize: 0,
    speed: 0,
    estimatedTimeRemaining: 0,
    createdAt: Date.now(),
    onProgress: options?.onProgress,
    execute: downloadFn,
  }
}

export type { DownloadTask }
