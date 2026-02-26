'use client'

import { useState, useRef, useEffect } from 'react'
import { BookOpen, Play, Pause, Headphones, SkipBack, SkipForward, Volume2, Plus, X, Upload, Loader2, Star } from 'lucide-react'
import { getVideos, addVideo } from '@/lib/db'
import VideoModal from '@/components/learning/VideoModal'
import type { Video } from '@/types'

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const p of patterns) {
    const m = url.trim().match(p)
    if (m) return m[1]
  }
  return null
}

const mockBooks = [
  {
    id: 'b-1',
    title: 'Atomic Habits',
    author: 'James Clear',
    why_it_helps: 'Teaches the 1% improvement system and the four laws of behavior change.',
    category: 'mindset',
    cover_url: '📗',
  },
  {
    id: 'b-2',
    title: 'The Power of Habit',
    author: 'Charles Duhigg',
    why_it_helps: 'Explains the cue-routine-reward loop that drives habit formation.',
    category: 'study',
    cover_url: '📘',
  },
  {
    id: 'b-3',
    title: 'Tiny Habits',
    author: 'BJ Fogg',
    why_it_helps: 'Shows how small behavior changes lead to big transformations.',
    category: 'health',
    cover_url: '📕',
  },
  {
    id: 'b-4',
    title: 'Deep Work',
    author: 'Cal Newport',
    why_it_helps: 'Strategies for developing deep focus habits in a distracted world.',
    category: 'focus',
    cover_url: '📙',
  },
]

const mockAudiobooks = [
  {
    id: 'ab-1',
    title: 'The Habit Loop Explained',
    narrator: 'Dr. Sarah Mitchell',
    duration: '12:34',
    durationSec: 754,
    category: 'study',
    description: 'Understand how cues, routines, and rewards shape every habit in your life.',
    chapters: ['Introduction', 'What is a Habit Loop?', 'Cue Recognition', 'Routine Patterns', 'Reward Systems', 'Breaking Bad Habits'],
    cover: '🎧',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    id: 'ab-2',
    title: 'Neuroplasticity & You',
    narrator: 'Prof. James Park',
    duration: '18:22',
    durationSec: 1102,
    category: 'mindset',
    description: 'How your brain physically rewires itself when you build new habits.',
    chapters: ['Brain Basics', 'What is Neuroplasticity?', 'Synaptic Connections', 'Practice & Repetition', 'The 21-Day Myth Debunked'],
    cover: '🧠',
    color: 'from-purple-500 to-pink-400',
  },
  {
    id: 'ab-3',
    title: 'Dopamine: Friend or Foe?',
    narrator: 'Dr. Anika Patel',
    duration: '15:48',
    durationSec: 948,
    category: 'health',
    description: 'The science of dopamine and how to hack your reward system for good habits.',
    chapters: ['Meet Dopamine', 'The Reward Prediction Error', 'Dopamine & Social Media', 'Healthy Dopamine Habits', 'Building Sustainable Motivation'],
    cover: '⚡',
    color: 'from-amber-500 to-orange-400',
  },
  {
    id: 'ab-4',
    title: 'Focus & Flow States',
    narrator: 'Coach Taylor Reid',
    duration: '21:15',
    durationSec: 1275,
    category: 'focus',
    description: 'Learn how to enter flow states and maintain deep focus for peak performance.',
    chapters: ['What is Flow?', 'The Flow Triggers', 'Eliminating Distractions', 'Time Blocking Techniques', 'Building a Focus Habit', 'Measuring Your Focus'],
    cover: '🎯',
    color: 'from-emerald-500 to-teal-400',
  },
  {
    id: 'ab-5',
    title: 'Sleep Science for Teens',
    narrator: 'Dr. Emily Chen',
    duration: '14:05',
    durationSec: 845,
    category: 'health',
    description: 'Why sleep is the ultimate habit multiplier and how to optimize yours.',
    chapters: ['Sleep & The Brain', 'Circadian Rhythms', 'Screen Time Effects', 'Building a Sleep Routine', 'Power Naps'],
    cover: '😴',
    color: 'from-indigo-500 to-blue-400',
  },
  {
    id: 'ab-6',
    title: 'Eco Habits That Matter',
    narrator: 'Maya Green',
    duration: '11:30',
    durationSec: 690,
    category: 'eco',
    description: 'Small environmental habits that compound into massive planetary impact.',
    chapters: ['The Power of Small Actions', 'Reducing Waste', 'Energy Habits', 'Water Conservation', 'Inspiring Others'],
    cover: '🌍',
    color: 'from-green-500 to-emerald-400',
  },
]

