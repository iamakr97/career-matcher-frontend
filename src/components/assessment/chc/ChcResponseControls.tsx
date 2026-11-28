import { useRef, useState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { AssessmentMedia } from '@/components/assessment/AssessmentMedia'
import { ChcShapeToken } from '@/components/assessment/chc/ChcStimulus'
import { Button } from '@/components/ui/button'
import { choiceMedia } from '@/lib/assessment-media'
import type { OperationOutcome } from '@/hooks/useAssessmentSession'
import type { AssessmentMediaDto, AssessmentOptionGroupDto, AssessmentPerformanceStepDto, ChcCellResponse, ChcCellSetResponse, ChcOptionResponse, ChcOrderedResponse, ChcFilteredOrderedResponse } from '@/types/assessment'

export type ChcInputResponse = ChcOptionResponse | ChcCellResponse | ChcCellSetResponse | ChcOrderedResponse | ChcFilteredOrderedResponse
interface Props { step: AssessmentPerformanceStepDto; group?: AssessmentOptionGroupDto; media: AssessmentMediaDto[]; busy: boolean; mediaReady: boolean; presentationOnly?: boolean; onAnswer: (response: ChcInputResponse) => Promise<OperationOutcome>; onMediaAvailability: (id: string, ready: boolean) => void }

export const ChcResponseControls = ({ step, group, media, busy, mediaReady, presentationOnly = false, onAnswer, onMediaAvailability }: Props) => {
  const [selected, setSelected] = useState<string | null>(null)
  const [ordered, setOrdered] = useState<(string | null)[]>([])
  const [positions, setPositions] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [failedMedia, setFailedMedia] = useState<string[]>([])
  const sent = useRef(false)
  const kind = presentationOnly || step.event === 'practice' ? 'option' : step.responseKind
  const tokens = step.responseTokens ?? []
  const columns = step.stimulus?.gridColumns
  const cellCount = step.cellCount ?? 0
  const choices = group ? choiceMedia({ mode: 'mixed', layout: group.layout ?? 'option_list', media, options: [group] }, group).options : []
  const imageChoices = choices.some(({ media: assets }) => assets.some((item) => item.role === 'option_image' || item.role === 'option'))
  const essentialFailed = choices.some(({ choice, media: assets }) => !choice.text && !choice.value && !choice.pair?.length && !choice.values?.length && (assets.length === 0 || assets.some((item) => failedMedia.includes(item.mediaId))))
  const unavailable = busy || saving || presentationOnly || !mediaReady || essentialFailed
  const answer = async (response: ChcInputResponse) => {
    if (sent.current || unavailable) return
    sent.current = true
    setSaving(true)
    const outcome = await onAnswer(response)
    if (outcome !== 'accepted') { sent.current = false; setSaving(false) }
  }
  if (kind === null || kind === 'unit_stream') return <p role="alert">This step has no issued current response domain.</p>
  if (kind === 'option' && !group) return <p role="alert">This step has no issued option group.</p>
  if ((kind === 'ordered' || kind === 'filtered_ordered') && tokens.length === 0) return <p role="alert">This step has no issued response tokens.</p>
  if ((kind === 'cell' || kind === 'cell_set') && (cellCount < 1 || cellCount > 256)) return <p role="alert">This step has no issued cellCount.</p>
  return <div className="mt-5" aria-busy={saving || busy}>
    {kind === 'option' && <div><p className="mb-3 text-sm font-medium">{group?.prompt || (step.event === 'practice' ? 'Practice response' : 'Choose one response')}</p><div className={imageChoices ? 'grid grid-cols-2 gap-2 sm:grid-cols-4' : 'grid gap-2'}>{choices.map(({ choice, media: assets }, index) => {
      const label = choice.text || choice.value || choice.values?.join(' · ') || choice.pair?.join(' · ') || assets[0]?.altText || `Option ${index + 1}`
      const active = selected === choice.optionId
      return <button key={choice.optionId} type="button" aria-label={label} aria-pressed={active} disabled={unavailable} onClick={() => { setSelected(choice.optionId); void answer({ kind: 'option', optionId: choice.optionId }) }} className={`flex min-w-0 rounded-xl border p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 ${imageChoices ? 'flex-col items-center gap-2 text-center' : 'items-center gap-3'} ${active ? 'border-teal-800 bg-teal-50 shadow-[inset_0_0_0_1px_#115e59]' : 'border-slate-200 bg-white'}`}>
        {assets.length > 0 && <span className="w-full">{assets.map((item) => <AssessmentMedia key={`${item.mediaId}:${item.url}`} media={item} variant="option" alt={choice.text ? '' : label} retryable={false} onAvailability={(id, ready) => { onMediaAvailability(id, ready); setFailedMedia((previous) => ready ? previous.filter((value) => value !== id) : previous.includes(id) ? previous : [...previous, id]) }} />)}</span>}
        <span className="min-w-0 flex-1 break-words text-sm [overflow-wrap:anywhere]">{label}</span><span aria-hidden="true" className="grid size-5 shrink-0 place-items-center">{active && (saving || busy) ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : active ? <Check className="size-4 text-teal-800" /> : null}</span>
      </button>
    })}</div></div>}
    {(kind === 'ordered' || kind === 'filtered_ordered') && <div><p className="text-sm font-medium">Choose tokens in response order</p><div className="mt-3 flex flex-wrap gap-2">{tokens.map((token, index) => <Button key={index} type="button" variant="outline" aria-label={`Add ${token.replace(/[_-]+/g, ' ')}`} disabled={unavailable || kind === 'filtered_ordered' && ordered.includes(token) || kind === 'ordered' && !step.allowRepeatedTokens && ordered.filter((item) => item === token).length >= tokens.filter((item) => item === token).length} onClick={() => setOrdered((previous) => [...previous, token])}><ChcShapeToken token={token} /></Button>)}</div><ol className="mt-3 flex flex-wrap gap-2" aria-label="Your response order">{ordered.map((token, index) => <li key={index}><Button type="button" variant="secondary" disabled={unavailable} aria-label={`Remove ${token ?? 'omitted position'} at position ${index + 1}`} onClick={() => setOrdered((previous) => previous.filter((_, position) => position !== index))}>{index + 1}. {token === null ? 'Omitted' : <ChcShapeToken token={token} />} ×</Button></li>)}</ol>{kind === 'ordered' && <Button className="mt-2" type="button" variant="outline" disabled={unavailable} onClick={() => setOrdered((previous) => [...previous, null])}>Omit position</Button>}<Button className="mt-2" type="button" variant="ghost" disabled={unavailable || ordered.length === 0} onClick={() => setOrdered([])}>Clear order</Button></div>}
    {(kind === 'cell' || kind === 'cell_set') && <div><p className="text-sm font-medium">{kind === 'cell' ? 'Choose one cell' : 'Choose cells, then finish'}</p><div className={`mt-3 gap-2 ${columns ? 'grid' : 'flex flex-wrap'}`} style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}>{Array.from({ length: cellCount }, (_, index) => { const position = index + 1; return <button key={position} type="button" disabled={unavailable} aria-label={columns ? `Row ${Math.floor(index / columns) + 1}, column ${index % columns + 1}` : `Position ${position}`} aria-pressed={positions.includes(position)} className={`min-h-12 rounded-lg border p-2 focus-visible:outline-2 focus-visible:outline-teal-800 ${positions.includes(position) ? 'border-teal-800 bg-teal-50' : ''}`} onClick={() => { if (kind === 'cell') { setPositions([position]); void answer({ kind: 'cell', position }) } else setPositions((previous) => previous.includes(position) ? previous.filter((item) => item !== position) : [...previous, position]) }}>{step.stimulus?.responseCells?.[index] ?? step.stimulus?.cells?.[index] ?? position}</button> })}</div></div>}
    {(kind === 'ordered' || kind === 'filtered_ordered' || kind === 'cell_set') && <Button className="mt-4" type="button" disabled={unavailable || kind !== 'cell_set' && ordered.length === 0} onClick={() => { if (kind === 'ordered') void answer({ kind, tokens: ordered }); else if (kind === 'filtered_ordered') void answer({ kind, tokens: ordered.filter((item): item is string => item !== null) }); else void answer({ kind: 'cell_set', positions }) }}>Finish</Button>}
    <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-teal-900">{saving || busy && selected ? 'Saving your answer…' : ''}</p>
    {failedMedia.length > 0 && <p role="alert" className="text-sm text-destructive">An option image could not load. Use the recovery action below if this image is needed to answer.</p>}
    {step.taskMode === 'static_choice' && step.questionType === 'single_select' && <div className="mt-3 border-t border-slate-100 pt-4"><Button type="button" variant="outline" disabled>Previous</Button></div>}
  </div>
}
