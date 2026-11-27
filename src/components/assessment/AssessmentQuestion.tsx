import { useEffect, useRef, useState } from 'react'
import { AssessmentMedia } from '@/components/assessment/AssessmentMedia'
import { AssessmentStatus } from '@/components/assessment/AssessmentStatus'
import { ChoiceQuestion } from '@/components/assessment/ChoiceQuestion'
import { ChcQuestion } from '@/components/assessment/chc/ChcQuestion'
import { PisaQuestion } from '@/components/assessment/pisa/PisaQuestion'
import { Button } from '@/components/ui/button'
import { choiceMedia } from '@/lib/assessment-media'
import type { AssessmentOperationIntent, AssessmentQuestionDto } from '@/types/assessment'

interface Props { assessmentId: string; question: AssessmentQuestionDto; busy: boolean; locked: boolean; onSubmit: (id: string) => void; onOperation: (intent: AssessmentOperationIntent) => void; onCheck: () => void }
export const AssessmentQuestion = ({ assessmentId, question, busy, locked, onSubmit, onOperation, onCheck }: Props) => {
  const heading = useRef<HTMLHeadingElement>(null)
  const [failedMedia, setFailedMedia] = useState<string[]>(() => {
    if (question.interaction.kind !== 'choice' || question.interaction.responseFamily !== 'picture_comparison' && !!question.questionText) return []
    const groupId = question.interaction.optionGroupId
    const group = question.presentation.options.find((item) => item.groupId === groupId)
    return group ? choiceMedia(question.presentation, group).stimulus.map((item) => item.mediaId) : []
  })
  useEffect(() => { heading.current?.focus() }, [assessmentId, question.attemptId, question.currentStep])
  const availability = (id: string, ready: boolean) => setFailedMedia((old) => ready ? old.filter((item) => item !== id) : old.includes(id) ? old : [...old, id])
  if (question.recoveryRequired) return <section className="rounded-xl border bg-white p-6"><AssessmentStatus title="Response recovery needed" description="Check the current state or use the issued interruption operation." onCheck={onCheck} busy={busy} />{question.interaction.kind === 'performance' && question.allowedOperations.includes('interrupt') && <Button type="button" className="mt-4" disabled={busy || locked} onClick={() => onOperation({ operation: 'interrupt', reason: 'Recover interrupted task', observation: { event: 'interruption', ...(question.interaction.kind === 'performance' && question.interaction.protocol.unitId ? { unitId: question.interaction.protocol.unitId } : {}) } })}>Resolve interrupted task</Button>}{question.interaction.kind === 'constructed_activity' && question.allowedOperations.includes('interrupt') && <Button type="button" className="mt-4" disabled={busy || locked} onClick={() => onOperation({ operation: 'interrupt', reason: 'Recover interrupted activity', observation: { technicalEvents: ['protected_recovery_required'] } })}>Resolve interrupted activity</Button>}</section>
  const performance = question.interaction.kind === 'performance' && question.model === 'chc'
  const interaction = question.interaction
  const group = interaction.kind === 'choice' ? question.presentation.options.find((item) => item.groupId === interaction.optionGroupId) : undefined
  const stimulus = group ? choiceMedia(question.presentation, group).stimulus : []
  const comparison = question.interaction.kind === 'choice' && question.interaction.responseFamily === 'picture_comparison'
  const essential = comparison || !question.questionText
  const missingStimulus = comparison && stimulus.length < 2
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
    <h1 ref={heading} tabIndex={-1} className="whitespace-pre-wrap break-words text-xl font-semibold leading-snug tracking-tight outline-none sm:text-2xl">{question.questionText || question.presentation.title || 'Assessment question'}</h1>
    {question.presentation.title && question.questionText && question.presentation.title !== question.questionText && <p className="mt-2 text-sm font-medium text-slate-700">{question.presentation.title}</p>}
    {question.description && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{question.description}</p>}
    {question.instructions && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{question.instructions}</p>}
    {question.helperText && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">{question.helperText}</p>}
    {question.interaction.kind === 'choice' && stimulus.length > 0 && <div className={comparison ? 'mt-5 grid grid-cols-2 gap-3' : 'mt-5 flex flex-wrap gap-4'}>{stimulus.map((item, index) => <figure key={`${item.mediaId}:${item.url}`} className={comparison ? 'min-w-0 rounded-lg border border-slate-200 p-2' : ''}>{comparison && <figcaption className="mb-2 text-center text-xs font-semibold text-slate-600">{item.mediaId.toLowerCase().includes('picture_a') ? 'Picture A' : item.mediaId.toLowerCase().includes('picture_b') ? 'Picture B' : `Picture ${index === 0 ? 'A' : 'B'}`}</figcaption>}<AssessmentMedia media={item} variant={comparison ? 'comparison' : 'stimulus'} onAvailability={availability} /></figure>)}</div>}
    {essential && (failedMedia.length > 0 || missingStimulus) && <p role="alert" className="mt-3 text-xs text-destructive">The required picture or stimulus is unavailable. Retry the media or check the current state before answering.</p>}
    <div className="mt-6">{question.interaction.kind === 'choice' ? <ChoiceQuestion assessmentId={assessmentId} question={question} interaction={question.interaction} busy={busy} locked={locked || essential && (failedMedia.length > 0 || missingStimulus)} onSubmit={onSubmit} /> : performance && question.interaction.kind === 'performance' ? <ChcQuestion question={question} step={question.interaction.protocol} busy={busy} locked={locked} onSubmit={onOperation} onCheck={onCheck} /> : question.interaction.kind === 'constructed_activity' ? <PisaQuestion question={question} interaction={question.interaction} busy={busy} locked={locked} onOperation={onOperation} onCheck={onCheck} /> : <AssessmentStatus title="This activity is not available" description="The issued response format is unavailable." onCheck={onCheck} busy={busy} />}</div>
  </section>
}
