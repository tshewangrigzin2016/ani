import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  MessageSquare,
  MoreVertical,
  User,
  Shuffle,
  Trophy,
  Compass,
  Download,
  Keyboard,
  Globe,
  Settings,
  Flag,
  PlusCircle,
  Check,
  LogOut,
} from 'lucide-react';

export type NavRoute =
  | 'home'
  | 'browse'
  | 'latest'
  | 'genres'
  | 'manga'
  | 'library'
  | 'community'
  | 'watch-together'
  | 'movies'
  | 'search'
  | 'detail'
  | 'leaderboard'
  | 'settings'
  | 'about';

interface NavbarProps {
  activeRoute: NavRoute;
  onNavigate: (route: NavRoute, params?: Record<string, string>) => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onOpenSignIn: () => void;
  onRollRandomAnime: () => void;
  onOpenShortcuts: () => void;
  onOpenRequestModal: (mode: 'report' | 'request') => void;
  currentUser: { username: string; email: string; level: number } | null;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRoute,
  onNavigate,
  onToggleChat,
  isChatOpen,
  onOpenSignIn,
  onRollRandomAnime,
  onOpenShortcuts,
  onOpenRequestModal,
  currentUser,
  onSignOut,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const [language, setLanguage] = useState<'English' | '日本語' | 'Español'>('English');
  const [installToast, setInstallToast] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: Array<{ id: NavRoute; label: string; href: string }> = [
    { id: 'home', label: 'Home', href: '#/' },
    { id: 'browse', label: 'Browse', href: '#/anime' },
    { id: 'latest', label: 'Latest', href: '#/latest' },
    { id: 'genres', label: 'Genres', href: '#/genres' },
    { id: 'manga', label: 'Manga', href: '#/manga' },
    { id: 'library', label: 'Library', href: '#/library' },
    { id: 'community', label: 'Community', href: '#/community' },
    { id: 'watch-together', label: 'Watch Together', href: '#/watch-together' },
    { id: 'movies', label: 'Movies', href: '#/movies' },
  ];

  const handleNavClick = (e: React.MouseEvent, id: NavRoute) => {
    e.preventDefault();
    onNavigate(id);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#08080a]/90 backdrop-blur-md border-b border-white/[0.06]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:bg-white focus:text-black focus:px-3 focus:py-1.5 focus:rounded-md text-xs font-semibold"
      >
        Skip to content
      </a>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand + Primary Navigation */}
        <div className="flex items-center gap-7 min-w-0">
          <a
            href="#/"
            aria-label="ani.pm home"
            onClick={(e) => handleNavClick(e, 'home')}
            className="flex items-center gap-2 text-white font-display font-extrabold tracking-wider text-lg whitespace-nowrap shrink-0 group"
          >
            {/* 4-point star sparkle icon matching ani.pm logo */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="text-white transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12"
            >
              <path d="M12 1L14.8 9.2L23 12L14.8 14.8L12 23L9.2 14.8L1 12L9.2 9.2L12 1Z" />
            </svg>
            <span aria-hidden="true">ANI.PM</span>
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-5 text-[13.5px] font-medium"
          >
            {navItems.map((item) => {
              const isActive = activeRoute === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`relative py-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Right: Search Ctrl K + Community Chat + More options + Sign in */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            aria-label="Search anime"
            onClick={() => onNavigate('search')}
            className="flex items-center justify-between gap-6 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] rounded-full px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors min-w-[160px] sm:min-w-[235px] cursor-pointer"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Search anime</span>
            </span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-white/[0.06] border border-white/[0.08] rounded">
              Ctrl K
            </kbd>
          </button>

          <button
            type="button"
            aria-label="Community chat"
            aria-pressed={isChatOpen}
            onClick={onToggleChat}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isChatOpen
                ? 'bg-white/15 text-white'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.07]'
            }`}
            title="Community chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* More options dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              aria-label="More options"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((v) => !v)}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                moreOpen
                  ? 'bg-white/15 text-white'
                  : 'text-zinc-300 hover:text-white hover:bg-white/[0.07]'
              }`}
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {moreOpen && (
              <div
                role="group"
                aria-label="More options"
                className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#121216] border border-white/10 shadow-2xl py-2 text-xs text-zinc-200 z-50 divide-y divide-white/[0.06]"
              >
                {/* Explore */}
                <div className="px-2 py-1.5">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Explore
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onNavigate('genres');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-left transition-colors cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Genres</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onNavigate('leaderboard');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-left transition-colors cursor-pointer"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Leaderboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onRollRandomAnime();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-left transition-colors cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Roll Random Anime</span>
                  </button>
                </div>

                {/* Tools */}
                <div className="px-2 py-1.5">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Tools
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setInstallToast(true);
                      setTimeout(() => setInstallToast(false), 2500);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-left transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Download className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Install app</span>
                    </span>
                    {installToast && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ready
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onOpenShortcuts();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-left transition-colors cursor-pointer"
                  >
                    <Keyboard className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Keyboard shortcuts</span>
                  </button>
                </div>

                {/* Preferences */}
                <div className="px-2 py-1.5">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Preferences
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setLanguage((prev) =>
                        prev === 'English'
                          ? '日本語'
                          : prev === '日本語'
                          ? 'Español'
                          : 'English'
                      )
                    }
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-left transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Globe className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Language</span>
                    </span>
                    <span className="text-zinc-400">{language}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onNavigate('settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-left transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Settings</span>
                  </button>
                </div>

                {/* Help */}
                <div className="px-2 py-1.5">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Help
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onOpenRequestModal('report');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-left transition-colors cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Report</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onOpenRequestModal('request');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] text-left transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Request an anime</span>
                  </button>
                </div>

                {/* Site information */}
                <div className="px-4 py-2 flex items-center gap-3 text-[11px] text-zinc-500">
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onNavigate('about');
                    }}
                    className="hover:text-zinc-300 cursor-pointer"
                  >
                    About
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onNavigate('about');
                    }}
                    className="hover:text-zinc-300 cursor-pointer"
                  >
                    Terms
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onNavigate('about');
                    }}
                    className="hover:text-zinc-300 cursor-pointer"
                  >
                    Privacy
                  </button>
                </div>
              </div>
            )}
          </div>

          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onNavigate('library')}
                className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 font-semibold text-xs px-3.5 py-1.5 rounded-full transition-colors cursor-pointer whitespace-nowrap"
              >
                <User className="w-3.5 h-3.5" />
                <span>{currentUser.username}</span>
                <span className="text-[10px] bg-black/15 px-1.5 py-0.2 rounded-full font-mono">
                  Lv {currentUser.level}
                </span>
              </button>
              <button
                type="button"
                aria-label="Sign out"
                onClick={onSignOut}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenSignIn}
              className="flex items-center gap-1.5 bg-white text-black hover:bg-zinc-200 font-semibold text-xs px-4 py-2 rounded-full transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign in</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile horizontal nav bar */}
      <div className="flex lg:hidden items-center gap-4 overflow-x-auto no-scrollbar px-4 py-2 border-t border-white/[0.05] text-xs">
        {navItems.map((item) => {
          const isActive = activeRoute === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.id)}
              className={`whitespace-nowrap shrink-0 py-1 ${
                isActive ? 'text-white font-semibold border-b-2 border-white' : 'text-zinc-400'
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </header>
  );
};
