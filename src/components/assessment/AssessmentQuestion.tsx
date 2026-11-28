import { useEffect, useRef, useState } from 'react'
import { AssessmentMedia, type MediaReadiness } from '@/components/assessment/AssessmentMedia'
import { AssessmentStatus } from '@/components/assessment/AssessmentStatus'
import { ChoiceQuestion } from '@/components/assessment/ChoiceQuestion'
import { ChcQuestion } from '@/components/assessment/chc/ChcQuestion'
import { PisaQuestion } from '@/components/assessment/pisa/PisaQuestion'
import { Button } from '@/components/ui/button'
import { choiceMedia } from '@/lib/assessment-media'
import type { OperationOutcome } from '@/hooks/useAssessmentSession'
import type { AssessmentOperationIntent, AssessmentQuestionDto } from '@/types/assessment'

interface Props { assessmentId: string; question: AssessmentQuestionDto; busy: boolean; locked: boolean; onSubmit: (id: string) => Promise<OperationOutcome>; onOperation: (intent: AssessmentOperationIntent) => Promise<OperationOutcome>; onCheck: () => void }
const same = (a?: string, b?: string) => !!a && !!b && a.replace(/\s+/g, ' ').trim() === b.replace(/\s+/g, ' ').trim()
export const AssessmentQuestion = ({ assessmentId, question, busy, locked, onSubmit, onOperation, onCheck }: Props) => {
  const heading = useRef<HTMLHeadingElement>(null)
  const interaction = question.interaction
  const group = interaction.kind === 'choice' ? question.presentation.options.find((item) => item.groupId === interaction.optionGroupId) : undefined
  const stimulus = group ? choiceMedia(question.presentation, group).stimulus : []
  const comparison = interaction.kind === 'choice' && interaction.responseFamily === 'picture_comparison'
  const pictures = comparison ? ['picture_a', 'picture_b'].map((id) => stimulus.filter((item) => item.mediaId.toLowerCase() === id && (item.mediaType === 'image' || item.mediaType === 'svg'))) : []
  const missingComparison = comparison && pictures.some((items) => items.length !== 1)
  const displayStimulus = comparison ? pictures.flatMap((items) => items.length === 1 ? items : []) : stimulus
  const meaningfulPrompt = !!question.questionText?.trim() || !!question.presentation.title?.trim()
  const requiredStimulus = stimulus.filter((item) => item.role === 'stimulus' || comparison || !meaningfulPrompt)
  const missingStimulus = missingComparison || interaction.kind === 'choice' && !meaningfulPrompt && stimulus.length === 0
  const [readiness, setReadiness] = useState<Record<string, MediaReadiness>>(() => Object.fromEntries(stimulus.map((item) => [item.mediaId, 'loading' as const])))
  useEffect(() => { if (interaction.kind === 'choice') heading.current?.focus({ preventScroll: true }) }, [assessmentId, question.attemptId, interaction.kind])
  const availability = (id: string, _ready: boolean, next: MediaReadiness) => setReadiness((old) => old[id] === next ? old : { ...old, [id]: next })
  const allRequiredReady = requiredStimulus.every((item) => readiness[item.mediaId] === 'ready')
  const requiredFailed = requiredStimulus.some((item) => readiness[item.mediaId] === 'failed')
  const stimulusBlocked = missingStimulus || !allRequiredReady
  if (question.recoveryRequired) {
    const simpleStatic = interaction.kind === 'performance' && interaction.protocol.taskMode === 'static_choice' && interaction.protocol.questionType === 'single_select' && interaction.protocol.unitId === null
    return <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-7"><p className="mb-3 text-sm text-slate-700">This activity was interrupted. Check its current state before continuing.</p>{!locked && <AssessmentStatus title="Response recovery needed" description="Check the current state before continuing." onCheck={onCheck} busy={busy} />}{!locked && interaction.kind === 'performance' && question.allowedOperations.includes('interrupt') && <Button type="button" className="mt-4" disabled={busy} onClick={() => void onOperation(simpleStatic ? { operation: 'interrupt', reason: 'Recover interrupted task' } : { operation: 'interrupt', reason: 'Recover interrupted task', observation: { event: 'interruption', ...(interaction.protocol.unitId ? { unitId: interaction.protocol.unitId } : {}) } })}>Resolve interrupted task</Button>}{!locked && interaction.kind === 'constructed_activity' && question.allowedOperations.includes('interrupt') && <Button type="button" className="mt-4" disabled={busy} onClick={() => void onOperation({ operation: 'interrupt', reason: 'Recover interrupted activity', observation: { technicalEvents: ['protected_recovery_required'] } })}>Resolve interrupted activity</Button>}</section>
  }
  const primary = question.questionText?.trim() || question.presentation.title?.trim() || 'Assessment question'
  const distinctHelper = question.helperText && ![primary, question.description, question.presentation.title, question.instructions].some((item) => same(question.helperText, item))
  const performance = interaction.kind === 'performance' && question.model === 'chc'
  return <section className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-7 ${interaction.kind === 'choice' ? 'animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none' : ''}`}>
    {question.description && !same(question.description, primary) && <p className="mb-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 sm:text-base [overflow-wrap:anywhere]">{question.description}</p>}
    <h1 ref={heading} tabIndex={-1} className="whitespace-pre-wrap break-words text-xl font-semibold leading-snug tracking-tight outline-none sm:text-2xl [overflow-wrap:anywhere]">{primary}</h1>
    {question.presentation.title && ![primary, question.description].some((item) => same(question.presentation.title, item)) && <p className="mt-3 text-sm font-medium text-slate-700">{question.presentation.title}</p>}
    {question.instructions && ![primary, question.description, question.presentation.title].some((item) => same(question.instructions, item)) && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 [overflow-wrap:anywhere]">{question.instructions}</p>}
    {distinctHelper && (interaction.kind === 'choice' ? <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><summary className="cursor-pointer text-sm font-medium text-teal-900">Need a little help?</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{question.helperText}</p></details> : <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{question.helperText}</p>)}
    {interaction.kind === 'choice' && displayStimulus.length > 0 && <div className={comparison ? 'mt-5 grid grid-cols-2 items-start gap-2 sm:gap-4' : 'mt-5 grid min-w-0 justify-items-center gap-3'}>{displayStimulus.map((item, index) => <figure key={`${item.mediaId}:${item.url}`} className={comparison ? 'min-w-0 rounded-xl border border-slate-200 bg-white p-2 sm:p-3' : 'min-w-0 w-full max-w-xl'}>{comparison && <figcaption className="mb-2 text-center text-xs font-semibold text-slate-600">Picture {index === 0 ? 'A' : 'B'}</figcaption>}<AssessmentMedia media={item} variant={comparison ? 'comparison' : 'activity'} alt={comparison ? `Picture ${index === 0 ? 'A' : 'B'}` : 'Question illustration'} onAvailability={availability} retryDisabled={busy || locked} /></figure>)}</div>}
    {interaction.kind === 'choice' && missingStimulus && <div role="alert" className="mt-3 flex flex-wrap items-center gap-2 text-sm text-destructive"><span>This question is missing a required picture. Check the current state before continuing.</span><Button type="button" variant="outline" disabled={busy} onClick={onCheck}>Check current state</Button></div>}
    {interaction.kind === 'choice' && !missingStimulus && requiredFailed && <p role="alert" className="mt-3 text-sm text-destructive">This picture could not be loaded yet. Retry the media before answering.</p>}
    {interaction.kind === 'choice' && !missingStimulus && !requiredFailed && !allRequiredReady && <p role="status" className="mt-3 text-sm text-slate-600">Loading picture…</p>}
    <div className="mt-5">{interaction.kind === 'choice' ? <ChoiceQuestion question={question} interaction={interaction} busy={busy} locked={locked} stimulusBlocked={stimulusBlocked} onSubmit={onSubmit} onCheck={onCheck} preceding={[primary, question.description, question.presentation.title, question.instructions, question.helperText]} /> : performance && interaction.kind === 'performance' ? <ChcQuestion key={`${question.currentStep}:${interaction.protocol.unitId ?? ''}`} question={question} step={interaction.protocol} busy={busy} locked={locked} onSubmit={onOperation} onCheck={onCheck} /> : interaction.kind === 'constructed_activity' ? <PisaQuestion question={question} interaction={interaction} busy={busy} locked={locked} onOperation={onOperation} onCheck={onCheck} /> : <AssessmentStatus title="This activity is not available" description="The issued response format is unavailable." onCheck={onCheck} busy={busy} />}</div>
  </section>
}
