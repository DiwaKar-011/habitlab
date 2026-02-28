'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Brain, Repeat, Zap, Clock, Beaker } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-20 space-y-16">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900">The Science Behind HabitLab</h1>
          <p className="text-lg text-slate-500 mt-3">
            Understanding how behavior change works in your brain
          </p>
        </div>

        {/* Cue-Routine-Reward */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Repeat size={20} className="text-purple-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">The Habit Loop</h2>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Every habit follows a three-step loop discovered by researchers at MIT:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { step: 'Cue', desc: 'A trigger that tells your brain to start the behavior. It could be a time (7 AM), location (gym), or emotion (stress).', color: 'bg-blue-50 border-blue-200 text-blue-800', emoji: '🔔' },
              { step: 'Routine', desc: 'The behavior itself — the habit you actually perform. This is what you\'re tracking in HabitLab.', color: 'bg-green-50 border-green-200 text-green-800', emoji: '🔄' },
              { step: 'Reward', desc: 'The positive outcome your brain gets. Dopamine is released, reinforcing the neural pathway for next time.', color: 'bg-amber-50 border-amber-200 text-amber-800', emoji: '🎁' },
            ].map((item, i) => (
              <div key={i} className={`rounded-xl border p-5 ${item.color}`}>
                <span className="text-3xl">{item.emoji}</span>
                <h3 className="font-bold text-lg mt-2">{item.step}</h3>
                <p className="text-sm mt-1 opacity-90">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Neuroplasticity */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
              <Brain size={20} className="text-pink-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Neuroplasticity</h2>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Your brain physically changes when you repeat behaviors. Neurons that fire together wire together (Hebb&apos;s Law).
            Each time you complete a habit, the neural pathway gets stronger — like a path through a forest that becomes clearer
            with every walk.
          </p>
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <p className="text-sm text-slate-500 italic">
              &ldquo;The brain is not a static organ. It rewires itself based on your behaviors, and this
              rewiring is the foundation of habit formation.&rdquo;
            </p>
            <p className="text-xs text-slate-400 mt-2">— Dr. Norman Doidge, The Brain That Changes Itself</p>
          </div>
        </motion.section>

        {/* Dopamine */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">How Dopamine Reinforces Habits</h2>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Dopamine isn&apos;t just the &ldquo;pleasure chemical&rdquo; — it&apos;s your brain&apos;s prediction and reward system.
            When you complete a habit, your brain releases dopamine, which signals: &ldquo;That was good. Do it again.&rdquo;
          </p>
          <p className="text-slate-600 leading-relaxed">
            Over time, dopamine starts firing in anticipation of the habit (during the Cue phase),
            which creates craving — the engine that makes habits automatic. This is why streaks feel so
            powerful and why HabitLab tracks your Dopamine Meter.
          </p>
        </motion.section>

        {/* 21 Days */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Why 21 Days? (And Why It&apos;s More Complex)</h2>
          </div>
          <p className="text-slate-600 leading-relaxed">
            The &ldquo;21-day rule&rdquo; comes from Dr. Maxwell Maltz&apos;s 1960 observation that patients took about 21 days
            to adjust to changes. However, research from University College London (2009) found that it actually takes
            18 to 254 days, with an average of 66 days.
          </p>
          <p className="text-slate-600 leading-relaxed">
            The key insight: it&apos;s not about a magic number. It&apos;s about consistency. Every completed day
            strengthens the neural pathway. HabitLab uses 21 days as a minimum experiment period because
            it provides enough data for meaningful insights while being achievable for most habits.
          </p>
        </motion.section>

        {/* Platform Science */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <Beaker size={20} className="text-brand-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">The Science Behind This Platform</h2>
          </div>
          <p className="text-slate-600 leading-relaxed">
            HabitLab applies multiple evidence-based principles:
          </p>
          <ul className="space-y-3 text-slate-600">
            {[
              'Scientific Method: Frame habits as experiments with hypotheses and variables to leverage the curiosity-driven learning system.',
              'Streak Psychology: Visual progress tracking triggers loss aversion — you don\'t want to break a streak.',
              'Failure Pattern Analysis: Understanding why you fail (not just that you failed) allows targeted intervention.',
              'Social Accountability: Leaderboards and challenges leverage social pressure for motivation.',
              'Gamification: XP, badges, and levels tap into the brain\'s reward system to make habit tracking intrinsically motivating.',
              'Impact Visualization: Connecting daily actions to real-world outcomes creates meaning and purpose.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-brand-500 font-bold mt-0.5">•</span>
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        <div className="text-center pt-8">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/25"
          >
            Start Your First Experiment
          </Link>
        </div>
      </div>
    </div>
  )
}
