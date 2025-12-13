// LocalStorage bookmark utilities for SoulScan
export interface LocalBookmark {
  slug: string;
  title: string;
  imageUrl: string;
  type?: string;
  addedAt: string;
}

const BOOKMARK_KEY = "soulscan_bookmarks";

export const getBookmarks = (): LocalBookmark[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(BOOKMARK_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addBookmark = (bookmark: Omit<LocalBookmark, "addedAt">): boolean => {
  try {
    const bookmarks = getBookmarks();
    if (bookmarks.some((b) => b.slug === bookmark.slug)) {
      return false;
    }
    bookmarks.unshift({ ...bookmark, addedAt: new Date().toISOString() });
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
    return true;
  } catch {
    return false;
  }
};

export const removeBookmark = (slug: string): boolean => {
  try {
    const bookmarks = getBookmarks();
    const filtered = bookmarks.filter((b) => b.slug !== slug);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
};

export const isBookmarked = (slug: string): boolean => {
  return getBookmarks().some((b) => b.slug === slug);
};

export const toggleBookmark = (bookmark: Omit<LocalBookmark, "addedAt">): boolean => {
  const bookmarks = getBookmarks();
  const exists = bookmarks.some((b) => b.slug === bookmark.slug);
  if (exists) {
    removeBookmark(bookmark.slug);
    return false;
  } else {
    addBookmark(bookmark);
    return true;
  }
};
