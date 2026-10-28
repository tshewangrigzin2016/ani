import React, { useState, useRef, useEffect } from 'react';
import { Plus, Check, Star, Captions, Mic, Trash2 } from 'lucide-react';
import type { AnimeItem, LibraryStatus } from '../utils/animeLogic';
import { getAnimePosterUrl } from '../utils/artworkGenerator';

interface AnimeCardProps {
  anime: AnimeItem;
  libraryStatus?: LibraryStatus;
  onSelectAnime: (anime: AnimeItem) => void;
  onUpdateStatus: (animeId: string, status: LibraryStatus | null) => void;
}

const STATUS_OPTIONS: Array<{ value: LibraryStatus; label: string }> = [
  { value: 'watching', label: 'Watching' },
  { value: 'planning', label: 'Plan to Watch' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'dropped', label: 'Dropped' },
];

export const AnimeCard: React.FC<AnimeCardProps> = ({
  anime,
  libraryStatus,
  onSelectAnime,
  onUpdateStatus,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  const posterSrc = getAnimePosterUrl(anime);

  return (
    <article className="group relative select-none">
      <div className="relative aspect-[2/3] w-full rounded-[18px] overflow-hidden bg-[#121217] ring-1 ring-white/[0.08] transition-transform duration-200 group-hover:scale-[1.02] group-hover:ring-white/20">
        {/* Clickable cover link */}
        <a
          href={`#/anime/${anime.slug}`}
          onClick={(e) => {
            e.preventDefault();
            onSelectAnime(anime);
          }}
          className="block w-full h-full focus:outline-none"
        >
          <img
            src={posterSrc}
            alt={anime.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />

          {/* Bottom dark gradient scrim matching ani.pm poster cards */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent" />

          {/* Bottom centered title and metadata row */}
          <div className="absolute inset-x-0 bottom-0 p-3.5 flex flex-col items-center text-center">
            <h3 className="text-[14px] font-semibold text-white leading-snug line-clamp-2 mb-1.5 drop-shadow">
              {anime.title}
            </h3>

            <div className="flex items-center justify-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-zinc-300 tabular-nums">
              <span className="text-zinc-400">{anime.primaryGenre}</span>

              <span
                className="inline-flex items-center gap-1.5 text-zinc-200"
                title={
                  anime.dubCount > 0
                    ? 'Subtitled and Dubbed'
                    : 'Subtitled'
                }
              >
                <span
                  className="inline-flex items-center gap-0.5"
                  title={`Subtitled · ${anime.subCount} episodes`}
                >
                  <Captions className="w-3 h-3 text-zinc-400" />
                  {anime.format !== 'MOVIE' && <span>{anime.subCount}</span>}
                </span>

                {anime.dubCount > 0 && (
                  <span
                    className="inline-flex items-center gap-0.5"
                    title={`Dubbed · ${anime.dubCount} episodes`}
                  >
                    <Mic className="w-3 h-3 text-zinc-400" />
                    {anime.format !== 'MOVIE' && <span>{anime.dubCount}</span>}
                  </span>
                )}
              </span>

              <span className="inline-flex items-center gap-0.5 text-amber-400 font-semibold">
                <span>{anime.score.toFixed(1)}</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </span>
            </div>
          </div>
        </a>

        {/* Top-right Add to Library / Status button */}
        <div className="absolute top-2.5 right-2.5 z-10" ref={menuRef}>
          <button
            type="button"
            aria-label={`Choose library status for ${anime.title}`}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-md ${
              libraryStatus
                ? 'bg-white text-black opacity-100 shadow-lg'
                : 'bg-black/65 text-white border border-white/15 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-black/85'
            }`}
          >
            {libraryStatus ? (
              <Check className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-[#141419] border border-white/15 shadow-2xl py-1.5 text-xs text-zinc-200 z-30">
              {STATUS_OPTIONS.map((opt) => {
                const active = libraryStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(anime.id, opt.value);
                      setMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-white/10 text-left cursor-pointer ${
                      active ? 'text-white font-semibold bg-white/[0.06]' : 'text-zinc-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                );
              })}
              {libraryStatus && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(anime.id, null);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 mt-1 border-t border-white/10 text-rose-400 hover:bg-rose-500/10 text-left cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
