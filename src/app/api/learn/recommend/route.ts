import { NextRequest, NextResponse } from 'next/server'

const YOUTUBE_SEARCH_TEMPLATES: Record<string, string[]> = {
  fitness: [
    'best workout routine for beginners',
    'how to build exercise habit',
    'science of exercise benefits',
    'morning workout routine',
    'fitness motivation science',
    'how exercise changes your brain',
    'bodyweight workout at home',
    'running tips for beginners',
    'yoga for beginners daily',
    'stretching routine for flexibility',
    'HIIT workout for beginners',
    'how to stay consistent with gym',
  ],
  study: [
    'effective study techniques science',
    'how to study effectively',
    'best study methods for students',
    'active recall study technique',
    'spaced repetition how to',
    'pomodoro technique study',
    'how to read faster and remember more',
    'note taking methods for students',
    'memory techniques for students',
    'how to focus while studying',
    'deep learning study techniques',
    'exam preparation strategies',
  ],
  focus: [
    'how to improve concentration',
    'deep work cal newport',
    'focus techniques for productivity',
    'how to stop procrastinating',
    'flow state how to achieve',
    'digital minimalism tips',
    'attention span improvement',
    'meditation for focus',
    'productivity system for students',
    'time management techniques',
    'how to avoid distractions',
    'dopamine detox how to',
  ],
  eco: [
    'sustainable living tips',
    'how to reduce plastic waste',
    'zero waste lifestyle beginners',
    'eco friendly habits daily',
    'climate change what can I do',
    'sustainable diet tips',
    'reduce carbon footprint personal',
    'composting for beginners',
    'renewable energy explained',
    'ocean pollution solutions',
    'fast fashion environmental impact',
    'plant based diet benefits environment',
  ],
  health: [
    'healthy habits for better life',
    'sleep science how to sleep better',
    'nutrition basics for beginners',
    'mental health daily habits',
    'hydration benefits science',
    'gut health improvement tips',
    'stress management techniques',
    'immune system boosting naturally',
    'healthy morning routine',
    'intermittent fasting science',
    'cold shower benefits science',
    'breathing exercises for health',
  ],
  mindset: [
    'growth mindset how to develop',
    'meditation for beginners guided',
    'positive thinking science',
    'emotional intelligence improvement',
    'stoicism for modern life',
    'how to build mental toughness',
    'gratitude practice benefits',
    'journaling for mental health',
    'self discipline techniques',
    'overcoming fear and anxiety',
    'building confidence science',
    'neuroplasticity explained simply',
  ],
}

