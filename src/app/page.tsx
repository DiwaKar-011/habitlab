'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Beaker, BarChart3, Brain, AlertTriangle, Lightbulb, ArrowRight, Flame, Target, Users } from 'lucide-react'

const features = [
  {
    icon: Beaker,
    title: 'Experiment Tracking',
    description: 'Design habits as scientific experiments with hypotheses, variables, and controls.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Brain,
    title: 'Brain Science',
    description: 'Understand the cue-routine-reward loop and neuroplasticity behind habit formation.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: AlertTriangle,
    title: 'Failure Analysis',
    description: 'Detect patterns in missed habits and get personalized suggestions to improve.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Lightbulb,
    title: 'Smart Insights',
    description: 'AI-powered insights analyze your data to reveal what\'s working and what\'s not.',
    color: 'from-green-500 to-emerald-500',
  },
]

const steps = [
  { num: '01', title: 'Create Your Experiment', desc: 'Define a habit with a hypothesis and scientific variables.' },
  { num: '02', title: 'Log Daily', desc: 'Track completions, mood, energy, and failure reasons each day.' },
  { num: '03', title: 'Analyze & Improve', desc: 'Get insights, view analytics, and prove your hypothesis.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center">
              <Beaker size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800">HabitLab</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Beaker size={14} />
              Behavior Science Platform
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-tight">
              Turn Your Habits Into{' '}
              <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
                Science Experiments
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Track habits with scientific rigor. Set hypotheses, log variables, analyze failures,
              and prove what works — all powered by behavior science.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-brand-600 text-white px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/25"
              >
                Start Your First Experiment
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-slate-600 px-8 py-3.5 rounded-xl font-medium text-lg hover:bg-slate-50 transition-all"
              >
                Learn the Science
              </Link>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            {[
              { icon: Flame, value: '10K+', label: 'Streaks Built' },
              { icon: Target, value: '85%', label: 'Avg Consistency' },
              { icon: Users, value: '2K+', label: 'Student Scientists' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon size={20} className="mx-auto text-brand-500 mb-1" />
                <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Science-Backed Features</h2>
            <p className="mt-3 text-slate-500">Everything you need to build lasting habits with evidence.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">How It Works</h2>
            <p className="mt-3 text-slate-500">Three steps from habit to scientific proof.</p>
          </div>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="flex items-start gap-6"
              >
                <div className="flex-shrink-0 w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center">
                  <span className="text-brand-600 font-bold text-lg">{step.num}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">{step.title}</h3>
                  <p className="text-slate-500 mt-1">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-brand-600 to-accent-600">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to Prove Your First Hypothesis?
          </h2>
          <p className="mt-4 text-brand-100 text-lg">
            Join thousands of student scientists already building better habits.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 bg-white text-brand-700 px-8 py-3.5 rounded-xl font-semibold text-lg hover:bg-brand-50 transition-all shadow-lg"
          >
            Start Your First Experiment
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 text-sm text-center">
        <p>© 2026 HabitLab · Behavior Science Habit Lab · Built for Science Fair</p>
      </footer>
    </div>
  )
}
