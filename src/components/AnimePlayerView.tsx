import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Plus,
  Check,
  Bell,
  Share2,
  Star,
  List,
  Layers,
  BookOpen,
  Sparkles,
  MessageSquare,
  Download,
  Search,
  ArrowUpDown,
  Grid,
  Eye,
  EyeOff,
  Mic,
  Volume2,
  VolumeX,
  Maximize2,
  SkipBack,
  SkipForward,
  Moon,
  Sun,
  Tv,
  Flag,
  ThumbsUp,
  ThumbsDown,
  Users,
  Settings,
} from 'lucide-react';
import {
  filterAndSortEpisodes,
  type AnimeItem,
  type AnimeEpisode,
  type LibraryStatus,
} from '../utils/animeLogic';
import {
  getAnimePosterUrl,
  getAnimeBannerUrl,
  getEpisodeThumbnailUrl,
  getUserAvatarUrl,
} from '../utils/artworkGenerator';
import { StylizedAnimeLogo } from './HeroCarousel';
import { AnimeCard } from './AnimeCard';

interface AnimePlayerViewProps {
  anime: AnimeItem;
  allAnime: AnimeItem[];
  activeEpisodeNumber: number | null;
  libraryStatus?: LibraryStatus;
  libraryMap: Record<string, LibraryStatus>;
  onBack: () => void;
  onSelectEpisode: (epNumber: number | null) => void;
  onSelectAnime: (anime: AnimeItem) => void;
  onUpdateStatus: (animeId: string, status: LibraryStatus | null) => void;
  onStartWatchTogether: (anime: AnimeItem, episodeNumber: number) => void;
  onRecordWatchProgress: (
    animeId: string,
    epNumber: number,
    watchedSec: number,
    durationSec: number,
    audio: 'SUB' | 'DUB'
  ) => void;
  onOpenReport: () => void;
}

interface CommentItem {
  id: string;
  username: string;
  handle: string;
  level: number;
  timeAgo: string;
  episodeTag?: string;
  text: string;
  likes: number;
  liked?: boolean;
  color: string;
}

const SUBTITLE_LINES_SUB = [
  '「領域展開」— 呪力の核心を解き放て！',
  'Everything within this perimeter is already inside my technique.',
  'Don’t look back! Push past the limit of your cursed energy!',
  'Even in the darkest night of this city, a spark remains.',
  'Target locked. Output at 120 percent—now!',
];

const SUBTITLE_LINES_DUB = [
  '[DUBTITLE] Domain Expansion — release the core of your power right now!',
  '[DUBTITLE] Everything inside this perimeter is already caught in my technique.',
  '[DUBTITLE] Don’t look back, kid! Push past 120 percent of your limit!',
  '[DUBTITLE] Even in Night City’s darkest alley, our spark still burns.',
  '[DUBTITLE] Target locked. Maximum output—fire!',
];

