'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Beaker, ArrowLeft, Plus, X, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { createHabit } from '@/lib/db'
import { useAuth } from '@/components/AuthProvider'
import type { HabitCategory } from '@/types'

const categories = [
  { value: 'fitness', label: 'Fitness', icon: '💪' },
  { value: 'study', label: 'Study', icon: '📚' },
  { value: 'focus', label: 'Focus', icon: '🎯' },
  { value: 'eco', label: 'Eco', icon: '🌱' },
  { value: 'health', label: 'Health', icon: '❤️' },
  { value: 'mindset', label: 'Mindset', icon: '🧠' },
]

// ── Experiment Suggestions Database ──────────────────
const experimentSuggestions: Record<string, { title: string; description: string; category: string; hypothesis: string; independentVar: string; dependentVar: string }[]> = {
  fitness: [
    { title: 'Morning Run', description: 'Run for 30 minutes every morning', category: 'fitness', hypothesis: 'If I run every morning, then my energy levels will improve', independentVar: 'Daily morning running', dependentVar: 'Energy levels throughout the day' },
    { title: 'Sprint Training', description: 'Do 10x100m sprint intervals 3 times per week', category: 'fitness', hypothesis: 'If I do sprint intervals, then my running speed will increase', independentVar: 'Sprint interval training', dependentVar: 'Running speed (100m time)' },
    { title: 'Jogging', description: 'Jog for 20 minutes at a comfortable pace daily', category: 'fitness', hypothesis: 'If I jog daily, then my resting heart rate will decrease', independentVar: 'Daily jogging', dependentVar: 'Resting heart rate' },
    { title: 'Trail Running', description: 'Run on nature trails for 40 minutes', category: 'fitness', hypothesis: 'If I trail run regularly, then my mood and fitness will improve', independentVar: 'Trail running sessions', dependentVar: 'Mood rating and endurance' },
    { title: 'Push-Up Challenge', description: 'Do 50 push-ups every day', category: 'fitness', hypothesis: 'If I do daily push-ups, then my upper body strength will increase', independentVar: 'Daily push-ups', dependentVar: 'Max push-ups in one set' },
    { title: 'Jump Rope Cardio', description: '15 minutes of jump rope daily', category: 'fitness', hypothesis: 'If I jump rope daily, then my coordination and stamina will improve', independentVar: 'Jump rope sessions', dependentVar: 'Stamina and coordination' },
    { title: 'Yoga Practice', description: '30 minutes of yoga every morning', category: 'fitness', hypothesis: 'If I do yoga daily, then my flexibility and stress levels will improve', independentVar: 'Daily yoga', dependentVar: 'Flexibility and stress rating' },
    { title: 'Plank Challenge', description: 'Hold plank for increasing durations daily', category: 'fitness', hypothesis: 'If I plank daily, then my core strength will increase', independentVar: 'Daily plank hold', dependentVar: 'Max plank duration' },
    { title: 'Swimming Laps', description: 'Swim 20 laps every other day', category: 'fitness', hypothesis: 'If I swim regularly, then my lung capacity will increase', independentVar: 'Swim sessions', dependentVar: 'Lung capacity and lap time' },
    { title: 'Cycling', description: 'Cycle 10km every day after school', category: 'fitness', hypothesis: 'If I cycle daily, then my leg strength and endurance will improve', independentVar: 'Daily cycling', dependentVar: 'Leg strength and endurance' },
  ],
  study: [
    { title: 'Read 30 Minutes', description: 'Read non-fiction for 30 minutes before bed', category: 'study', hypothesis: 'If I read daily, then my vocabulary and comprehension will improve', independentVar: 'Daily reading', dependentVar: 'Vocabulary test scores' },
    { title: 'Flashcard Review', description: 'Review 50 flashcards using spaced repetition', category: 'study', hypothesis: 'If I use spaced repetition, then my memory retention will increase', independentVar: 'Flashcard review sessions', dependentVar: 'Quiz scores and retention' },
    { title: 'Pomodoro Study', description: '4 Pomodoro sessions (25 min each) daily', category: 'study', hypothesis: 'If I use the Pomodoro technique, then my study efficiency will increase', independentVar: 'Pomodoro study sessions', dependentVar: 'Material covered per hour' },
    { title: 'Math Practice', description: 'Solve 10 math problems every day', category: 'study', hypothesis: 'If I practice daily, then my math test scores will improve', independentVar: 'Daily math problems', dependentVar: 'Math test scores' },
    { title: 'Journal Writing', description: 'Write 500 words daily in a journal', category: 'study', hypothesis: 'If I write daily, then my writing skills will improve', independentVar: 'Daily writing', dependentVar: 'Writing quality score' },
    { title: 'Language Learning', description: 'Practice a new language for 20 minutes daily', category: 'study', hypothesis: 'If I practice daily, then my language proficiency will improve', independentVar: 'Daily language practice', dependentVar: 'Proficiency test scores' },
  ],
  focus: [
    { title: 'No Phone First Hour', description: 'Avoid phone for the first hour after waking', category: 'focus', hypothesis: 'If I avoid my phone in the morning, then my focus at school will improve', independentVar: 'Phone-free mornings', dependentVar: 'Focus rating during class' },
    { title: 'Meditation', description: '10 minutes of guided meditation daily', category: 'focus', hypothesis: 'If I meditate daily, then my attention span will increase', independentVar: 'Daily meditation', dependentVar: 'Attention span (focus test)' },
    { title: 'Digital Detox', description: 'No social media after 8 PM', category: 'focus', hypothesis: 'If I limit social media, then my sleep quality will improve', independentVar: 'Social media cut-off', dependentVar: 'Sleep quality rating' },
    { title: 'Deep Work Block', description: '2 hours of distraction-free work daily', category: 'focus', hypothesis: 'If I do deep work blocks, then my productivity will increase', independentVar: 'Deep work sessions', dependentVar: 'Tasks completed per session' },
    { title: 'Single-Tasking', description: 'Do one task at a time, no multitasking', category: 'focus', hypothesis: 'If I single-task, then my error rate will decrease', independentVar: 'Single-tasking habit', dependentVar: 'Error rate and completion time' },
  ],
  eco: [
    { title: 'No Single-Use Plastic', description: 'Avoid all single-use plastic items for the day', category: 'eco', hypothesis: 'If I avoid single-use plastic, then my waste output will decrease', independentVar: 'Plastic avoidance', dependentVar: 'Waste produced (grams)' },
    { title: 'Walk to School', description: 'Walk or bike instead of getting a car ride', category: 'eco', hypothesis: 'If I walk to school, then my carbon footprint will decrease', independentVar: 'Walking to school', dependentVar: 'CO2 emissions saved' },
    { title: 'Plant Care', description: 'Water and care for a plant every day', category: 'eco', hypothesis: 'If I care for plants, then my environmental awareness will grow', independentVar: 'Daily plant care', dependentVar: 'Plant growth and eco awareness' },
    { title: 'Zero Food Waste', description: 'Finish all food with no waste', category: 'eco', hypothesis: 'If I waste no food, then my food waste kg will decrease to near zero', independentVar: 'Zero food waste commitment', dependentVar: 'Food waste (grams/day)' },
    { title: 'Energy Saver', description: 'Turn off all lights/devices when not in use', category: 'eco', hypothesis: 'If I save energy, then my electricity usage will decrease', independentVar: 'Energy saving habits', dependentVar: 'Electricity consumption' },
  ],
  health: [
    { title: 'Drink 8 Glasses of Water', description: 'Track and drink 8 glasses of water daily', category: 'health', hypothesis: 'If I stay hydrated, then my energy and skin health will improve', independentVar: 'Water intake (8 glasses)', dependentVar: 'Energy and skin quality rating' },
    { title: 'Sleep by 10 PM', description: 'Be in bed with lights off by 10 PM', category: 'health', hypothesis: 'If I sleep early, then my morning alertness will increase', independentVar: 'Early sleep schedule', dependentVar: 'Morning alertness rating' },
    { title: 'Healthy Breakfast', description: 'Eat a balanced breakfast every morning', category: 'health', hypothesis: 'If I eat a healthy breakfast, then my morning focus will improve', independentVar: 'Balanced breakfast', dependentVar: 'Focus and energy levels' },
    { title: 'No Sugary Drinks', description: 'Replace all sugary drinks with water', category: 'health', hypothesis: 'If I cut sugary drinks, then my energy crashes will decrease', independentVar: 'Sugar drink elimination', dependentVar: 'Energy stability throughout day' },
    { title: 'Stretch Before Bed', description: '10 minutes of stretching before sleep', category: 'health', hypothesis: 'If I stretch before bed, then my sleep quality will improve', independentVar: 'Nightly stretching', dependentVar: 'Sleep quality score' },
  ],
  mindset: [
    { title: 'Gratitude Journal', description: 'Write 3 things you are grateful for every night', category: 'mindset', hypothesis: 'If I practice gratitude, then my overall happiness will increase', independentVar: 'Gratitude journaling', dependentVar: 'Happiness/mood rating' },
    { title: 'Positive Affirmations', description: 'Say 5 positive affirmations every morning', category: 'mindset', hypothesis: 'If I practice affirmations, then my self-confidence will improve', independentVar: 'Daily affirmations', dependentVar: 'Confidence rating' },
    { title: 'Growth Mindset Practice', description: 'Reframe one negative thought as a learning opportunity daily', category: 'mindset', hypothesis: 'If I reframe negatives, then my resilience will improve', independentVar: 'Thought reframing', dependentVar: 'Resilience rating' },
    { title: 'Act of Kindness', description: 'Do one deliberate act of kindness each day', category: 'mindset', hypothesis: 'If I practice kindness, then my social connections will strengthen', independentVar: 'Daily acts of kindness', dependentVar: 'Social wellbeing rating' },
    { title: 'Visualization', description: 'Spend 5 minutes visualizing your goals', category: 'mindset', hypothesis: 'If I visualize daily, then my goal achievement rate will increase', independentVar: 'Daily visualization', dependentVar: 'Goal progress %' },
  ],
}

