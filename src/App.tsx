import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Play,
  Plus,
  Bookmark,
  FolderPlus,
  Clock,
  Heart,
  BarChart3,
  Upload,
  Mic,
  Sparkles,
  BookOpen,
  Trophy,
  Settings as SettingsIcon,
  X,
  Check,
  Trash2,
  Captions,
  Volume2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  filterAndSortAnime,
  getTopByTimeframe,
  searchByDescription,
  updateLibraryStatus,
  calculateWatchStats,
  type AnimeItem,
  type BrowseFilterOptions,
  type LibraryStatus,
  type WatchHistoryEntry,
} from './utils/animeLogic';
import {
  ANIME_CATALOG,
  LATEST_EPISODES_FEED,
  ALL_GENRES,
  INITIAL_FORUM_THREADS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_WATCH_ROOMS,
  type ForumThread,
  type ChatMessage,
  type WatchRoom,
} from './data/animeCatalog';
import {
  getEpisodeThumbnailUrl,
  getAnimePosterUrl,
  getUserAvatarUrl,
} from './utils/artworkGenerator';
import { Navbar, type NavRoute } from './components/Navbar';
import { AnimeCard } from './components/AnimeCard';
import { HeroCarousel } from './components/HeroCarousel';
import { AnimePlayerView } from './components/AnimePlayerView';
import {
  ChatDrawer,
  SignInModal,
  CommunityPage,
  WatchTogetherPage,
} from './components/CommunityAndModals';

type Timeframe = 'weekly' | 'monthly' | 'all_time';

const DEFAULT_FILTERS: Required<BrowseFilterOptions> = {
  query: '',
  genre: 'ALL',
  tag: 'ALL',
  studio: 'ALL',
  year: 'ALL',
  season: 'ALL',
  format: 'ALL',
  status: 'ALL',
  language: 'ALL',
  sort: 'trending',
};

interface MangaChapterItem {
  id: string;
  title: string;
  chaptersCount: number;
  latestChapter: number;
  rating: number;
  genre: string;
  animeRef: AnimeItem;
}