export const AnimePlayerView: React.FC<AnimePlayerViewProps> = ({
  anime,
  allAnime,
  activeEpisodeNumber,
  libraryStatus,
  libraryMap,
  onBack,
  onSelectEpisode,
  onSelectAnime,
  onUpdateStatus,
  onStartWatchTogether,
  onRecordWatchProgress,
  onOpenReport,
}) => {
  // Overview vs Episode Player states
  const [activeTab, setActiveTab] = useState<
    'episodes' | 'related' | 'manga' | 'similar' | 'comments' | 'downloads'
  >('episodes');
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [bellSubscribed, setBellSubscribed] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [rateOpen, setRateOpen] = useState(false);
  const [tagsExpanded, setTagsExpanded] = useState(false);

  // Episode Filter controls matching ani.pm
  const [episodeQuery, setEpisodeQuery] = useState('');
  const [episodeSort, setEpisodeSort] = useState<'oldest' | 'newest'>('oldest');
  const [isNumberGrid, setIsNumberGrid] = useState(false);
  const [hideSpoilers, setHideSpoilers] = useState(false);
  const [audioFilter, setAudioFilter] = useState<'all' | 'sub' | 'dub'>('all');

  // Video Player Controls matching ani.pm player screenshot
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(82); // start near intro so user can see/test Skip Intro
  const totalDuration = 1435; // 23:55
  const [isMuted, setIsMuted] = useState(false);
  const [resolution, setResolution] = useState<'1080p' | '720p' | '480p' | '360p' | '144p'>('1080p');
  const [resMenuOpen, setResMenuOpen] = useState(false);

  const [autoplay, setAutoplay] = useState(true);
  const [autoSkip, setAutoSkip] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [lightsOff, setLightsOff] = useState(false);
  const [ambientMode, setAmbientMode] = useState(true);
  const [playerSize, setPlayerSize] = useState<'100%' | '115%'>('100%');

  const [audioLang, setAudioLang] = useState<'SUB' | 'DUB'>('DUB');
  const [subMode, setSubMode] = useState<'SOFT' | 'HARD'>('SOFT');
  const [backupServer, setBackupServer] = useState(false);
  const [betaServer, setBetaServer] = useState(false);
  const [customPlayerSkin, setCustomPlayerSkin] = useState(true);

  const [likesCount, setLikesCount] = useState(anime.likes);
  const [userLiked, setUserLiked] = useState<'like' | 'dislike' | null>(null);

  const [comments, setComments] = useState<CommentItem[]>([
    {
      id: 'c1',
      username: 'Lemon1',
      handle: '@deeznutz',
      level: 1,
      timeAgo: '4 months ago',
      text: `first time watching ${anime.title} in 1080p, animation goes crazy`,
      likes: 4,
      color: '#f59e0b',
    },
    {
      id: 'c2',
      username: 'Mohib Rauf',
      handle: '@Mohib',
      level: 12,
      timeAgo: '1 week ago',
      episodeTag: 'EP 1',
      text: 'love this site, instant loading and dubtitles work great',
      likes: 9,
      color: '#3b82f6',
    },
    {
      id: 'c3',
      username: 'BrXyXn',
      handle: '@CalmMeteor744',
      level: 6,
      timeAgo: '6 days ago',
      episodeTag: `EP ${anime.episodes.length}`,
      text: 'first season done its a masterpiece',
      likes: 3,
      color: '#ec4899',
    },
  ]);
  const [newCommentText, setNewCommentText] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  const filteredEpisodes = filterAndSortEpisodes(anime.episodes, {
    query: episodeQuery,
    sortOrder: episodeSort,
    audioFilter,
  });

  const activeEpisode: AnimeEpisode | undefined =
    activeEpisodeNumber !== null
      ? anime.episodes.find((e) => e.number === activeEpisodeNumber) || anime.episodes[0]
      : undefined;

  // Timer tick when playing an episode
  useEffect(() => {
    if (!activeEpisode || !isPlaying) return;
    const timer = window.setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 1;
        // Auto-skip intro (between 85s and 175s)
        if (autoSkip && next >= 85 && next < 175) {
          return 175;
        }
        if (next >= totalDuration) {
          if (autoplay && activeEpisode.number < anime.episodes.length) {
            onSelectEpisode(activeEpisode.number + 1);
            return 0;
          }
          setIsPlaying(false);
          return totalDuration;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeEpisode, isPlaying, autoSkip, autoplay, anime.episodes.length, onSelectEpisode]);

  // Record watch progress when episode changes or time advances
  useEffect(() => {
    if (!activeEpisode) return;
    onRecordWatchProgress(anime.id, activeEpisode.number, currentTime, totalDuration, audioLang);
  }, [anime.id, activeEpisode?.number, Math.floor(currentTime / 15), audioLang]);

  // Render animated anime frame on canvas in Episode Player mode
  useEffect(() => {
    if (!activeEpisode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let tick = currentTime * 12;

    const drawFrame = () => {
      const w = canvas.width;
      const h = canvas.height;
      tick += isPlaying ? 1 : 0;

      // Sky / background gradient from anime palette
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, anime.palette.bgDark);
      grad.addColorStop(0.55, anime.palette.primary + '55');
      grad.addColorStop(1, '#060609');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Animated energy aura / moon
      const pulse = Math.sin(tick * 0.04) * 18;
      const radGrad = ctx.createRadialGradient(
        w * 0.52,
        h * 0.44,
        15,
        w * 0.52,
        h * 0.44,
        210 + pulse
      );
      radGrad.addColorStop(0, anime.palette.accent + 'aa');
      radGrad.addColorStop(0.5, anime.palette.primary + '44');
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, w, h);

      // Animated anime speedlines
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 14; i++) {
        const yPos = ((i * 47 + tick * 3) % h);
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(w, yPos - 25);
        ctx.stroke();
      }

      // Cel-shaded anime protagonist silhouette in motion
      const swayX = Math.sin(tick * 0.03) * 10;
      const swayY = Math.cos(tick * 0.05) * 6;
      ctx.save();
      ctx.translate(w * 0.5 + swayX, h * 0.54 + swayY);

      // Cape / aura wave
      ctx.fillStyle = anime.palette.primary;
      ctx.beginPath();
      ctx.moveTo(-30, -45);
      ctx.quadraticCurveTo(95 + pulse, -70, 150 + pulse * 1.4, 35);
      ctx.quadraticCurveTo(60, 55, -20, 10);
      ctx.fill();

      // Character torso & head
      ctx.fillStyle = '#0b0d14';
      ctx.strokeStyle = anime.palette.accent;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -70, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-38, -38);
      ctx.lineTo(38, -38);
      ctx.lineTo(62, 140);
      ctx.lineTo(-62, 140);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing anime eyes
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-14, -73, 9, 4);
      ctx.fillRect(5, -73, 9, 4);

      // Energy blade slash arc
      ctx.strokeStyle = anime.palette.accent;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 125 + pulse * 0.5, -0.7, 1.3);
      ctx.stroke();
      ctx.restore();

      // Server & Resolution watermark top-left
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(18, 16, 235, 28);
      ctx.fillStyle = '#e4e4e7';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      const srvName = backupServer ? 'BACKUP-CDN' : betaServer ? 'BETA-MULTI' : 'ANI.PM-DIRECT';
      ctx.fillText(`${srvName} · ${resolution} · ${audioLang} (${subMode})`, 28, 34);

      if (isPlaying) {
        animId = window.requestAnimationFrame(drawFrame);
      }
    };

    drawFrame();
    return () => {
      if (animId) window.cancelAnimationFrame(animId);
    };
  }, [activeEpisode, isPlaying, anime, resolution, audioLang, subMode, backupServer, betaServer]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentSubtitle =
    audioLang === 'DUB'
      ? SUBTITLE_LINES_DUB[Math.floor(currentTime / 6) % SUBTITLE_LINES_DUB.length]
      : SUBTITLE_LINES_SUB[Math.floor(currentTime / 6) % SUBTITLE_LINES_SUB.length];

  const isIntroWindow = currentTime >= 60 && currentTime <= 150;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setComments((prev) => [
      {
        id: `c-${Date.now()}`,
        username: 'You',
        handle: '@otaku_viewer',
        level: 9,
        timeAgo: 'Just now',
        episodeTag: activeEpisode ? `EP ${activeEpisode.number}` : 'EP 1',
        text: newCommentText.trim(),
        likes: 1,
        liked: true,
        color: '#10b981',
      },
      ...prev,
    ]);
    setNewCommentText('');
  };

  const relatedList = allAnime
    .filter(
      (item) =>
        item.id !== anime.id &&
        (item.studio === anime.studio ||
          item.genres.some((g) => anime.genres.includes(g)))
    )
    .slice(0, 6);

  // ============================================================================
  // RENDER MODE 1: EPISODE VIDEO PLAYER VIEW (/anime/:slug?ep=:ep)
  // ============================================================================
  if (activeEpisode) {
    return (
      <div className="relative min-h-screen pb-16">
        {/* Lights-off overlay */}
        {lightsOff && (
          <div
            onClick={() => setLightsOff(false)}
            className="fixed inset-0 bg-black/85 z-30 transition-opacity"
          />
        )}

        <div
          className={`mx-auto px-4 sm:px-8 pt-4 ${
            playerSize === '115%' ? 'max-w-[1600px]' : 'max-w-[1440px]'
          }`}
        >
          <div
            className={`grid gap-6 ${
              theaterMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'
            }`}
          >
            {/* LEFT COLUMN: Video Player + Controls + Episode Info + Server Bar */}
            <div className={`${theaterMode ? 'w-full' : 'lg:col-span-8'} space-y-4 relative z-40`}>
              {/* Ambient Mode Backlight */}
              <div
                ref={playerContainerRef}
                className="relative rounded-2xl overflow-hidden bg-black ring-1 ring-white/10"
                style={
                  ambientMode
                    ? {
                        boxShadow: `0 0 95px -15px ${anime.palette.primary}66, 0 0 45px -10px ${anime.palette.accent}44`,
                      }
                    : undefined
                }
              >
                {/* 16:9 Interactive Anime Stream Canvas */}
                <div
                  onClick={() => setIsPlaying((v) => !v)}
                  className="relative aspect-video w-full bg-[#050508] cursor-pointer select-none overflow-hidden"
                >
                  <canvas
                    ref={canvasRef}
                    width={960}
                    height={540}
                    data-testid="anime-video-canvas"
                    className="w-full h-full object-cover"
                  />

                  {/* Subtitle Overlay */}
                  <div className="absolute inset-x-8 bottom-16 flex justify-center pointer-events-none">
                    <span
                      className={`px-3.5 py-1 rounded text-sm sm:text-base font-semibold text-center leading-snug ${
                        subMode === 'SOFT'
                          ? 'bg-black/75 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
                          : 'bg-transparent text-amber-300 drop-shadow-[0_2px_6px_rgba(0,0,0,1)]'
                      }`}
                    >
                      {currentSubtitle}
                    </span>
                  </div>

                  {/* Floating Skip Intro Button */}
                  {isIntroWindow && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentTime(155);
                      }}
                      className="absolute right-5 bottom-16 bg-white/95 hover:bg-white text-black font-bold text-xs px-4 py-2 rounded-lg shadow-xl transition-transform active:scale-95 cursor-pointer"
                    >
                      Skip Intro →
                    </button>
                  )}

                  {/* Center Play/Pause feedback badge when paused */}
                  {!isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/95 text-black flex items-center justify-center shadow-2xl">
                        <Play className="w-7 h-7 fill-black ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Bottom Scrubber & Internal Video Controls */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 pt-6 pb-3 space-y-2"
                  >
                    {/* Progress bar with Intro chapter highlight */}
                    <div className="relative flex items-center group">
                      <input
                        type="range"
                        aria-label="Seek video timeline"
                        min={0}
                        max={totalDuration}
                        value={currentTime}
                        onChange={(e) => setCurrentTime(Number(e.target.value))}
                        className="w-full h-1.5 bg-white/25 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-200 tabular-nums">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          aria-label={isPlaying ? 'Pause video' : 'Play video'}
                          onClick={() => setIsPlaying((v) => !v)}
                          className="hover:text-white cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                          onClick={() => setIsMuted((v) => !v)}
                          className="hover:text-white cursor-pointer"
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>

                        <span>
                          {formatSeconds(currentTime)} / {activeEpisode.duration}
                        </span>
                      </div>

                      {/* Resolution selector (1080p down to 144p) */}
                      <div className="relative flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setResMenuOpen((v) => !v)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-[11px] font-mono font-semibold text-white cursor-pointer"
                        >
                          <Settings className="w-3 h-3" />
                          <span>{resolution}</span>
                        </button>

                        {resMenuOpen && (
                          <div className="absolute right-0 bottom-7 w-28 rounded-xl bg-[#141419] border border-white/15 py-1 text-xs shadow-2xl z-50">
                            {(['1080p', '720p', '480p', '360p', '144p'] as const).map((res) => (
                              <button
                                key={res}
                                type="button"
                                onClick={() => {
                                  setResolution(res);
                                  setResMenuOpen(false);
                                }}
                                className={`w-full px-3 py-1.5 text-left font-mono hover:bg-white/10 flex items-center justify-between cursor-pointer ${
                                  resolution === res ? 'text-amber-400 font-bold' : 'text-zinc-300'
                                }`}
                              >
                                <span>{res}</span>
                                {res === '1080p' && (
                                  <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1 rounded">
                                    HD
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Player Control Pill Row matching ani.pm screenshot */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    aria-pressed={autoplay}
                    onClick={() => setAutoplay((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      autoplay
                        ? 'bg-white text-black font-semibold'
                        : 'bg-[#18181d] text-zinc-300 hover:bg-white/10 border border-white/[0.07]'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Autoplay</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={autoSkip}
                    onClick={() => setAutoSkip((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      autoSkip
                        ? 'bg-white text-black font-semibold'
                        : 'bg-[#18181d] text-zinc-300 hover:bg-white/10 border border-white/[0.07]'
                    }`}
                  >
                    <SkipForward className="w-3 h-3" />
                    <span>Auto-skip</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={theaterMode}
                    onClick={() => setTheaterMode((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      theaterMode
                        ? 'bg-white text-black font-semibold'
                        : 'bg-[#18181d] text-zinc-300 hover:bg-white/10 border border-white/[0.07]'
                    }`}
                  >
                    <Tv className="w-3 h-3" />
                    <span>Theater mode</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={lightsOff}
                    onClick={() => setLightsOff((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      lightsOff
                        ? 'bg-amber-400 text-black font-semibold'
                        : 'bg-[#18181d] text-zinc-300 hover:bg-white/10 border border-white/[0.07]'
                    }`}
                  >
                    <Moon className="w-3 h-3" />
                    <span>Lights off</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={ambientMode}
                    onClick={() => setAmbientMode((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      ambientMode
                        ? 'bg-white/15 text-white border border-white/20'
                        : 'bg-[#18181d] text-zinc-300 hover:bg-white/10 border border-white/[0.07]'
                    }`}
                  >
                    <Sun className="w-3 h-3" />
                    <span>Ambient mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlayerSize((s) => (s === '100%' ? '115%' : '100%'))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#18181d] text-zinc-300 hover:bg-white/10 border border-white/[0.07] cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Player size</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (playerContainerRef.current?.requestFullscreen) {
                        playerContainerRef.current.requestFullscreen().catch(() => {});
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#18181d] text-zinc-300 hover:bg-white/10 border border-white/[0.07] cursor-pointer"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Fullscreen</span>
                  </button>
                </div>

                {/* Prev / Next episode circular buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Previous episode"
                    disabled={activeEpisode.number <= 1}
                    onClick={() => onSelectEpisode(activeEpisode.number - 1)}
                    className="w-8 h-8 rounded-full bg-[#18181d] border border-white/[0.07] flex items-center justify-center text-zinc-300 hover:text-white disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next episode"
                    disabled={activeEpisode.number >= anime.episodes.length}
                    onClick={() => onSelectEpisode(activeEpisode.number + 1)}
                    className="w-8 h-8 rounded-full bg-[#18181d] border border-white/[0.07] flex items-center justify-center text-zinc-300 hover:text-white disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Episode Title & Description matching ani.pm player screenshot */}
              <div className="pt-2 space-y-2">
                <h1 className="text-xl sm:text-2xl font-display font-bold text-white">
                  <span className="text-zinc-400 mr-1.5">{activeEpisode.number}.</span>
                  {activeEpisode.title}
                </h1>
                <p className="text-sm text-zinc-300/90 leading-relaxed max-w-3xl">
                  {activeEpisode.description}
                </p>
              </div>

              {/* SUB / DUB + SOFT / HARD + Backup server / Beta server / Player / Report bar */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <div
                  role="group"
                  aria-label="Audio language"
                  className="inline-flex items-center rounded-full bg-[#18181d] p-1 border border-white/[0.08]"
                >
                  <button
                    type="button"
                    aria-pressed={audioLang === 'SUB'}
                    onClick={() => setAudioLang('SUB')}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      audioLang === 'SUB' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    SUB
                  </button>
                  <button
                    type="button"
                    aria-pressed={audioLang === 'DUB'}
                    onClick={() => setAudioLang('DUB')}
                    className={`inline-flex items-center gap-1 px-3.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      audioLang === 'DUB' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Mic className="w-3 h-3" />
                    <span>DUB</span>
                  </button>
                </div>

                <div
                  role="group"
                  aria-label="Subtitle mode"
                  className="inline-flex items-center rounded-full bg-[#18181d] p-1 border border-white/[0.08]"
                >
                  <button
                    type="button"
                    aria-pressed={subMode === 'SOFT'}
                    onClick={() => setSubMode('SOFT')}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      subMode === 'SOFT' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    SOFT
                  </button>
                  <button
                    type="button"
                    aria-pressed={subMode === 'HARD'}
                    onClick={() => setSubMode('HARD')}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      subMode === 'HARD' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    HARD
                  </button>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={backupServer}
                  onClick={() => setBackupServer((v) => !v)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18181d] border border-white/[0.08] text-xs text-zinc-300 hover:text-white cursor-pointer"
                >
                  <span
                    className={`w-6 h-3.5 rounded-full flex items-center p-0.5 transition-colors ${
                      backupServer ? 'bg-emerald-500 justify-end' : 'bg-zinc-600 justify-start'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  </span>
                  <span>Backup server</span>
                </button>

                <button
                  type="button"
                  role="switch"
                  aria-checked={betaServer}
                  onClick={() => setBetaServer((v) => !v)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18181d] border border-white/[0.08] text-xs text-zinc-300 hover:text-white cursor-pointer"
                >
                  <span
                    className={`w-6 h-3.5 rounded-full flex items-center p-0.5 transition-colors ${
                      betaServer ? 'bg-emerald-500 justify-end' : 'bg-zinc-600 justify-start'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  </span>
                  <span>Beta server</span>
                </button>

                <button
                  type="button"
                  role="switch"
                  aria-checked={customPlayerSkin}
                  onClick={() => setCustomPlayerSkin((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#18181d] border border-white/[0.08] text-xs text-zinc-300 hover:text-white cursor-pointer"
                >
                  <span>⇄ Player</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenReport}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#18181d] border border-white/[0.08] text-xs text-zinc-300 hover:text-white cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Report a problem</span>
                </button>
              </div>

              {/* Series Details Card below Player matching ani.pm player snapshot */}
              <div className="mt-6 p-5 rounded-2xl bg-[#111115] border border-white/[0.07] flex flex-col sm:flex-row gap-5">
                <img
                  src={getAnimePosterUrl(anime)}
                  alt={anime.title}
                  referrerPolicy="no-referrer"
                  onClick={() => onSelectEpisode(null)}
                  className="w-28 h-40 rounded-xl object-cover shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                />
                <div className="flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectEpisode(null)}
                        className="text-lg font-bold text-white hover:underline text-left cursor-pointer"
                      >
                        {anime.title}
                      </button>
                      <p className="text-xs text-zinc-400">{anime.nativeTitle}</p>
                      <p className="text-xs text-zinc-400 mt-1 tabular-nums">
                        {anime.views.toLocaleString()} views · {anime.format} · {anime.airedRange} ·{' '}
                        {anime.episodesCount} episodes
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (userLiked !== 'like') {
                            setLikesCount((c) => c + 1);
                            setUserLiked('like');
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors cursor-pointer tabular-nums ${
                          userLiked === 'like'
                            ? 'bg-white text-black border-white font-semibold'
                            : 'bg-white/[0.05] text-zinc-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{likesCount}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserLiked('dislike')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors cursor-pointer tabular-nums ${
                          userLiked === 'dislike'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-white/[0.05] text-zinc-300 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>{anime.dislikes}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onStartWatchTogether(anime, activeEpisode.number)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.07] hover:bg-white/15 text-white border border-white/10 transition-colors cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Watch together</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                    {anime.synopsis}
                  </p>
                </div>
              </div>

              {/* Comments Section below Player */}
              <div className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">
                    {comments.length} Comments
                  </h2>
                  <span className="text-xs text-zinc-400">Top comments · All episodes</span>
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Add a comment…"
                    className="flex-1 bg-[#141418] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
                  >
                    Post
                  </button>
                </form>

                <div className="space-y-3">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="flex gap-3 p-3.5 rounded-xl bg-[#111115] border border-white/[0.06]"
                    >
                      <img
                        src={getUserAvatarUrl(c.username, c.color)}
                        alt={c.username}
                        className="w-9 h-9 rounded-full shrink-0"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-white">{c.handle}</span>
                          <span className="px-1.5 py-0.5 rounded bg-white/[0.07] text-[10px] font-mono text-zinc-300">
                            Lv {c.level}
                          </span>
                          <span className="text-zinc-500">{c.timeAgo}</span>
                          {c.episodeTag && (
                            <span className="px-1.5 py-0.5 rounded bg-white/[0.05] text-[10px] text-zinc-400">
                              {c.episodeTag}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-200 leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Season & Episode Selector Sidebar matching ani.pm player screenshot */}
            <aside className={`${theaterMode ? 'w-full' : 'lg:col-span-4'} space-y-3`}>
              {/* Season Selector bar */}
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#141418] border border-white/[0.08] text-xs font-medium text-white">
                <span className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  <span>
                    Season 1 · {anime.year} · {anime.episodes.length} eps
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onSelectEpisode(null)}
                  className="text-zinc-400 hover:text-white text-[11px] cursor-pointer"
                >
                  Series Info →
                </button>
              </div>

              {/* Search episodes input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  aria-label="Search episodes"
                  value={episodeQuery}
                  onChange={(e) => setEpisodeQuery(e.target.value)}
                  placeholder="Search episodes"
                  className="w-full bg-[#141418] border border-white/[0.08] rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
                />
              </div>

              {/* Filter & view controls */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setEpisodeSort((s) => (s === 'oldest' ? 'newest' : 'oldest'))
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#18181d] border border-white/[0.08] text-xs text-zinc-300 hover:text-white cursor-pointer"
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span>{episodeSort === 'oldest' ? 'Oldest' : 'Newest'}</span>
                </button>

                <button
                  type="button"
                  aria-label="Show episodes as a number grid"
                  onClick={() => setIsNumberGrid((v) => !v)}
                  className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
                    isNumberGrid
                      ? 'bg-white text-black border-white'
                      : 'bg-[#18181d] text-zinc-300 border-white/[0.08] hover:text-white'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  aria-label="Hide episode descriptions to avoid spoilers"
                  onClick={() => setHideSpoilers((v) => !v)}
                  className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
                    hideSpoilers
                      ? 'bg-white text-black border-white'
                      : 'bg-[#18181d] text-zinc-300 border-white/[0.08] hover:text-white'
                  }`}
                >
                  {hideSpoilers ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAudioFilter((a) => (a === 'sub' ? 'all' : 'sub'))
                  }
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors cursor-pointer tabular-nums ${
                    audioFilter === 'sub'
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-[#18181d] text-zinc-300 border-white/[0.08] hover:text-white'
                  }`}
                >
                  Sub only {anime.subCount}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAudioFilter((a) => (a === 'dub' ? 'all' : 'dub'))
                  }
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors cursor-pointer tabular-nums ${
                    audioFilter === 'dub'
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-[#18181d] text-zinc-300 border-white/[0.08] hover:text-white'
                  }`}
                >
                  Dub only {anime.dubCount}
                </button>
              </div>

              {/* Episode Cards List / Number Grid */}
              {isNumberGrid ? (
                <div className="grid grid-cols-5 gap-2 max-h-[620px] overflow-y-auto pr-1">
                  {filteredEpisodes.map((ep) => {
                    const isCurrent = ep.number === activeEpisode.number;
                    return (
                      <button
                        key={ep.id}
                        type="button"
                        onClick={() => {
                          onSelectEpisode(ep.number);
                          setCurrentTime(0);
                          setIsPlaying(true);
                        }}
                        className={`py-2.5 rounded-xl text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-white text-black'
                            : 'bg-[#16161b] text-zinc-300 hover:bg-white/15 border border-white/[0.06]'
                        }`}
                      >
                        {ep.number}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
                  {filteredEpisodes.map((ep) => {
                    const isCurrent = ep.number === activeEpisode.number;
                    const thumbUrl = getEpisodeThumbnailUrl(anime, ep.number, ep.title);
                    return (
                      <button
                        key={ep.id}
                        type="button"
                        onClick={() => {
                          onSelectEpisode(ep.number);
                          setCurrentTime(0);
                          setIsPlaying(true);
                        }}
                        className={`w-full flex gap-3 p-2 rounded-2xl text-left transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-[#222228] ring-1 ring-white/25'
                            : 'bg-[#121216] hover:bg-[#1a1a20] border border-white/[0.05]'
                        }`}
                      >
                        <div className="relative w-36 aspect-video rounded-xl overflow-hidden bg-black shrink-0">
                          <img
                            src={thumbUrl}
                            alt={`Episode ${ep.number}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/80 text-[10px] font-semibold text-white">
                            EP {ep.number}
                          </span>
                          {isCurrent && (
                            <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-white text-black text-[9px] font-bold flex items-center gap-1">
                              <Play className="w-2 h-2 fill-black" /> Playing
                            </span>
                          )}
                          {ep.hasDub && (
                            <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-zinc-200 flex items-center gap-0.5">
                              <Mic className="w-2.5 h-2.5" /> DUB
                            </span>
                          )}
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/85 text-[10px] font-mono text-zinc-200 tabular-nums">
                            {ep.duration}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-semibold text-white truncate">
                              {ep.title}
                            </h4>
                            {!hideSpoilers && (
                              <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                                {ep.description}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-500 mt-1">{ep.aired}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER MODE 2: ANIME DETAIL OVERVIEW (/anime/:slug — matching anipm-watch.png)
  // ============================================================================
  const bannerUrl = getAnimeBannerUrl(anime);
  const posterUrl = getAnimePosterUrl(anime);
  const visibleTags = tagsExpanded ? anime.tags : anime.tags.slice(0, 12);

  return (
    <div className="min-h-screen pb-16">
      {/* Top Hero Region with Backdrop Banner */}
      <section aria-label={anime.title} className="relative isolate w-full overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={bannerUrl}
            alt={anime.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08080a] via-[#08080a]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/40 to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-10 pt-5 pb-8">
          {/* Circular Back button matching ani.pm detail page */}
          <button
            type="button"
            aria-label="Back"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 border border-white/15 flex items-center justify-center text-white mb-5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            {/* Left Poster Column */}
            <div className="lg:col-span-3 max-w-[240px] sm:max-w-[260px]">
              <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/15 bg-[#121216]">
                <img
                  src={posterUrl}
                  alt={anime.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right Hero Details Column */}
            <div className="lg:col-span-9 space-y-4">
              <StylizedAnimeLogo anime={anime} size="lg" />

              {/* Metadata Pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/75 border border-white/15 text-amber-400 font-semibold tabular-nums">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {(userRating ?? anime.score).toFixed(1)}
                </span>
                <span className="px-3 py-1 rounded-full bg-black/75 border border-white/15 text-zinc-200 tabular-nums">
                  {anime.year}
                </span>
                <span className="px-3 py-1 rounded-full bg-black/75 border border-white/15 text-zinc-200 tabular-nums">
                  {anime.episodesCount} Episodes
                </span>
                <span className="px-3 py-1 rounded-full bg-black/75 border border-white/15 text-zinc-200">
                  {anime.format}
                </span>
                {anime.genres.map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 rounded-full bg-black/75 border border-white/15 text-zinc-200"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Synopsis with More toggle */}
              <div className="max-w-2xl">
                <p
                  className={`text-sm text-zinc-200/90 leading-relaxed ${
                    synopsisExpanded ? '' : 'line-clamp-3'
                  }`}
                >
                  {anime.synopsis}
                </p>
                <button
                  type="button"
                  onClick={() => setSynopsisExpanded((v) => !v)}
                  className="mt-1 text-xs font-semibold text-white hover:underline cursor-pointer"
                >
                  {synopsisExpanded ? 'Less' : 'More'}
                </button>
              </div>

              {/* Action Buttons Row: Watch now + Plus + Bell + Share + AL + MAL + Star */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => onSelectEpisode(1)}
                  className="inline-flex items-center justify-center gap-2.5 bg-white hover:bg-zinc-200 text-black font-semibold text-sm px-8 py-3.5 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-black text-black" />
                  <span>Watch now</span>
                </button>

                {/* Library status button */}
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Choose library status"
                    onClick={() => setStatusMenuOpen((v) => !v)}
                    className={`w-11 h-11 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                      libraryStatus
                        ? 'bg-white text-black border-white'
                        : 'bg-black/60 hover:bg-black/85 text-white border-white/15'
                    }`}
                  >
                    {libraryStatus ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                  {statusMenuOpen && (
                    <div className="absolute left-0 mt-2 w-44 rounded-xl bg-[#141419] border border-white/15 shadow-2xl py-1.5 text-xs text-zinc-200 z-30">
                      {(
                        [
                          ['watching', 'Watching'],
                          ['planning', 'Plan to Watch'],
                          ['completed', 'Completed'],
                          ['on_hold', 'On Hold'],
                          ['dropped', 'Dropped'],
                        ] as const
                      ).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            onUpdateStatus(anime.id, val);
                            setStatusMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-white/10 text-left cursor-pointer"
                        >
                          <span>{label}</span>
                          {libraryStatus === val && (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Episode Alerts Bell */}
                <button
                  type="button"
                  aria-label="Get new-episode alerts"
                  onClick={() => setBellSubscribed((v) => !v)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                    bellSubscribed
                      ? 'bg-amber-400 text-black border-amber-400'
                      : 'bg-black/60 hover:bg-black/85 text-white border-white/15'
                  }`}
                  title="New episode alerts"
                >
                  <Bell className="w-4 h-4" />
                </button>

                {/* Share button */}
                <button
                  type="button"
                  aria-label="Share"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href).catch(() => {});
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2000);
                  }}
                  className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/15 flex items-center justify-center transition-colors cursor-pointer"
                  title="Share link"
                >
                  {shareCopied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>

                {/* AniList & MAL links */}
                <a
                  href={`https://anilist.co/anime/${anime.anilistId}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="AniList"
                  className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-[#02a9ff] border border-white/15 flex items-center justify-center text-xs font-extrabold tracking-tighter transition-colors"
                >
                  AL
                </a>

                <a
                  href={`https://myanimelist.net/anime/${anime.malId}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="MyAnimeList"
                  className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-[#2e51a2] border border-white/15 flex items-center justify-center text-[10px] font-extrabold tracking-tighter transition-colors"
                >
                  MAL
                </a>

                {/* Rate this title */}
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Rate this title"
                    onClick={() => setRateOpen((v) => !v)}
                    className={`w-11 h-11 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                      userRating
                        ? 'bg-amber-400 text-black border-amber-400'
                        : 'bg-black/60 hover:bg-black/85 text-white border-white/15'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  {rateOpen && (
                    <div className="absolute left-0 mt-2 p-2 rounded-xl bg-[#141419] border border-white/15 shadow-2xl flex items-center gap-1 z-30">
                      {[6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => {
                            setUserRating(score);
                            setRateOpen(false);
                          }}
                          className="px-2 py-1 rounded hover:bg-white/15 text-xs font-bold text-amber-400 cursor-pointer"
                        >
                          ★ {score}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Split: Left Metadata Sidebar (3 cols) + Right Tabs & Episodes Grid (9 cols) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-10 pt-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Metadata Definition List matching ani.pm screenshot */}
        <aside className="lg:col-span-3 space-y-3.5 text-xs">
          <div>
            <div className="text-zinc-500">Format</div>
            <div className="text-white font-semibold mt-0.5">{anime.format}</div>
          </div>
          <div>
            <div className="text-zinc-500">Episodes</div>
            <div className="text-white font-semibold mt-0.5 tabular-nums">{anime.episodesCount}</div>
          </div>
          <div>
            <div className="text-zinc-500">Duration</div>
            <div className="text-white font-semibold mt-0.5">{anime.durationPerEp}</div>
          </div>
          <div>
            <div className="text-zinc-500">Aired</div>
            <div className="text-white font-semibold mt-0.5">{anime.airedRange}</div>
          </div>
          <div>
            <div className="text-zinc-500">Score</div>
            <div className="text-amber-400 font-semibold mt-0.5 flex items-center gap-1 tabular-nums">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{anime.score.toFixed(1)}</span>
            </div>
          </div>
          <div>
            <div className="text-zinc-500">Views</div>
            <div className="text-white font-semibold mt-0.5 tabular-nums">
              {anime.views.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-zinc-500">Studio</div>
            <div className="text-white font-semibold mt-0.5">{anime.studio}</div>
          </div>
          <div>
            <div className="text-zinc-500">Season</div>
            <div className="text-white font-semibold mt-0.5">
              {anime.season} {anime.year}
            </div>
          </div>
          <div>
            <div className="text-zinc-500">Status</div>
            <div className="text-white font-semibold mt-0.5">
              {anime.status === 'FINISHED' ? 'Finished' : 'Releasing'}
            </div>
          </div>
          <div>
            <div className="text-zinc-500">Audio</div>
            <div className="text-white font-semibold mt-0.5">
              {anime.dubCount > 0 ? 'Sub / Dub' : 'Sub'}
            </div>
          </div>
          <div>
            <div className="text-zinc-500">Rated</div>
            <div className="text-white font-semibold mt-0.5">{anime.rated}</div>
          </div>
          <div>
            <div className="text-zinc-500 mb-1.5">Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {visibleTags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.07] text-[11px] text-zinc-300"
                >
                  {t}
                </span>
              ))}
              {anime.tags.length > 12 && (
                <button
                  type="button"
                  onClick={() => setTagsExpanded((v) => !v)}
                  className="px-2.5 py-1 rounded-full bg-white/[0.08] text-[11px] text-white font-medium cursor-pointer"
                >
                  {tagsExpanded ? 'Show less' : `+${anime.tags.length - 12} more`}
                </button>
              )}
            </div>
          </div>
          <div>
            <div className="text-zinc-500">Native</div>
            <div className="text-white font-semibold mt-0.5">{anime.nativeTitle}</div>
          </div>
          <div>
            <div className="text-zinc-500">Also known as</div>
            <div className="text-zinc-300 mt-0.5 space-y-0.5">
              {anime.synonyms.map((s) => (
                <div key={s}>{s}</div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Tabs & Content Region */}
        <div className="lg:col-span-9 space-y-5">
          {/* Navigation Tabs matching ani.pm detail page */}
          <nav
            aria-label="About this title"
            className="flex items-center gap-6 border-b border-white/[0.08] overflow-x-auto no-scrollbar text-xs font-medium"
          >
            <button
              type="button"
              onClick={() => setActiveTab('episodes')}
              className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'episodes'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Episodes</span>
              <span className="text-zinc-500 tabular-nums">{anime.episodes.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('related')}
              className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'related'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Related</span>
              <span className="text-zinc-500 tabular-nums">4</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manga')}
              className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'manga'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Manga</span>
              <span className="text-zinc-500 tabular-nums">2</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('similar')}
              className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'similar'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>More like this</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'comments'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Comments</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('downloads')}
              className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'downloads'
                  ? 'border-white text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Downloads</span>
            </button>
          </nav>

          {/* TAB 1: EPISODES */}
          {activeTab === 'episodes' && (
            <div className="space-y-4">
              {/* Search episodes bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  aria-label="Search episodes"
                  value={episodeQuery}
                  onChange={(e) => setEpisodeQuery(e.target.value)}
                  placeholder="Search episodes"
                  className="w-full bg-[#141418] border border-white/[0.08] rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
                />
              </div>

              {/* Episode Filter Controls matching ani.pm screenshot */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEpisodeSort((s) => (s === 'oldest' ? 'newest' : 'oldest'))
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#18181d] border border-white/[0.08] text-xs font-medium text-zinc-200 hover:bg-white/10 cursor-pointer"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>{episodeSort === 'oldest' ? 'Oldest' : 'Newest'}</span>
                </button>

                <button
                  type="button"
                  aria-label="Show episodes as a number grid"
                  onClick={() => setIsNumberGrid((v) => !v)}
                  className={`p-2 rounded-full border transition-colors cursor-pointer ${
                    isNumberGrid
                      ? 'bg-white text-black border-white'
                      : 'bg-[#18181d] text-zinc-300 border-white/[0.08] hover:bg-white/10'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  aria-label="Hide episode descriptions to avoid spoilers"
                  onClick={() => setHideSpoilers((v) => !v)}
                  className={`p-2 rounded-full border transition-colors cursor-pointer ${
                    hideSpoilers
                      ? 'bg-white text-black border-white'
                      : 'bg-[#18181d] text-zinc-300 border-white/[0.08] hover:bg-white/10'
                  }`}
                >
                  {hideSpoilers ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAudioFilter((a) => (a === 'sub' ? 'all' : 'sub'))
                  }
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer tabular-nums ${
                    audioFilter === 'sub'
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-[#18181d] text-zinc-300 border-white/[0.08] hover:bg-white/10'
                  }`}
                >
                  Sub only <span className="text-zinc-500 ml-0.5">{anime.subCount}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setAudioFilter((a) => (a === 'dub' ? 'all' : 'dub'))
                  }
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer tabular-nums ${
                    audioFilter === 'dub'
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-[#18181d] text-zinc-300 border-white/[0.08] hover:bg-white/10'
                  }`}
                >
                  Dub only <span className="text-zinc-500 ml-0.5">{anime.dubCount}</span>
                </button>
              </div>

              {/* 2-Column Episode Grid matching ani.pm watch screenshot */}
              {isNumberGrid ? (
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 pt-2">
                  {filteredEpisodes.map((ep) => (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => onSelectEpisode(ep.number)}
                      className="py-3 rounded-xl bg-[#141418] hover:bg-white hover:text-black text-xs font-bold text-zinc-200 border border-white/[0.07] transition-colors cursor-pointer tabular-nums"
                    >
                      {ep.number}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {filteredEpisodes.map((ep) => {
                    const thumbUrl = getEpisodeThumbnailUrl(anime, ep.number, ep.title);
                    return (
                      <button
                        key={ep.id}
                        type="button"
                        onClick={() => onSelectEpisode(ep.number)}
                        className="group flex gap-3.5 p-2 rounded-2xl hover:bg-white/[0.04] transition-colors text-left cursor-pointer"
                      >
                        {/* 16:9 Episode Thumbnail */}
                        <div className="relative w-44 sm:w-48 aspect-video rounded-xl overflow-hidden bg-[#141418] shrink-0 ring-1 ring-white/10">
                          <img
                            src={thumbUrl}
                            alt={`Episode ${ep.number} — ${ep.title}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-black/80 text-[11px] font-semibold text-white">
                            Episode {ep.number}
                          </span>
                          {ep.hasDub && (
                            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/80 text-[10px] font-bold text-zinc-200 inline-flex items-center gap-1">
                              <Mic className="w-2.5 h-2.5" /> DUB
                            </span>
                          )}
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/85 text-[11px] font-mono text-white tabular-nums">
                            {ep.duration}
                          </span>
                        </div>

                        {/* Episode Text Details */}
                        <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
                              {ep.title}
                            </h3>
                            {!hideSpoilers && (
                              <p className="text-xs text-zinc-400 line-clamp-3 mt-1 leading-relaxed">
                                {ep.description}
                              </p>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-500 mt-2">{ep.aired}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2 & 4: RELATED / MORE LIKE THIS */}
          {(activeTab === 'related' || activeTab === 'similar') && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
              {relatedList.map((rel) => (
                <AnimeCard
                  key={rel.id}
                  anime={rel}
                  libraryStatus={libraryMap[rel.id]}
                  onSelectAnime={onSelectAnime}
                  onUpdateStatus={onUpdateStatus}
                />
              ))}
            </div>
          )}

          {/* TAB 3: MANGA */}
          {activeTab === 'manga' && (
            <div className="p-6 rounded-2xl bg-[#121216] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {anime.title} — Original Manga Serialization
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Read all chapters translated in English high-resolution scans on Toonkotsu / Ani.pm Manga.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectEpisode(1)}
                className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
              >
                Read Chapter 1
              </button>
            </div>
          )}

          {/* TAB 5: COMMENTS */}
          {activeTab === 'comments' && (
            <div className="space-y-4 pt-2">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Add a comment about this series…"
                  className="flex-1 bg-[#141418] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 cursor-pointer"
                >
                  Post
                </button>
              </form>
              <div className="space-y-3">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex gap-3 p-4 rounded-xl bg-[#121216] border border-white/[0.06]"
                  >
                    <img
                      src={getUserAvatarUrl(c.username, c.color)}
                      alt={c.username}
                      className="w-9 h-9 rounded-full shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-white">{c.handle}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono">
                          Lv {c.level}
                        </span>
                        <span className="text-zinc-500">{c.timeAgo}</span>
                      </div>
                      <p className="text-xs text-zinc-200">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: DOWNLOADS */}
          {activeTab === 'downloads' && (
            <div className="space-y-2.5 pt-2">
              {anime.episodes.slice(0, 8).map((ep) => (
                <div
                  key={ep.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#121216] border border-white/[0.06] text-xs"
                >
                  <div>
                    <span className="font-semibold text-white">
                      Episode {ep.number} — {ep.title}
                    </span>
                    <span className="text-zinc-500 ml-2 font-mono">({ep.duration})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectEpisode(ep.number)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.07] hover:bg-white/15 text-zinc-200 font-mono cursor-pointer"
                    >
                      1080p HEVC (SUB/DUB)
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectEpisode(ep.number)}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.07] hover:bg-white/15 text-zinc-200 font-mono cursor-pointer"
                    >
                      720p MP4
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