export default function LearnPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [activeVideo, setActiveVideo] = useState<Video | null>(null)
  const [tab, setTab] = useState<'videos' | 'books' | 'audiobooks'>('videos')

  // Load videos from DB
  useEffect(() => {
    getVideos().then(setVideos)
  }, [])

  // Add-video form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [ytUrl, setYtUrl] = useState('')
  const [ytTitle, setYtTitle] = useState('')
  const [ytSummary, setYtSummary] = useState('')
  const [ytCategory, setYtCategory] = useState('mindset')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  const previewId = extractYouTubeId(ytUrl)

  const handleAddVideo = async () => {
    if (!previewId) { setAddError('Invalid YouTube URL'); return }
    if (!ytTitle.trim()) { setAddError('Title is required'); return }
    setAddError('')
    setAddLoading(true)
    try {
      const newVid = await addVideo({
        youtube_id: previewId,
        title: ytTitle.trim(),
        summary: ytSummary.trim() || undefined,
        habit_category: ytCategory,
      })
      setVideos(prev => [newVid, ...prev])
      setShowAddForm(false)
      setYtUrl('')
      setYtTitle('')
      setYtSummary('')
      setYtCategory('mindset')
    } catch (e: any) {
      setAddError(e?.message || 'Failed to add video')
    } finally {
      setAddLoading(false)
    }
  }

  // Audiobook player state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [audioProgress, setAudioProgress] = useState(0) // 0 to 100
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [expandedAudioId, setExpandedAudioId] = useState<string | null>(null)
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const startAudioPlayback = (audioId: string) => {
    if (playingAudioId === audioId) {
      // Pause
      if (progressInterval.current) clearInterval(progressInterval.current)
      progressInterval.current = null
      setPlayingAudioId(null)
      return
    }
    // Start playing
    setPlayingAudioId(audioId)
    const audio = mockAudiobooks.find(a => a.id === audioId)
    if (!audio) return

    if (progressInterval.current) clearInterval(progressInterval.current)

    // Simulate playback at ~10x speed for demo (1 sec real = 10 sec audio)
    progressInterval.current = setInterval(() => {
      setAudioCurrentTime(prev => {
        const next = prev + 10
        if (next >= audio.durationSec) {
          if (progressInterval.current) clearInterval(progressInterval.current)
          setPlayingAudioId(null)
          return 0
        }
        setAudioProgress((next / audio.durationSec) * 100)
        return next
      })
    }, 1000)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Learning Center</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Understand the science behind your habits
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setTab('videos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
            tab === 'videos'
              ? 'bg-brand-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Play size={14} />
          Videos
        </button>
        <button
          onClick={() => setTab('books')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
            tab === 'books'
              ? 'bg-brand-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <BookOpen size={14} />
          Books
        </button>
        <button
          onClick={() => setTab('audiobooks')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
            tab === 'audiobooks'
              ? 'bg-brand-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Headphones size={14} />
          Audiobooks
        </button>
      </div>

      {/* Videos */}
      {tab === 'videos' && (
        <div className="space-y-4">
          {/* Add Video Button */}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Add YouTube Video
          </button>

          {/* Add Video Modal */}
          {showAddForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Upload size={20} className="text-brand-600" />
                    Add YouTube Video
                  </h2>
                  <button onClick={() => { setShowAddForm(false); setAddError('') }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {/* YouTube URL */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">YouTube URL *</label>
                    <input
                      type="text"
                      value={ytUrl}
                      onChange={e => { setYtUrl(e.target.value); setAddError('') }}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Thumbnail Preview */}
                  {previewId && (
                    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img
                        src={`https://img.youtube.com/vi/${previewId}/hqdefault.jpg`}
                        alt="Video preview"
                        className="w-full aspect-video object-cover"
                      />
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                    <input
                      type="text"
                      value={ytTitle}
                      onChange={e => setYtTitle(e.target.value)}
                      placeholder="e.g. How Habits Shape Your Brain"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Summary */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Summary</label>
                    <textarea
                      value={ytSummary}
                      onChange={e => setYtSummary(e.target.value)}
                      placeholder="Brief description of the video..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select
                      value={ytCategory}
                      onChange={e => setYtCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                    >
                      <option value="mindset">Mindset</option>
                      <option value="study">Study</option>
                      <option value="health">Health</option>
                      <option value="focus">Focus</option>
                      <option value="eco">Eco</option>
                      <option value="social">Social</option>
                    </select>
                  </div>

                  {/* Error */}
                  {addError && (
                    <p className="text-sm text-red-500">{addError}</p>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleAddVideo}
                    disabled={addLoading}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {addLoading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {addLoading ? 'Adding...' : 'Add Video'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Video Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Recommended videos first, then the rest */}
          {[...videos].sort((a, b) => (a.trigger_type === 'recommend' ? -1 : 1) - (b.trigger_type === 'recommend' ? -1 : 1)).map((video) => (
            <div
              key={video.id}
              className={`bg-white dark:bg-slate-900 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
                video.trigger_type === 'recommend'
                  ? 'border-2 border-amber-400 dark:border-amber-500 ring-1 ring-amber-200 dark:ring-amber-800'
                  : 'border border-slate-200 dark:border-slate-800'
              }`}
              onClick={() => setActiveVideo(video)}
            >
              <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative group">
                <img
                  src={`https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                <div className="relative z-10 w-16 h-16 bg-white/90 dark:bg-slate-700/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play size={28} className="text-brand-600 ml-1" />
                </div>
                {video.trigger_type === 'recommend' && (
                  <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Star size={10} fill="white" /> Recommended
                  </div>
                )}
                <div className="absolute top-2 right-2 z-10 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                  {video.habit_category}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-1">{video.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{video.summary}</p>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Books */}
      {tab === 'books' && (
        <div className="grid md:grid-cols-2 gap-4">
          {mockBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{book.cover_url}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{book.title}</h3>
                  <p className="text-xs text-slate-400 mb-2">by {book.author}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{book.why_it_helps}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <select className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800">
                      <option>Want to Read</option>
                      <option>Reading</option>
                      <option>Finished</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audiobooks */}
      {tab === 'audiobooks' && (
        <div className="space-y-6">
          {/* Info banner */}
          <div className="bg-gradient-to-r from-accent-50 to-brand-50 dark:from-accent-950/30 dark:to-brand-950/30 rounded-xl border border-accent-200 dark:border-accent-800 p-4 flex items-center gap-3">
            <Headphones size={24} className="text-accent-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Learn on the go with audiobooks
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Listen to bite-sized lessons about behavior science, habit formation, and neuroplasticity.
                Earn +15 XP for each audiobook completed!
              </p>
            </div>
          </div>

          {/* Audiobook Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {mockAudiobooks.map((audio) => {
              const isPlaying = playingAudioId === audio.id
              const isExpanded = expandedAudioId === audio.id
              return (
                <div
                  key={audio.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-all"
                >
                  {/* Header with gradient */}
                  <div className={`bg-gradient-to-r ${audio.color} p-4 relative`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{audio.cover}</span>
                        <div>
                          <h3 className="font-bold text-white text-sm">{audio.title}</h3>
                          <p className="text-white/80 text-xs">by {audio.narrator}</p>
                        </div>
                      </div>
                      <div className="bg-white/20 text-white text-xs px-2 py-1 rounded-full font-medium">
                        {audio.duration}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{audio.description}</p>

                    {/* Player Controls */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setAudioCurrentTime(Math.max(0, audioCurrentTime - 15))
                            setAudioProgress(Math.max(0, (audioCurrentTime - 15) / audio.durationSec * 100))
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                          title="Rewind 15s"
                        >
                          <SkipBack size={16} />
                        </button>
                        <button
                          onClick={() => startAudioPlayback(audio.id)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isPlaying
                              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30 scale-110'
                              : 'bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 hover:bg-brand-200 dark:hover:bg-brand-800/50'
                          }`}
                        >
                          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                        </button>
                        <button
                          onClick={() => {
                            setAudioCurrentTime(Math.min(audio.durationSec, audioCurrentTime + 15))
                            setAudioProgress(Math.min(100, (audioCurrentTime + 15) / audio.durationSec * 100))
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                          title="Forward 15s"
                        >
                          <SkipForward size={16} />
                        </button>
                        <div className="flex-1 ml-2">
                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-300"
                              style={{ width: `${isPlaying || playingAudioId === null ? (audio.id === playingAudioId || audioCurrentTime > 0 ? audioProgress : 0) : 0}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-slate-400">{isPlaying ? formatTime(audioCurrentTime) : '0:00'}</span>
                            <span className="text-[10px] text-slate-400">{audio.duration}</span>
                          </div>
                        </div>
                        <Volume2 size={14} className="text-slate-400 ml-1" />
                      </div>
                    </div>

                    {/* Chapters toggle */}
                    <button
                      onClick={() => setExpandedAudioId(isExpanded ? null : audio.id)}
                      className="mt-3 text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline"
                    >
                      {isExpanded ? 'Hide Chapters ▲' : `${audio.chapters.length} Chapters ▼`}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-1">
                        {audio.chapters.map((ch, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {idx + 1}
                            </span>
                            {ch}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {activeVideo && (
        <VideoModal
          youtubeId={activeVideo.youtube_id}
          title={activeVideo.title}
          isOpen={!!activeVideo}
          onClose={() => setActiveVideo(null)}
          onWatched={() => {
            // In production: insert into video_watch_logs + award XP
          }}
        />
      )}
    </div>
  )
}
