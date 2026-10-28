import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAndSortAnime,
  getTopByTimeframe,
  filterAndSortEpisodes,
  searchByDescription,
  updateLibraryStatus,
  calculateWatchStats,
  type AnimeItem,
  type AnimeEpisode,
} from './animeLogic';

const mockEpisodes: AnimeEpisode[] = [
  {
    number: 1,
    id: 'ep-1',
    title: 'Ryoumen Sukuna',
    description: 'Itadori Yuuji meets Megumi Fushiguro.',
    duration: '23:55',
    durationMinutes: 24,
    aired: 'Oct 3, 2020',
    hasSub: true,
    hasDub: true,
  },
  {
    number: 2,
    id: 'ep-2',
    title: 'For Myself',
    description: 'Itadori wakes up in a room with Gojou Satoru.',
    duration: '23:55',
    durationMinutes: 24,
    aired: 'Oct 10, 2020',
    hasSub: true,
    hasDub: false,
  },
];

const mockCatalog: AnimeItem[] = [
  {
    id: 'jjk',
    slug: 'jujutsu-kaisen-1103',
    title: 'JUJUTSU KAISEN',
    nativeTitle: '呪術廻戦',
    synonyms: ['JJK', 'Sorcery Fight'],
    score: 8.5,
    year: 2020,
    season: 'Winter',
    format: 'TV',
    status: 'FINISHED',
    episodesCount: 24,
    subCount: 24,
    dubCount: 24,
    durationPerEp: '24 min per episode',
    airedRange: 'Oct 3, 2020 – Mar 27, 2021',
    views: 55828,
    likes: 24,
    dislikes: 0,
    studio: 'MAPPA',
    rated: 'PG-13',
    primaryGenre: 'Action',
    genres: ['Action', 'Drama', 'Supernatural'],
    tags: ['Curses', 'Exorcism', 'Shounen', 'Urban Fantasy'],
    synopsis: 'A boy eats a cursed finger to save his friends and joins Tokyo Jujutsu High.',
    anilistId: 113415,
    malId: 40748,
    featured: true,
    trendingRank: 2,
    monthlyRank: 1,
    allTimeRank: 3,
    palette: { primary: '#e11d48', secondary: '#3b82f6', accent: '#f43f5e', bgDark: '#090d16' },
    artMotif: 'cursed',
    episodes: mockEpisodes,
  },
  {
    id: 'edgerunners-2',
    slug: 'cyberpunk-edgerunners-2-195539',
    title: 'Cyberpunk: Edgerunners 2',
    nativeTitle: 'サイバーパンク エッジランナーズ 2',
    synonyms: ['Edgerunners II'],
    score: 8.2,
    year: 2026,
    season: 'Spring',
    format: 'ONA',
    status: 'RELEASING',
    episodesCount: 10,
    subCount: 10,
    dubCount: 10,
    durationPerEp: '25 min per episode',
    airedRange: 'Apr 12, 2026 – Present',
    views: 84200,
    likes: 92,
    dislikes: 2,
    studio: 'Trigger',
    rated: 'R-17+',
    primaryGenre: 'Action',
    genres: ['Action', 'Drama', 'Sci-Fi'],
    tags: ['Cyberpunk', 'Night City', 'Cyborg', 'Dystopian'],
    synopsis: 'Cyberpunk: Edgerunners 2 pulls you back into Night City where chrome and ambition collide.',
    anilistId: 195539,
    malId: 59900,
    featured: true,
    trendingRank: 1,
    monthlyRank: 2,
    allTimeRank: 5,
    palette: { primary: '#f59e0b', secondary: '#ef4444', accent: '#facc15', bgDark: '#170c06' },
    artMotif: 'cyberpunk',
    episodes: mockEpisodes,
  },
  {
    id: 'reze-movie',
    slug: 'chainsaw-man-the-movie-reze-arc-8260',
    title: 'Chainsaw Man the Movie: Reze Arc',
    nativeTitle: '劇場版 チェンソーマン レゼ篇',
    synonyms: ['CSM Movie'],
    score: 9.1,
    year: 2025,
    season: 'Fall',
    format: 'MOVIE',
    status: 'FINISHED',
    episodesCount: 1,
    subCount: 1,
    dubCount: 1,
    durationPerEp: '1 hr 58 min',
    airedRange: 'Sep 19, 2025',
    views: 67000,
    likes: 140,
    dislikes: 1,
    studio: 'MAPPA',
    rated: 'R-17+',
    primaryGenre: 'Action',
    genres: ['Action', 'Supernatural', 'Drama'],
    tags: ['Demons', 'Urban Fantasy'],
    synopsis: 'Denji meets a mysterious girl named Reze working at a cafe in the rain.',
    anilistId: 171000,
    malId: 57500,
    trendingRank: 3,
    monthlyRank: 3,
    allTimeRank: 1,
    palette: { primary: '#a855f7', secondary: '#ec4899', accent: '#f43f5e', bgDark: '#120818' },
    artMotif: 'demon',
    episodes: [mockEpisodes[0]],
  },
];

