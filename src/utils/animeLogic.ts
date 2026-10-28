/**
 * Pure utility functions for filtering, sorting, library management, watch time calculation,
 * and semantic search matching for the ani.pm replica.
 */

export type LibraryStatus = 'watching' | 'planning' | 'completed' | 'on_hold' | 'dropped';

export interface AnimeEpisode {
  number: number;
  id: string;
  title: string;
  description: string;
  duration: string;
  durationMinutes: number;
  aired: string;
  hasSub: boolean;
  hasDub: boolean;
  hasDubtitles?: boolean;
  relativeTime?: string;
}

export interface AnimeItem {
  id: string;
  slug: string;
  title: string;
  nativeTitle: string;
  synonyms: string[];
  score: number;
  year: number;
  season: 'Winter' | 'Spring' | 'Summer' | 'Fall';
  format: 'TV' | 'MOVIE' | 'ONA' | 'OVA' | 'SPECIAL';
  status: 'FINISHED' | 'RELEASING' | 'NOT_YET_RELEASED';
  episodesCount: number;
  subCount: number;
  dubCount: number;
  durationPerEp: string;
  airedRange: string;
  views: number;
  likes: number;
  dislikes: number;
  studio: string;
  rated: string;
  primaryGenre: string;
  genres: string[];
  tags: string[];
  synopsis: string;
  anilistId: number;
  malId: number;
  featured?: boolean;
  trendingRank: number;
  monthlyRank: number;
  allTimeRank: number;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    bgDark: string;
  };
  artMotif: 'cyberpunk' | 'cursed' | 'grimoire' | 'pirate' | 'ninja' | 'soulreaper' | 'titan' | 'shadow' | 'alchemist' | 'demon' | 'mecha' | 'romcom' | 'shinigami' | 'psychic' | 'fantasy';
  episodes: AnimeEpisode[];
}

export interface BrowseFilterOptions {
  query?: string;
  sort?: 'trending' | 'popular' | 'score' | 'newest' | 'title';
  genre?: string;
  tag?: string;
  studio?: string;
  year?: number | 'ALL';
  season?: string;
  format?: string;
  status?: string;
  language?: 'ALL' | 'SUB' | 'DUB';
}

export interface EpisodeFilterOptions {
  query?: string;
  sortOrder?: 'oldest' | 'newest';
  audioFilter?: 'all' | 'sub' | 'dub';
}

/**
 * Filters and sorts the anime catalog according to the active Browse filters.
 */
export function filterAndSortAnime(
  catalog: AnimeItem[],
  options: BrowseFilterOptions
): AnimeItem[] {
  const query = (options.query ?? '').trim().toLowerCase();

  const filtered = catalog.filter((item) => {
    if (query) {
      const matchesTitle = item.title.toLowerCase().includes(query);
      const matchesNative = item.nativeTitle.toLowerCase().includes(query);
      const matchesSynonym = item.synonyms.some((s) => s.toLowerCase().includes(query));
      const matchesStudio = item.studio.toLowerCase().includes(query);
      const matchesGenre = item.genres.some((g) => g.toLowerCase().includes(query));
      if (!matchesTitle && !matchesNative && !matchesSynonym && !matchesStudio && !matchesGenre) {
        return false;
      }
    }

    if (options.genre && options.genre !== 'ALL') {
      const hasGenre = item.genres.some(
        (g) => g.toLowerCase() === options.genre!.toLowerCase()
      );
      if (!hasGenre) return false;
    }

    if (options.tag && options.tag !== 'ALL') {
      const hasTag = item.tags.some(
        (t) => t.toLowerCase() === options.tag!.toLowerCase()
      );
      if (!hasTag) return false;
    }

    if (options.studio && options.studio !== 'ALL') {
      if (item.studio.toLowerCase() !== options.studio.toLowerCase()) return false;
    }

    if (options.year && options.year !== 'ALL') {
      if (item.year !== Number(options.year)) return false;
    }

    if (options.season && options.season !== 'ALL') {
      if (item.season.toLowerCase() !== options.season.toLowerCase()) return false;
    }

    if (options.format && options.format !== 'ALL') {
      if (item.format.toLowerCase() !== options.format.toLowerCase()) return false;
    }

    if (options.status && options.status !== 'ALL') {
      if (item.status.toLowerCase() !== options.status.toLowerCase()) return false;
    }

    if (options.language && options.language !== 'ALL') {
      if (options.language === 'SUB' && item.subCount <= 0) return false;
      if (options.language === 'DUB' && item.dubCount <= 0) return false;
    }

    return true;
  });

  const sortMode = options.sort ?? 'trending';
  return [...filtered].sort((a, b) => {
    switch (sortMode) {
      case 'trending':
        return a.trendingRank - b.trendingRank;
      case 'popular':
        return b.views - a.views;
      case 'score':
        return b.score - a.score;
      case 'newest':
        return b.year - a.year || a.trendingRank - b.trendingRank;
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return a.trendingRank - b.trendingRank;
    }
  });
}

