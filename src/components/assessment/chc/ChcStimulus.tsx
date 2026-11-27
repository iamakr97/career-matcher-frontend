import { useEffect, useState } from 'react'
import { AssessmentMedia } from '@/components/assessment/AssessmentMedia'
import type { AssessmentMediaDto, AssessmentPerformanceStepDto, AssessmentPerformanceStimulusDto } from '@/types/assessment'

interface Props { step: AssessmentPerformanceStepDto; media: AssessmentMediaDto[]; visible: boolean; onMediaAvailability: (id: string, ready: boolean) => void }
export const ChcStimulus = ({ step, media, visible, onMediaAvailability }: Props) => {
  const s: AssessmentPerformanceStimulusDto = step.stimulus ?? {}
  const [tokenIndex, setTokenIndex] = useState(0)
  const [inGap, setInGap] = useState(false)
  useEffect(() => {
    if (!visible || step.event !== 'study' || step.timing.perTokenExposureMs === null || !s?.tokens?.length) return
    const perToken = step.timing.perTokenExposureMs
    const gap = step.timing.interTokenGapMs ?? 0
    const tokenCount = s.tokens.length
    const timer = window.setTimeout(() => {
      if (!inGap && tokenIndex + 1 < tokenCount) setInGap(true)
      else if (inGap) { setTokenIndex((index) => index + 1); setInGap(false) }
    }, inGap ? gap : perToken)
    return () => window.clearTimeout(timer)
  }, [visible, step.event, step.timing.perTokenExposureMs, step.timing.interTokenGapMs, s?.tokens, tokenIndex, inGap])
  if (!visible) return null
  const canShowStudy = step.event !== 'response' || step.timing.studyVisibleDuringResponse
  const gridCells = s.cells ?? []
  const gridRows = s.gridRows ?? 0
  const gridColumns = s.gridColumns ?? 0
  return <div className="mt-5 grid gap-4" aria-label="Current activity material">
    {s.text && <p className="whitespace-pre-wrap break-words">{s.text}</p>}
    {s.cue && <p className="whitespace-pre-wrap break-words font-medium">{s.cue}</p>}
    {s.studyText && canShowStudy && <p className="whitespace-pre-wrap break-words">{s.studyText}</p>}
    {s.current && <p className="rounded-lg border p-3 text-center text-lg">{s.current}</p>}
    {s.sample && <p>Sample: {s.sample}</p>}{s.candidate && <p>Candidate: {s.candidate}</p>}
    {canShowStudy && s.tokens && <div className="flex flex-wrap gap-2">{step.event === 'study' && step.timing.perTokenExposureMs !== null ? !inGap && <span className="rounded border px-3 py-2">{s.tokens[tokenIndex]}</span> : s.tokens.map((token, index) => <span key={index} className="rounded border px-3 py-2">{token}</span>)}</div>}
    {canShowStudy && s.numberTokens && <div className="flex flex-wrap gap-2">{s.numberTokens.map((token, index) => <span key={index} className="rounded border px-3 py-2">{token}</span>)}</div>}
    {s.rowA && <p>Row A: {s.rowA.join(' · ')}</p>}{s.rowB && <p>Row B: {s.rowB.join(' · ')}</p>}
    {step.event === 'presentation' && s.optionGroup && <div><p className="font-medium">{s.optionGroup.prompt}</p><ul className="mt-2 grid gap-2 sm:grid-cols-2">{s.optionGroup.choices.map((choice, index) => <li key={choice.optionId} className="rounded-lg border p-3">{choice.text || choice.value || choice.values?.join(' · ') || choice.pair?.join(' · ') || choice.media?.altText || `Option ${index + 1}`}{choice.media && choice.media.mediaType !== 'audio' && <AssessmentMedia media={choice.media} onAvailability={onMediaAvailability} />}</li>)}</ul></div>}
    {canShowStudy && s.studyPairs && <ul className="grid gap-2">{s.studyPairs.map((pair, index) => <li key={index} className="rounded border p-3">{pair.cue}{pair.target && <> · {pair.target}</>}{pair.targetSequence && <> · {pair.targetSequence.join(' · ')}</>}{pair.context && <p className="text-sm">{pair.context}</p>}</li>)}</ul>}
    {canShowStudy && s.studyFacts && <ul className="grid gap-2">{s.studyFacts.map((fact, index) => <li key={index} className="rounded border p-3">{[fact.text, fact.signal, fact.object, fact.destination, fact.event, fact.location].filter(Boolean).join(' · ')}</li>)}</ul>}
    {canShowStudy && gridRows > 0 && gridColumns > 0 && <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}>{Array.from({ length: gridRows * gridColumns }, (_, index) => <span key={index} className={`min-h-10 rounded border p-2 text-center ${s.highlightOrder?.includes(`r${Math.floor(index / gridColumns) + 1}c${index % gridColumns + 1}`) ? 'bg-primary/20' : ''}`}>{gridCells[index] ?? ''}</span>)}</div>}
    {media.filter((item) => item.mediaType !== 'audio' && !s.optionGroup?.choices.some((choice) => choice.media?.mediaId === item.mediaId)).map((item) => <AssessmentMedia key={item.mediaId} media={item} onAvailability={onMediaAvailability} />)}
    {s.media && s.media.mediaType !== 'audio' && !media.some((item) => item.mediaId === s.media?.mediaId) && <AssessmentMedia media={s.media} onAvailability={onMediaAvailability} />}
  </div>
}
