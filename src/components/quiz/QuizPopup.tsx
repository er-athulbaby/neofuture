'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuizState {
  step: number
  ageGroup: string
  mainConcern: string
  path: 'pcos' | 'sleep_stress' | 'energy' | ''
  answers: Record<string, string | string[]>
  result: QuizResult | null
  leadName: string
  leadWhatsApp: string
  leadEmail: string
  submitted: boolean
  loading: boolean
}

interface QuizResult {
  path: string
  hormone_score: number
  stress_score: number
  energy_score: number
  recommended_product: string
  result_text: string
  quiz_session_id?: number
}

const AGE_OPTIONS = ['Under 18', '18–24', '25–34', '35–44', '45+']

const CONCERN_OPTIONS = [
  { value: 'pcos', label: 'Hormone & PCOS Health', icon: '🌸' },
  { value: 'sleep', label: 'Better Sleep', icon: '🌙' },
  { value: 'stress', label: 'Reduce Stress', icon: '🧘' },
  { value: 'energy', label: 'More Daily Energy', icon: '⚡' },
  { value: 'skin', label: 'Skin & Hair Health', icon: '✨' },
  { value: 'overall', label: 'Overall Women\'s Wellness', icon: '💚' },
  { value: 'exploring', label: 'Just Exploring', icon: '🔍' },
]

function getConcernPath(concern: string): 'pcos' | 'sleep_stress' | 'energy' {
  if (concern === 'pcos') return 'pcos'
  if (concern === 'sleep' || concern === 'stress') return 'sleep_stress'
  return 'energy'
}

// Score calculation helpers
function calcHormoneScore(answers: Record<string, string | string[]>): number {
  let score = 0
  const symptoms = answers['pcos_symptoms'] as string[] ?? []
  score += Math.min(symptoms.length * 8, 40)
  const cycle = answers['cycle_regularity'] as string
  if (cycle === 'Frequently irregular') score += 35
  else if (cycle === 'Sometimes irregular') score += 20
  else if (cycle === 'I am not sure') score += 15
  return Math.min(score, 100)
}

function calcStressScore(answers: Record<string, string | string[]>): number {
  let score = 0
  const stress = answers['stress_level'] as string
  const stressMap: Record<string, number> = { 'Low': 10, 'Moderate': 30, 'High': 55, 'Very High': 80 }
  score += stressMap[stress] ?? 0
  const sleep = answers['sleep_hours'] as string
  const sleepPenalty: Record<string, number> = { 'Less than 5': 20, '5–6': 10, '6–7': 5, '7–8': 0, 'More than 8': 0 }
  score += sleepPenalty[sleep] ?? 0
  const symptoms = answers['sleep_symptoms'] as string[] ?? []
  score += Math.min(symptoms.length * 5, 20)
  return Math.min(Math.round(score), 100)
}

function calcEnergyScore(answers: Record<string, string | string[]>): number {
  let score = 0
  const tired = answers['tiredness'] as string
  const tiredMap: Record<string, number> = { 'Rarely': 10, 'Sometimes': 30, 'Often': 60, 'Almost every day': 85 }
  score += tiredMap[tired] ?? 0
  return Math.min(score, 100)
}