// Flatten all suggestions for search
const allSuggestions = Object.values(experimentSuggestions).flat()

const targetOptions = [7, 14, 21, 30]

export default function CreateHabitPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState(allSuggestions)
  const suggestRef = useRef<HTMLDivElement>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState(3)
  const [hypothesis, setHypothesis] = useState('')
  const [independentVar, setIndependentVar] = useState('')
  const [dependentVar, setDependentVar] = useState('')
  const [controlVars, setControlVars] = useState<string[]>([])
  const [newControlVar, setNewControlVar] = useState('')
  const [targetDays, setTargetDays] = useState(21)

  // Filter suggestions when title or category changes
  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (value.length >= 1) {
      const query = value.toLowerCase()
      let results = allSuggestions.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      )
      // If category is selected, boost those results
      if (category) {
        const inCat = results.filter(s => s.category === category)
        const notCat = results.filter(s => s.category !== category)
        results = [...inCat, ...notCat]
      }
      setFilteredSuggestions(results.slice(0, 8))
      setShowSuggestions(results.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  // Also show category-specific suggestions when category changes
  const handleCategoryChange = (cat: string) => {
    setCategory(cat)
    if (cat && !title) {
      setFilteredSuggestions(experimentSuggestions[cat] || [])
      setShowSuggestions(true)
    }
  }

  const applySuggestion = (s: typeof allSuggestions[0]) => {
    setTitle(s.title)
    setDescription(s.description)
    setCategory(s.category)
    setHypothesis(s.hypothesis)
    setIndependentVar(s.independentVar)
    setDependentVar(s.dependentVar)
    setShowSuggestions(false)
  }

  // Close suggestions on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const addControlVar = () => {
    if (newControlVar.trim()) {
      setControlVars([...controlVars, newControlVar.trim()])
      setNewControlVar('')
    }
  }

  const removeControlVar = (index: number) => {
    setControlVars(controlVars.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!user) {
      setError('You must be signed in to create an experiment. Please sign in first.')
      return
    }
    setLoading(true)

    try {
      await createHabit({
        user_id: user.id,
        title,
        description: description || undefined,
        category: category as HabitCategory,
        difficulty,
        hypothesis: hypothesis || undefined,
        independent_var: independentVar || undefined,
        dependent_var: dependentVar || undefined,
        control_vars: controlVars.length > 0 ? controlVars : undefined,
        target_days: targetDays,
      })
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Failed to create habit', err)
      const msg = err?.message || 'Unknown error'
      if (msg.includes('permission') || msg.includes('PERMISSION_DENIED')) {
        setError('Firestore permission denied. Make sure Firestore rules allow writes for authenticated users.')
      } else if (msg.includes('not-found') || msg.includes('NOT_FOUND')) {
        setError('Firestore database not found. Please create a Firestore database in the Firebase Console.')
      } else {
        setError(`Failed to create experiment: ${msg}`)
      }
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-brand-50 dark:bg-brand-950/30 rounded-xl flex items-center justify-center">
          <Beaker size={20} className="text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Experiment</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Design your habit as a scientific experiment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section A: Basic Info */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6"
        >
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div className="relative" ref={suggestRef}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Habit Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onFocus={() => {
                  if (title.length >= 1 && filteredSuggestions.length > 0) setShowSuggestions(true)
                  else if (category && !title) {
                    setFilteredSuggestions(experimentSuggestions[category] || [])
                    setShowSuggestions(true)
                  }
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                placeholder="e.g., Morning Run — start typing for suggestions..."
              />
              {/* Autocomplete Suggestions */}
              <AnimatePresence>
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl max-h-72 overflow-y-auto"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-accent-500" />
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                        Suggested Experiments
                      </span>
                    </div>
                    {filteredSuggestions.map((s, idx) => {
                      const catInfo = categories.find(c => c.value === s.category)
                      return (
                        <button
                          key={`${s.title}-${idx}`}
                          type="button"
                          onClick={() => applySuggestion(s)}
                          className="w-full text-left px-4 py-3 hover:bg-brand-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{catInfo?.icon}</span>
                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{s.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300 capitalize">
                              {s.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 ml-6">{s.description}</p>
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none dark:bg-slate-800"
                placeholder="Describe what this habit involves..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleCategoryChange(cat.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      category === cat.value
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Difficulty: {difficulty}/5
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                <span>Easy</span>
                <span>Medium</span>
                <span>Hard</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section B: Experiment Setup */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6"
        >
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">Experiment Setup</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            Frame your habit as a scientific experiment
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Hypothesis
              </label>
              <input
                type="text"
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none dark:bg-slate-800"
                placeholder="If I do X, then Y will happen"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Independent Variable
                </label>
                <input
                  type="text"
                  value={independentVar}
                  onChange={(e) => setIndependentVar(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none dark:bg-slate-800"
                  placeholder="What you change"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Dependent Variable
                </label>
                <input
                  type="text"
                  value={dependentVar}
                  onChange={(e) => setDependentVar(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none dark:bg-slate-800"
                  placeholder="What you measure"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Control Variables
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newControlVar}
                  onChange={(e) => setNewControlVar(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addControlVar())}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none dark:bg-slate-800"
                  placeholder="What stays the same"
                />
                <button
                  type="button"
                  onClick={addControlVar}
                  className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
              {controlVars.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {controlVars.map((cv, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1 rounded-full"
                    >
                      {cv}
                      <button type="button" onClick={() => removeControlVar(i)}>
                        <X size={12} className="text-slate-400 hover:text-red-500" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Experiment Duration
              </label>
              <div className="flex gap-2">
                {targetOptions.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setTargetDays(d)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                      targetDays === d
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !title || !category}
          className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-brand-700 disabled:opacity-50 transition-all shadow-lg shadow-brand-500/20"
        >
          {loading ? 'Creating Experiment...' : '🧪 Start Experiment'}
        </button>
      </form>
    </div>
  )
}
