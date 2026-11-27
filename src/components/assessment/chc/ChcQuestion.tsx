import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChcAudio } from '@/components/assessment/chc/ChcAudio'
import { ChcResponseControls, type ChcInputResponse } from '@/components/assessment/chc/ChcResponseControls'
import { ChcStimulus } from '@/components/assessment/chc/ChcStimulus'
import { useChcStepTiming } from '@/hooks/useChcStepTiming'
import type { AssessmentOperationIntent, AssessmentPerformanceStepDto, AssessmentQuestionDto, ChcUnitItemResponse } from '@/types/assessment'

interface Props { question: AssessmentQuestionDto; step: AssessmentPerformanceStepDto; busy: boolean; locked: boolean; onSubmit: (intent: AssessmentOperationIntent) => void; onCheck: () => void }

export const ChcQuestion = ({ question, step, busy, locked, onSubmit, onCheck }: Props) => {
  const sent = useRef(false)
  const [hidden, setHidden] = useState(false)
  const [pendingMedia, setPendingMedia] = useState<string[]>(() => {
    const group = step.stimulus?.optionGroup ?? question.presentation.options.find((item) => item.groupId === step.optionGroupId)
    return [...question.presentation.media, ...(step.stimulus?.media ? [step.stimulus.media] : []), ...(group?.choices.flatMap((choice) => choice.media ? [choice.media] : []) ?? [])].filter((item) => item.mediaType !== 'audio' && item.role !== 'supporting').map((item) => item.mediaId)
  })
  const mediaReady = pendingMedia.length === 0
  const mediaAvailability = (id: string, ready: boolean) => setPendingMedia((previous) => ready ? previous.filter((item) => item !== id) : previous.includes(id) ? previous : [...previous, id])
  const [notice, setNotice] = useState('')
  const duration = step.event === 'response' ? step.timing.responseWindowMs
    : step.event === 'study' ? step.timing.studyExposureMs ?? (step.timing.perTokenExposureMs !== null && step.stimulus?.tokens?.length ? step.stimulus.tokens.length * step.timing.perTokenExposureMs + (step.stimulus.tokens.length - 1) * (step.timing.interTokenGapMs ?? 0) : null)
      : step.event === 'retention' ? step.timing.retentionDelayMs
        : step.event === 'cue' ? step.timing.ruleCueExposureMs
          : step.event === 'interference' ? step.timing.interferenceDurationMs
            : null
  const send = (intent: AssessmentOperationIntent) => {
    if (sent.current || busy || locked || !question.allowedOperations.includes(intent.operation)) return
    sent.current = true
    setHidden(true)
    onSubmit(intent)
  }
  const { elapsedMs, remainingMs, stop } = useChcStepTiming(duration, mediaReady && !hidden && !busy && !locked && step.event !== 'playback', (elapsed) => {
    if (step.event === 'response') {
      setHidden(true)
      setNotice('The response time ended. Check the current activity before continuing.')
    } else if (question.allowedOperations.includes('step')) send({ operation: 'step', observation: { event: step.event, ...(step.unitId ? { unitId: step.unitId } : {}), observedDurationMs: elapsed } })
    else { setHidden(true); setNotice('This timed activity cannot continue. Check its current state.') }
  })
  useEffect(() => {
    const visibility = () => {
      if (document.hidden && ['study', 'playback', 'response', 'practice'].includes(step.event)) {
        stop()
        setHidden(true)
        setNotice('This activity was interrupted. Check its current state before continuing.')
      }
    }
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [step.event, stop])
  const group = step.stimulus?.optionGroup ?? question.presentation.options.find((item) => item.groupId === step.optionGroupId)
  const stream = step.responseKind === 'unit_stream' || step.questionType.startsWith('multi_trial_')
  const canRespond = step.event !== 'response' || step.responseKind === null
    ? true
    : stream || step.responseKind === 'cell' || step.responseKind === 'cell_set'
      ? !!step.unitId && question.allowedOperations.includes('step')
      : question.allowedOperations.includes('submit')
  const answer = (response: ChcInputResponse) => {
    const elapsed = elapsedMs()
    if (step.event !== 'response') return
    if (stream && step.unitId && question.allowedOperations.includes('step') && (response.kind === 'option' || response.kind === 'cell' || response.kind === 'cell_set')) {
      const item: ChcUnitItemResponse = response
      send({ operation: 'step', observation: { event: 'response', unitId: step.unitId, unitResponse: { unitId: step.unitId, state: 'submitted', response: item, elapsedMs: elapsed }, observedElapsedMs: elapsed } })
    } else if (question.allowedOperations.includes('submit') && response.kind !== 'cell' && response.kind !== 'cell_set') send({ operation: 'submit', response: { kind: 'performance', response } })
  }
  const acknowledge = () => send({ operation: 'step', observation: { event: step.event, ...(step.unitId ? { unitId: step.unitId } : {}), ...(duration !== null ? { observedDurationMs: elapsedMs() } : {}) } })
  const interrupt = () => send(step.taskMode === 'static_choice' && step.questionType === 'single_select' ? { operation: 'interrupt', reason: 'Current activity interrupted' } : { operation: 'interrupt', reason: 'Current activity interrupted', observation: { event: 'interruption', ...(step.unitId ? { unitId: step.unitId } : {}), observedElapsedMs: elapsedMs() } })
  if (hidden) return <div role="status" className="mt-6 rounded-lg border p-4"><p>{notice || 'Saving this step…'}</p><Button className="mt-3" type="button" variant="outline" onClick={onCheck} disabled={busy}>Check again</Button>{notice && question.allowedOperations.includes('interrupt') && <Button className="mt-3 ml-2" type="button" onClick={interrupt} disabled={busy || locked}>Resolve interrupted task</Button>}</div>
  if (step.event === 'practice') return <div role="alert" className="mt-5 rounded-lg border p-4"><p>Practice is unavailable because this issued step does not include the round needed by the assessment service.</p><Button className="mt-3" type="button" variant="outline" onClick={onCheck} disabled={busy}>Check again</Button></div>
  if (step.event === 'playback' && (step.timing.playbackLimit === null || !step.stimulus?.media || step.stimulus.media.mediaType !== 'audio')) return <div role="alert">Listening details are unavailable. <Button type="button" variant="outline" onClick={onCheck}>Check again</Button></div>
  return <div>
    {step.unitIndex !== null && step.unitCount !== null && <p className="mt-4 text-sm text-muted-foreground">Part {step.unitIndex} of {step.unitCount}</p>}
    <ChcStimulus step={step} media={question.presentation.media} visible={step.event !== 'retention'} onMediaAvailability={mediaAvailability} />
    {step.event === 'playback' && step.stimulus?.media && step.timing.playbackLimit !== null && <ChcAudio media={step.stimulus.media} limit={step.timing.playbackLimit} allowReplay={step.timing.allowReplay} busy={busy || locked} onComplete={(count, elapsed) => send({ operation: 'step', observation: { event: 'playback', ...(step.unitId ? { unitId: step.unitId } : {}), playbackCount: count, observedDurationMs: elapsed } })} onFailure={() => { setHidden(true); setNotice('Audio could not be completed. Check the current activity.') }} />}
    {step.event === 'response' && step.responseKind !== null && (canRespond ? <ChcResponseControls step={step} group={group} busy={busy || locked} mediaReady={mediaReady} onAnswer={answer} onMediaAvailability={mediaAvailability} /> : <p role="alert" className="mt-5">This activity has no compatible response operation. Check its current state.</p>)}
    {step.responseKind === null && step.event !== 'playback' && duration === null && question.allowedOperations.includes('step') && <Button className="mt-5" type="button" disabled={busy || locked || !mediaReady} onClick={acknowledge}>Continue</Button>}
    {duration !== null && step.event === 'response' && remainingMs !== null && <p role="timer" className="mt-3 text-sm text-muted-foreground">Time remaining: {Math.ceil(remainingMs / 1000)} seconds</p>}
    {notice && <p role="alert" className="mt-3 text-sm text-destructive">{notice}</p>}
  </div>
}
