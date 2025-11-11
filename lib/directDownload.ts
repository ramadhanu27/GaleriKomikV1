/**
 * Direct Download Helper
 * Generate server-side PDF and trigger browser/IDM download
 */

export interface DirectDownloadOptions {
  manhwaTitle: string;
  manhwaSlug: string;
  chapterNumber: string;
  images: string[];
}

/**
 * Trigger direct download via server-side API
 * Browser/IDM will detect the download URL automatically
 */
export async function downloadChapterDirect(options: DirectDownloadOptions): Promise<void> {
  const { manhwaTitle, chapterNumber, images } = options;

  // Build URL with query parameters
  const params = new URLSearchParams();
  params.append('chapter', chapterNumber);
  params.append('title', manhwaTitle);
  
  // Add all image URLs
  images.forEach((img) => params.append('img', img));

  // Create download URL
  const downloadUrl = `/api/chapter/download?${params.toString()}`;

  console.log(`🚀 Triggering direct download for Chapter ${chapterNumber}`);
  console.log(`📦 Total images: ${images.length}`);
  console.log(`🔗 Download URL: ${downloadUrl}`);

  // Open in new tab - browser/IDM will detect and download
  window.open(downloadUrl, '_blank');
}

/**
 * Check if direct download is supported
 */
export function isDirectDownloadSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.open === 'function';
}