export default function App() {
  // Navigation & URL hash synchronization
  const [activeRoute, setActiveRoute] = useState<NavRoute>('home');
  const [selectedAnimeSlug, setSelectedAnimeSlug] = useState<string>('jujutsu-kaisen-1103');
  const [activeEpisodeNumber, setActiveEpisodeNumber] = useState<number | null>(null);

  // Home page carousels timeframe state
  const [topAnimeTimeframe, setTopAnimeTimeframe] = useState<Timeframe>('weekly');
  const [topMoviesTimeframe, setTopMoviesTimeframe] = useState<Timeframe>('weekly');
  const [animeTimeframeMenuOpen, setAnimeTimeframeMenuOpen] = useState(false);
  const [movieTimeframeMenuOpen, setMovieTimeframeMenuOpen] = useState(false);

  const topAnimeCarouselRef = useRef<HTMLDivElement>(null);
  const topMoviesCarouselRef = useRef<HTMLDivElement>(null);

  // Browse page filter state
  const [browseFilters, setBrowseFilters] = useState<Required<BrowseFilterOptions>>(DEFAULT_FILTERS);

  // Latest episodes page state
  const [latestAudioFilter, setLatestAudioFilter] = useState<'all' | 'sub' | 'dub'>('all');
  const [latestSearch, setLatestSearch] = useState('');

  // Search page (/search) state
  const [searchMode, setSearchMode] = useState<'titles' | 'describe'>('titles');
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceListening, setVoiceListening] = useState(false);

  // Library (/library) state persisted to localStorage as Record<string, LibraryStatus>
  const [libraryMap, setLibraryMap] = useState<Record<string, LibraryStatus>>(() => {
    try {
      const saved = localStorage.getItem('anipm_library_map_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return {};
  });
  const [libraryTab, setLibraryTab] = useState<
    'watchlist' | 'manga' | 'folders' | 'history' | 'liked' | 'watch_time'
  >('watchlist');
  const [libraryStatusFilter, setLibraryStatusFilter] = useState<'all' | LibraryStatus>('all');
  const [customFolders, setCustomFolders] = useState<Array<{ id: string; name: string; count: number }>>([
    { id: 'f1', name: 'Peak Action & Sakuga', count: 4 },
    { id: 'f2', name: 'Weekend Movie Night', count: 3 },
  ]);
  const [newFolderName, setNewFolderName] = useState('');
  const [likedAnimeIds] = useState<string[]>(['jujutsu-kaisen', 'cyberpunk-edgerunners-2']);

  // Watch history state persisted to localStorage
  const [watchHistory, setWatchHistory] = useState<WatchHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem('anipm_history_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        animeId: 'jujutsu-kaisen',
        episodeNumber: 1,
        watchedSeconds: 1120,
        durationSeconds: 1435,
        timestamp: Date.now() - 3600 * 1000,
        audio: 'SUB',
      },
    ];
  });

  // Global modals & drawers state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [requestModalMode, setRequestModalMode] = useState<'report' | 'request' | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User, Community & Watch Together state
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    email: string;
    level: number;
  } | null>(null);
  const [forumThreads, setForumThreads] = useState<ForumThread[]>(INITIAL_FORUM_THREADS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [watchRooms, setWatchRooms] = useState<WatchRoom[]>(INITIAL_WATCH_ROOMS);
  const [activeWatchRoom, setActiveWatchRoom] = useState<WatchRoom | null>(null);

  // Manga reader modal state
  const [activeMangaReader, setActiveMangaReader] = useState<{
    manga: MangaChapterItem;
    chapter: number;
  } | null>(null);

  // Settings preferences state
  const [prefDefaultAudio, setPrefDefaultAudio] = useState<'SUB' | 'DUB'>('SUB');
  const [prefAutoPlay, setPrefAutoPlay] = useState(true);
  const [prefAutoSkipIntro, setPrefAutoSkipIntro] = useState(true);
  const [prefTitleLanguage, setPrefTitleLanguage] = useState<'English' | 'Romaji'>('English');

  useEffect(() => {
    try {
      localStorage.setItem('anipm_library_map_v2', JSON.stringify(libraryMap));
    } catch {
      // ignore
    }
  }, [libraryMap]);

  useEffect(() => {
    try {
      localStorage.setItem('anipm_history_v1', JSON.stringify(watchHistory));
    } catch {
      // ignore
    }
  }, [watchHistory]);

  // Global Ctrl+K / Cmd+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveRoute('search');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsShortcutsOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  const libraryEntries = useMemo(
    () =>
      Object.entries(libraryMap).map(([animeId, status]) => ({
        animeId,
        status,
      })),
    [libraryMap]
  );

  const handleUpdateLibraryStatus = (animeId: string, status: LibraryStatus | null) => {
    setLibraryMap((prev) => updateLibraryStatus(prev, animeId, status));
    const targetAnime = ANIME_CATALOG.find((a) => a.id === animeId);
    if (status === null) {
      showToast(`Removed ${targetAnime?.title ?? 'anime'} from My Lists`);
    } else {
      const labelMap: Record<LibraryStatus, string> = {
        watching: 'Watching',
        planning: 'Plan to Watch',
        completed: 'Completed',
        on_hold: 'On Hold',
        dropped: 'Dropped',
      };
      showToast(`Saved "${targetAnime?.title ?? 'Anime'}" to ${labelMap[status]}`);
    }
  };

  // Navigation handler
  const handleNavigate = (route: NavRoute, params?: Record<string, string>) => {
    if (route === 'movies') {
      setBrowseFilters({
        ...DEFAULT_FILTERS,
        format: 'MOVIE',
      });
      setActiveRoute('movies');
    } else if (route === 'browse') {
      setBrowseFilters((prev) => ({
        ...prev,
        format: params?.format ?? 'ALL',
        genre: params?.genre ?? prev.genre,
        sort: (params?.sortBy as Required<BrowseFilterOptions>['sort']) ?? prev.sort,
      }));
      setActiveRoute('browse');
    } else {
      setActiveRoute(route);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAnimeDetail = (anime: AnimeItem, episodeNumber: number | null = null) => {
    setSelectedAnimeSlug(anime.slug);
    setActiveEpisodeNumber(episodeNumber);
    setActiveRoute('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRollRandomAnime = () => {
    const randomIndex = Math.floor(Math.random() * ANIME_CATALOG.length);
    const chosen = ANIME_CATALOG[randomIndex];
    handleOpenAnimeDetail(chosen, null);
    showToast(`Rolled random anime: ${chosen.title}`);
  };

  const handleRecordWatchProgress = (
    animeId: string,
    epNumber: number,
    watchedSec: number,
    durationSec: number,
    audio: 'SUB' | 'DUB'
  ) => {
    setWatchHistory((prev) => {
      const filtered = prev.filter(
        (item) => !(item.animeId === animeId && item.episodeNumber === epNumber)
      );
      return [
        {
          animeId,
          episodeNumber: epNumber,
          watchedSeconds: watchedSec,
          durationSeconds: durationSec,
          timestamp: Date.now(),
          audio,
        },
        ...filtered,
      ];
    });
  };

  // Derived data for Home view
  const featuredHeroAnime = useMemo(
    () => ANIME_CATALOG.filter((a) => a.featured),
    []
  );

  const topAnimesList = useMemo(
    () => getTopByTimeframe(ANIME_CATALOG, topAnimeTimeframe, 'TV_SERIES'),
    [topAnimeTimeframe]
  );

  const topMoviesList = useMemo(
    () => getTopByTimeframe(ANIME_CATALOG, topMoviesTimeframe, 'MOVIE'),
    [topMoviesTimeframe]
  );

  // Derived data for Browse / Movies view
  const effectiveBrowseFilters: BrowseFilterOptions = useMemo(() => {
    if (activeRoute === 'movies') {
      return { ...browseFilters, format: 'MOVIE' };
    }
    return browseFilters;
  }, [activeRoute, browseFilters]);

  const filteredBrowseAnime = useMemo(
    () => filterAndSortAnime(ANIME_CATALOG, effectiveBrowseFilters),
    [effectiveBrowseFilters]
  );

  // Unique Studios, Tags, Years for Browse dropdowns
  const allStudios = useMemo(() => {
    const set = new Set<string>();
    ANIME_CATALOG.forEach((a) => set.add(a.studio));
    return Array.from(set).sort();
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    ANIME_CATALOG.forEach((a) => a.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, []);

  const allYears = useMemo(() => {
    const set = new Set<number>();
    ANIME_CATALOG.forEach((a) => set.add(a.year));
    return Array.from(set).sort((a, b) => b - a);
  }, []);

  // Derived data for Search view
  const searchResults = useMemo(() => {
    if (searchMode === 'describe') {
      return searchByDescription(ANIME_CATALOG, searchQuery);
    }
    return filterAndSortAnime(ANIME_CATALOG, {
      ...DEFAULT_FILTERS,
      query: searchQuery,
      sort: 'popular',
    });
  }, [searchMode, searchQuery]);

  // Derived data for Latest Episodes view
  const filteredLatestFeed = useMemo(() => {
    return LATEST_EPISODES_FEED.filter((item) => {
      if (latestAudioFilter === 'sub' && !item.hasSub) return false;
      if (latestAudioFilter === 'dub' && !item.hasDub) return false;
      if (latestSearch.trim()) {
        const q = latestSearch.toLowerCase();
        return (
          item.animeTitle.toLowerCase().includes(q) ||
          (item.episodeTitle && item.episodeTitle.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [latestAudioFilter, latestSearch]);

  // Currently selected anime for Detail / Player route
  const currentDetailAnime = useMemo(
    () =>
      ANIME_CATALOG.find((a) => a.slug === selectedAnimeSlug) || ANIME_CATALOG[0],
    [selectedAnimeSlug]
  );

  // Watch stats for Library -> Watch time tab
  const watchStats = useMemo(
    () => calculateWatchStats(watchHistory),
    [watchHistory]
  );

  // Manga list derived from catalog
  const mangaCatalog: MangaChapterItem[] = useMemo(
    () =>
      ANIME_CATALOG.slice(0, 12).map((a, idx) => ({
        id: `manga-${a.id}`,
        title: a.title,
        chaptersCount: Math.max(85, a.episodesCount * 3),
        latestChapter: Math.max(85, a.episodesCount * 3),
        rating: a.score,
        genre: a.genres[0] || 'Action',
        animeRef: a,
      })),
    []
  );

  const scrollCarousel = (
    ref: React.RefObject<HTMLDivElement | null>,
    dir: 'left' | 'right'
  ) => {
    if (!ref.current) return;
    const distance = dir === 'left' ? -680 : 680;
    ref.current.scrollBy({ left: distance, behavior: 'smooth' });
  };

  const timeframeLabel: Record<Timeframe, string> = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    all_time: 'All-Time',
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-[#f4f4f6] flex flex-col selection:bg-white selection:text-black">
      {/* Top Global Navigation Bar */}
      <Navbar
        activeRoute={activeRoute}
        onNavigate={handleNavigate}
        onToggleChat={() => setIsChatOpen((v) => !v)}
        isChatOpen={isChatOpen}
        onOpenSignIn={() => setIsSignInOpen(true)}
        onRollRandomAnime={handleRollRandomAnime}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenRequestModal={(mode) => setRequestModalMode(mode)}
        currentUser={currentUser}
        onSignOut={() => {
          setCurrentUser(null);
          showToast('Signed out of ani.pm');
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-full bg-white text-black font-semibold text-xs shadow-2xl flex items-center gap-2 border border-white/20"
        >
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {/* ================================================================
            1. HOME VIEW (/)
           ================================================================ */}
        {activeRoute === 'home' && (
          <div className="space-y-12 pb-12">
            {/* Full-bleed Hero Carousel + Site Activity Bar */}
            <HeroCarousel
              featuredAnime={featuredHeroAnime}
              libraryMap={libraryMap}
              onPlayAnime={(anime) => handleOpenAnimeDetail(anime, 1)}
              onMoreInfo={(anime) => handleOpenAnimeDetail(anime, null)}
              onUpdateStatus={handleUpdateLibraryStatus}
              onOpenChat={() => setIsChatOpen(true)}
              latestChatMessage={
                chatMessages[chatMessages.length - 1] || {
                  username: '𝐋 𝐋 Ŷ 𝐑',
                  text: 'rock san',
                }
              }
            />

            {/* Top [Weekly/Monthly/All-Time] Animes Carousel */}
            <section className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
                    <span>Top</span>
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => {
                          setAnimeTimeframeMenuOpen((v) => !v);
                          setMovieTimeframeMenuOpen(false);
                        }}
                        className="inline-flex items-center gap-1 text-white underline decoration-white/30 underline-offset-4 hover:decoration-white cursor-pointer"
                      >
                        <span>{timeframeLabel[topAnimeTimeframe]}</span>
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      </button>
                      {animeTimeframeMenuOpen && (
                        <div className="absolute left-0 top-full mt-2 w-36 rounded-xl bg-[#141419] border border-white/15 shadow-2xl py-1 z-30">
                          {(['weekly', 'monthly', 'all_time'] as Timeframe[]).map((tf) => (
                            <button
                              key={tf}
                              type="button"
                              onClick={() => {
                                setTopAnimeTimeframe(tf);
                                setAnimeTimeframeMenuOpen(false);
                              }}
                              className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-white/10 cursor-pointer ${
                                topAnimeTimeframe === tf
                                  ? 'text-white font-semibold'
                                  : 'text-zinc-400'
                              }`}
                            >
                              <span>{timeframeLabel[tf]}</span>
                              {topAnimeTimeframe === tf && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span>Animes</span>
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Scroll left"
                    onClick={() => scrollCarousel(topAnimeCarouselRef, 'left')}
                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Scroll right"
                    onClick={() => scrollCarousel(topAnimeCarouselRef, 'right')}
                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <a
                    href="#/anime?sort=popular"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate('browse', { sortBy: 'popular' });
                    }}
                    className="ml-1 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                  >
                    View All &gt;
                  </a>
                </div>
              </div>

              <div
                ref={topAnimeCarouselRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x"
              >
                {topAnimesList.map((anime) => (
                  <div
                    key={anime.id}
                    className="w-[165px] sm:w-[195px] shrink-0 snap-start"
                  >
                    <AnimeCard
                      anime={anime}
                      libraryStatus={libraryMap[anime.id]}
                      onSelectAnime={(a) => handleOpenAnimeDetail(a, null)}
                      onUpdateStatus={handleUpdateLibraryStatus}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Top [Weekly/Monthly/All-Time] Movies Carousel */}
            <section className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
                    <span>Top</span>
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => {
                          setMovieTimeframeMenuOpen((v) => !v);
                          setAnimeTimeframeMenuOpen(false);
                        }}
                        className="inline-flex items-center gap-1 text-white underline decoration-white/30 underline-offset-4 hover:decoration-white cursor-pointer"
                      >
                        <span>{timeframeLabel[topMoviesTimeframe]}</span>
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      </button>
                      {movieTimeframeMenuOpen && (
                        <div className="absolute left-0 top-full mt-2 w-36 rounded-xl bg-[#141419] border border-white/15 shadow-2xl py-1 z-30">
                          {(['weekly', 'monthly', 'all_time'] as Timeframe[]).map((tf) => (
                            <button
                              key={tf}
                              type="button"
                              onClick={() => {
                                setTopMoviesTimeframe(tf);
                                setMovieTimeframeMenuOpen(false);
                              }}
                              className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-white/10 cursor-pointer ${
                                topMoviesTimeframe === tf
                                  ? 'text-white font-semibold'
                                  : 'text-zinc-400'
                              }`}
                            >
                              <span>{timeframeLabel[tf]}</span>
                              {topMoviesTimeframe === tf && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span>Movies</span>
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Scroll left"
                    onClick={() => scrollCarousel(topMoviesCarouselRef, 'left')}
                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Scroll right"
                    onClick={() => scrollCarousel(topMoviesCarouselRef, 'right')}
                    className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/15 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <a
                    href="#/movies"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate('movies');
                    }}
                    className="ml-1 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                  >
                    View All &gt;
                  </a>
                </div>
              </div>

              <div
                ref={topMoviesCarouselRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x"
              >
                {topMoviesList.map((movie) => (
                  <div
                    key={movie.id}
                    className="w-[165px] sm:w-[195px] shrink-0 snap-start"
                  >
                    <AnimeCard
                      anime={movie}
                      libraryStatus={libraryMap[movie.id]}
                      onSelectAnime={(a) => handleOpenAnimeDetail(a, null)}
                      onUpdateStatus={handleUpdateLibraryStatus}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Latest Episodes Section on Home */}
            <section className="max-w-[1440px] mx-auto px-4 sm:px-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
                  Latest Episodes
                </h2>
                <a
                  href="#/latest"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate('latest');
                  }}
                  className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  View All &gt;
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {LATEST_EPISODES_FEED.slice(0, 8).map((item) => {
                  const targetAnime =
                    ANIME_CATALOG.find((a) => a.id === item.animeId) || ANIME_CATALOG[0];
                  const thumbUrl = getEpisodeThumbnailUrl(
                    targetAnime,
                    item.episodeNumber,
                    item.episodeTitle
                  );

                  return (
                    <a
                      key={item.id}
                      href={`#/anime/${item.animeSlug}?ep=${item.episodeNumber}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleOpenAnimeDetail(targetAnime, item.episodeNumber);
                      }}
                      className="group block rounded-2xl overflow-hidden bg-[#121216] border border-white/[0.07] hover:border-white/20 transition-all"
                    >
                      <div className="relative aspect-video bg-[#18181f] overflow-hidden">
                        <img
                          src={thumbUrl}
                          alt={`${item.animeTitle} Episode ${item.episodeNumber}`}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                        {/* Top-left episode pill */}
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[11px] font-mono font-semibold text-white border border-white/10">
                          EP {item.episodeNumber}
                        </span>

                        {/* Top-right SUB / DUB badges */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                          {item.hasSub && (
                            <span className="px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-white border border-white/15">
                              SUB
                            </span>
                          )}
                          {item.hasDub && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-400/90 text-[10px] font-bold text-black">
                              DUB
                            </span>
                          )}
                        </div>

                        {/* Play hover icon */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-11 h-11 rounded-full bg-white/95 text-black flex items-center justify-center shadow-lg">
                            <Play className="w-5 h-5 fill-black ml-0.5" />
                          </div>
                        </div>

                        {/* Bottom duration & time ago */}
                        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-zinc-300 font-mono">
                          <span>{item.duration}</span>
                          <span>{item.relativeTime}</span>
                        </div>
                      </div>

                      <div className="p-3 space-y-0.5">
                        <h3 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                          {item.animeTitle}
                        </h3>
                        <p className="text-[11px] text-zinc-400 truncate">
                          Episode {item.episodeNumber}
                          {item.episodeTitle ? ` — ${item.episodeTitle}` : ''}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ================================================================
            2. BROWSE ANIME (/anime) & MOVIES (/movies) VIEW
           ================================================================ */}
        {(activeRoute === 'browse' || activeRoute === 'movies') && (
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 space-y-6">
            {/* Heading + catalog count */}
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  {activeRoute === 'movies' ? 'Anime Movies' : 'Browse anime'}
                </h1>
                <p className="text-xs text-zinc-400 mt-1 tabular-nums">
                  {activeRoute === 'movies'
                    ? `${filteredBrowseAnime.length} theatrical & feature films`
                    : '9,888 catalogued'}
                </p>
              </div>
            </div>

            {/* Inline search input + quick filter dropdowns matching anipm-browse.png */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pb-2 border-b border-white/[0.07]">
              {/* Search box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  aria-label="Search anime..."
                  value={browseFilters.query}
                  onChange={(e) =>
                    setBrowseFilters((prev) => ({ ...prev, query: e.target.value }))
                  }
                  placeholder="Search anime..."
                  className="w-full bg-[#121216] border border-white/10 rounded-full pl-9 pr-3.5 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
                />
              </div>

              {/* Sort dropdown */}
              <label className="inline-flex items-center gap-1 text-xs text-zinc-300 border-b border-white/25 pb-1">
                <select
                  aria-label="Sort by"
                  value={browseFilters.sort}
                  onChange={(e) =>
                    setBrowseFilters((prev) => ({
                      ...prev,
                      sort: e.target.value as Required<BrowseFilterOptions>['sort'],
                    }))
                  }
                  className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
                >
                  <option value="trending" className="bg-[#141419]">
                    Trending
                  </option>
                  <option value="popular" className="bg-[#141419]">
                    Popular
                  </option>
                  <option value="score" className="bg-[#141419]">
                    Top Rated
                  </option>
                  <option value="newest" className="bg-[#141419]">
                    Newest
                  </option>
                  <option value="title" className="bg-[#141419]">
                    Title A–Z
                  </option>
                </select>
              </label>

              {/* Genre dropdown */}
              <label className="inline-flex items-center gap-1 text-xs text-zinc-300 border-b border-white/25 pb-1">
                <select
                  aria-label="Genres"
                  value={browseFilters.genre}
                  onChange={(e) =>
                    setBrowseFilters((prev) => ({ ...prev, genre: e.target.value }))
                  }
                  className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#141419]">
                    Genres
                  </option>
                  {ALL_GENRES.slice(0, 20).map((g) => (
                    <option key={g.name} value={g.name} className="bg-[#141419]">
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Tags dropdown */}
              <label className="inline-flex items-center gap-1 text-xs text-zinc-300 border-b border-white/25 pb-1">
                <select
                  aria-label="Tags"
                  value={browseFilters.tag}
                  onChange={(e) =>
                    setBrowseFilters((prev) => ({ ...prev, tag: e.target.value }))
                  }
                  className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#141419]">
                    Tags
                  </option>
                  {allTags.map((t) => (
                    <option key={t} value={t} className="bg-[#141419]">
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              {/* Studio dropdown */}
              <label className="inline-flex items-center gap-1 text-xs text-zinc-300 border-b border-white/25 pb-1">
                <select
                  aria-label="Studio"
                  value={browseFilters.studio}
                  onChange={(e) =>
                    setBrowseFilters((prev) => ({ ...prev, studio: e.target.value }))
                  }
                  className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#141419]">
                    Studio
                  </option>
                  {allStudios.map((s) => (
                    <option key={s} value={s} className="bg-[#141419]">
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              {/* Year dropdown */}
              <label className="inline-flex items-center gap-1 text-xs text-zinc-300 border-b border-white/25 pb-1">
                <select
                  aria-label="Year"
                  value={String(browseFilters.year)}
                  onChange={(e) =>
                    setBrowseFilters((prev) => ({
                      ...prev,
                      year: e.target.value === 'ALL' ? 'ALL' : Number(e.target.value),
                    }))
                  }
                  className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#141419]">
                    Year
                  </option>
                  {allYears.map((y) => (
                    <option key={y} value={String(y)} className="bg-[#141419]">
                      {y}
                    </option>
                  ))}
                </select>
              </label>

              {/* Season dropdown */}
              <label className="inline-flex items-center gap-1 text-xs text-zinc-300 border-b border-white/25 pb-1">
                <select
                  aria-label="Season"
                  value={browseFilters.season}
                  onChange={(e) =>
                    setBrowseFilters((prev) => ({ ...prev, season: e.target.value }))
                  }
                  className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#141419]">
                    Season
                  </option>
                  {['Winter', 'Spring', 'Summer', 'Fall'].map((s) => (
                    <option key={s} value={s} className="bg-[#141419]">
                      {s}
                    </option>
                  ))}
                </select>
              </label>

              {/* Format dropdown */}
              {activeRoute !== 'movies' && (
                <label className="inline-flex items-center gap-1 text-xs text-zinc-300 border-b border-white/25 pb-1">
                  <select
                    aria-label="Format"
                    value={browseFilters.format}
                    onChange={(e) =>
                      setBrowseFilters((prev) => ({ ...prev, format: e.target.value }))
                    }
                    className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
                  >
                    <option value="ALL" className="bg-[#141419]">
                      Format
                    </option>
                    <option value="TV" className="bg-[#141419]">
                      TV
                    </option>
                    <option value="MOVIE" className="bg-[#141419]">
                      Movie
                    </option>
                    <option value="ONA" className="bg-[#141419]">
                      ONA
                    </option>
                  </select>
                </label>
              )}

              {/* Status dropdown */}
              <label className="inline-flex items-center gap-1 text-xs text-zinc-300 border-b border-white/25 pb-1">
                <select
                  aria-label="Status"
                  value={browseFilters.status}
                  onChange={(e) =>
                    setBrowseFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#141419]">
                    Status
                  </option>
                  <option value="RELEASING" className="bg-[#141419]">
                    Airing
                  </option>
                  <option value="FINISHED" className="bg-[#141419]">
                    Finished
                  </option>
                </select>
              </label>

              {/* Language dropdown */}
              <label className="inline-flex items-center gap-1 text-xs text-zinc-300 border-b border-white/25 pb-1">
                <select
                  aria-label="Language"
                  value={browseFilters.language}
                  onChange={(e) =>
                    setBrowseFilters((prev) => ({
                      ...prev,
                      language: e.target.value as Required<BrowseFilterOptions>['language'],
                    }))
                  }
                  className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#141419]">
                    Language
                  </option>
                  <option value="SUB" className="bg-[#141419]">
                    Subbed
                  </option>
                  <option value="DUB" className="bg-[#141419]">
                    Dubbed
                  </option>
                </select>
              </label>

              {/* Reset button when any filter is active */}
              {(browseFilters.query ||
                browseFilters.genre !== 'ALL' ||
                browseFilters.tag !== 'ALL' ||
                browseFilters.studio !== 'ALL' ||
                browseFilters.year !== 'ALL' ||
                browseFilters.season !== 'ALL' ||
                browseFilters.status !== 'ALL' ||
                browseFilters.language !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => setBrowseFilters(DEFAULT_FILTERS)}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white font-medium cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>

            {/* Results Grid */}
            {filteredBrowseAnime.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <p className="text-sm text-zinc-400">
                  No anime matched those exact filters.
                </p>
                <button
                  type="button"
                  onClick={() => setBrowseFilters(DEFAULT_FILTERS)}
                  className="px-4 py-2 rounded-full bg-white text-black font-semibold text-xs cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredBrowseAnime.map((anime) => (
                  <AnimeCard
                    key={anime.id}
                    anime={anime}
                    libraryStatus={libraryMap[anime.id]}
                    onSelectAnime={(a) => handleOpenAnimeDetail(a, null)}
                    onUpdateStatus={handleUpdateLibraryStatus}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            3. LATEST EPISODES (/latest) VIEW
           ================================================================ */}
        {activeRoute === 'latest' && (
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  Latest episodes
                </h1>

                <div
                  role="group"
                  aria-label="Audio filter"
                  className="inline-flex rounded-full bg-[#121216] p-1 border border-white/[0.08]"
                >
                  {(
                    [
                      ['all', 'All'],
                      ['sub', 'Sub'],
                      ['dub', 'Dub'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      aria-pressed={latestAudioFilter === val}
                      onClick={() => setLatestAudioFilter(val)}
                      className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                        latestAudioFilter === val
                          ? 'bg-white text-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  aria-label="Search episodes"
                  value={latestSearch}
                  onChange={(e) => setLatestSearch(e.target.value)}
                  placeholder="Search episodes"
                  className="w-full bg-[#121216] border border-white/10 rounded-full pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredLatestFeed.map((item) => {
                const targetAnime =
                  ANIME_CATALOG.find((a) => a.id === item.animeId) || ANIME_CATALOG[0];
                const thumbUrl = getEpisodeThumbnailUrl(
                  targetAnime,
                  item.episodeNumber,
                  item.episodeTitle
                );

                return (
                  <a
                    key={item.id}
                    href={`#/anime/${item.animeSlug}?ep=${item.episodeNumber}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleOpenAnimeDetail(targetAnime, item.episodeNumber);
                    }}
                    className="group block rounded-2xl overflow-hidden bg-[#121216] border border-white/[0.07] hover:border-white/25 transition-all"
                  >
                    <div className="relative aspect-video bg-[#18181f] overflow-hidden">
                      <img
                        src={thumbUrl}
                        alt={`${item.animeTitle} Episode ${item.episodeNumber}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[11px] font-mono font-semibold text-white border border-white/10">
                        EP {item.episodeNumber}
                      </span>

                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                        {item.hasSub && (
                          <span className="px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-bold text-white border border-white/15">
                            SUB
                          </span>
                        )}
                        {item.hasDub && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-400/90 text-[10px] font-bold text-black">
                            DUB
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-zinc-300 font-mono">
                        <span>{item.duration}</span>
                        <span>{item.relativeTime}</span>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-0.5">
                      <h3 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                        {item.animeTitle}
                      </h3>
                      <p className="text-[11px] text-zinc-400 truncate">
                        Episode {item.episodeNumber}
                        {item.episodeTitle ? ` · ${item.episodeTitle}` : ''}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================
            4. GENRES (/genres) VIEW
           ================================================================ */}
        {activeRoute === 'genres' && (
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                Genres
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                All 50 genres, ordered by how many titles carry each
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {ALL_GENRES.map((genre, idx) => {
                const hue = (idx * 37) % 360;
                return (
                  <a
                    key={genre.name}
                    href={`#/anime?genre=${encodeURIComponent(genre.name)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setBrowseFilters({
                        ...DEFAULT_FILTERS,
                        genre: genre.name,
                      });
                      setActiveRoute('browse');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group relative p-4 rounded-2xl bg-[#121216] hover:bg-[#191920] border border-white/[0.07] hover:border-white/20 transition-all flex flex-col justify-between h-24 overflow-hidden"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: `hsl(${hue}, 80%, 60%)` }}
                    />
                    <div>
                      <div className="text-sm font-display font-bold text-white group-hover:translate-x-0.5 transition-transform">
                        {genre.name}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono tabular-nums">
                        {genre.count.toLocaleString()} titles
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================
            5. MANGA (/manga) VIEW
           ================================================================ */}
        {activeRoute === 'manga' && (
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-[11px] font-semibold mb-1.5">
                  <BookOpen className="w-3 h-3" />
                  <span>ani.pm × Toonkotsu Reader</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  Manga &amp; Light Novels
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Continue the story past the anime finale with high-resolution chapters synced to your ani.pm library.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {mangaCatalog.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setActiveMangaReader({ manga: m, chapter: m.latestChapter })}
                  className="group cursor-pointer rounded-[18px] overflow-hidden bg-[#121217] ring-1 ring-white/[0.08] hover:ring-white/25 transition-all"
                >
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <img
                      src={getAnimePosterUrl(m.animeRef)}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono font-bold text-amber-300 border border-amber-400/30">
                      CH {m.latestChapter}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 p-3 space-y-1">
                      <h3 className="text-xs font-bold text-white line-clamp-1">
                        {m.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        {m.chaptersCount} chapters · ★ {m.rating.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================
            6. LIBRARY (/library — My Lists) VIEW
           ================================================================ */}
        {activeRoute === 'library' && (
          <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                My Lists
              </h1>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#141418] hover:bg-white/10 text-xs font-semibold text-zinc-200 border border-white/10 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import backup or MAL list</span>
              </button>
            </div>

            {/* Library Navigation Tabs matching anipm-library.txt */}
            <nav
              aria-label="Library sections"
              className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/[0.08]"
            >
              {(
                [
                  ['watchlist', 'Watchlist', Bookmark],
                  ['manga', 'Manga', BookOpen],
                  ['folders', 'Folders', FolderPlus],
                  ['history', 'History', Clock],
                  ['liked', 'Liked', Heart],
                  ['watch_time', 'Watch time', BarChart3],
                ] as const
              ).map(([tabKey, label, Icon]) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setLibraryTab(tabKey)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                    libraryTab === tabKey
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            {/* Watchlist Tab */}
            {libraryTab === 'watchlist' && (
              <div className="space-y-5">
                {/* Status filter pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      ['all', 'All'],
                      ['watching', 'Watching'],
                      ['planning', 'Plan to Watch'],
                      ['completed', 'Completed'],
                      ['on_hold', 'On Hold'],
                      ['dropped', 'Dropped'],
                    ] as const
                  ).map(([st, label]) => {
                    const count =
                      st === 'all'
                        ? libraryEntries.length
                        : libraryEntries.filter((e) => e.status === st).length;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setLibraryStatusFilter(st)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer tabular-nums ${
                          libraryStatusFilter === st
                            ? 'bg-white text-black font-semibold'
                            : 'bg-[#121216] text-zinc-300 hover:bg-white/10 border border-white/[0.07]'
                        }`}
                      >
                        {label} <span className="opacity-60 ml-1">{count}</span>
                      </button>
                    );
                  })}
                </div>

                {libraryEntries.length === 0 ? (
                  <div className="py-16 text-center rounded-3xl bg-[#101014] border border-white/[0.06] space-y-3">
                    <h2 className="text-base font-display font-bold text-white">
                      Your watchlist is empty
                    </h2>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">
                      Browse anime and hit + on anything you want to save.
                    </p>
                    <div className="pt-1">
                      <a
                        href="#/anime"
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigate('browse');
                        }}
                        className="inline-flex items-center px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors"
                      >
                        Browse anime
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {libraryEntries
                      .filter((entry) =>
                        libraryStatusFilter === 'all'
                          ? true
                          : entry.status === libraryStatusFilter
                      )
                      .map((entry) => {
                        const anime = ANIME_CATALOG.find((a) => a.id === entry.animeId);
                        if (!anime) return null;
                        return (
                          <AnimeCard
                            key={anime.id}
                            anime={anime}
                            libraryStatus={entry.status}
                            onSelectAnime={(a) => handleOpenAnimeDetail(a, null)}
                            onUpdateStatus={handleUpdateLibraryStatus}
                          />
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* Manga Tab in Library */}
            {libraryTab === 'manga' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {mangaCatalog.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setActiveMangaReader({ manga: m, chapter: m.latestChapter })}
                    className="cursor-pointer rounded-2xl overflow-hidden bg-[#121216] border border-white/10 p-3 space-y-2"
                  >
                    <img
                      src={getAnimePosterUrl(m.animeRef)}
                      alt={m.title}
                      className="w-full aspect-[2/3] object-cover rounded-xl"
                    />
                    <div className="text-xs font-bold text-white truncate">{m.title}</div>
                    <div className="text-[11px] text-zinc-400">
                      Reading Ch. {m.latestChapter}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Folders Tab in Library */}
            {libraryTab === 'folders' && (
              <div className="space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newFolderName.trim()) return;
                    setCustomFolders((prev) => [
                      ...prev,
                      { id: `f-${Date.now()}`, name: newFolderName.trim(), count: 0 },
                    ]);
                    setNewFolderName('');
                  }}
                  className="flex gap-2 max-w-md"
                >
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Create a custom collection folder…"
                    className="flex-1 bg-[#121216] border border-white/10 rounded-full px-4 py-2 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-full bg-white text-black font-semibold text-xs cursor-pointer"
                  >
                    Create
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {customFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="p-5 rounded-2xl bg-[#121216] border border-white/[0.08] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{folder.name}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {folder.count} titles saved
                        </div>
                      </div>
                      <FolderPlus className="w-5 h-5 text-zinc-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History Tab in Library */}
            {libraryTab === 'history' && (
              <div className="space-y-3">
                {watchHistory.map((h, i) => {
                  const anime =
                    ANIME_CATALOG.find((a) => a.id === h.animeId) || ANIME_CATALOG[0];
                  const pct = Math.min(
                    100,
                    Math.round((h.watchedSeconds / Math.max(1, h.durationSeconds)) * 100)
                  );
                  return (
                    <div
                      key={`${h.animeId}-${h.episodeNumber}-${i}`}
                      onClick={() => handleOpenAnimeDetail(anime, h.episodeNumber)}
                      className="p-4 rounded-2xl bg-[#121216] hover:bg-[#17171d] border border-white/[0.07] flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={getEpisodeThumbnailUrl(anime, h.episodeNumber)}
                          alt={anime.title}
                          className="w-28 aspect-video object-cover rounded-xl shrink-0"
                        />
                        <div>
                          <div className="text-sm font-bold text-white">{anime.title}</div>
                          <div className="text-xs text-zinc-400">
                            Episode {h.episodeNumber} · {h.audio} · {pct}% watched
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs cursor-pointer"
                      >
                        Resume
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Liked Tab in Library */}
            {libraryTab === 'liked' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {ANIME_CATALOG.filter((a) => likedAnimeIds.includes(a.id)).map((anime) => (
                  <AnimeCard
                    key={anime.id}
                    anime={anime}
                    libraryStatus={libraryMap[anime.id]}
                    onSelectAnime={(a) => handleOpenAnimeDetail(a, null)}
                    onUpdateStatus={handleUpdateLibraryStatus}
                  />
                ))}
              </div>
            )}

            {/* Watch Time Analytics Tab in Library */}
            {libraryTab === 'watch_time' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.08]">
                  <div className="text-xs text-zinc-400">Total Minutes Streamed</div>
                  <div className="text-2xl font-display font-bold text-white mt-1 tabular-nums">
                    {watchStats.totalMinutes} mins
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.08]">
                  <div className="text-xs text-zinc-400">Episodes Completed</div>
                  <div className="text-2xl font-display font-bold text-white mt-1 tabular-nums">
                    {watchStats.episodesCompleted}
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-[#121216] border border-white/[0.08]">
                  <div className="text-xs text-zinc-400">Unique Titles Watched</div>
                  <div className="text-2xl font-display font-bold text-amber-300 mt-1 tabular-nums">
                    {watchStats.uniqueTitlesCount}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            7. SEARCH ANI.PM (/search) VIEW
           ================================================================ */}
        {activeRoute === 'search' && (
          <div className="max-w-[1140px] mx-auto px-4 sm:px-8 py-10 space-y-8">
            <div className="max-w-2xl mx-auto text-center space-y-5">
              <h1 className="text-2xl sm:text-4xl font-display font-bold text-white">
                Search Ani.pm
              </h1>

              {/* Titles vs Describe it toggle matching anipm-search.txt */}
              <div className="inline-flex rounded-full bg-[#121216] p-1 border border-white/10">
                <button
                  type="button"
                  aria-pressed={searchMode === 'titles'}
                  onClick={() => setSearchMode('titles')}
                  className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    searchMode === 'titles'
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Titles
                </button>
                <button
                  type="button"
                  aria-pressed={searchMode === 'describe'}
                  onClick={() => setSearchMode('describe')}
                  className={`inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    searchMode === 'describe'
                      ? 'bg-white text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Describe it</span>
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  autoFocus
                  aria-label="Search anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    searchMode === 'describe'
                      ? 'Describe the plot, vibe, or character (e.g. "cybernetic mercenary in Night City" or "cursed finger")...'
                      : 'Search anime...'
                  }
                  className="w-full bg-[#121217] border border-white/15 rounded-2xl pl-11 pr-12 py-3.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
                />
                <button
                  type="button"
                  aria-label="Voice search"
                  onClick={() => {
                    setVoiceListening(true);
                    setTimeout(() => {
                      setVoiceListening(false);
                      setSearchQuery('Jujutsu Kaisen');
                      showToast('Voice search recognized: "Jujutsu Kaisen"');
                    }, 900);
                  }}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors cursor-pointer ${
                    voiceListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              {searchMode === 'describe' && (
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                  <span className="text-zinc-500">Try describing:</span>
                  {[
                    'cursed fingers & sorcerers',
                    'Night City cyberware mercenary',
                    'boy born without magic in grimoire world',
                    'deaf girl redemption romance',
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setSearchQuery(prompt)}
                      className="px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/10 text-zinc-300 border border-white/10 cursor-pointer"
                    >
                      “{prompt}”
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {searchResults.map((anime) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  libraryStatus={libraryMap[anime.id]}
                  onSelectAnime={(a) => handleOpenAnimeDetail(a, null)}
                  onUpdateStatus={handleUpdateLibraryStatus}
                />
              ))}
            </div>
          </div>
        )}

        {/* ================================================================
            8. ANIME DETAIL & EPISODE PLAYER (/anime/:slug) VIEW
           ================================================================ */}
        {activeRoute === 'detail' && (
          <AnimePlayerView
            anime={currentDetailAnime}
            allAnime={ANIME_CATALOG}
            activeEpisodeNumber={activeEpisodeNumber}
            libraryStatus={libraryMap[currentDetailAnime.id]}
            libraryMap={libraryMap}
            onBack={() => handleNavigate('home')}
            onSelectEpisode={(ep) => {
              setActiveEpisodeNumber(ep);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectAnime={(anime) => handleOpenAnimeDetail(anime, null)}
            onUpdateStatus={handleUpdateLibraryStatus}
            onStartWatchTogether={(anime, epNum) => {
              const room: WatchRoom = {
                code: Math.random().toString(36).substring(2, 10),
                roomName: `${anime.title} Watch Party`,
                animeId: anime.id,
                animeTitle: anime.title,
                episodeNumber: epNum,
                audio: 'SUB',
                hostName: currentUser?.username || 'Host',
                viewersCount: 1,
                isPublic: true,
                isPlaying: true,
              };
              setWatchRooms((prev) => [room, ...prev]);
              setActiveWatchRoom(room);
              setActiveRoute('watch-together');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onRecordWatchProgress={handleRecordWatchProgress}
            onOpenReport={() => setRequestModalMode('report')}
          />
        )}

        {/* ================================================================
            9. COMMUNITY (/community) VIEW
           ================================================================ */}
        {activeRoute === 'community' && (
          <CommunityPage
            threads={forumThreads}
            onCreateThread={(title, excerpt, category) => {
              const newThread: ForumThread = {
                id: String(Date.now()),
                title,
                excerpt,
                category,
                author: currentUser?.username || 'GuestOtaku',
                authorColor: '#3b82f6',
                startedAgo: 'Just now',
                repliesCount: 0,
                replies: [],
              };
              setForumThreads((prev) => [newThread, ...prev]);
              showToast('Published thread to Community Forum');
            }}
            onReplyThread={(threadId, replyText) => {
              setForumThreads((prev) =>
                prev.map((t) =>
                  t.id === threadId
                    ? {
                        ...t,
                        repliesCount: t.repliesCount + 1,
                        lastReplyBy: currentUser?.username || 'GuestOtaku',
                        lastReplyAgo: 'Just now',
                        replies: [
                          ...t.replies,
                          {
                            id: `r-${Date.now()}`,
                            author: currentUser?.username || 'GuestOtaku',
                            level: currentUser?.level || 5,
                            timeAgo: 'Just now',
                            content: replyText,
                          },
                        ],
                      }
                    : t
                )
              );
            }}
            chatMessages={chatMessages}
            onSendChatMessage={(text) => {
              setChatMessages((prev) => [
                ...prev,
                {
                  id: `msg-${Date.now()}`,
                  username: currentUser?.username || 'GuestViewer',
                  level: currentUser?.level || 4,
                  time: 'Now',
                  text,
                  color: '#10b981',
                },
              ]);
            }}
            currentUser={currentUser}
            onOpenSignIn={() => setIsSignInOpen(true)}
          />
        )}

        {/* ================================================================
            10. WATCH TOGETHER (/watch-together) VIEW
           ================================================================ */}
        {activeRoute === 'watch-together' && (
          <WatchTogetherPage
            catalog={ANIME_CATALOG}
            rooms={watchRooms}
            activeRoom={activeWatchRoom}
            onCreateRoom={(room) => {
              setWatchRooms((prev) => [room, ...prev]);
              setActiveWatchRoom(room);
              showToast(`Created Watch Together room #${room.code}`);
            }}
            onJoinRoom={(code) => {
              const clean = code.trim().replace(/^.*\/watch-together\//, '');
              const found = watchRooms.find(
                (r) => r.code.toLowerCase() === clean.toLowerCase()
              );
              if (found) {
                setActiveWatchRoom(found);
              } else {
                const fallbackRoom: WatchRoom = {
                  code: clean.slice(0, 8) || 'room2026',
                  roomName: `Room #${clean.slice(0, 8)}`,
                  animeId: ANIME_CATALOG[0].id,
                  animeTitle: ANIME_CATALOG[0].title,
                  episodeNumber: 1,
                  audio: 'SUB',
                  hostName: 'Host',
                  viewersCount: 2,
                  isPublic: true,
                  isPlaying: true,
                };
                setActiveWatchRoom(fallbackRoom);
              }
            }}
            onLeaveRoom={() => setActiveWatchRoom(null)}
          />
        )}

        {/* ================================================================
            11. LEADERBOARD (/leaderboard) VIEW
           ================================================================ */}
        {activeRoute === 'leaderboard' && (
          <div className="max-w-[960px] mx-auto px-4 sm:px-8 py-8 space-y-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-7 h-7 text-amber-400" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                  Community Leaderboard
                </h1>
                <p className="text-xs text-zinc-400">
                  Top ani.pm watchers ranked by XP level, episodes completed, and community contributions.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#121216] border border-white/[0.08] divide-y divide-white/[0.06]">
              {[
                { rank: 1, name: 'OreoBiskoot', level: 38, hours: 1420, badge: 'VIP', color: '#ec4899' },
                { rank: 2, name: '𝐋 𝐋 Ŷ 𝐑', level: 31, hours: 1105, badge: 'VIP', color: '#f59e0b' },
                { rank: 3, name: 'Lelouch', level: 29, hours: 980, badge: 'VIP', color: '#9333ea' },
                { rank: 4, name: 'GojoSensei', level: 26, hours: 845, color: '#0284c7' },
                { rank: 5, name: 'Rin', level: 22, hours: 710, color: '#10b981' },
                { rank: 6, name: 'YuksMeNow', level: 18, hours: 540, color: '#e11d48' },
              ].map((u) => (
                <div key={u.rank} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <span className="w-6 text-center font-mono font-bold text-sm text-zinc-400">
                      #{u.rank}
                    </span>
                    <img
                      src={getUserAvatarUrl(u.name, u.color)}
                      alt={u.name}
                      className="w-9 h-9 rounded-full"
                    />
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{u.name}</span>
                        {u.badge && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                            {u.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400">Level {u.level}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs text-zinc-300 tabular-nums">
                    {u.hours.toLocaleString()} hrs watched
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================
            12. SETTINGS (/settings) & ABOUT (/about) VIEWS
           ================================================================ */}
        {activeRoute === 'settings' && (
          <div className="max-w-[780px] mx-auto px-4 sm:px-8 py-8 space-y-6">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
              Preferences &amp; Playback Settings
            </h1>
            <div className="rounded-2xl bg-[#121216] border border-white/[0.08] p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">Default Audio Track</div>
                  <div className="text-xs text-zinc-400">
                    Choose whether episodes start in Japanese (SUB) or English (DUB)
                  </div>
                </div>
                <select
                  value={prefDefaultAudio}
                  onChange={(e) => setPrefDefaultAudio(e.target.value as 'SUB' | 'DUB')}
                  className="bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="SUB">Subbed (Japanese)</option>
                  <option value="DUB">Dubbed (English)</option>
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.07] pt-4">
                <div>
                  <div className="text-sm font-bold text-white">Title Display Language</div>
                  <div className="text-xs text-zinc-400">
                    Show anime titles in English or Romaji
                  </div>
                </div>
                <select
                  value={prefTitleLanguage}
                  onChange={(e) =>
                    setPrefTitleLanguage(e.target.value as 'English' | 'Romaji')
                  }
                  className="bg-[#18181f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="English">English</option>
                  <option value="Romaji">Romaji</option>
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.07] pt-4">
                <div>
                  <div className="text-sm font-bold text-white">Autoplay Next Episode</div>
                  <div className="text-xs text-zinc-400">
                    Automatically start the next episode when the current one finishes
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefAutoPlay}
                  onChange={(e) => setPrefAutoPlay(e.target.checked)}
                  className="w-4 h-4 accent-white"
                />
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.07] pt-4">
                <div>
                  <div className="text-sm font-bold text-white">Auto-Skip Intro / Outro</div>
                  <div className="text-xs text-zinc-400">
                    Skip opening and ending themes automatically
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefAutoSkipIntro}
                  onChange={(e) => setPrefAutoSkipIntro(e.target.checked)}
                  className="w-4 h-4 accent-white"
                />
              </div>
            </div>
          </div>
        )}

        {activeRoute === 'about' && (
          <div className="max-w-[820px] mx-auto px-4 sm:px-8 py-10 space-y-6">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
              About ani.pm
            </h1>
            <div className="p-6 rounded-2xl bg-[#121216] border border-white/[0.08] space-y-4 text-xs text-zinc-300 leading-relaxed">
              <p>
                <strong className="text-white">ani.pm</strong> (and official mirror{' '}
                <strong className="text-white">ani.nz</strong>) is a fast, clutter-free anime streaming and tracking platform built for instant 1080p playback, multi-audio switching (SUB, DUB, and Dubtitles), synchronized Watch Together rooms, and cross-device library management.
              </p>
              <p>
                Disclaimer: This site does not store any files on its server. All contents are provided by non-affiliated third parties.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ====================================================================
          GLOBAL RIGHT-SIDE COMMUNITY CHAT DRAWER
         ==================================================================== */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={(text) => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              username: currentUser?.username || 'GuestViewer',
              level: currentUser?.level || 4,
              time: 'Now',
              text,
              color: '#3b82f6',
            },
          ]);
        }}
        currentUser={currentUser}
        onOpenSignIn={() => setIsSignInOpen(true)}
      />

      {/* ====================================================================
          SIGN IN TO ANI.PM MODAL
         ==================================================================== */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSignInSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Signed in as ${user.username}`);
        }}
      />

      {/* ====================================================================
          KEYBOARD SHORTCUTS MODAL
         ==================================================================== */}
      {isShortcutsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Keyboard shortcuts"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#121216] border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-white">
                Keyboard shortcuts
              </h2>
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              {[
                ['Search anime anywhere', 'Ctrl + K'],
                ['Play / Pause video player', 'Space / K'],
                ['Skip Intro (+85s)', 'S'],
                ['Seek backward / forward 10s', '← / →'],
                ['Toggle Theater mode', 'T'],
                ['Toggle Fullscreen', 'F'],
                ['Toggle Mute', 'M'],
              ].map(([desc, key]) => (
                <div
                  key={desc}
                  className="flex items-center justify-between py-1.5 border-b border-white/[0.06]"
                >
                  <span className="text-zinc-300">{desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[11px] text-white">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          REPORT A PROBLEM / REQUEST AN ANIME MODAL
         ==================================================================== */}
      {requestModalMode && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setRequestModalMode(null);
              showToast(
                requestModalMode === 'report'
                  ? 'Problem report submitted to ani.pm staff'
                  : 'Anime request submitted to catalog queue'
              );
            }}
            className="w-full max-w-md rounded-3xl bg-[#121216] border border-white/10 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-white">
                {requestModalMode === 'report' ? 'Report a problem' : 'Request an anime'}
              </h2>
              <button
                type="button"
                onClick={() => setRequestModalMode(null)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              required
              placeholder={
                requestModalMode === 'report'
                  ? 'Anime title & episode number'
                  : 'Anime title or MyAnimeList / AniList URL'
              }
              className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
            />
            <textarea
              rows={3}
              required
              placeholder={
                requestModalMode === 'report'
                  ? 'Describe the subtitle, audio, or video playback issue…'
                  : 'Any specific season, dub language, or Blu-ray version notes…'
              }
              className="w-full bg-[#18181f] border border-white/10 rounded-xl p-3.5 text-xs text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRequestModalMode(null)}
                className="px-4 py-2 rounded-full bg-white/10 text-xs text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs cursor-pointer"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          IMPORT BACKUP OR MAL LIST MODAL
         ==================================================================== */}
      {isImportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#121216] border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-white">
                Import backup or MAL list
              </h2>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Import your MyAnimeList XML, AniList username, or an ani.pm JSON backup to populate your Watchlist automatically.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  handleUpdateLibraryStatus('jujutsu-kaisen', 'watching');
                  handleUpdateLibraryStatus('cyberpunk-edgerunners-2', 'watching');
                  handleUpdateLibraryStatus('solo-leveling-season-2', 'planning');
                  setIsImportModalOpen(false);
                  showToast('Imported 3 anime from MyAnimeList / AniList sync');
                }}
                className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 cursor-pointer"
              >
                Quick Import Sample MAL Watchlist (3 titles)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MANGA READER MODAL
         ==================================================================== */}
      {activeMangaReader && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
        >
          <div className="w-full max-w-2xl rounded-3xl bg-[#121216] border border-white/15 p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-bold text-white">
                  {activeMangaReader.manga.title} — Chapter {activeMangaReader.chapter}
                </h2>
                <p className="text-xs text-zinc-400">
                  Toonkotsu High-Contrast Vertical Reader
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveMangaReader(null)}
                className="p-2 rounded-full bg-white/10 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {[1, 2, 3].map((page) => (
                <div
                  key={page}
                  className="rounded-2xl overflow-hidden bg-black border border-white/10 p-4 space-y-2"
                >
                  <img
                    src={getEpisodeThumbnailUrl(
                      activeMangaReader.manga.animeRef,
                      page,
                      `Chapter ${activeMangaReader.chapter} · Page ${page}`
                    )}
                    alt={`Page ${page}`}
                    className="w-full rounded-xl object-cover grayscale contrast-125"
                  />
                  <div className="text-center text-[11px] font-mono text-zinc-500">
                    Page {page} of 3
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          FOOTER (matching ani.pm footer structure & links)
         ==================================================================== */}
      <footer className="border-t border-white/[0.07] bg-[#060608] mt-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-xs text-zinc-400">
          <div className="space-y-2 max-w-md">
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate('home');
              }}
              className="inline-flex items-center gap-2 text-white font-display font-extrabold tracking-tight text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L14.8 9.2L23 12L14.8 14.8L12 23L9.2 14.8L1 12L9.2 9.2L12 1Z" />
              </svg>
              <span>ANI.PM</span>
            </a>
            <p className="text-zinc-400">
              Subbed and dubbed anime, tracked across every device you watch on.
            </p>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Disclaimer: This site does not store any files on its server. All contents are provided by non-affiliated third parties.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-3">
            <div className="flex flex-wrap items-center gap-5 text-xs text-zinc-300">
              {(['About', 'Terms', 'Privacy', 'DMCA', 'Developers'] as const).map((item) => (
                <a
                  key={item}
                  href={`#/${item.toLowerCase()}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate('about');
                  }}
                  className="hover:text-white transition-colors"
                >
                  {item}
                </a>
              ))}
              <a
                href="https://discord.gg/anipm"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                Discord
              </a>
            </div>
            <p className="text-[11px] text-zinc-500">© 2026 Ani.pm</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
