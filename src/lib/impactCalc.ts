import { HabitCategory, ImpactMetric } from '@/types'

export const impactMap: Record<string, ImpactMetric> = {
  fitness: { metric: 'calories burned', perDay: 300, unit: 'kcal' },
  eco: { metric: 'plastic reduced', perDay: 0.05, unit: 'kg' },
  study: { metric: 'study hours gained', perDay: 1, unit: 'hours' },
  health: { metric: 'water saved', perDay: 10, unit: 'litres' },
  focus: { metric: 'focus hours gained', perDay: 0.5, unit: 'hours' },
  mindset: { metric: 'mindful minutes', perDay: 15, unit: 'minutes' },
}

export function calculateImpact(
  category: HabitCategory,
  completedDays: number
): { total: number; metric: string; unit: string } {
  const impact = impactMap[category]
  if (!impact) return { total: 0, metric: 'unknown', unit: '' }
  return {
    total: Math.round(impact.perDay * completedDays * 100) / 100,
    metric: impact.metric,
    unit: impact.unit,
  }
}

export function simulateGroupImpact(
  category: HabitCategory,
  completedDays: number,
  numStudents: number
): { total: number; metric: string; unit: string } {
  const single = calculateImpact(category, completedDays)
  return {
    ...single,
    total: Math.round(single.total * numStudents * 100) / 100,
  }
}
