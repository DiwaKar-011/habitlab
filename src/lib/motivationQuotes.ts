// Motivation quotes, roasting notifications, and habit predictions

export const motivationQuotes = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit. — Aristotle",
  "Small daily improvements over time lead to stunning results. — Robin Sharma",
  "Success is the sum of small efforts, repeated day in and day out. — Robert Collier",
  "Discipline is choosing between what you want now and what you want most.",
  "Your future is created by what you do today, not tomorrow.",
  "The only bad workout is the one that didn't happen.",
  "Don't count the days, make the days count. — Muhammad Ali",
  "It's not about having time, it's about making time.",
  "A year from now you will wish you had started today. — Karen Lamb",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Push yourself because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Wake up with determination. Go to bed with satisfaction.",
  "The difference between who you are and who you want to be is what you do.",
  "Believe you can and you're halfway there. — Theodore Roosevelt",
  "You don't have to be great to start, but you have to start to be great. — Zig Ziglar",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Motivation gets you going, but discipline keeps you growing.",
  "Your only limit is your mind.",
  "Progress, not perfection.",
  "Every expert was once a beginner. Every pro was once an amateur.",
  "Fall seven times, stand up eight. — Japanese Proverb",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Consistency is what transforms average into excellence.",
  "One day or day one. You decide.",
  "If it doesn't challenge you, it doesn't change you.",
  "Don't wish for it. Work for it.",
  "Every neural pathway gets stronger with each repetition. 🔬",
  "🧠 Your habits today shape your future tomorrow.",
]

export const funnyRoasts = [
  "🪨 Bro, your streak just died... Even your pet rock has more consistency.",
  "💸 Your habit streak is looking like my bank account — zero.",
  "🦥 Even a sloth moves more than your progress bar right now.",
  "👀 Your friend just crushed their habit. Meanwhile, you're reading this notification...",
  "👻 Plot twist: Your habit tracker has trust issues because you keep ghosting it.",
  "🥇 If procrastination was an Olympic sport, you'd have a gold medal by now.",
  "📞 Your habit called. It said it misses you...",
  "📰 Breaking news: Local user discovers the 'Log Today' button still exists!",
  "🚰 Even Monday is more productive than you today. Let that sink in.",
  "🔥 Your streak disappeared faster than my attention span.",
  "💨 Hey, that habit isn't gonna complete itself. Unless... wait, no, it won't. Do it.",
  "🫥 Fun fact: Your phone screen time is probably higher than your habit score today.",
  "📱 Your grandma could outperform your current streak. Just saying.",
  "🐵 Warning: Your motivation has left the chat.",
  "💬 Your habit is collecting more dust than my bookshelf. Clean it up!",
  "📚 Fun fact: reading about habits doesn't count as doing them.",
]

export const friendComparisonMessages = [
  "🏃 {friend} just completed their habit! Don't let them get too far ahead!",
  "💪 {friend} is on a {streak}-day streak. What's your excuse?",
  "⚡ {friend} has {xp} XP more than you. Time to grind!",
  "🤔 {friend} hasn't missed a day this week. Can you say the same?",
  "🏅 {friend} just earned a new badge! Go earn yours!",
  "🏆 {friend} is climbing the leaderboard. Are you going to let them win?",
]

export const streakCongrats: Record<number, string> = {
  7: "🔥 AMAZING! 7-day streak! Your habit loop is forming! Your brain is literally rewiring itself!",
  14: "⚡ TWO WEEKS! 14-day streak! The neural pathways are getting real strong! Keep it up!",
  21: "🏅 THREE WEEKS! 21 days — the classic habit formation milestone! You're unstoppable!",
  30: "🏆 ONE MONTH! 30-day streak! You're a habit machine! Scientists would be proud!",
  50: "👑 FIFTY DAYS! Half a century of consistency! You're in the top tier now!",
  75: "💎 75 DAYS! You're a diamond in the making! Three-quarters of the way to 100!",
  100: "🌟 ONE HUNDRED DAYS! LEGENDARY! You've achieved what most people only dream about!",
  150: "⭐ 150 DAYS! You're not just building habits, you're building a legacy!",
  200: "🔱 200 DAYS! At this point, the habit is part of your DNA!",
  250: "🌈 250 DAYS! You're inspiring everyone around you. True habit scientist!",
  300: "💫 300 DAYS! You're basically a superhero at this point!",
  365: "🎆 ONE YEAR! 365 DAYS! You've done the impossible. Standing ovation! 👏",
}

export function getRandomQuote(): string {
  return motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)]
}

export function getRandomRoast(): string {
  return funnyRoasts[Math.floor(Math.random() * funnyRoasts.length)]
}

export function getFriendComparison(friendName: string, streak?: number, xp?: number): string {
  const template = friendComparisonMessages[Math.floor(Math.random() * friendComparisonMessages.length)]
  return template
    .replace('{friend}', friendName)
    .replace('{streak}', String(streak || 0))
    .replace('{xp}', String(xp || 0))
}

export function getStreakMilestoneMessage(streak: number): string | null {
  // Check if this is a milestone (multiples of 50 after 100, or specific values)
  if (streakCongrats[streak]) return streakCongrats[streak]
  if (streak > 100 && streak % 50 === 0) {
    return `🌟 ${streak} DAYS! You're absolutely incredible! Every 50 days is a new victory!`
  }
  return null
}

