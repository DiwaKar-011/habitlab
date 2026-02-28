'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Play,
  RefreshCw,
  ExternalLink,
  Headphones,
  Search,
  Sparkles,
  ChevronDown,
  Star,
  Filter,
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { getHabits } from '@/lib/db'
import type { Habit, HabitCategory } from '@/types'

const CATEGORY_ICONS: Record<string, string> = {
  fitness: '💪',
  study: '📖',
  focus: '🎯',
  eco: '🌱',
  health: '❤️',
  mindset: '🧠',
}

const CATEGORY_COLORS: Record<string, string> = {
  fitness: 'bg-green-100 text-green-700 border-green-200',
  study: 'bg-blue-100 text-blue-700 border-blue-200',
  focus: 'bg-amber-100 text-amber-700 border-amber-200',
  eco: 'bg-teal-100 text-teal-700 border-teal-200',
  health: 'bg-pink-100 text-pink-700 border-pink-200',
  mindset: 'bg-purple-100 text-purple-700 border-purple-200',
}

type Tab = 'videos' | 'books'

interface VideoRec {
  query: string
  youtube_search_url: string
  youtube_embed_url?: string
}

interface BookRec {
  title: string
  author: string
  description: string
  searchQuery: string
}

export default function LearnPage() {
  const { user: authUser, loading: authLoading } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('videos')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [videos, setVideos] = useState<VideoRec[]>([])
  const [books, setBooks] = useState<BookRec[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [videoExcluded, setVideoExcluded] = useState<number[]>([])
  const [bookExcluded, setBookExcluded] = useState<number[]>([])
  const [fetchingCategory, setFetchingCategory] = useState<string | null>(null)

  // Get user's habit categories
  useEffect(() => {
    if (authLoading) return
    if (!authUser) { setLoading(false); return }
    const load = async () => {
      try {
        const h = await getHabits(authUser.id)
        setHabits(h)
        // Auto-select first category
        if (h.length > 0) {
          const firstCat = h[0].category
          setSelectedCategory(firstCat)
        }
      } catch (err) {
        console.error('Learn load error:', err)
      }
      setLoading(false)
    }
    load()
  }, [authUser, authLoading])

  // Fetch recommendations when category changes
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'all') {
      fetchRecommendations(selectedCategory)
    }
  }, [selectedCategory])

  const fetchRecommendations = async (category: string) => {
    setFetchingCategory(category)
    try {
      const [videoRes, bookRes] = await Promise.all([
        fetch('/api/learn/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, type: 'video', exclude_ids: videoExcluded }),
        }),
        fetch('/api/learn/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category, type: 'book', exclude_ids: bookExcluded }),
        }),
      ])
      const videoData = await videoRes.json()
      const bookData = await bookRes.json()
      setVideos(videoData.recommendations || [])
      setBooks(bookData.recommendations || [])
      if (videoData.refreshed) setVideoExcluded([])
      if (bookData.refreshed) setBookExcluded([])
    } catch (err) {
      console.error('Fetch recommendations error:', err)
    }
    setFetchingCategory(null)
  }

  const handleRefresh = async () => {
    if (!selectedCategory || selectedCategory === 'all') return
    setRefreshing(true)
    // Add current indices to excluded so we get new ones
    const newVideoExcluded = [...videoExcluded, ...Array.from({ length: 12 }, (_, i) => i)]
    const newBookExcluded = [...bookExcluded, ...Array.from({ length: 4 }, (_, i) => i)]
    setVideoExcluded(newVideoExcluded)
    setBookExcluded(newBookExcluded)

    try {
      const [videoRes, bookRes] = await Promise.all([
        fetch('/api/learn/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: selectedCategory, type: 'video', exclude_ids: newVideoExcluded }),
        }),
        fetch('/api/learn/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: selectedCategory, type: 'book', exclude_ids: newBookExcluded }),
        }),
      ])
      const videoData = await videoRes.json()
      const bookData = await bookRes.json()
      setVideos(videoData.recommendations || [])
      setBooks(bookData.recommendations || [])
      if (videoData.refreshed) setVideoExcluded([])
      if (bookData.refreshed) setBookExcluded([])
    } catch (err) {
      console.error('Refresh error:', err)
    }
    setRefreshing(false)
  }

  const userCategories = [...new Set(habits.map((h) => h.category))]
  const allCategories: string[] = ['fitness', 'study', 'focus', 'eco', 'health', 'mindset']

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-amber-500" size={24} />
            Learn & Grow
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Curated videos, books & audiobooks based on your habits
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || !selectedCategory || selectedCategory === 'all'}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : "Don't like these? Refresh!"}
        </button>
      </div>

      {/* Category Selection */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1">
          <Filter size={14} /> Select Category
        </h3>
        <div className="flex flex-wrap gap-2">
          {allCategories.map((cat) => {
            const isUserCat = userCategories.includes(cat as HabitCategory)
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setVideoExcluded([]); setBookExcluded([]) }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                    : isUserCat
                    ? `${CATEGORY_COLORS[cat]} hover:shadow-sm`
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                <span className="capitalize">{cat}</span>
                {isUserCat && selectedCategory !== cat && (
                  <span className="text-[9px] bg-white/50 rounded px-1">Your habit</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {[
          { id: 'videos' as Tab, label: 'YouTube Videos', icon: Play },
          { id: 'books' as Tab, label: 'Books & Audiobooks', icon: BookOpen },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {selectedCategory === 'all' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Search size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Select a category</h3>
          <p className="text-sm text-slate-400 mt-1">Choose a habit category above to get personalized recommendations</p>
        </div>
      ) : fetchingCategory ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          <span className="ml-3 text-slate-500">Finding the best content for you...</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'videos' ? (
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {videos.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                  <Play size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No videos found</h3>
                  <p className="text-sm text-slate-400">Try refreshing or selecting a different category</p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {videos.map((v, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all"
                    >
                      {/* Embedded YouTube Player */}
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(v.query)}`}
                          title={v.query}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold text-slate-800 dark:text-white text-sm">
                          {v.query}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${CATEGORY_COLORS[selectedCategory]}`}>
                            {CATEGORY_ICONS[selectedCategory]} {selectedCategory}
                          </span>
                          <a
                            href={v.youtube_search_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-0.5 transition-colors"
                          >
                            <ExternalLink size={10} /> Open on YouTube
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 text-center mt-4">
                Watch videos right here! Hit refresh for new suggestions.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="books"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {books.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                  <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No books found</h3>
                  <p className="text-sm text-slate-400">Try refreshing or selecting a different category</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {books.map((book, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-16 rounded-lg bg-gradient-to-b from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center flex-shrink-0">
                          <BookOpen size={20} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-800 dark:text-white text-sm">
                            {book.title}
                          </h4>
                          <p className="text-xs text-slate-400">by {book.author}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                            {book.description}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <a
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(book.searchQuery + ' audiobook')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full hover:bg-purple-100 transition-colors"
                            >
                              <Headphones size={10} /> Audiobook
                            </a>
                            <a
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(book.searchQuery)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full hover:bg-red-100 transition-colors"
                            >
                              <Play size={10} /> Summary Video
                            </a>
                            <a
                              href={`https://www.google.com/search?q=${encodeURIComponent(book.title + ' ' + book.author + ' book')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full hover:bg-slate-100 transition-colors"
                            >
                              <ExternalLink size={10} /> Find Book
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-400 text-center mt-4">
                Books and audiobooks curated for your {selectedCategory} habits. Hit refresh for different picks!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
