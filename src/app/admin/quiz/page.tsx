'use client'

import { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp, Info } from 'lucide-react'
import Link from 'next/link'

const QUIZ_PATHS = [
  {
    id: 'pcos',
    color: 'bg-primary-light border-primary/20',
    dot: 'bg-primary',
    label: 'PCOS / Hormone Path',
    product: 'Neo Balance (Pink)',
    trigger: 'User selects: "Irregular periods / PCOS symptoms" as main concern',
    questions: [
      {
        q: 'What PCOS symptoms do you experience?',
        options: ['Irregular periods', 'Weight gain', 'Acne / hair fall', 'Mood swings', 'All of the above'],
      },
      {
        q: 'How regular is your menstrual cycle?',
        options: ['Very irregular (30+ days variation)', 'Slightly irregular', 'Regular but painful', 'I skip periods'],
      },
    ],
  },
  {
    id: 'sleep',
    color: 'bg-purple-50 border-purple-200',
    dot: 'bg-neo-purple',
    label: 'Sleep / Stress Path',
    product: 'Neo Nidra (Purple)',
    trigger: 'User selects: "Stress / anxiety / poor sleep" as main concern',
    questions: [
      {
        q: 'How would you rate your stress level?',
        options: ['Mild — manageable', 'Moderate — affects my day', 'High — hard to cope', 'Very high — overwhelming'],
      },
      {
        q: 'How many hours of sleep do you get per night?',
        options: ['Less than 5 hrs', '5–6 hrs', '6–7 hrs', '7–8 hrs'],
      },
      {
        q: 'Which sleep issues do you face?',
        options: ['Trouble falling asleep', 'Wake up at night', 'Wake up tired', 'Racing thoughts at bedtime'],
      },
    ],
  },
  {
    id: 'energy',
    color: 'bg-orange-50 border-orange-200',
    dot: 'bg-neo-orange',
    label: 'Energy / Vitality Path',
    product: 'Neo Prime (Orange)',
    trigger: 'User selects: "Low energy / fatigue" as main concern',
    questions: [
      {
        q: 'How often do you feel tired or fatigued?',
        options: ['Rarely', 'Sometimes', 'Most days', 'Every day'],
      },
      {
        q: 'What are your main wellness goals?',
        options: ['More energy daily', 'Better immunity', 'Improve iron levels', 'Overall vitality'],
      },
    ],
  },
]

export default function AdminQuizPage() {
  const [open, setOpen] = useState<string | null>('pcos')

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-xl font-bold text-brand-dark mb-2 flex items-center gap-2">
        <HelpCircle size={20} className="text-primary" /> Quiz Configuration
      </h1>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex gap-3">
        <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Quiz is currently hardcoded</p>
          <p>The quiz logic lives in <code className="bg-blue-100 px-1 rounded">src/components/quiz/QuizPopup.tsx</code>. Below is a read-only view of the current quiz flow. To change questions, edit that file and redeploy.</p>
          <p className="mt-2">Need fully editable quiz from admin? Let the developer know to build the DB-driven quiz editor.</p>
        </div>
      </div>

      {/* Step 1 — shared */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <p className="text-xs font-semibold text-brand-gray uppercase mb-3">Step 1 — All Users (Age)</p>
        <p className="text-sm font-medium text-brand-dark mb-2">How old are you?</p>
        <div className="flex flex-wrap gap-2">
          {['Under 18', '18–24', '25–34', '35–44', '45+'].map((o) => (
            <span key={o} className="text-xs bg-gray-100 text-brand-gray px-3 py-1 rounded-lg">{o}</span>
          ))}
        </div>
      </div>

      {/* Step 2 — shared */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <p className="text-xs font-semibold text-brand-gray uppercase mb-3">Step 2 — All Users (Main Concern) — determines path</p>
        <p className="text-sm font-medium text-brand-dark mb-2">What is your main health concern?</p>
        <div className="space-y-2">
          {[
            { label: 'Irregular periods / PCOS symptoms', path: '→ PCOS path', color: 'text-primary' },
            { label: 'Stress / anxiety / poor sleep', path: '→ Sleep path', color: 'text-neo-purple' },
            { label: 'Low energy / fatigue', path: '→ Energy path', color: 'text-neo-orange' },
          ].map((o) => (
            <div key={o.label} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
              <span className="text-brand-dark">{o.label}</span>
              <span className={`font-semibold ${o.color}`}>{o.path}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3 paths */}
      <div className="space-y-4">
        {QUIZ_PATHS.map((path) => (
          <div key={path.id} className={`rounded-2xl border ${path.color} overflow-hidden`}>
            <button
              onClick={() => setOpen(open === path.id ? null : path.id)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${path.dot}`} />
                <div>
                  <p className="font-semibold text-brand-dark">{path.label}</p>
                  <p className="text-xs text-brand-gray">Recommends: <span className="font-medium">{path.product}</span></p>
                </div>
              </div>
              {open === path.id ? <ChevronUp size={18} className="text-brand-gray" /> : <ChevronDown size={18} className="text-brand-gray" />}
            </button>

            {open === path.id && (
              <div className="px-5 pb-5 border-t border-black/5 pt-4 space-y-4">
                <p className="text-xs bg-white/60 rounded-lg px-3 py-2 text-brand-gray">
                  <span className="font-semibold">Trigger:</span> {path.trigger}
                </p>
                {path.questions.map((q, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-brand-dark mb-2">Step {i + 3}: {q.q}</p>
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((o) => (
                        <span key={o} className="text-xs bg-white border border-black/10 text-brand-gray px-3 py-1 rounded-lg">{o}</span>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="bg-white/60 rounded-xl p-3 text-xs text-brand-gray">
                  <span className="font-semibold">Result:</span> Score calculated → Product card shown → Lead capture (Name + WhatsApp + Email)
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