// Habit continuation predictions
export const habitBenefits: Record<string, { days: number; benefits: string[] }[]> = {
  fitness: [
    { days: 7, benefits: ['Improved blood circulation', 'Better sleep quality', 'Initial mood boost'] },
    { days: 14, benefits: ['Visible energy increase', 'Reduced stress hormones', 'Better appetite regulation'] },
    { days: 30, benefits: ['Noticeable strength gains', 'Improved cardiovascular health', 'Reduced anxiety by ~30%'] },
    { days: 60, benefits: ['Significant body composition changes', 'Stronger immune system', 'Exercise becomes automatic'] },
    { days: 90, benefits: ['Complete lifestyle transformation', 'Reduced risk of chronic diseases', 'Peak mental clarity'] },
  ],
  study: [
    { days: 7, benefits: ['Improved focus duration', 'Better information retention', 'Developing reading stamina'] },
    { days: 14, benefits: ['Faster reading speed', 'Better comprehension', 'Vocabulary expansion begins'] },
    { days: 30, benefits: ['Knowledge compounds noticeably', 'Critical thinking improves', 'Memory recall strengthens'] },
    { days: 60, benefits: ['Expert-level understanding in topic', 'Cross-domain connections form', 'Study becomes effortless'] },
    { days: 90, benefits: ['Mastery-level knowledge', 'Teaching ability emerges', 'Lifelong learner mindset locked in'] },
  ],
  mindset: [
    { days: 7, benefits: ['Reduced stress response', 'Better emotional awareness', 'Improved focus for ~5 extra min/day'] },
    { days: 14, benefits: ['Measurable cortisol reduction', 'Better decision making', 'Increased patience'] },
    { days: 30, benefits: ['Rewired stress response', 'Emotional resilience up 40%', 'Better relationships'] },
    { days: 60, benefits: ['Sustained inner peace', 'Grey matter increase in prefrontal cortex', 'Automatic mindfulness'] },
    { days: 90, benefits: ['Transformative mental clarity', 'Deep emotional intelligence', 'Unshakeable calm under pressure'] },
  ],
  eco: [
    { days: 7, benefits: ['Saved ~0.35kg of plastic waste', 'Awareness of consumption patterns', 'Small carbon footprint reduction'] },
    { days: 14, benefits: ['Saved ~0.7kg plastic', 'New eco-friendly routines forming', 'Inspiring those around you'] },
    { days: 30, benefits: ['Saved ~1.5kg plastic', 'Significant waste reduction', 'Eco mindset becomes natural'] },
    { days: 60, benefits: ['Saved ~3kg plastic, Equivalent to saving 60 marine animals', 'Sustainable lifestyle locked in'] },
    { days: 90, benefits: ['Saved ~4.5kg plastic', 'You\'ve prevented significant ocean pollution', 'Environmental leader status'] },
  ],
  health: [
    { days: 7, benefits: ['Improved hydration', 'Better digestion', 'Initial immune boost'] },
    { days: 14, benefits: ['Clearer skin', 'More stable energy levels', 'Better sleep quality'] },
    { days: 30, benefits: ['Measurable health improvements', 'Stronger immune system', 'Reduced inflammation'] },
    { days: 60, benefits: ['Significant longevity benefits', 'Optimized body functions', 'Health habit fully automatic'] },
    { days: 90, benefits: ['Complete health transformation', 'Disease risk significantly reduced', 'Peak physical wellness'] },
  ],
  focus: [
    { days: 7, benefits: ['15% longer attention span', 'Fewer distractions noticed', 'Better task completion'] },
    { days: 14, benefits: ['Flow states become accessible', 'Reduced phone pickups', 'Deeper work sessions'] },
    { days: 30, benefits: ['2x productivity boost', 'Deep work becomes natural', 'Distraction resistance strengthens'] },
    { days: 60, benefits: ['Elite-level concentration', 'Multi-hour focus sessions possible', 'Peak cognitive performance'] },
    { days: 90, benefits: ['Superhuman focus ability', 'Automatic deep work mode', 'Top 1% productivity'] },
  ],
}

export function predictHabitBenefits(category: string, currentStreak: number): { nextMilestone: number; benefits: string[]; scienceFact: string } {
  const categoryData = habitBenefits[category] || habitBenefits['mindset']
  
  // Find next milestone
  let nextMilestone = categoryData[0]
  for (const milestone of categoryData) {
    if (milestone.days > currentStreak) {
      nextMilestone = milestone
      break
    }
  }

  const scienceFacts = [
    `Your brain has formed approximately ${Math.floor(currentStreak * 1.5)} new synaptic connections for this habit.`,
    `Research shows it takes 66 days on average to form a habit. You're ${Math.min(100, Math.round((currentStreak / 66) * 100))}% there!`,
    `Each day you complete this habit, the neural pathway gets ~2% stronger.`,
    `Studies show that after ${currentStreak} days, your habit automaticity score is approximately ${Math.min(95, Math.round(currentStreak * 1.2))}%.`,
    `Your dopamine response to this habit has strengthened by ~${Math.min(80, currentStreak * 2)}% since you started.`,
  ]

  return {
    nextMilestone: nextMilestone.days,
    benefits: nextMilestone.benefits,
    scienceFact: scienceFacts[Math.floor(Math.random() * scienceFacts.length)],
  }
}
