'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles, Phone, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Path = 'pcos' | 'sleep_stress' | 'energy'

interface AccumulatedScores {
  hormone_score: number
  stress_score: number
  energy_score: number
}

interface QuizState {
  step: number
  ageGroup: string
  mainConcern: string
  path: Path | ''
  answers: Record<string, string | string[]>
  completedPaths: Path[]
  accumulatedScores: AccumulatedScores
  leadName: string
  leadWhatsApp: string
  leadEmail: string
  submitted: boolean
  loading: boolean
}

const ALL_PATHS: Path[] = ['pcos', 'sleep_stress', 'energy']

const PATH_LABELS: Record<Path, { label: string; metric: string; icon: string }> = {
  pcos: { label: 'Hormone & PCOS', metric: 'Hormone Balance', icon: '🌸' },
  sleep_stress: { label: 'Stress & Sleep', metric: 'Stress Level', icon: '🧘' },
  energy: { label: 'Energy & Vitality', metric: 'Energy Score', icon: '⚡' },
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

function getConcernPath(concern: string): Path {
  if (concern === 'pcos') return 'pcos'
  if (concern === 'sleep' || concern === 'stress') return 'sleep_stress'
  return 'energy'
}

function getNextPath(completed: Path[]): Path | null {
  return ALL_PATHS.find((p) => !completed.includes(p)) ?? null
}

function calcHormoneScore(answers: Record<string, string | string[]>): number {
  let score = 0
  const symptoms = (answers['pcos_symptoms'] as string[]) ?? []
  score += Math.min(symptoms.length * 8, 40)
  const cycle = answers['cycle_regularity'] as string
  if (cycle === 'Frequently irregular') score += 35
  else if (cycle === 'Sometimes irregular') score += 20
  else if (cycle === 'I am not sure') score += 15
  return Math.min(score, 100)
}

function calcStressScore(answers: Record<string, string | string[]>): number {
  let score = 0
  const stressMap: Record<string, number> = { Low: 10, Moderate: 30, High: 55, 'Very High': 80 }
  score += stressMap[answers['stress_level'] as string] ?? 0
  const sleepPenalty: Record<string, number> = { 'Less than 5': 20, '5–6': 10, '6–7': 5, '7–8': 0, 'More than 8': 0 }
  score += sleepPenalty[answers['sleep_hours'] as string] ?? 0
  const symptoms = (answers['sleep_symptoms'] as string[]) ?? []
  score += Math.min(symptoms.length * 5, 20)
  return Math.min(Math.round(score), 100)
}

function calcEnergyScore(answers: Record<string, string | string[]>): number {
  const tiredMap: Record<string, number> = { Rarely: 10, Sometimes: 30, Often: 60, 'Almost every day': 85 }
  return Math.min(tiredMap[answers['tiredness'] as string] ?? 0, 100)
}

const INIT: QuizState = {
  step: 1, ageGroup: '', mainConcern: '', path: '',
  answers: {}, completedPaths: [],
  accumulatedScores: { hormone_score: 0, stress_score: 0, energy_score: 0 },
  leadName: '', leadWhatsApp: '', leadEmail: '', submitted: false, loading: false,
}

export default function QuizPopup({
  forceOpen, onClose,
}: { forceOpen?: boolean; onClose?: () => void } = {}) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<QuizState>(INIT)

  useEffect(() => {
    if (forceOpen) {
      setOpen(true)
      sessionStorage.setItem('nf_quiz_seen', '1')
    }
  }, [forceOpen])

  useEffect(() => {
    if (forceOpen) return
    const seen = sessionStorage.getItem('nf_quiz_seen')
    if (!seen) {
      const t = setTimeout(() => { setOpen(true); sessionStorage.setItem('nf_quiz_seen', '1') }, 3000)
      return () => clearTimeout(t)
    }
  }, [forceOpen])

  function handleClose() { setOpen(false); onClose?.() }

  function set(patch: Partial<QuizState>) { setState((s) => ({ ...s, ...patch })) }
  function updateAnswer(key: string, value: string | string[]) {
    setState((s) => ({ ...s, answers: { ...s.answers, [key]: value } }))
  }
  function toggleMulti(key: string, value: string) {
    const cur = (state.answers[key] as string[]) ?? []
    updateAnswer(key, cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value])
  }
  function next() { setState((s) => ({ ...s, step: s.step + 1 })) }
  function back() { setState((s) => ({ ...s, step: Math.max(1, s.step - 1) })) }

  function finishPath() {
    const path = state.path as Path
    const newScores = { ...state.accumulatedScores }
    if (path === 'pcos') newScores.hormone_score = calcHormoneScore(state.answers)
    if (path === 'sleep_stress') newScores.stress_score = calcStressScore(state.answers)
    if (path === 'energy') newScores.energy_score = calcEnergyScore(state.answers)

    const completedPaths = [...state.completedPaths, path]
    setState((s) => ({ ...s, accumulatedScores: newScores, completedPaths, step: 99 }))
  }

  function continueNextPath() {
    const nextPath = getNextPath(state.completedPaths)
    if (!nextPath) { goToLeadCapture(); return }
    setState((s) => ({ ...s, path: nextPath, step: 3 }))
  }

  function goToLeadCapture() {
    saveToAPI()
    setState((s) => ({ ...s, step: 100 }))
  }

  async function saveToAPI() {
    try {
      await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ageGroup: state.ageGroup,
          mainConcern: state.mainConcern,
          path: state.completedPaths[0] ?? state.path,
          answers: state.answers,
          ...state.accumulatedScores,
          recommended_product:
            state.accumulatedScores.hormone_score > 0 ? 'neobalance PCOS Support Sachet' :
            state.accumulatedScores.stress_score > 0 ? 'neonidra Sleep & Calm Sachet' :
            'neoprime Multivitamin Sachet',
          result_text: 'Your personalized wellness profile is ready.',
        }),
      })
    } catch {}
  }

  async function submitLead() {
    if (!state.leadName || !state.leadWhatsApp) return
    set({ loading: true })
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.leadName,
          whatsapp: state.leadWhatsApp,
          email: state.leadEmail,
          ...state.accumulatedScores,
        }),
      })
      set({ submitted: true, loading: false })
    } catch { set({ loading: false }) }
  }

  const nextPath = getNextPath(state.completedPaths)
  const allDone = state.completedPaths.length === 3

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-40 bg-primary text-white rounded-full px-5 py-3 shadow-lg font-medium text-sm flex items-center gap-2 hover:bg-primary-dark transition-colors">
        <Sparkles size={16} /> AI Wellness Check-in
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 quiz-overlay bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6 rounded-t-2xl relative">
          <button onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30">
            <X size={16} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} />
            <span className="text-xs font-medium uppercase tracking-wide opacity-80">NeoFuture AI</span>
          </div>
          <h2 className="text-xl font-bold">AI Wellness Check-in</h2>
          <p className="text-white/80 text-sm mt-1">
            {state.step <= 4 ? 'Understand your wellness needs' :
             state.step === 99 ? (allDone ? 'Full profile complete!' : 'Continue for your complete profile') :
             'Get your personalized wellness report'}
          </p>

          {/* Path progress pills */}
          {(state.step === 3 || state.step === 4 || state.step === 99 || state.step === 100) && (
            <div className="flex gap-2 mt-3">
              {ALL_PATHS.map((p) => (
                <div key={p}
                  className={cn('flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-all',
                    state.completedPaths.includes(p)
                      ? 'bg-white text-primary'
                      : state.path === p
                        ? 'bg-white/30 text-white border border-white/50'
                        : 'bg-white/10 text-white/50')}>
                  {state.completedPaths.includes(p) && <CheckCircle2 size={10} />}
                  {PATH_LABELS[p].icon} {PATH_LABELS[p].metric}
                </div>
              ))}
            </div>
          )}

          {/* Step progress bar */}
          {state.step <= 4 && (
            <div className="mt-4 flex gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className={cn('h-1.5 flex-1 rounded-full transition-all', s <= state.step ? 'bg-white' : 'bg-white/30')} />
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
                  <button key={age} onClick={() => { set({ ageGroup: age }); next() }}
                    className={cn('border-2 rounded-xl p-3 text-sm font-medium transition-all text-left',
                      state.ageGroup === age ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 hover:border-primary text-brand-dark')}>
                    {age}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Main concern */}
          {state.step === 2 && (
            <div>
              <h3 className="font-semibold text-brand-dark text-lg mb-1">What would you most like to improve?</h3>
              <p className="text-sm text-brand-gray mb-4">Select one to start</p>
              <div className="space-y-2.5">
                {CONCERN_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => { const p = getConcernPath(opt.value); set({ mainConcern: opt.value, path: p }); next() }}
                    className="w-full flex items-center gap-3 border-2 border-gray-200 hover:border-primary hover:bg-primary-light rounded-xl p-3.5 text-left transition-all">
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-sm font-medium text-brand-dark">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {state.step === 3 && state.path === 'pcos' && <PCOSStep1 answers={state.answers} update={updateAnswer} toggle={toggleMulti} onNext={next} onBack={back} />}
          {state.step === 3 && state.path === 'sleep_stress' && <SleepStep1 answers={state.answers} update={updateAnswer} onNext={next} onBack={back} />}
          {state.step === 3 && state.path === 'energy' && <EnergyStep1 answers={state.answers} update={updateAnswer} onNext={next} onBack={back} />}

          {/* Step 4 */}
          {state.step === 4 && state.path === 'pcos' && <PCOSStep2 answers={state.answers} update={updateAnswer} onNext={finishPath} onBack={back} />}
          {state.step === 4 && state.path === 'sleep_stress' && <SleepStep2 answers={state.answers} update={updateAnswer} toggle={toggleMulti} onNext={finishPath} onBack={back} />}
          {state.step === 4 && state.path === 'energy' && <EnergyStep2 answers={state.answers} toggle={toggleMulti} onNext={finishPath} onBack={back} />}

          {/* Step 99: After each path — show results + continue/skip */}
          {state.step === 99 && (
            <div>
              {/* Current scores summary */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {state.accumulatedScores.hormone_score > 0 && (
                  <MiniScoreCard label="Hormone Balance" score={state.accumulatedScores.hormone_score} icon="🌸" />
                )}
                {state.accumulatedScores.stress_score > 0 && (
                  <MiniScoreCard label="Stress Level" score={state.accumulatedScores.stress_score} icon="🧘" isStress />
                )}
                {state.accumulatedScores.energy_score > 0 && (
                  <MiniScoreCard label="Energy Score" score={state.accumulatedScores.energy_score} icon="⚡" />
                )}
                {/* Locked scores (not yet done) */}
                {ALL_PATHS.filter(p => !state.completedPaths.includes(p)).map((p) => (
                  <div key={p} className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center opacity-60">
                    <p className="text-lg mb-0.5">{PATH_LABELS[p].icon}</p>
                    <p className="text-xs text-brand-gray font-medium">{PATH_LABELS[p].metric}</p>
                    <p className="text-xs text-brand-gray mt-1">🔒 Not assessed yet</p>
                  </div>
                ))}
              </div>

              {allDone ? (
                /* All paths done → go to lead capture */
                <div>
                  <div className="bg-primary-light rounded-xl p-4 text-center mb-4">
                    <CheckCircle2 size={28} className="mx-auto text-primary mb-2" />
                    <p className="font-bold text-brand-dark">Full wellness profile complete!</p>
                    <p className="text-sm text-brand-gray mt-1">You've assessed all 3 wellness areas.</p>
                  </div>
                  <button onClick={goToLeadCapture}
                    className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors">
                    Get My Complete Wellness Report →
                  </button>
                </div>
              ) : (
                /* More paths available */
                <div className="space-y-3">
                  <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
                    <p className="text-sm font-semibold text-primary mb-1">
                      Next: {nextPath ? PATH_LABELS[nextPath].metric : ''}
                    </p>
                    <p className="text-sm text-brand-gray">
                      Continue to assess your {nextPath ? PATH_LABELS[nextPath].label : ''} for a complete wellness overview.
                    </p>
                  </div>
                  <button onClick={continueNextPath}
                    className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
                    <Sparkles size={15} /> Continue for Complete Overview
                  </button>
                  <button onClick={goToLeadCapture}
                    className="w-full border border-gray-200 text-brand-gray py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                    Skip — Get partial report now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 100: Lead capture */}
          {state.step === 100 && (
            <div>
              {!state.submitted ? (
                <>
                  <h4 className="font-semibold text-brand-dark mb-1">Get Your Personalized Wellness Report</h4>
                  <p className="text-sm text-brand-gray mb-4">We'll send your full wellness plan on WhatsApp.</p>
                  <div className="space-y-3">
                    <input type="text" placeholder="Your Name *" value={state.leadName}
                      onChange={(e) => set({ leadName: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-brand-gray">+91</span>
                      <input type="tel" placeholder="WhatsApp Number *" value={state.leadWhatsApp}
                        onChange={(e) => set({ leadWhatsApp: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 pl-12 text-sm focus:outline-none focus:border-primary" />
                    </div>
                    <input type="email" placeholder="Email (Optional)" value={state.leadEmail}
                      onChange={(e) => set({ leadEmail: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary" />
                    <button onClick={submitLead}
                      disabled={!state.leadName || !state.leadWhatsApp || state.loading}
                      className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-600 disabled:opacity-50 transition-colors">
                      <Phone size={16} />
                      {state.loading ? 'Sending...' : 'Send My Wellness Plan on WhatsApp'}
                    </button>
                    <button onClick={handleClose} className="w-full text-center text-sm text-brand-gray hover:text-brand-dark py-2">
                      Skip for now
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">🎉</div>
                  <h4 className="font-bold text-brand-dark text-lg mb-2">Thank you, {state.leadName}!</h4>
                  <p className="text-sm text-brand-gray mb-5">We'll send your personalized wellness plan on WhatsApp soon.</p>
                  <button onClick={handleClose}
                    className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors">
                    View My Dashboard
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

/* ── Mini score card for step 99 ── */
function MiniScoreCard({ label, score, icon, isStress = false }: { label: string; score: number; icon: string; isStress?: boolean }) {
  const getColor = (s: number, stress: boolean) => {
    if (stress) return s <= 30 ? 'text-green-600' : s <= 55 ? 'text-neo-orange' : 'text-red-500'
    return s >= 75 ? 'text-green-600' : s >= 50 ? 'text-neo-orange' : 'text-red-500'
  }
  const getText = (s: number, stress: boolean) => {
    if (stress) return s <= 30 ? 'Low' : s <= 55 ? 'Moderate' : 'High'
    return s >= 75 ? 'Good' : s >= 50 ? 'Average' : 'Low'
  }
  const color = getColor(score, isStress)
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
      <p className="text-lg mb-0.5">{icon}</p>
      <p className="text-xs text-brand-gray font-medium">{label}</p>
      {isStress ? (
        <p className={`text-base font-bold ${color} mt-1`}>{getText(score, true)}</p>
      ) : (
        <>
          <p className={`text-2xl font-bold ${color}`}>{score}</p>
          <p className={`text-xs ${color} font-semibold`}>{getText(score, false)}</p>
        </>
      )}
    </div>
  )
}

/* ── Path step components (unchanged logic) ── */
interface PathStepProps {
  answers: Record<string, string | string[]>
  update?: (key: string, value: string | string[]) => void
  toggle?: (key: string, value: string) => void
  onNext: () => void
  onBack: () => void
}

function PCOSStep1({ answers, toggle, onNext, onBack }: PathStepProps) {
  const selected = (answers['pcos_symptoms'] as string[]) ?? []
  const options = ['Irregular periods', 'Weight gain', 'Acne', 'Hair fall', 'Mood swings', 'Difficulty managing PCOS', 'None of these']
  return (
    <PathStep title="Do you experience any of these?" subtitle="Multiple choice" onBack={onBack} onNext={onNext} canNext={selected.length > 0}>
      {options.map((opt) => <MultiButton key={opt} label={opt} selected={selected.includes(opt)} onClick={() => toggle?.('pcos_symptoms', opt)} />)}
    </PathStep>
  )
}

function PCOSStep2({ answers, update, onNext, onBack }: PathStepProps) {
  const options = ['Very regular', 'Sometimes irregular', 'Frequently irregular', 'I am not sure']
  return (
    <PathStep title="How regular is your menstrual cycle?" onBack={onBack} onNext={onNext} canNext={!!answers['cycle_regularity']}>
      {options.map((opt) => <SingleButton key={opt} label={opt} selected={answers['cycle_regularity'] === opt} onClick={() => update?.('cycle_regularity', opt)} />)}
    </PathStep>
  )
}

function SleepStep1({ answers, update, onNext, onBack }: PathStepProps) {
  const options = ['Low', 'Moderate', 'High', 'Very High']
  return (
    <PathStep title="How would you rate your stress levels?" onBack={onBack} onNext={onNext} canNext={!!answers['stress_level']}>
      {options.map((opt) => <SingleButton key={opt} label={opt} selected={answers['stress_level'] === opt} onClick={() => update?.('stress_level', opt)} />)}
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
        {sleepOptions.map((opt) => <SingleButton key={opt} label={opt} selected={answers['sleep_hours'] === opt} onClick={() => update?.('sleep_hours', opt)} />)}
      </div>
      <p className="text-sm font-medium text-brand-dark mb-2">Do you often experience: (Multiple choice)</p>
      {symptomOptions.map((opt) => <MultiButton key={opt} label={opt} selected={selected.includes(opt)} onClick={() => toggle?.('sleep_symptoms', opt)} />)}
    </PathStep>
  )
}

function EnergyStep1({ answers, update, onNext, onBack }: PathStepProps) {
  const options = ['Rarely', 'Sometimes', 'Often', 'Almost every day']
  return (
    <PathStep title="How often do you feel tired during the day?" onBack={onBack} onNext={onNext} canNext={!!answers['tiredness']}>
      {options.map((opt) => <SingleButton key={opt} label={opt} selected={answers['tiredness'] === opt} onClick={() => update?.('tiredness', opt)} />)}
    </PathStep>
  )
}

function EnergyStep2({ answers, toggle, onNext, onBack }: PathStepProps) {
  const options = ['More energy', 'Better immunity', 'Better skin', 'Hair health', 'Daily nutrition', 'Overall wellness']
  const selected = (answers['wellness_goals'] as string[]) ?? []
  return (
    <PathStep title="Which wellness goals matter most to you?" subtitle="Multiple choice" onBack={onBack} onNext={onNext} canNext={selected.length > 0}>
      {options.map((opt) => <MultiButton key={opt} label={opt} selected={selected.includes(opt)} onClick={() => toggle?.('wellness_goals', opt)} />)}
    </PathStep>
  )
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
        <button onClick={onNext} disabled={!canNext}
          className="flex-1 bg-primary text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-1 hover:bg-primary-dark disabled:opacity-40 transition-all">
          Continue <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function SingleButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn('w-full text-left border-2 rounded-xl px-4 py-3 text-sm font-medium transition-all',
        selected ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 hover:border-primary text-brand-dark')}>
      {label}
    </button>
  )
}

function MultiButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn('w-full text-left border-2 rounded-xl px-4 py-3 text-sm font-medium transition-all flex items-center gap-2',
        selected ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 hover:border-primary text-brand-dark')}>
      <div className={cn('w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all',
        selected ? 'border-primary bg-primary' : 'border-gray-300')}>
        {selected && <span className="text-white text-xs">✓</span>}
      </div>
      {label}
    </button>
  )
}
