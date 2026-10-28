import React, { useState, useEffect } from 'react';
import {
  Play,
  Plus,
  Check,
  Info,
  Star,
  Calendar,
  MessageSquare,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { AnimeItem, LibraryStatus } from '../utils/animeLogic';
import { getAnimeBannerUrl } from '../utils/artworkGenerator';

interface HeroCarouselProps {
  featuredAnime: AnimeItem[];
  libraryMap: Record<string, LibraryStatus>;
  onPlayAnime: (anime: AnimeItem) => void;
  onMoreInfo: (anime: AnimeItem) => void;
  onUpdateStatus: (animeId: string, status: LibraryStatus | null) => void;
  onOpenChat: () => void;
  latestChatMessage: { username: string; text: string };
}

/**
 * Renders the custom stylized anime title graphic matching ani.pm's hero logos
 * (e.g. Cyberpunk: Edgerunners II neon yellow/magenta slash logo, Jujutsu Kaisen cursed logo, Black Clover gothic crest).
 */
export const StylizedAnimeLogo: React.FC<{ anime: AnimeItem; size?: 'lg' | 'md' }> = ({
  anime,
  size = 'lg',
}) => {
  if (anime.id === 'cyberpunk-edgerunners-2') {
    return (
      <div className="select-none max-w-full">
        <svg
          viewBox="0 0 540 155"
          className={size === 'lg' ? 'w-[310px] sm:w-[440px] h-auto' : 'w-[260px] sm:w-[340px] h-auto'}
          role="img"
          aria-label={anime.title}
        >
          {/* Neon yellow CYBERPUNK brush text with black drop shadow */}
          <g transform="skewX(-14)">
            <text
              x="18"
              y="84"
              fill="#000000"
              fontFamily="Outfit, sans-serif"
              fontWeight="900"
              fontSize="74"
              letterSpacing="-2"
            >
              CYBERPUNK
            </text>
            <text
              x="12"
              y="78"
              fill="#facc15"
              stroke="#000000"
              strokeWidth="3"
              fontFamily="Outfit, sans-serif"
              fontWeight="900"
              fontSize="74"
              letterSpacing="-2"
            >
              CYBERPUNK
            </text>
          </g>
          {/* Red/orange striped bar + EDGERUNNERS II */}
          <g transform="translate(10, 96) skewX(-16)">
            <rect x="115" y="0" width="365" height="40" fill="#f43f5e" />
            {/* Diagonal hazard stripes on left */}
            <rect x="0" y="0" width="8" height="40" fill="#fb923c" />
            <rect x="16" y="0" width="8" height="40" fill="#fb923c" />
            <rect x="32" y="0" width="8" height="40" fill="#fb923c" />
            <rect x="48" y="0" width="8" height="40" fill="#fb923c" />
            <rect x="64" y="0" width="8" height="40" fill="#fb923c" />
            <rect x="80" y="0" width="8" height="40" fill="#fb923c" />
            <rect x="96" y="0" width="8" height="40" fill="#fb923c" />
            <text
              x="130"
              y="30"
              fill="#09090b"
              fontFamily="Outfit, sans-serif"
              fontWeight="900"
              fontSize="30"
              letterSpacing="3"
            >
              EDGERUNNERS II
            </text>
          </g>
        </svg>
      </div>
    );
  }

  if (anime.id === 'jujutsu-kaisen') {
    return (
      <div className="select-none max-w-full">
        <svg
          viewBox="0 0 560 130"
          className={size === 'lg' ? 'w-[310px] sm:w-[440px] h-auto' : 'w-[260px] sm:w-[360px] h-auto'}
          role="img"
          aria-label={anime.title}
        >
          <text
            x="6"
            y="88"
            fill="#09090d"
            stroke="#d4af37"
            strokeWidth="3.5"
            fontFamily="Outfit, serif"
            fontWeight="900"
            fontSize="66"
            letterSpacing="2"
          >
            JUJUTSU KAISEN
          </text>
          <text
            x="10"
            y="118"
            fill="#f43f5e"
            fontFamily="sans-serif"
            fontWeight="800"
            fontSize="18"
            letterSpacing="10"
          >
            呪術廻戦 · TOKYO JUJUTSU HIGH
          </text>
        </svg>
      </div>
    );
  }

  return (
    <h2
      className={`font-display font-extrabold tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] ${
        size === 'lg' ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-4xl'
      }`}
    >
      {anime.title}
    </h2>
  );
};

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  featuredAnime,
  libraryMap,
  onPlayAnime,
  onMoreInfo,
  onUpdateStatus,
  onOpenChat,
  latestChatMessage,
}) => {
  const [activeIndex, setActiveIndex] = useState(1); // Default to Cyberpunk: Edgerunners 2 (index 0 or 1)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  // Ensure valid index
  const safeIndex = featuredAnime.length > 0 ? activeIndex % featuredAnime.length : 0;
  const current = featuredAnime[safeIndex] || featuredAnime[0];

  useEffect(() => {
    // Start on Cyberpunk: Edgerunners 2 (index 0)
    setActiveIndex(0);
  }, []);

  if (!current) return null;

  const currentStatus = libraryMap[current.id];
  const bannerUrl = getAnimeBannerUrl(current);

  const prevSlide = () => {
    setStatusMenuOpen(false);
    setActiveIndex((prev) => (prev - 1 + featuredAnime.length) % featuredAnime.length);
  };

  const nextSlide = () => {
    setStatusMenuOpen(false);
    setActiveIndex((prev) => (prev + 1) % featuredAnime.length);
  };

  return (
    <section
      aria-label="Featured anime carousel"
      className="relative isolate w-full overflow-hidden select-none"
    >
      <h1 className="sr-only">Watch anime free, subbed &amp; dubbed</h1>

      {/* Full-bleed hero slide container */}
      <div className="relative w-full min-h-[540px] sm:min-h-[620px] flex flex-col justify-end">
        {/* Background key visual */}
        <div className="absolute inset-0 -z-10">
          <img
            src={bannerUrl}
            alt={current.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08080a] via-[#08080a]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/25 to-transparent" />
        </div>

        {/* Left/Right subtle slide navigation arrows */}
        <button
          type="button"
          aria-label="Previous featured anime"
          onClick={prevSlide}
          className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/45 hover:bg-black/75 border border-white/10 text-white/80 hover:text-white items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          aria-label="Next featured anime"
          onClick={nextSlide}
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/45 hover:bg-black/75 border border-white/10 text-white/80 hover:text-white items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Main Hero Content aligned left matching ani.pm */}
        <div className="relative z-10 max-w-[1440px] w-full mx-auto px-4 sm:px-10 pt-20 pb-8">
          <div className="max-w-xl space-y-4">
            {/* Title logo */}
            <StylizedAnimeLogo anime={current} size="lg" />

            {/* Metadata Pills Row matching ani.pm screenshot */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/70 border border-white/15 text-amber-400 font-semibold tabular-nums">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {current.score.toFixed(1)}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-white/15 text-zinc-200 tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                {current.year}
              </span>

              <span className="px-3 py-1 rounded-full bg-black/70 border border-white/15 text-zinc-200 tabular-nums">
                {current.episodesCount} {current.episodesCount === 1 ? 'Episode' : 'Episodes'}
              </span>

              <span className="px-3 py-1 rounded-full bg-black/70 border border-white/15 text-zinc-200">
                {current.format}
              </span>

              {current.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 rounded-full bg-black/70 border border-white/15 text-zinc-200"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Synopsis paragraph (3 lines clamped) */}
            <p className="text-sm sm:text-[14.5px] text-zinc-200/90 leading-relaxed line-clamp-3 drop-shadow">
              {current.synopsis}
            </p>

            {/* Primary CTA Row: Play pill + Plus circle + Info circle */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onPlayAnime(current)}
                className="inline-flex items-center justify-center gap-2.5 bg-white hover:bg-zinc-200 text-black font-semibold text-sm px-8 py-3.5 rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black text-black" />
                <span>Play</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  aria-label="Choose library status"
                  onClick={() => setStatusMenuOpen((v) => !v)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${
                    currentStatus
                      ? 'bg-white text-black border-white'
                      : 'bg-black/65 hover:bg-black/85 text-white border-white/20'
                  }`}
                >
                  {currentStatus ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
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
                          onUpdateStatus(current.id, val);
                          setStatusMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-white/10 text-left cursor-pointer"
                      >
                        <span>{label}</span>
                        {currentStatus === val && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                aria-label="More info"
                onClick={() => onMoreInfo(current)}
                className="w-12 h-12 rounded-full bg-black/65 hover:bg-black/85 text-white border border-white/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Info className="w-5 h-5" />
              </button>

              {/* Carousel slide indicator pills */}
              <div className="ml-4 flex items-center gap-1.5">
                {featuredAnime.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-label={`Show featured slide ${idx + 1}: ${item.title}`}
                    onClick={() => setActiveIndex(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === safeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/35 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Centered Floating Site Activity Bar matching ani.pm screenshot */}
          <div className="mt-12 flex justify-center">
            <div
              role="group"
              aria-label="Site activity"
              className="inline-flex flex-wrap items-center gap-3 sm:gap-5 px-4 sm:px-5 py-2 rounded-full bg-[#121216]/90 border border-white/[0.09] text-xs text-zinc-400 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center gap-3 tabular-nums">
                <span
                  title="Every page visit in the last 15 minutes, including repeat visits"
                  className="inline-flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <strong className="text-white font-semibold">12,731</strong>
                  <span>Watching</span>
                </span>

                <span className="text-white/15">|</span>

                <span
                  title="Every page visit in the last 60 minutes, including repeat visits"
                  className="inline-flex items-center gap-1.5"
                >
                  <strong className="text-white font-semibold">49,407</strong>
                  <span>Online</span>
                </span>
              </div>

              <span className="hidden sm:inline text-white/15">|</span>

              <button
                type="button"
                onClick={onOpenChat}
                className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer max-w-[220px] truncate"
              >
                <MessageSquare className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <strong className="text-white font-semibold">{latestChatMessage.username}:</strong>
                <span className="text-zinc-400 truncate">{latestChatMessage.text}</span>
              </button>

              <span className="hidden md:inline text-white/15">|</span>

              <div className="hidden md:inline-flex items-center gap-1.5 text-zinc-400">
                <Bookmark className="w-3.5 h-3.5 text-zinc-500" />
                <span>Bookmark</span>
                <a
                  href="#/"
                  onClick={(e) => e.preventDefault()}
                  className="text-white font-semibold hover:underline"
                >
                  ani.pm
                </a>
                <span>&amp;</span>
                <a
                  href="#/"
                  onClick={(e) => e.preventDefault()}
                  className="text-white font-semibold hover:underline"
                >
                  ani.nz
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