test('filterAndSortAnime filters by query, genre, studio, format and sorts accurately', () => {
  const byQuery = filterAndSortAnime(mockCatalog, { query: 'jjk' });
  assert.equal(byQuery.length, 1);
  assert.equal(byQuery[0].id, 'jjk');

  const byGenre = filterAndSortAnime(mockCatalog, { genre: 'Sci-Fi' });
  assert.equal(byGenre.length, 1);
  assert.equal(byGenre[0].id, 'edgerunners-2');

  const byStudioAndSort = filterAndSortAnime(mockCatalog, {
    studio: 'MAPPA',
    sort: 'score',
  });
  assert.equal(byStudioAndSort.length, 2);
  assert.equal(byStudioAndSort[0].id, 'reze-movie');
  assert.equal(byStudioAndSort[1].id, 'jjk');
});

test('getTopByTimeframe separates TV/ONA from MOVIE and respects timeframe ranking', () => {
  const weeklySeries = getTopByTimeframe(mockCatalog, 'weekly', 'TV_SERIES');
  assert.equal(weeklySeries.length, 2);
  assert.equal(weeklySeries[0].id, 'edgerunners-2');

  const monthlySeries = getTopByTimeframe(mockCatalog, 'monthly', 'TV_SERIES');
  assert.equal(monthlySeries[0].id, 'jjk');

  const movies = getTopByTimeframe(mockCatalog, 'weekly', 'MOVIE');
  assert.equal(movies.length, 1);
  assert.equal(movies[0].id, 'reze-movie');
});

test('filterAndSortEpisodes handles audio filter, search query, and sort direction', () => {
  const dubOnly = filterAndSortEpisodes(mockEpisodes, { audioFilter: 'dub' });
  assert.equal(dubOnly.length, 1);
  assert.equal(dubOnly[0].number, 1);

  const newestFirst = filterAndSortEpisodes(mockEpisodes, { sortOrder: 'newest' });
  assert.equal(newestFirst[0].number, 2);
  assert.equal(newestFirst[1].number, 1);

  const searchGojou = filterAndSortEpisodes(mockEpisodes, { query: 'Gojou' });
  assert.equal(searchGojou.length, 1);
  assert.equal(searchGojou[0].number, 2);
});

test('searchByDescription ranks anime matching plot and tag keywords', () => {
  const results = searchByDescription(mockCatalog, 'cursed finger exorcism high school');
  assert.ok(results.length >= 1);
  assert.equal(results[0].id, 'jjk');
});

test('updateLibraryStatus adds, updates, and removes library entries immutably', () => {
  const initial: Record<string, 'watching' | 'planning' | 'completed' | 'on_hold' | 'dropped'> = {};
  const added = updateLibraryStatus(initial, 'jjk', 'watching');
  assert.equal(added['jjk'], 'watching');
  assert.equal(initial['jjk'], undefined);

  const removed = updateLibraryStatus(added, 'jjk', null);
  assert.equal(removed['jjk'], undefined);
});

test('calculateWatchStats computes watch hours, completed episodes, and unique titles', () => {
  const stats = calculateWatchStats([
    {
      animeId: 'jjk',
      episodeNumber: 1,
      watchedSeconds: 1400,
      durationSeconds: 1440,
      timestamp: 1000,
      audio: 'SUB',
    },
    {
      animeId: 'edgerunners-2',
      episodeNumber: 1,
      watchedSeconds: 400,
      durationSeconds: 1440,
      timestamp: 2000,
      audio: 'DUB',
    },
  ]);

  assert.equal(stats.totalMinutes, 30);
  assert.equal(stats.totalHours, 0.5);
  assert.equal(stats.episodesCompleted, 1);
  assert.equal(stats.uniqueTitlesCount, 2);
});
