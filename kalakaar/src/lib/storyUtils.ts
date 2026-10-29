const EDITORIAL_CATEGORIES = new Set([
  'editorial',
  'heritage',
  'educational',
  'historical',
  'technique',
  'techniques',
  'tutorials',
  'tutorial',
  'cultural',
  'art history',
  'news',
  'tips',
  'exhibitions',
  'exhibition',
  'inspiration',
  'other',
]);

const BANNED_PLACEHOLDER_NAMES = [
  'unknown',
  'test user',
  'dummy user',
  'sample artist',
  'lorem ipsum',
  'john doe',
  'artisan storyteller',
  'artisan creator',
  'artisan',
  'admin',
  'staff',
  'editor',
  'editorial',
  'system',
  'user',
  'kalakaar',
];

function isPlaceholderName(name?: string | null): boolean {
  if (!name || !name.trim()) return true;
  const normalized = name.trim().toLowerCase();

  if (BANNED_PLACEHOLDER_NAMES.includes(normalized)) return true;
  if (normalized.includes('dummy')) return true;
  if (normalized.includes('test user')) return true;
  if (normalized.includes('sample artist')) return true;
  if (normalized.includes('unknown')) return true;
  if (normalized.includes('lorem ipsum')) return true;
  if (normalized.includes('john doe')) return true;

  return false;
}

function isEditorialCategory(category?: string | null): boolean {
  if (!category) return false;
  const cat = category.trim().toLowerCase();
  return EDITORIAL_CATEGORIES.has(cat);
}

export interface StoryAuthorSource {
  category?: string;
  profiles?: { full_name?: string; username?: string; display_name?: string } | null;
  author_name?: string;
  artist_name?: string;
  author?: { full_name?: string; name?: string } | string;
}

export function getStoryAuthorName(story?: StoryAuthorSource | null): string {
  if (!story) return "Kalakaar Journal";

  // Rule 1: Editorial Content -> Kalakaar Journal
  if (isEditorialCategory(story.category)) {
    return "Kalakaar Journal";
  }

  // Rule 2: Check for real artist name from profile
  let rawName = "";
  if (typeof story.author === "string") {
    rawName = story.author;
  } else if (story.author && typeof story.author === "object") {
    rawName = story.author.full_name || story.author.name || "";
  }

  if (!rawName) {
    rawName =
      story.profiles?.full_name ||
      story.profiles?.display_name ||
      story.profiles?.username ||
      story.author_name ||
      story.artist_name ||
      "";
  }

  // Rule 3: If missing or dummy/placeholder -> Kalakaar Journal
  if (isPlaceholderName(rawName)) {
    return "Kalakaar Journal";
  }

  return rawName.trim();
}

