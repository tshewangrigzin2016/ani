import React, { useState } from 'react';
import {
  X,
  Send,
  Settings,
  Users,
  Play,
  Pause,
  MessageSquare,
  Pin,
  Plus,
  BookOpen,
  Trophy,
  Sparkles,
  Check,
} from 'lucide-react';
import type {
  ForumThread,
  ChatMessage,
  WatchRoom,
} from '../data/animeCatalog';
import type { AnimeItem } from '../utils/animeLogic';
import { getUserAvatarUrl, getAnimePosterUrl } from '../utils/artworkGenerator';

// ============================================================================
// 1. RIGHT-SIDE GLOBAL COMMUNITY CHAT DRAWER (matching anipm-chat-drawer.txt)
// ============================================================================
interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUser: { username: string; email: string; level: number } | null;
  onOpenSignIn: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentUser,
  onOpenSignIn,
}) => {
  const [draft, setDraft] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSendMessage(draft.trim());
    setDraft('');
  };

  return (
    <aside
      aria-label="Community chat"
      className="fixed top-16 right-0 bottom-0 w-full sm:w-[360px] bg-[#0e0e12] border-l border-white/[0.08] z-40 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-white">Community chat</div>
          <div role="status" className="text-[11px] text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{messages.length + 14} chatting now</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Chat settings"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pinned Discord Banner */}
      <div
        role="region"
        aria-label="Pinned messages"
        className="px-3.5 py-2 bg-white/[0.03] border-b border-white/[0.06] text-[11px] text-zinc-300 flex items-center justify-between"
      >
        <span className="truncate">
          <strong className="text-amber-400 mr-1">ani.pm admin</strong>
          Join the ani.pm Discord:{' '}
          <a
            href="https://discord.gg/anipm"
            target="_blank"
            rel="noreferrer"
            className="text-white underline"
          >
            discord.gg/anipm
          </a>
        </span>
      </div>

      {/* Chat Log */}
      <div
        role="log"
        aria-label="Community chat"
        className="flex-1 overflow-y-auto p-3.5 space-y-3"
      >
        <div className="text-center text-[10px] text-zinc-500 uppercase tracking-wider py-1">
          Today
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2.5 text-xs">
            <img
              src={getUserAvatarUrl(msg.username, msg.color)}
              alt={msg.username}
              className="w-7 h-7 rounded-full shrink-0 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              {msg.replyTo && (
                <div className="text-[10px] text-zinc-500 mb-0.5">
                  ↪ replying to <span className="text-zinc-300">{msg.replyTo}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-white">{msg.username}</span>
                {msg.badge && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[9px] font-bold">
                    {msg.badge}
                  </span>
                )}
                <span className="px-1.5 py-0.2 rounded bg-white/[0.07] text-zinc-300 text-[9px] font-mono">
                  Lv {msg.level}
                </span>
                <span className="text-[10px] text-zinc-500 tabular-nums">{msg.time}</span>
              </div>
              <p className="text-zinc-200 mt-0.5 break-words leading-snug">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Composer */}
      <div className="p-3 border-t border-white/[0.07]">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              currentUser ? `Message as ${currentUser.username}…` : 'Write a chat message…'
            }
            className="flex-1 bg-[#16161c] border border-white/10 rounded-full px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/25"
          />
          <button
            type="submit"
            aria-label="Send message"
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        {!currentUser && (
          <div className="mt-2 text-center text-[11px] text-zinc-400">
            <button
              type="button"
              onClick={onOpenSignIn}
              className="text-white font-semibold underline mr-1 cursor-pointer"
            >
              Sign in
            </button>
            to sync your chat level across devices
          </div>
        )}
      </div>
    </aside>
  );
};