const BOOK_RECOMMENDATIONS: Record<string, { title: string; author: string; description: string; searchQuery: string }[]> = {
  fitness: [
    { title: 'Atomic Habits', author: 'James Clear', description: 'The 1% improvement system for building exercise habits', searchQuery: 'Atomic Habits James Clear summary' },
    { title: 'The Body', author: 'Bill Bryson', description: 'A fascinating guide to the human body and why exercise matters', searchQuery: 'The Body Bill Bryson review' },
    { title: 'Born to Run', author: 'Christopher McDougall', description: 'The hidden tribe that redefined running and human potential', searchQuery: 'Born to Run book summary' },
    { title: 'Spark', author: 'John J. Ratey', description: 'The revolutionary new science of exercise and the brain', searchQuery: 'Spark exercise brain science' },
  ],
  study: [
    { title: 'Make It Stick', author: 'Peter C. Brown', description: 'The science of successful learning and study techniques', searchQuery: 'Make It Stick study science' },
    { title: 'A Mind for Numbers', author: 'Barbara Oakley', description: 'How to excel at math and science even if you struggled', searchQuery: 'A Mind for Numbers Barbara Oakley' },
    { title: 'Deep Work', author: 'Cal Newport', description: 'Rules for focused success in a distracted world', searchQuery: 'Deep Work Cal Newport summary' },
    { title: 'Ultralearning', author: 'Scott Young', description: 'Master hard skills and accelerate your career', searchQuery: 'Ultralearning Scott Young explained' },
  ],
  mindset: [
    { title: 'Mindset', author: 'Carol S. Dweck', description: 'The new psychology of success — growth vs fixed mindset', searchQuery: 'Mindset Carol Dweck summary' },
    { title: 'The Power of Now', author: 'Eckhart Tolle', description: 'A guide to spiritual enlightenment and present-moment awareness', searchQuery: 'Power of Now Eckhart Tolle' },
    { title: 'Meditations', author: 'Marcus Aurelius', description: 'Stoic philosophy for daily resilience and inner peace', searchQuery: 'Meditations Marcus Aurelius summary' },
    { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', description: 'How our two thinking systems shape judgments and decisions', searchQuery: 'Thinking Fast Slow summary' },
  ],
  eco: [
    { title: 'Silent Spring', author: 'Rachel Carson', description: 'The book that launched the environmental movement', searchQuery: 'Silent Spring Rachel Carson' },
    { title: 'Drawdown', author: 'Paul Hawken', description: 'The most comprehensive plan to reverse global warming', searchQuery: 'Drawdown Paul Hawken summary' },
    { title: 'No One Is Too Small to Make a Difference', author: 'Greta Thunberg', description: 'Inspiring speeches on climate action', searchQuery: 'Greta Thunberg book summary' },
  ],
  health: [
    { title: 'Why We Sleep', author: 'Matthew Walker', description: 'Unlocking the power of sleep and dreams for better health', searchQuery: 'Why We Sleep Matthew Walker' },
    { title: 'The Sleep Revolution', author: 'Arianna Huffington', description: 'Transform your life one night at a time', searchQuery: 'Sleep Revolution Huffington summary' },
    { title: 'How Not to Die', author: 'Michael Greger', description: 'Discover foods scientifically proven to prevent disease', searchQuery: 'How Not to Die Michael Greger' },
  ],
  focus: [
    { title: 'Deep Work', author: 'Cal Newport', description: 'Rules for focused success in a distracted world', searchQuery: 'Deep Work Cal Newport summary' },
    { title: 'Indistractable', author: 'Nir Eyal', description: 'How to control your attention and choose your life', searchQuery: 'Indistractable Nir Eyal summary' },
    { title: 'Hyperfocus', author: 'Chris Bailey', description: 'How to manage attention in a world of distraction', searchQuery: 'Hyperfocus Chris Bailey summary' },
  ],
}

export async function POST(request: NextRequest) {
  try {
    const { category, type, exclude_ids } = await request.json()

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    const safeCategory = category.toLowerCase()

    if (type === 'book') {
      const books = BOOK_RECOMMENDATIONS[safeCategory] || BOOK_RECOMMENDATIONS['mindset']
      // Filter out already shown
      const available = exclude_ids?.length
        ? books.filter((_, i) => !exclude_ids.includes(i))
        : books
      if (available.length === 0) {
        return NextResponse.json({ recommendations: books.slice(0, 2), refreshed: true })
      }
      // Random pick 2
      const shuffled = [...available].sort(() => Math.random() - 0.5)
      return NextResponse.json({ recommendations: shuffled.slice(0, 2) })
    }

    // Videos — return YouTube search queries for the category
    const queries = YOUTUBE_SEARCH_TEMPLATES[safeCategory] || YOUTUBE_SEARCH_TEMPLATES['mindset']
    const excludeSet = new Set(exclude_ids || [])
    const available = queries.filter((_, i) => !excludeSet.has(i))

    if (available.length === 0) {
      // Reset — give all back
      const shuffled = [...queries].sort(() => Math.random() - 0.5)
      return NextResponse.json({
        recommendations: shuffled.slice(0, 4).map((q) => ({
          query: q,
          youtube_search_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
        })),
        refreshed: true,
      })
    }

    const shuffled = [...available].sort(() => Math.random() - 0.5)
    return NextResponse.json({
      recommendations: shuffled.slice(0, 4).map((q) => ({
        query: q,
        youtube_search_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
