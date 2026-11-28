import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChcAudio } from '@/components/assessment/chc/ChcAudio'
import { ChcResponseControls, type ChcInputResponse } from '@/components/assessment/chc/ChcResponseControls'
import { ChcStimulus } from '@/components/assessment/chc/ChcStimulus'
import { chcStimulusMedia } from '@/components/assessment/chc/chc-media'
import { choiceMedia } from '@/lib/assessment-media'
import { useChcStepTiming } from '@/hooks/useChcStepTiming'
import type { OperationOutcome } from '@/hooks/useAssessmentSession'
import type { AssessmentOperationIntent, AssessmentPerformanceStepDto, AssessmentQuestionDto, ChcUnitItemResponse } from '@/types/assessment'

interface Props { question: AssessmentQuestionDto; step: AssessmentPerformanceStepDto; busy: boolean; locked: boolean; onSubmit: (intent: AssessmentOperationIntent) => Promise<OperationOutcome>; onCheck: () => void }

export const ChcQuestion = ({ question, step, busy, locked, onSubmit, onCheck }: Props) => {
  const group = step.stimulus?.optionGroup ?? question.presentation.options.find((item) => item.groupId === step.optionGroupId)
  const simpleStatic = step.taskMode === 'static_choice' && step.questionType === 'single_select' && step.unitId === null
  const showOptions = step.event === 'response' || step.event === 'practice' || step.taskMode === 'static_choice' && step.event === 'presentation'
  const optionAssets = showOptions && group ? choiceMedia({ ...question.presentation, options: [group] }, group).options.flatMap(({ choice, media }) => media.filter((item) => item.mediaType !== 'audio' && (item.role === 'option_image' || item.role === 'option' || !choice.text && !choice.value && !choice.pair?.length && !choice.values?.length))) : []
  const visibleAssets = [...chcStimulusMedia(step, question.presentation.media), ...optionAssets]
  const [pendingMedia, setPendingMedia] = useState<string[]>(() => [...new Set(visibleAssets.map((item) => item.mediaId))])
  const [failedMedia, setFailedMedia] = useState<string[]>([])
  const [mediaAttempt, setMediaAttempt] = useState(0)
  const [notice, setNotice] = useState('')
  const [obscured, setObscured] = useState(false)
  const [saving, setSaving] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [presentationAttempted, setPresentationAttempted] = useState(false)
  const sending = useRef(false)
  const autoPresentationAttempted = useRef(false)
  const mediaReady = pendingMedia.length === 0
  const mediaAvailability = (id: string, ready: boolean) => {
    setPendingMedia((previous) => ready ? previous.filter((item) => item !== id) : previous.includes(id) ? previous : [...previous, id])
    setFailedMedia((previous) => ready ? previous.filter((item) => item !== id) : previous.includes(id) ? previous : [...previous, id])
  }
  const sequential = step.event === 'study' && (step.exposureGap === true || step.stimulus?.currentEvent !== undefined || step.timing.perTokenExposureMs !== null && (step.stimulus?.tokens?.length || step.stimulus?.numberTokens?.length || step.stimulus?.highlightOrder?.length))
  const missingExposure = sequential && !step.exposureGap && !!step.stimulus?.highlightOrder?.length && (!step.stimulus.gridRows || !step.stimulus.gridColumns)
  const stimulus = step.stimulus
  const hasStudyMaterial = !!(step.exposureGap || stimulus?.tokens?.length || stimulus?.numberTokens?.length || stimulus?.currentEvent || stimulus?.current || stimulus?.studyText || stimulus?.studyPairs?.length || stimulus?.studyFacts?.length || stimulus?.text && !['sequence_memory', 'visual_memory'].includes(step.taskMode) || chcStimulusMedia(step, question.presentation.media).length)
  const hasCueMaterial = !!stimulus?.cue
  const hasInterferenceMaterial = !!(stimulus?.text || stimulus?.cue || stimulus?.currentEvent || stimulus?.current || stimulus?.tokens?.length || stimulus?.numberTokens?.length || chcStimulusMedia(step, question.presentation.media).length)
  const missingMaterial = step.event === 'study' && !hasStudyMaterial || step.event === 'cue' && !hasCueMaterial || step.event === 'interference' && !hasInterferenceMaterial
  const unsupportedInterference = step.event === 'interference' && (step.responseKind !== null || !!stimulus?.optionGroup)
  const duration = step.event === 'response' ? step.timing.responseWindowMs
    : step.event === 'study' ? sequential ? step.exposureGap ? step.timing.interTokenGapMs : step.timing.perTokenExposureMs : step.timing.studyExposureMs
      : step.event === 'retention' ? step.timing.retentionDelayMs
        : step.event === 'cue' ? step.timing.ruleCueExposureMs
          : step.event === 'interference' ? step.timing.interferenceDurationMs
            : step.event === 'hide' ? step.timing.interUnitGapMs : null
  const missingSequentialTiming = step.event === 'study' && duration === null && (step.exposureGap === true || !!step.stimulus?.currentEvent)
  const protectedStep = duration !== null && ['study', 'retention', 'cue', 'interference', 'response'].includes(step.event) || step.event === 'playback'
  const send = async (intent: AssessmentOperationIntent): Promise<OperationOutcome> => {
    if (sending.current || busy || locked || !question.allowedOperations.includes(intent.operation)) return 'not_sent'
    sending.current = true
    setSaving(true)
    try {
      const outcome = await onSubmit(intent)
      if (outcome === 'rejected') setNotice('This step was not accepted. Check the issued activity or use its recovery action.')
      return outcome
    } finally {
      sending.current = false
      setSaving(false)
    }
  }
  const { elapsedMs, remainingMs, stop } = useChcStepTiming(duration, duration !== null && !missingExposure && !missingMaterial && !unsupportedInterference && mediaReady && !obscured && !saving && !busy && !locked && step.event !== 'playback', (elapsed) => {
    if (step.event === 'response') {
      setObscured(true)
      if (step.omissionAllowed === true && step.unitId && question.allowedOperations.includes('step')) void send({ operation: 'step', observation: { event: 'response', unitId: step.unitId, unitResponse: { unitId: step.unitId, state: 'omitted', elapsedMs: elapsed }, observedElapsedMs: elapsed } })
      else setNotice('Response time ended. Use the available recovery action to continue.')
    } else if (question.allowedOperations.includes('step')) { setObscured(true); void send({ operation: 'step', observation: { event: step.event, ...(step.unitId ? { unitId: step.unitId } : {}), observedDurationMs: elapsed } }) }
    else { setObscured(true); setNotice('This timed step cannot continue without an issued operation.') }
  })
  useEffect(() => {
    if (!(step.event === 'presentation' && step.taskMode === 'static_choice') || autoPresentationAttempted.current || !group || !mediaReady || busy || locked || sending.current || !question.allowedOperations.includes('step')) return
    const frame = window.requestAnimationFrame(() => { if (autoPresentationAttempted.current || sending.current || locked || busy) return; autoPresentationAttempted.current = true; setPresentationAttempted(true); void send({ operation: 'step', observation: { event: step.event, ...(step.unitId ? { unitId: step.unitId } : {}) } }) })
    return () => window.cancelAnimationFrame(frame)
  })
  useEffect(() => {
    if (!protectedStep) return
    const visibility = () => {
      if (document.hidden && mediaReady && (step.event !== 'playback' || audioPlaying) && !busy && !saving && !locked) { stop(); setObscured(true); setNotice('This timed activity was interrupted. Use the available recovery action to continue.') }
    }
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [protectedStep, step.event, mediaReady, audioPlaying, busy, saving, locked, stop])
  const answer = (response: ChcInputResponse): Promise<OperationOutcome> => {
    const elapsed = elapsedMs()
    if (step.event === 'practice') {
      if (step.practiceRound === undefined || !step.unitId || response.kind !== 'option' || !question.allowedOperations.includes('step')) return Promise.resolve('not_sent')
      return send({ operation: 'step', observation: { event: 'practice', unitId: step.unitId, practiceRound: step.practiceRound, unitResponse: { unitId: step.unitId, state: 'submitted', response } } })
    }
    if (step.event !== 'response') return Promise.resolve('not_sent')
    if (step.unitId && question.allowedOperations.includes('step') && (response.kind === 'option' || response.kind === 'cell' || response.kind === 'cell_set')) {
      const item: ChcUnitItemResponse = response
      return send({ operation: 'step', observation: { event: 'response', unitId: step.unitId, unitResponse: { unitId: step.unitId, state: 'submitted', response: item, ...(duration !== null ? { elapsedMs: elapsed } : {}) }, ...(duration !== null ? { observedElapsedMs: elapsed } : {}) } })
    }
    if (question.allowedOperations.includes('submit') && (response.kind === 'option' || response.kind === 'ordered' || response.kind === 'filtered_ordered')) return send({ operation: 'submit', response: { kind: 'performance', response } })
    return Promise.resolve('not_sent')
  }
  const acknowledge = () => { void send({ operation: 'step', observation: { event: step.event, ...(step.unitId ? { unitId: step.unitId } : {}), ...(duration !== null ? { observedDurationMs: elapsedMs() } : {}) } }) }
  const interrupt = () => {
    if (!question.allowedOperations.includes('interrupt')) return
    const reason = notice || (missingMaterial ? 'Required activity material unavailable' : missingExposure ? 'Required visual grid unavailable' : failedMedia.length ? 'Required media unavailable' : 'Current activity interrupted')
    void send(simpleStatic ? { operation: 'interrupt', reason } : { operation: 'interrupt', reason, observation: { event: 'interruption', ...(step.unitId ? { unitId: step.unitId } : {}), ...(duration !== null && mediaReady && !missingMaterial && !missingExposure && !missingSequentialTiming ? { observedElapsedMs: elapsedMs() } : {}) } })
  }
  const audio = step.stimulus?.media?.mediaType === 'audio' ? step.stimulus.media : question.presentation.media.find((item) => item.mediaType === 'audio' && !item.optionId)
  const missingDomain = (step.event === 'response' && (!step.responseKind || step.responseKind === 'unit_stream' || step.responseKind === 'option' && !group || (step.responseKind === 'ordered' || step.responseKind === 'filtered_ordered') && !step.responseTokens?.length || (step.responseKind === 'cell' || step.responseKind === 'cell_set') && (!step.cellCount || !step.unitId || !question.allowedOperations.includes('step')) || step.taskMode === 'timed_fluency' && duration === null)) || (step.event === 'presentation' && step.taskMode === 'static_choice' && !group) || (step.event === 'practice' && (step.practiceRound === undefined || !step.unitId || !group)) || missingExposure || missingMaterial || missingSequentialTiming || unsupportedInterference || step.event === 'interference' && duration === null || step.event === 'playback' && (!audio || step.timing.playbackLimit === null)
  return <div className="min-w-0">
    {step.unitIndex !== null && step.unitCount !== null && <p className="mt-3 text-sm text-slate-500">Part {step.unitIndex} of {step.unitCount}</p>}
    {step.event === 'practice' && step.practiceRound !== undefined && <p className="mt-3 text-sm font-medium text-teal-900">Practice round {step.practiceRound}</p>}
    {obscured ? <p role="status" className="mt-5 rounded-lg border p-4">{notice || 'Saving this step…'}</p> : !missingExposure && !missingMaterial && !missingSequentialTiming && <ChcStimulus key={mediaAttempt} step={step} media={question.presentation.media} questionText={question.questionText} visible onMediaAvailability={mediaAvailability} />}
    {!obscured && showOptions && group && <ChcResponseControls key={`${question.currentStep}:${step.unitId ?? ''}:${mediaAttempt}`} step={step} group={group} media={question.presentation.media} busy={busy || locked || saving || missingDomain || step.event === 'presentation'} mediaReady={mediaReady} presentationOnly={step.event === 'presentation'} onAnswer={answer} onMediaAvailability={mediaAvailability} />}
    {!obscured && step.event === 'response' && step.responseKind !== null && !group && step.responseKind !== 'option' && <ChcResponseControls key={`${question.currentStep}:${step.unitId ?? ''}`} step={step} media={question.presentation.media} busy={busy || locked || saving || missingDomain} mediaReady={mediaReady} onAnswer={answer} onMediaAvailability={mediaAvailability} />}
    {!obscured && step.event === 'playback' && audio && step.timing.playbackLimit !== null && <ChcAudio media={audio} limit={step.timing.playbackLimit} allowReplay={step.timing.allowReplay} busy={busy || locked || saving} onPlayingChange={setAudioPlaying} onComplete={(count, elapsed) => { if (count === 1) void send({ operation: 'step', observation: { event: 'playback', ...(step.unitId ? { unitId: step.unitId } : {}), playbackCount: 1, observedDurationMs: elapsed } }) }} onFailure={() => { setObscured(true); setNotice('Audio could not be completed. Use the recovery action to continue.') }} />}
    {!obscured && (step.event === 'acknowledgement' || step.event === 'presentation' && step.taskMode !== 'static_choice' || ['study', 'cue', 'retention', 'hide'].includes(step.event)) && duration === null && question.allowedOperations.includes('step') && <Button className="mt-5" type="button" disabled={busy || locked || saving || !mediaReady || missingDomain} onClick={acknowledge}>{step.event === 'acknowledgement' ? 'I understand' : step.event === 'study' || step.event === 'cue' ? 'Continue after viewing' : 'Continue'}</Button>}
    {step.event === 'response' && duration !== null && remainingMs !== null && !obscured && <p role="timer" className="mt-3 text-sm text-slate-600">Time remaining: {Math.ceil(remainingMs / 1000)} seconds</p>}
    {saving && <p role="status" aria-live="polite" className="mt-2 text-sm text-teal-900">Saving this step…</p>}
    {missingDomain && <p role="alert" className="mt-3 text-sm text-destructive">The current activity cannot continue because its {step.event === 'response' ? 'response choices or timing' : step.event === 'playback' ? 'audio' : step.event === 'interference' || missingSequentialTiming ? 'timing or controls' : missingExposure ? 'visual grid' : missingMaterial ? 'material' : 'issued options'} are unavailable.</p>}
    {failedMedia.length > 0 && <div role="alert" className="mt-3 flex flex-wrap items-center gap-2 text-sm text-destructive"><span>Required media could not load.</span><Button type="button" variant="outline" disabled={busy || locked} onClick={() => { setFailedMedia([]); setMediaAttempt((value) => value + 1) }}>Retry media</Button></div>}
    {notice && !obscured && <p role="alert" className="mt-3 text-sm text-destructive">{notice}</p>}
    {(obscured || missingDomain || failedMedia.length > 0 || notice || locked || presentationAttempted && step.event === 'presentation' && step.taskMode === 'static_choice') && !busy && !locked && <div className="mt-4 flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={onCheck}>Check current state</Button>{presentationAttempted && step.event === 'presentation' && step.taskMode === 'static_choice' && !saving && mediaReady && !missingDomain && question.allowedOperations.includes('step') && <Button type="button" onClick={acknowledge}>Try continuing</Button>}{question.allowedOperations.includes('interrupt') && <Button type="button" onClick={interrupt}>Continue to next question</Button>}</div>}
  </div>
}