/**
 * Ranks top anime or movies by timeframe ('weekly' | 'monthly' | 'all_time').
 */
export function getTopByTimeframe(
  catalog: AnimeItem[],
  timeframe: 'weekly' | 'monthly' | 'all_time',
  formatFilter?: 'TV_SERIES' | 'MOVIE'
): AnimeItem[] {
  const pool = catalog.filter((item) => {
    if (formatFilter === 'MOVIE') return item.format === 'MOVIE';
    if (formatFilter === 'TV_SERIES') return item.format !== 'MOVIE';
    return true;
  });

  return [...pool].sort((a, b) => {
    if (timeframe === 'weekly') return a.trendingRank - b.trendingRank;
    if (timeframe === 'monthly') return a.monthlyRank - b.monthlyRank;
    return a.allTimeRank - b.allTimeRank;
  });
}

/**
 * Filters and sorts episodes on an anime detail or player page.
 */
export function filterAndSortEpisodes(
  episodes: AnimeEpisode[],
  options: EpisodeFilterOptions
): AnimeEpisode[] {
  const q = (options.query ?? '').trim().toLowerCase();
  const audio = options.audioFilter ?? 'all';
  const order = options.sortOrder ?? 'oldest';

  const result = episodes.filter((ep) => {
    if (audio === 'sub' && !ep.hasSub) return false;
    if (audio === 'dub' && !ep.hasDub) return false;
    if (q) {
      const numMatch = String(ep.number).includes(q) || `ep ${ep.number}`.includes(q);
      const titleMatch = ep.title.toLowerCase().includes(q);
      const descMatch = ep.description.toLowerCase().includes(q);
      if (!numMatch && !titleMatch && !descMatch) return false;
    }
    return true;
  });

  return [...result].sort((a, b) =>
    order === 'oldest' ? a.number - b.number : b.number - a.number
  );
}

/**
 * Semantic / descriptive search for "Describe it" search mode on /search.
 * Matches plot keywords, themes, tags, genres, and character names.
 */
export function searchByDescription(
  catalog: AnimeItem[],
  descriptionQuery: string
): AnimeItem[] {
  const raw = descriptionQuery.trim().toLowerCase();
  if (raw.length < 2) return [];

  const tokens = raw
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  if (tokens.length === 0) return [];

  const scored = catalog
    .map((item) => {
      const haystacks = [
        item.title.toLowerCase(),
        item.synopsis.toLowerCase(),
        item.genres.join(' ').toLowerCase(),
        item.tags.join(' ').toLowerCase(),
        item.synonyms.join(' ').toLowerCase(),
        item.studio.toLowerCase(),
      ].join(' ');

      let score = 0;
      for (const token of tokens) {
        if (item.title.toLowerCase().includes(token)) score += 5;
        if (item.tags.some((t) => t.toLowerCase().includes(token))) score += 4;
        if (item.genres.some((g) => g.toLowerCase().includes(token))) score += 3;
        if (item.synopsis.toLowerCase().includes(token)) score += 2;
        if (haystacks.includes(token)) score += 1;
      }
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.trendingRank - b.item.trendingRank);

  return scored.map((s) => s.item);
}

/**
 * Updates or removes an anime's status in the user's personal watchlist record.
 */
export function updateLibraryStatus(
  currentMap: Record<string, LibraryStatus>,
  animeId: string,
  status: LibraryStatus | null
): Record<string, LibraryStatus> {
  const next = { ...currentMap };
  if (status === null) {
    delete next[animeId];
  } else {
    next[animeId] = status;
  }
  return next;
}

/**
 * Calculates total watch time statistics from history entries.
 */
export interface WatchHistoryEntry {
  animeId: string;
  episodeNumber: number;
  watchedSeconds: number;
  durationSeconds: number;
  timestamp: number;
  audio: 'SUB' | 'DUB';
}

export function calculateWatchStats(history: WatchHistoryEntry[]): {
  totalMinutes: number;
  totalHours: number;
  episodesCompleted: number;
  uniqueTitlesCount: number;
} {
  const totalSeconds = history.reduce((sum, h) => sum + Math.max(0, h.watchedSeconds), 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const totalHours = Number((totalMinutes / 60).toFixed(1));
  const episodesCompleted = history.filter(
    (h) => h.durationSeconds > 0 && h.watchedSeconds / h.durationSeconds >= 0.75
  ).length;
  const uniqueTitlesCount = new Set(history.map((h) => h.animeId)).size;

  return {
    totalMinutes,
    totalHours,
    episodesCompleted,
    uniqueTitlesCount,
  };
}
