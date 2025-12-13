// LocalStorage reading history utilities
export interface ReadingHistoryItem {
  comicSlug: string;
  comicTitle: string;
  comicImageUrl: string;
  chapterSlug: string;
  chapterTitle: string;
  chapterNumber: string;
  lastReadAt: string;
  scrollPosition?: number;
}

const HISTORY_KEY = "soulscan_reading_history";
const MAX_HISTORY_ITEMS = 50;

export const getReadingHistory = (): ReadingHistoryItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addToReadingHistory = (item: Omit<ReadingHistoryItem, "lastReadAt">): void => {
  try {
    const history = getReadingHistory();

    // Remove existing entry for same comic
    const filtered = history.filter((h) => h.comicSlug !== item.comicSlug);

    // Add new entry at the beginning
    filtered.unshift({
      ...item,
      lastReadAt: new Date().toISOString(),
    });

    // Keep only last MAX_HISTORY_ITEMS
    const trimmed = filtered.slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error("Error saving reading history:", err);
  }
};

export const updateReadingProgress = (comicSlug: string, scrollPosition: number): void => {
  try {
    const history = getReadingHistory();
    const index = history.findIndex((h) => h.comicSlug === comicSlug);

    if (index !== -1) {
      history[index].scrollPosition = scrollPosition;
      history[index].lastReadAt = new Date().toISOString();
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  } catch (err) {
    console.error("Error updating reading progress:", err);
  }
};

export const removeFromHistory = (comicSlug: string): void => {
  try {
    const history = getReadingHistory();
    const filtered = history.filter((h) => h.comicSlug !== comicSlug);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error("Error removing from history:", err);
  }
};

export const clearReadingHistory = (): void => {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.error("Error clearing reading history:", err);
  }
};

export const getLastRead = (comicSlug: string): ReadingHistoryItem | null => {
  const history = getReadingHistory();
  return history.find((h) => h.comicSlug === comicSlug) || null;
};

export const getContinueReading = (limit: number = 5): ReadingHistoryItem[] => {
  return getReadingHistory().slice(0, limit);
};
