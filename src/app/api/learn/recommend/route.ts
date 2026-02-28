import { NextRequest, NextResponse } from 'next/server'

// Real YouTube video IDs mapped to each category
const YOUTUBE_VIDEOS: Record<string, { id: string; title: string }[]> = {
  fitness: [
    { id: 'U4lFPw7iOBc', title: 'Best Beginner Workout Routine' },
    { id: 'IODxDxX7oi4', title: 'Science of How Exercise Improves Your Brain' },
    { id: 'gC_L9qAHVJ8', title: '20-Min Full Body Workout - No Equipment' },
    { id: 'UBMk30rjy0o', title: 'Morning Workout Routine to Start Your Day' },
    { id: 'ml6cT4AZdqI', title: 'How Exercise Changes Your Brain' },
    { id: '2pLT-olgUJs', title: 'How to Build a Workout Habit That Sticks' },
    { id: 'BHY0FxzoKZE', title: 'Yoga for Beginners - 30 Day Challenge' },
    { id: 'sTANio_2E0Q', title: '15 Min Standing Abs Workout' },
    { id: 'TN9GDif2cOA', title: 'Running Tips for Beginners' },
    { id: 'Y2oKC2KTeZk', title: 'Stretching Routine for Flexibility' },
    { id: 'H1F-G1f2wPg', title: 'Why You Should Exercise Everyday' },
    { id: 'tSb_HQQsvgg', title: 'How to Stay Consistent at the Gym' },
  ],
  study: [
    { id: 'ukLnPbIffxE', title: 'How to Study Effectively - Evidence-Based' },
    { id: 'fDbxPVn02VU', title: 'Active Recall - Best Study Technique' },
    { id: 'Z-zNHHpXoMM', title: 'Spaced Repetition - Remember More in Less Time' },
    { id: 'mNbY8O1Y110', title: 'Pomodoro Technique - Study More Effectively' },
    { id: 'nqYmmZKY4sA', title: 'How to Learn Faster with Feynman Technique' },
    { id: 'IlU-zDU6aQ0', title: 'Best Note-Taking Methods for Students' },
    { id: 'p60rN9JEapg', title: 'How to Focus While Studying' },
    { id: 'V-UvSKe8jW4', title: '11 Secrets to Memorize Things Quicker' },
    { id: 'TjPFZaMe2yw', title: 'How to Study When You Don\'t Want To' },
    { id: 'bYjqMGeXFZ0', title: 'Exam Preparation Strategies That Work' },
    { id: 'DXlhEB0cKcE', title: 'How to Read Faster and Remember More' },
    { id: 'bDknBFQ-UY0', title: 'Deep Work - Cal Newport Summary' },
  ],
  focus: [
    { id: 'Hu4Yvq-g7_Y', title: 'How to Improve Concentration and Focus' },
    { id: 'ZD7dXfdDPTg', title: 'Deep Work - Rules for Focused Success' },
    { id: 'arj7oStGLkU', title: 'How to Stop Procrastinating' },
    { id: 'iONDebHX9qk', title: 'Dopamine Detox - How to Reset Your Brain' },
    { id: 'MYiR1-bJ5JQ', title: 'Flow State - How to Get in the Zone' },
    { id: 'Jkl1vMuRSWs', title: 'Meditation for Focus - 10 Min Guided' },
    { id: 'DGMCxRA-5Rs', title: 'Digital Minimalism Tips' },
    { id: 'rbxs68gdsGE', title: 'How to Avoid Distractions' },
    { id: 'cqGY-FkV8pQ', title: 'Time Management Tips That Actually Work' },
    { id: 'UQztq-HS4FY', title: 'Productivity System for Students' },
    { id: 'wfKv2qG8d_w', title: 'How to Build Discipline' },
    { id: 'la6v0UPEJDM', title: 'Attention Span - How to Improve It' },
  ],
  eco: [
    { id: 'wGHBSG-D_EI', title: 'Simple Sustainable Living Tips' },
    { id: '6jQ7y_qQYUA', title: 'How to Reduce Plastic in Your Life' },
    { id: 'OagTXWfaXEo', title: 'Zero Waste Lifestyle for Beginners' },
    { id: 'yiw6_JakZFc', title: 'What You Can Do About Climate Change' },
    { id: 'XALBGkjkUPQ', title: 'How to Reduce Your Carbon Footprint' },
    { id: 'tJkLnUi_Gio', title: 'Composting for Beginners' },
    { id: '1kUE0BZtTRc', title: 'Fast Fashion Impact on Environment' },
    { id: 'NxvQPzrg2Wg', title: 'Plant-Based Diet Benefits for the Planet' },
    { id: 'bfAzi6D5FpM', title: 'Renewable Energy Explained Simply' },
    { id: '_6xlNyWPpB8', title: 'Ocean Pollution - What Can We Do' },
    { id: 'oS-8MJ9DQNM', title: 'Sustainable Diet Choices' },
    { id: 'xY0_1CbDUMk', title: 'Easy Eco-Friendly Daily Habits' },
  ],
  health: [
    { id: 'pwaWilO_Pig', title: 'Healthy Habits for a Better Life' },
    { id: 'gedoSfZvBgE', title: 'How to Sleep Better - Sleep Science' },
    { id: 'GqQ5TRN3hEg', title: 'Nutrition Basics Everyone Should Know' },
    { id: 'FEn2_ber4YE', title: 'Daily Habits for Better Mental Health' },
    { id: 'LIoVsmmqnaE', title: 'Gut Health - How to Improve It' },
    { id: 'sG7DBA-mgFY', title: 'Stress Management Techniques' },
    { id: '8VwTZFY-oBs', title: 'Healthy Morning Routine Ideas' },
    { id: 'A6g0mPo-uJM', title: 'Intermittent Fasting - What Science Says' },
    { id: 'pq6WHJzOkno', title: 'Cold Shower Benefits - Science Explained' },
    { id: 'odADwWzHR24', title: 'Breathing Exercises for Better Health' },
    { id: 'GDBfA-aLBos', title: 'Hydration - Why Water is So Important' },
    { id: 'tTb3d5cjSFI', title: 'Immune System - How to Boost It Naturally' },
  ],
  mindset: [
    { id: '9DVdclX6NZY', title: 'Growth Mindset vs Fixed Mindset' },
    { id: 'inpok4MKVLM', title: '5-Minute Meditation for Beginners' },
    { id: 'EKR-HydGohQ', title: 'Stoicism - Practical Philosophy for Life' },
    { id: '8GO6_5us2eE', title: 'How to Build Mental Toughness' },
    { id: 'WPPPFqsECz0', title: 'The Power of Gratitude - Science' },
    { id: 'Y5oU6PKezP0', title: 'Journaling for Mental Health' },
    { id: 'PYaixyyzlDI', title: 'Self-Discipline - How to Build It' },
    { id: 'TWICdJMCHrk', title: 'Overcoming Fear and Anxiety' },
    { id: 'w6T02g5hnT4', title: 'Building Confidence with Science' },
    { id: '5KLPxDtMqeI', title: 'Neuroplasticity - How Your Brain Changes' },
    { id: 'OwJE3Cq9dMI', title: 'Emotional Intelligence - The Key Skill' },
    { id: 'R2_Mn-qRKjA', title: 'Positive Thinking - Does it Work?' },
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

    // Videos — return YouTube video IDs for embedding
    const videoList = YOUTUBE_VIDEOS[safeCategory] || YOUTUBE_VIDEOS['mindset']
    const excludeSet = new Set(exclude_ids || [])
    const available = videoList.filter((_, i) => !excludeSet.has(i))

    if (available.length === 0) {
      // Reset — give all back
      const shuffled = [...videoList].sort(() => Math.random() - 0.5)
      return NextResponse.json({
        recommendations: shuffled.slice(0, 4).map((v) => ({
          query: v.title,
          youtube_id: v.id,
          youtube_search_url: `https://www.youtube.com/watch?v=${v.id}`,
        })),
        refreshed: true,
      })
    }

    const shuffled = [...available].sort(() => Math.random() - 0.5)
    return NextResponse.json({
      recommendations: shuffled.slice(0, 4).map((v) => ({
        query: v.title,
        youtube_id: v.id,
        youtube_search_url: `https://www.youtube.com/watch?v=${v.id}`,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
