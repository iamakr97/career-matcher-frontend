import { AssessmentMedia } from '@/components/assessment/AssessmentMedia'
import { chcStimulusMedia } from '@/components/assessment/chc/chc-media'
import type { AssessmentMediaDto, AssessmentPerformanceStepDto } from '@/types/assessment'

interface Props { step: AssessmentPerformanceStepDto; media: AssessmentMediaDto[]; visible: boolean; questionText?: string; onMediaAvailability: (id: string, ready: boolean) => void }
export const ChcStimulus = ({ step, media, visible, questionText, onMediaAvailability }: Props) => {
  if (!visible || step.event === 'hide' || step.event === 'retention') return null
  if (step.exposureGap) return <div aria-label="Brief interval" className="mt-5 min-h-12 rounded-lg bg-slate-50" />
  const s = step.stimulus ?? {}
  const canShowStudy = step.event !== 'response' || step.timing.studyVisibleDuringResponse
  const sequential = step.event === 'study' && step.timing.perTokenExposureMs !== null
  const gridRows = s.gridRows ?? 0
  const gridColumns = s.gridColumns ?? 0
  const highlight = sequential ? s.highlightOrder?.[0] : undefined
  return <div className="mt-5 grid min-w-0 gap-4" aria-label="Current activity material">
    {s.text && s.text.replace(/\s+/g, ' ').trim() !== questionText?.replace(/\s+/g, ' ').trim() && <p className="whitespace-pre-wrap break-words">{s.text}</p>}
    {s.cue && <p className="whitespace-pre-wrap break-words font-medium">{s.cue}</p>}
    {s.studyText && canShowStudy && !sequential && <p className="whitespace-pre-wrap break-words">{s.studyText}</p>}
    {s.current && !s.currentEvent && <p className="rounded-lg border p-3 text-center text-lg">{s.current}</p>}
    {s.currentEvent && canShowStudy && <p className="rounded-lg border p-3 text-center text-lg"><span className="mr-2 text-xs text-slate-500">{s.currentEvent.channel}</span>{s.currentEvent.token}</p>}
    {s.sample && <p>Sample: {s.sample}</p>}{s.candidate && <p>Candidate: {s.candidate}</p>}
    {canShowStudy && s.tokens && !s.currentEvent && <div className="flex flex-wrap gap-2">{(sequential ? s.tokens.slice(0, 1) : s.tokens).map((token, index) => <span key={index} className="rounded border px-3 py-2">{token}</span>)}</div>}
    {canShowStudy && s.numberTokens && !s.currentEvent && <div className="flex flex-wrap gap-2">{(sequential ? s.numberTokens.slice(0, 1) : s.numberTokens).map((token, index) => <span key={index} className="rounded border px-3 py-2">{token}</span>)}</div>}
    {!sequential && s.rowA && <p>Row A: {s.rowA.join(' · ')}</p>}{!sequential && s.rowB && <p>Row B: {s.rowB.join(' · ')}</p>}
    {canShowStudy && !sequential && s.studyPairs && <ul className="grid gap-2">{s.studyPairs.map((pair, index) => <li key={index} className="rounded border p-3">{pair.cue}{pair.target && <> · {pair.target}</>}{pair.targetSequence && <> · {pair.targetSequence.join(' · ')}</>}{pair.context && <p className="text-sm">{pair.context}</p>}</li>)}</ul>}
    {canShowStudy && !sequential && s.studyFacts && <ul className="grid gap-2">{s.studyFacts.map((fact, index) => <li key={index} className="rounded border p-3">{[fact.text, fact.signal, fact.object, fact.destination, fact.event, fact.location].filter(Boolean).join(' · ')}</li>)}</ul>}
    {canShowStudy && gridRows > 0 && gridColumns > 0 && <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}>{Array.from({ length: gridRows * gridColumns }, (_, index) => <span key={index} className={`min-h-10 rounded border p-2 text-center ${highlight === `r${Math.floor(index / gridColumns) + 1}c${index % gridColumns + 1}` ? 'bg-teal-100' : ''}`}>{s.cells?.[index] ?? ''}</span>)}</div>}
    {chcStimulusMedia(step, media).map((item) => <AssessmentMedia key={`${item.mediaId}:${item.url}`} media={item} variant="stimulus" onAvailability={onMediaAvailability} />)}
  </div>
}