export default function QuizPopup() {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<QuizState>({
    step: 1,
    ageGroup: '',
    mainConcern: '',
    path: '',
    answers: {},
    result: null,
    leadName: '',
    leadWhatsApp: '',
    leadEmail: '',
    submitted: false,
    loading: false,
  })

  useEffect(() => {
    const seen = sessionStorage.getItem('nf_quiz_seen')
    if (!seen) {
      const timer = setTimeout(() => {
        setOpen(true)
        sessionStorage.setItem('nf_quiz_seen', '1')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  function updateAnswer(key: string, value: string | string[]) {
    setState((s) => ({ ...s, answers: { ...s.answers, [key]: value } }))
  }

  function toggleMulti(key: string, value: string) {
    const current = (state.answers[key] as string[]) ?? []
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    updateAnswer(key, updated)
  }

  function next() {
    setState((s) => ({ ...s, step: s.step + 1 }))
  }

  function back() {
    setState((s) => ({ ...s, step: Math.max(1, s.step - 1) }))
  }

  async function finishQuiz() {
    const path = state.path

    const hormone_score = path === 'pcos' ? calcHormoneScore(state.answers) : 0
    const stress_score = path === 'sleep_stress' ? calcStressScore(state.answers) : 0
    const energy_score = path === 'energy' ? calcEnergyScore(state.answers) : 0

    let recommended_product = ''
    let result_text = ''

    if (path === 'pcos') {
      recommended_product = 'neobalance PCOS Support Sachet'
      result_text = 'Your responses indicate a focus on hormone balance and menstrual wellness.'
    } else if (path === 'sleep_stress') {
      recommended_product = 'neonidra Sleep & Calm Sachet'
      result_text = 'Your responses suggest stress and sleep may be affecting your wellness.'
    } else {
      recommended_product = 'neoprime Multivitamin Sachet'
      result_text = 'Your responses suggest a need for daily nutritional support and energy optimization.'
    }

    const result: QuizResult = {
      path,
      hormone_score,
      stress_score,
      energy_score,
      recommended_product,
      result_text,
    }

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, ...result, answers: state.answers }),
      })
      const data = await res.json()
      result.quiz_session_id = data.session_id
    } catch {}

    setState((s) => ({ ...s, result, step: 99 }))
  }

  async function submitLead() {
    if (!state.leadName || !state.leadWhatsApp) return
    setState((s) => ({ ...s, loading: true }))
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.leadName,
          whatsapp: state.leadWhatsApp,
          email: state.leadEmail,
          quiz_session_id: state.result?.quiz_session_id,
          recommended_product: state.result?.recommended_product,
          quiz_path: state.result?.path,
          hormone_score: state.result?.hormone_score,
          stress_score: state.result?.stress_score,
          energy_score: state.result?.energy_score,
        }),
      })
      setState((s) => ({ ...s, submitted: true, loading: false }))
    } catch {
      setState((s) => ({ ...s, loading: false }))
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-primary text-white rounded-full px-5 py-3 shadow-lg font-medium text-sm flex items-center gap-2 hover:bg-primary-dark transition-colors"
      >
        <Sparkles size={16} />
        Take Wellness Quiz
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 quiz-overlay bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6 rounded-t-2xl relative">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} />
            <span className="text-xs font-medium uppercase tracking-wide opacity-80">NeoFuture AI</span>
          </div>
          <h2 className="text-xl font-bold">Welcome to NeoFuture AI</h2>
          <p className="text-white/80 text-sm mt-1">
            Let's understand your wellness needs and create your personalized wellness plan.
          </p>

          {/* Progress */}
          {state.step <= 4 && (
            <div className="mt-4 flex gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={cn('h-1.5 flex-1 rounded-full transition-all', s <= state.step ? 'bg-white' : 'bg-white/30')}
                />
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Step 1: Age */}
          {state.step === 1 && (
            <div>
              <h3 className="font-semibold text-brand-dark text-lg mb-4">How old are you?</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {AGE_OPTIONS.map((age) => (
                  <button
                    key={age}
                    onClick={() => {
                      setState((s) => ({ ...s, ageGroup: age }))
                      next()
                    }}
                    className={cn(
                      'border-2 rounded-xl p-3 text-sm font-medium transition-all text-left',
                      state.ageGroup === age
                        ? 'border-primary bg-primary-light text-primary'
                        : 'border-gray-200 hover:border-primary hover:bg-primary-light text-brand-dark'
                    )}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Main concern */}
          {state.step === 2 && (
            <div>
              <h3 className="font-semibold text-brand-dark text-lg mb-1">What would you most like to improve right now?</h3>
              <p className="text-sm text-brand-gray mb-4">Select one</p>
              <div className="space-y-2.5">
                {CONCERN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      const path = getConcernPath(opt.value)
                      setState((s) => ({ ...s, mainConcern: opt.value, path }))
                      next()
                    }}
                    className="w-full flex items-center gap-3 border-2 border-gray-200 hover:border-primary hover:bg-primary-light rounded-xl p-3.5 text-left transition-all"
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-sm font-medium text-brand-dark">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Path-specific questions */}
          {state.step === 3 && state.path === 'pcos' && (
            <PCOSStep1 answers={state.answers} update={updateAnswer} toggle={toggleMulti} onNext={next} onBack={back} />
          )}
          {state.step === 3 && state.path === 'sleep_stress' && (
            <SleepStep1 answers={state.answers} update={updateAnswer} onNext={next} onBack={back} />
          )}
          {state.step === 3 && state.path === 'energy' && (
            <EnergyStep1 answers={state.answers} update={updateAnswer} onNext={next} onBack={back} />
          )}

          {/* Step 4 */}
          {state.step === 4 && state.path === 'pcos' && (
            <PCOSStep2 answers={state.answers} update={updateAnswer} onNext={finishQuiz} onBack={back} />
          )}
          {state.step === 4 && state.path === 'sleep_stress' && (
            <SleepStep2 answers={state.answers} update={updateAnswer} toggle={toggleMulti} onNext={finishQuiz} onBack={back} />
          )}
          {state.step === 4 && state.path === 'energy' && (
            <EnergyStep2 answers={state.answers} update={updateAnswer} toggle={toggleMulti} onNext={finishQuiz} onBack={back} />
          )}

          {/* Result + Lead capture */}
          {state.step === 99 && state.result && (
            <div>
              {/* AI Result */}
              <div className="bg-primary-light border border-primary/20 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-primary" />
                  <span className="font-semibold text-primary text-sm">AI Result</span>
                </div>
                <p className="text-brand-dark text-sm">{state.result.result_text}</p>
                <div className="mt-3 flex items-start gap-2">
                  <span className="text-green-600 text-lg">✅</span>
                  <span className="font-semibold text-brand-dark text-sm">{state.result.recommended_product}</span>
                </div>
                {state.result.hormone_score > 0 && (
                  <ScoreBar label="Hormone Score" score={state.result.hormone_score} color="primary" />
                )}
                {state.result.stress_score > 0 && (
                  <ScoreBar label="Stress Score" score={state.result.stress_score} color="neo-orange" />
                )}
                {state.result.energy_score > 0 && (
                  <ScoreBar label="Energy Score" score={state.result.energy_score} color="neo-purple" />
                )}
              </div>

              {/* Lead capture */}
              {!state.submitted ? (
                <div>
                  <h4 className="font-semibold text-brand-dark mb-1">Get Your Personalized Wellness Report</h4>
                  <p className="text-sm text-brand-gray mb-4">We'll send your full plan details on WhatsApp.</p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Your Name *"
                      value={state.leadName}
                      onChange={(e) => setState((s) => ({ ...s, leadName: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                    />
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-brand-gray">+91</span>
                      <input
                        type="tel"
                        placeholder="WhatsApp Number *"
                        value={state.leadWhatsApp}
                        onChange={(e) => setState((s) => ({ ...s, leadWhatsApp: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-12 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Email (Optional)"
                      value={state.leadEmail}
                      onChange={(e) => setState((s) => ({ ...s, leadEmail: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={submitLead}
                      disabled={!state.leadName || !state.leadWhatsApp || state.loading}
                      className="w-full bg-success text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      <Phone size={16} />
                      {state.loading ? 'Sending...' : 'Send My Wellness Plan on WhatsApp'}
                    </button>
                    <button onClick={() => setOpen(false)} className="w-full text-center text-sm text-brand-gray hover:text-brand-dark py-2">
                      Skip for now
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">🎉</div>
                  <h4 className="font-bold text-brand-dark text-lg mb-2">Thank you, {state.leadName}!</h4>
                  <p className="text-sm text-brand-gray mb-5">
                    We'll reach out on WhatsApp with your personalized wellness plan soon.
                  </p>
                  <button
                    onClick={() => setOpen(false)}
                    className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors"
                  >
                    Explore Products
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Path-specific step components ── */

function PCOSStep1({ answers, toggle, onNext, onBack }: PathStepProps) {
  const selected = (answers['pcos_symptoms'] as string[]) ?? []
  const options = ['Irregular periods', 'Weight gain', 'Acne', 'Hair fall', 'Mood swings', 'Difficulty managing PCOS', 'None of these']
  return (
    <PathStep
      title="Do you experience any of these?"
      subtitle="Multiple choice"
      onBack={onBack}
      onNext={onNext}
      canNext={selected.length > 0}
    >
      {options.map((opt) => (
        <MultiButton key={opt} label={opt} selected={selected.includes(opt)} onClick={() => toggle?.('pcos_symptoms', opt)} />
      ))}
    </PathStep>
  )
}

function PCOSStep2({ answers, update, onNext, onBack }: PathStepProps) {
  const options = ['Very regular', 'Sometimes irregular', 'Frequently irregular', 'I am not sure']
  return (
    <PathStep title="How regular is your menstrual cycle?" onBack={onBack} onNext={onNext} canNext={!!answers['cycle_regularity']}>
      {options.map((opt) => (
        <SingleButton key={opt} label={opt} selected={answers['cycle_regularity'] === opt} onClick={() => update('cycle_regularity', opt)} />
      ))}
    </PathStep>
  )
}

function SleepStep1({ answers, update, onNext, onBack }: PathStepProps) {
  const options = ['Low', 'Moderate', 'High', 'Very High']
  return (
    <PathStep title="How would you rate your stress levels?" onBack={onBack} onNext={onNext} canNext={!!answers['stress_level']}>
      {options.map((opt) => (
        <SingleButton key={opt} label={opt} selected={answers['stress_level'] === opt} onClick={() => update('stress_level', opt)} />
      ))}
    </PathStep>
  )
}

function SleepStep2({ answers, update, toggle, onNext, onBack }: PathStepProps) {
  const sleepOptions = ['Less than 5', '5–6', '6–7', '7–8', 'More than 8']
  const symptomOptions = ['Difficulty falling asleep', 'Frequent waking at night', 'Morning fatigue', 'Anxiety or overthinking', 'Work-related stress']
  const selected = (answers['sleep_symptoms'] as string[]) ?? []
  return (
    <PathStep title="Sleep & Symptoms" onBack={onBack} onNext={onNext} canNext={!!answers['sleep_hours'] && selected.length > 0}>
      <p className="text-sm font-medium text-brand-dark mb-2">How many hours do you usually sleep?</p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {sleepOptions.map((opt) => (
          <SingleButton key={opt} label={opt} selected={answers['sleep_hours'] === opt} onClick={() => update('sleep_hours', opt)} />
        ))}
      </div>
      <p className="text-sm font-medium text-brand-dark mb-2">Do you often experience: (Multiple choice)</p>
      {symptomOptions.map((opt) => (
        <MultiButton key={opt} label={opt} selected={selected.includes(opt)} onClick={() => toggle?.('sleep_symptoms', opt)} />
      ))}
    </PathStep>
  )
}

function EnergyStep1({ answers, update, onNext, onBack }: PathStepProps) {
  const options = ['Rarely', 'Sometimes', 'Often', 'Almost every day']
  return (
    <PathStep title="How often do you feel tired during the day?" onBack={onBack} onNext={onNext} canNext={!!answers['tiredness']}>
      {options.map((opt) => (
        <SingleButton key={opt} label={opt} selected={answers['tiredness'] === opt} onClick={() => update('tiredness', opt)} />
      ))}
    </PathStep>
  )
}

function EnergyStep2({ answers, toggle, onNext, onBack }: PathStepProps) {
  const options = ['More energy', 'Better immunity', 'Better skin', 'Hair health', 'Daily nutrition', 'Overall wellness']
  const selected = (answers['wellness_goals'] as string[]) ?? []
  return (
    <PathStep title="Which wellness goals matter most to you?" subtitle="Multiple choice" onBack={onBack} onNext={onNext} canNext={selected.length > 0}>
      {options.map((opt) => (
        <MultiButton key={opt} label={opt} selected={selected.includes(opt)} onClick={() => toggle?.('wellness_goals', opt)} />
      ))}
    </PathStep>
  )
}

/* ── Shared primitives ── */

interface PathStepProps {
  answers: Record<string, string | string[]>
  update: (key: string, value: string | string[]) => void
  toggle?: (key: string, value: string) => void
  onNext: () => Promise<void> | void
  onBack: () => void
}

function PathStep({ title, subtitle, onBack, onNext, canNext, children }: {
  title: string; subtitle?: string; onBack: () => void; onNext: () => void; canNext: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="font-semibold text-brand-dark text-lg mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-brand-gray mb-3">{subtitle}</p>}
      <div className="space-y-2 mb-6">{children}</div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-brand-gray hover:text-brand-dark">
          <ChevronLeft size={16} /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-1 hover:bg-primary-dark disabled:opacity-40 transition-all"
        >
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function SingleButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left border-2 rounded-xl px-4 py-3 text-sm font-medium transition-all',
        selected ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 hover:border-primary text-brand-dark'
      )}
    >
      {label}
    </button>
  )
}

function MultiButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left border-2 rounded-xl px-4 py-3 text-sm font-medium transition-all flex items-center gap-2',
        selected ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 hover:border-primary text-brand-dark'
      )}
    >
      <div className={cn('w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all',
        selected ? 'border-primary bg-primary' : 'border-gray-300')}>
        {selected && <span className="text-white text-xs">✓</span>}
      </div>
      {label}
    </button>
  )
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-brand-gray mb-1">
        <span>{label}</span>
        <span className="font-semibold">{score}/100</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-1000', `bg-${color}`)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