// ============================================================================
// 2. SIGN IN TO ANI.PM MODAL (matching anipm-signin-modal.txt)
// ============================================================================
interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInSuccess: (user: { username: string; email: string; level: number }) => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSignInSuccess,
}) => {
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleProviderClick = (providerName: string) => {
    onSignInSuccess({
      username: `${providerName}Viewer`,
      email: `viewer@${providerName.toLowerCase()}.io`,
      level: 14,
    });
    onClose();
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    const cleanName = username.trim() || email.split('@')[0];
    onSignInSuccess({
      username: cleanName,
      email: email.trim(),
      level: 12,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to ani.pm"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-[#121216] border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/15 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 text-white mb-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L14.8 9.2L23 12L14.8 14.8L12 23L9.2 14.8L1 12L9.2 9.2L12 1Z" />
            </svg>
          </div>
          <h1 className="text-xl font-display font-bold text-white">Sign in to ani.pm</h1>
          <p className="text-xs text-zinc-400">
            Sign in or create an account to keep your list with you.
          </p>
        </div>

        {!emailMode ? (
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => handleProviderClick('Google')}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleProviderClick('Apple')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1c1c22] hover:bg-[#25252d] text-white font-semibold text-xs border border-white/10 transition-colors cursor-pointer"
            >
              Continue with Apple
            </button>
            <button
              type="button"
              onClick={() => handleProviderClick('Discord')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-indigo-200 font-semibold text-xs border border-[#5865F2]/40 transition-colors cursor-pointer"
            >
              Continue with Discord
            </button>
            <button
              type="button"
              onClick={() => handleProviderClick('AniList')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#02a9ff]/15 hover:bg-[#02a9ff]/25 text-sky-200 font-semibold text-xs border border-[#02a9ff]/30 transition-colors cursor-pointer"
            >
              Continue with AniList
            </button>
            <button
              type="button"
              onClick={() => handleProviderClick('MyAnimeList')}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2e51a2]/25 hover:bg-[#2e51a2]/35 text-blue-200 font-semibold text-xs border border-[#2e51a2]/40 transition-colors cursor-pointer"
            >
              Continue with MyAnimeList
            </button>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setEmailMode(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-white/[0.05] text-zinc-300 font-medium text-xs border border-white/10 transition-colors cursor-pointer"
              >
                Continue with email
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. GojoSatoru"
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="you@example.com"
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
              />
            </div>
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEmailMode(false)}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-xs text-zinc-300 hover:text-white cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-[11px] text-zinc-500">
          By continuing you agree to our <span className="text-zinc-300 underline">Terms</span> and{' '}
          <span className="text-zinc-300 underline">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// 3. COMMUNITY PAGE (/community — Forum + Live Chat tabs matching anipm-community.txt)
// ============================================================================
interface CommunityPageProps {
  threads: ForumThread[];
  onCreateThread: (title: string, excerpt: string, category: ForumThread['category']) => void;
  onReplyThread: (threadId: string, replyText: string) => void;
  chatMessages: ChatMessage[];
  onSendChatMessage: (text: string) => void;
  currentUser: { username: string; email: string; level: number } | null;
  onOpenSignIn: () => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({
  threads,
  onCreateThread,
  onReplyThread,
  chatMessages,
  onSendChatMessage,
  currentUser,
  onOpenSignIn,
}) => {
  const [activeTab, setActiveTab] = useState<'forum' | 'chat'>('forum');
  const [categoryFilter, setCategoryFilter] = useState<
    'All' | 'General' | 'Anime' | 'Bugs' | 'Suggestions'
  >('All');
  const [sortBy, setSortBy] = useState<'latest' | 'newest'>('latest');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newThreadOpen, setNewThreadOpen] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategory, setNewCategory] = useState<ForumThread['category']>('General');
  const [replyDraft, setReplyDraft] = useState('');
  const [liveChatDraft, setLiveChatDraft] = useState('');

  const filteredThreads = threads.filter((t) =>
    categoryFilter === 'All' ? true : t.category === categoryFilter
  );

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    onCreateThread(newTitle.trim(), newBody.trim(), newCategory);
    setNewTitle('');
    setNewBody('');
    setNewThreadOpen(false);
  };

  return (
    <div className="max-w-[1140px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Community</h1>

        <div
          role="tablist"
          aria-label="Community"
          className="inline-flex rounded-full bg-[#141418] p-1 border border-white/[0.08]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'forum'}
            onClick={() => setActiveTab('forum')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'forum' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Forum
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'chat' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Live chat
          </button>
        </div>
      </div>

      {activeTab === 'forum' ? (
        <div role="region" aria-label="Forum" className="space-y-5">
          {/* Category Filter Bar + Sort + New Thread */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  ['All', threads.length],
                  ['General', 32],
                  ['Anime', 5],
                  ['Bugs', 5],
                  ['Suggestions', 16],
                ] as const
              ).map(([cat, count]) => (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={categoryFilter === cat}
                  onClick={() => {
                    setCategoryFilter(cat);
                    setSelectedThreadId(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer tabular-nums ${
                    categoryFilter === cat
                      ? 'bg-white text-black font-semibold'
                      : 'bg-[#141418] text-zinc-300 hover:bg-white/10 border border-white/[0.07]'
                  }`}
                >
                  {cat} {cat !== 'All' && <span className="opacity-60 ml-1">{count}</span>}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5">
              <label className="text-xs text-zinc-400 flex items-center gap-2">
                <span>Sort threads</span>
                <select
                  aria-label="Sort threads"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'latest' | 'newest')}
                  className="bg-[#141418] border border-white/10 rounded-full px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="latest">Latest activity</option>
                  <option value="newest">Newest</option>
                </select>
              </label>

              <button
                type="button"
                onClick={() => setNewThreadOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New thread</span>
              </button>
            </div>
          </div>

          {!currentUser && (
            <div className="px-4 py-3 rounded-2xl bg-[#121216] border border-white/[0.07] flex items-center justify-between text-xs text-zinc-300">
              <span>Sign in to start a thread or reply.</span>
              <button
                type="button"
                onClick={onOpenSignIn}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold cursor-pointer"
              >
                Sign in
              </button>
            </div>
          )}

          {/* New thread composer */}
          {newThreadOpen && (
            <form
              onSubmit={handleCreateSubmit}
              className="p-5 rounded-2xl bg-[#141419] border border-white/15 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Start a new community thread</h3>
                <button
                  type="button"
                  onClick={() => setNewThreadOpen(false)}
                  className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Thread title…"
                  className="sm:col-span-3 bg-[#0e0e12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ForumThread['category'])}
                  className="bg-[#0e0e12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="General">General</option>
                  <option value="Anime">Anime</option>
                  <option value="Suggestions">Suggestions</option>
                  <option value="Bugs">Bugs</option>
                </select>
              </div>
              <textarea
                rows={3}
                required
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Share recommendations, feedback, or questions…"
                className="w-full bg-[#0e0e12] border border-white/10 rounded-xl p-3.5 text-xs text-white"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 cursor-pointer"
                >
                  Publish thread
                </button>
              </div>
            </form>
          )}

          {/* Selected Thread Detail or Thread List */}
          {selectedThread ? (
            <div className="p-5 rounded-2xl bg-[#121216] border border-white/10 space-y-4">
              <button
                type="button"
                onClick={() => setSelectedThreadId(null)}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                ← Back to all threads
              </button>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] text-zinc-200">
                    {selectedThread.category}
                  </span>
                  <span className="text-xs text-zinc-400">
                    Posted by <strong className="text-white">{selectedThread.author}</strong> ·{' '}
                    {selectedThread.startedAgo}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">{selectedThread.title}</h2>
                <p className="text-xs text-zinc-300 leading-relaxed">{selectedThread.excerpt}</p>
              </div>

              <div className="border-t border-white/[0.07] pt-4 space-y-3">
                <h3 className="text-xs font-semibold text-zinc-400">
                  Replies ({selectedThread.replies.length})
                </h3>
                {selectedThread.replies.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl bg-[#17171d] border border-white/[0.05] text-xs space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <strong className="text-white">{r.author}</strong>
                      <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] font-mono">
                        Lv {r.level}
                      </span>
                      <span className="text-zinc-500">{r.timeAgo}</span>
                    </div>
                    <p className="text-zinc-200">{r.content}</p>
                  </div>
                ))}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!replyDraft.trim()) return;
                    onReplyThread(selectedThread.id, replyDraft.trim());
                    setReplyDraft('');
                  }}
                  className="flex gap-2 pt-2"
                >
                  <input
                    type="text"
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    placeholder="Write a reply…"
                    className="flex-1 bg-[#0e0e12] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs cursor-pointer"
                  >
                    Reply
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {filteredThreads.map((t) => (
                <li
                  key={t.id}
                  onClick={() => setSelectedThreadId(t.id)}
                  className="p-4 rounded-2xl bg-[#121216] hover:bg-[#17171d] border border-white/[0.07] flex items-start justify-between gap-4 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <img
                      src={getUserAvatarUrl(t.author, t.authorColor)}
                      alt={t.author}
                      className="w-10 h-10 rounded-full shrink-0 mt-0.5"
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {t.pinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-[10px] font-semibold">
                            <Pin className="w-2.5 h-2.5" /> Pinned
                          </span>
                        )}
                        <h3 className="text-sm font-semibold text-white truncate">{t.title}</h3>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-1">{t.excerpt}</p>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-0.5">
                        <span className="px-2 py-0.2 rounded bg-white/[0.05] text-zinc-300">
                          {t.category}
                        </span>
                        <span className="text-zinc-300 font-medium">{t.author}</span>
                        {t.authorBadge && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                            {t.authorBadge}
                          </span>
                        )}
                        <span>· {t.startedAgo}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-zinc-400 shrink-0 hidden sm:block tabular-nums">
                    <div className="text-zinc-200 font-medium">
                      {t.repliesCount === 0 ? 'No replies' : `${t.repliesCount} replies`}
                    </div>
                    {t.lastReplyBy && (
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        Last reply {t.lastReplyAgo} by {t.lastReplyBy}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#121216] border border-white/[0.08] p-5 space-y-4">
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 text-xs">
                <img
                  src={getUserAvatarUrl(msg.username, msg.color)}
                  alt={msg.username}
                  className="w-8 h-8 rounded-full shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-white">{msg.username}</strong>
                    <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] font-mono">
                      Lv {msg.level}
                    </span>
                    <span className="text-zinc-500">{msg.time}</span>
                  </div>
                  <p className="text-zinc-200 mt-0.5">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!liveChatDraft.trim()) return;
              onSendChatMessage(liveChatDraft.trim());
              setLiveChatDraft('');
            }}
            className="flex gap-2 border-t border-white/[0.07] pt-3"
          >
            <input
              type="text"
              value={liveChatDraft}
              onChange={(e) => setLiveChatDraft(e.target.value)}
              placeholder="Write a message to global live chat…"
              className="flex-1 bg-[#0e0e12] border border-white/10 rounded-full px-4 py-2 text-xs text-white"
            />
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. WATCH TOGETHER PAGE (/watch-together — matching anipm-watch-together.txt)
// ============================================================================
interface WatchTogetherPageProps {
  catalog: AnimeItem[];
  rooms: WatchRoom[];
  activeRoom: WatchRoom | null;
  onCreateRoom: (room: WatchRoom) => void;
  onJoinRoom: (roomCode: string) => void;
  onLeaveRoom: () => void;
}

export const WatchTogetherPage: React.FC<WatchTogetherPageProps> = ({
  catalog,
  rooms,
  activeRoom,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
}) => {
  const [animeQuery, setAnimeQuery] = useState('');
  const [selectedAnimeId, setSelectedAnimeId] = useState<string>(catalog[0]?.id || '');
  const [roomName, setRoomName] = useState('');
  const [hostName, setHostName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [joinCode, setJoinCode] = useState('');

  // Room sync state when inside an active Watch Together room
  const [roomPlaying, setRoomPlaying] = useState(true);
  const [roomChat, setRoomChat] = useState<Array<{ user: string; text: string }>>([
    { user: 'Rin', text: 'Welcome to the room! Starting episode in 3, 2, 1…' },
    { user: 'Kaito', text: 'Audio and 1080p stream synced!' },
  ]);
  const [roomMsg, setRoomMsg] = useState('');

  if (activeRoom) {
    const roomAnime =
      catalog.find((a) => a.id === activeRoom.animeId) || catalog[0];

    return (
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={onLeaveRoom}
              className="text-xs text-zinc-400 hover:text-white mb-1 cursor-pointer"
            >
              ← Leave Watch Together room
            </button>
            <h1 className="text-xl font-display font-bold text-white flex items-center gap-2.5">
              <span>{activeRoom.roomName || activeRoom.animeTitle}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono">
                Room #{activeRoom.code}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>
              {activeRoom.viewersCount} watching · Hosted by{' '}
              <strong className="text-white">{activeRoom.hostName}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-3">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-white/15">
              <img
                src={getAnimePosterUrl(roomAnime)}
                alt={roomAnime.title}
                className="w-full h-full object-cover opacity-55"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex flex-col justify-between p-6">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-black/75 border border-white/15 text-xs font-semibold text-white">
                    {roomAnime.title} · Episode {activeRoom.episodeNumber} · {activeRoom.audio}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono">
                    {roomPlaying ? '▶ SYNCED PLAYBACK' : '❚❚ PAUSED BY HOST'}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setRoomPlaying((v) => !v)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs cursor-pointer"
                  >
                    {roomPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-black" /> Pause for everyone
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-black" /> Resume for everyone
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Room Chat */}
          <div className="lg:col-span-4 rounded-2xl bg-[#121216] border border-white/10 p-4 flex flex-col h-[420px]">
            <div className="text-xs font-bold text-white pb-3 border-b border-white/[0.07]">
              Room Party Chat
            </div>
            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 text-xs">
              {roomChat.map((m, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-white/[0.04]">
                  <strong className="text-white mr-1.5">{m.user}:</strong>
                  <span className="text-zinc-300">{m.text}</span>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!roomMsg.trim()) return;
                setRoomChat((prev) => [
                  ...prev,
                  { user: hostName || 'You', text: roomMsg.trim() },
                ]);
                setRoomMsg('');
              }}
              className="flex gap-2 pt-2 border-t border-white/[0.07]"
            >
              <input
                type="text"
                value={roomMsg}
                onChange={(e) => setRoomMsg(e.target.value)}
                placeholder="Say something to the room…"
                className="flex-1 bg-[#18181f] border border-white/10 rounded-full px-3.5 py-2 text-xs text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-full bg-white text-black font-semibold text-xs cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const matchingAnime = catalog.filter((a) =>
    animeQuery.trim()
      ? a.title.toLowerCase().includes(animeQuery.toLowerCase())
      : true
  );

  const canCreate = Boolean(selectedAnimeId && hostName.trim().length > 0);
  const canJoin = joinCode.trim().length >= 3;

  return (
    <div className="max-w-[1140px] mx-auto px-4 sm:px-8 py-8 space-y-8">
      <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
        Watch Together
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Start a room card matching anipm-watch-together.txt */}
        <div className="p-6 rounded-2xl bg-[#121216] border border-white/[0.08] space-y-4">
          <h2 className="text-lg font-display font-bold text-white">Start a room</h2>

          <div className="space-y-2">
            <input
              type="search"
              aria-label="Search anime to watch together"
              value={animeQuery}
              onChange={(e) => setAnimeQuery(e.target.value)}
              placeholder="Search anime to watch together"
              className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500"
            />
            <select
              aria-label="Select anime for room"
              value={selectedAnimeId}
              onChange={(e) => setSelectedAnimeId(e.target.value)}
              className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white"
            >
              {matchingAnime.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.episodesCount} eps)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">
              Room name (optional)
            </label>
            <input
              type="text"
              aria-label="Room name (optional)"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Friday Night Anime"
              className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Your name</label>
            <input
              type="text"
              aria-label="Your name"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="How others will see you"
              className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded accent-white"
            />
            <span>List this room under Live rooms</span>
          </label>

          <button
            type="button"
            disabled={!canCreate}
            onClick={() => {
              const target =
                catalog.find((a) => a.id === selectedAnimeId) || catalog[0];
              onCreateRoom({
                code: Math.random().toString(36).substring(2, 10),
                roomName: roomName.trim() || target.title,
                animeId: target.id,
                animeTitle: target.title,
                episodeNumber: 1,
                audio: 'DUB',
                hostName: hostName.trim(),
                viewersCount: 1,
                isPublic,
                isPlaying: true,
              });
            }}
            className="w-full py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            Create room
          </button>
        </div>

        {/* Join a room card */}
        <div className="p-6 rounded-2xl bg-[#121216] border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h2 className="text-lg font-display font-bold text-white">Join a room</h2>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">
                Room code or link
              </label>
              <input
                type="text"
                aria-label="Room code or link"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Paste a link or type the 8-letter code"
                className="w-full bg-[#18181f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={!canJoin}
            onClick={() => onJoinRoom(joinCode.trim())}
            className="w-full py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            Join
          </button>
        </div>
      </div>

      {/* Live rooms list */}
      <section className="space-y-3">
        <h2 className="text-lg font-display font-bold text-white">Live rooms</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rooms.map((room) => (
            <li key={room.code}>
              <button
                type="button"
                onClick={() => onJoinRoom(room.code)}
                className="w-full p-4 rounded-2xl bg-[#121216] hover:bg-[#18181f] border border-white/[0.08] text-left transition-colors flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">{room.roomName}</div>
                  <div className="text-xs text-zinc-300">{room.animeTitle}</div>
                  <div className="text-[11px] text-zinc-500">
                    Episode {room.episodeNumber} · {room.audio}
                  </div>
                </div>
                <div className="text-right text-xs text-zinc-400">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] text-zinc-200">
                    <span>{room.isPlaying ? '▶' : '❚❚'}</span>
                    <span>{room.viewersCount} watching</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Hosted by {room.hostName}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
