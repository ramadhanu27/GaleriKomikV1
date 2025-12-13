// Types for SoulScan API (https://www.sankavollerei.com/comic/soulscan/home)

export interface SoulScanSliderItem {
  title: string;
  chapter: string;
  description: string;
  imageUrl: string;
  url: string;
}

export interface SoulScanPopularItem {
  title: string;
  url: string;
  imageUrl: string;
  chapter: string;
  rating: string;
}

export interface SoulScanChapter {
  title: string;
  url: string;
  time: string;
}

export interface SoulScanLatestUpdate {
  title: string;
  url: string;
  imageUrl: string;
  chapters: SoulScanChapter[];
}

export interface SoulScanHomeResponse {
  creator: string;
  success: boolean;
  result: {
    slider: SoulScanSliderItem[];
    popularToday: SoulScanPopularItem[];
    latestUpdates: SoulScanLatestUpdate[];
  };
}

// Detail API Types
export interface SoulScanDetailChapter {
  number: string;
  title: string;
  date: string;
  url: string;
}

export interface SoulScanDetailResult {
  title: string;
  imageUrl: string;
  followed: string;
  details: {
    type: string;
    released: string;
    author: string;
    artist: string;
    postedOn: string;
    updatedOn: string;
    views: string;
  };
  alternativeNames: string;
  tags: string[];
  chapters: SoulScanDetailChapter[];
}

export interface SoulScanDetailResponse {
  creator: string;
  success: boolean;
  result: SoulScanDetailResult;
}

// Chapter API Types
export interface SoulScanChapterResult {
  title: string;
  description: string;
  imageUrls: string[];
  totalImages: number;
}

export interface SoulScanChapterResponse {
  creator: string;
  success: boolean;
  result: SoulScanChapterResult;
}

// Search API Types
export interface SoulScanSearchResult {
  title: string;
  imageUrl: string;
  chapter: string;
  rating: string;
  type: string;
  isHot: boolean;
  url: string;
}

export interface SoulScanSearchResponse {
  creator: string;
  success: boolean;
  results: SoulScanSearchResult[];
}

// Projects API Types
export interface SoulScanProjectResult {
  title: string;
  slug: string;
  url: string;
  imageUrl: string;
  latestChapter: string;
  updateTime: string;
}

export interface SoulScanProjectsPagination {
  currentPage: number;
  hasNextPage: boolean;
  nextPage: number;
}

export interface SoulScanProjectsResponse {
  creator: string;
  success: boolean;
  pagination: SoulScanProjectsPagination;
  results: SoulScanProjectResult[];
}

// Helper function to extract slug from URL
export function extractSlugFromUrl(url: string): string {
  // URL format: https://soulscans.my.id/manga/legend-of-star-general/
  const match = url.match(/\/manga\/([^\/]+)\/?$/);
  return match ? match[1] : "";
}

// Helper function to extract chapter slug from URL
export function extractChapterSlugFromUrl(url: string): string {
  // URL format: https://soulscans.my.id/legend-of-star-general-chapter-336/
  const match = url.match(/\/([^\/]+)\/?$/);
  return match ? match[1] : "";
}
