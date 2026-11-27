import { useState } from 'react'
import { AssessmentMedia } from '@/components/assessment/AssessmentMedia'
import { Button } from '@/components/ui/button'
import type { AssessmentOptionGroupDto, AssessmentPerformanceStepDto, ChcCellResponse, ChcCellSetResponse, ChcOptionResponse, ChcOrderedResponse, ChcFilteredOrderedResponse } from '@/types/assessment'

export type ChcInputResponse = ChcOptionResponse | ChcCellResponse | ChcCellSetResponse | ChcOrderedResponse | ChcFilteredOrderedResponse
interface Props { step: AssessmentPerformanceStepDto; group?: AssessmentOptionGroupDto; busy: boolean; mediaReady: boolean; onAnswer: (response: ChcInputResponse) => void; onMediaAvailability: (id: string, ready: boolean) => void }

export const ChcResponseControls = ({ step, group, busy, mediaReady, onAnswer, onMediaAvailability }: Props) => {
  const [selected, setSelected] = useState<string | null>(null)
  const [ordered, setOrdered] = useState<number[]>([])
  const [positions, setPositions] = useState<number[]>([])
  const [failedMedia, setFailedMedia] = useState<string[]>([])
  const kind = step.responseKind === 'unit_stream'
    ? !step.questionType.startsWith('multi_trial_') ? null
      : step.questionType === 'multi_trial_multi_select' ? step.stimulus?.gridRows && step.stimulus.gridColumns ? 'cell_set' : null
        : group ? 'option' : step.stimulus?.gridRows && step.stimulus.gridColumns ? 'cell' : null
    : step.responseKind
  const tokens = step.responseTokens ?? []
  const rows = step.stimulus?.gridRows
  const columns = step.stimulus?.gridColumns
  const cellCount = rows && columns ? rows * columns : step.stimulus?.responseCells?.length ?? step.stimulus?.cells?.length ?? 0
  const validOption = selected !== null && !!group?.choices.some((choice) => choice.optionId === selected)
  const usable = !busy && mediaReady && failedMedia.length === 0 && (kind === 'option' ? validOption : kind === 'cell' ? positions.length === 1 : kind === 'cell_set' ? positions.length > 0 : ordered.length > 0)
  const submit = () => {
    if (!usable) return
    if (kind === 'option' && selected !== null) onAnswer({ kind: 'option', optionId: selected })
    else if (kind === 'cell' && positions.length === 1) onAnswer({ kind: 'cell', position: positions[0] })
    else if (kind === 'cell_set') onAnswer({ kind: 'cell_set', positions: [...positions].sort((a, b) => a - b) })
    else if (kind === 'ordered') onAnswer({ kind: 'ordered', tokens: ordered.map((index) => tokens[index]) })
    else if (kind === 'filtered_ordered') onAnswer({ kind: 'filtered_ordered', tokens: ordered.map((index) => tokens[index]) })
  }
  if (kind === null) return <p role="alert">This trial needs an issued response domain before it can continue. Check this activity again.</p>
  if (kind === 'option' && !group) return <p role="alert">Response options are unavailable. Check this activity again.</p>
  if ((kind === 'ordered' || kind === 'filtered_ordered') && tokens.length === 0) return <p role="alert">Response tokens are unavailable. Check this activity again.</p>
  if ((kind === 'cell' || kind === 'cell_set') && (cellCount < 1 || cellCount > 256)) return <p role="alert">The response cells are unavailable. Check this activity again.</p>

  return <div className="mt-6">
    {kind === 'option' && group && <fieldset disabled={busy}><legend className="font-medium">{group.prompt || 'Choose one response'}</legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{group.choices.map((choice, index) => <label key={choice.optionId} className={`flex cursor-pointer gap-2 rounded-lg border p-3 ${selected === choice.optionId ? 'border-primary bg-primary/5' : ''}`}><input type="radio" name="chc-response" checked={selected === choice.optionId} onChange={() => setSelected(choice.optionId)} /><span className="grid gap-2">{choice.text || choice.value || choice.values?.join(' · ') || choice.pair?.join(' · ') || choice.media?.altText || `Option ${index + 1}`}{choice.media && <AssessmentMedia media={choice.media} onAvailability={(id, ready) => { onMediaAvailability(id, ready); setFailedMedia((previous) => ready ? previous.filter((item) => item !== id) : previous.includes(id) ? previous : [...previous, id]) }} />}</span></label>)}</div></fieldset>}
    {(kind === 'ordered' || kind === 'filtered_ordered') && <div><p className="font-medium">Choose tokens in your response order</p><div className="mt-3 flex flex-wrap gap-2">{tokens.map((token, index) => <Button key={index} type="button" variant="outline" disabled={busy || ordered.includes(index)} onClick={() => setOrdered((previous) => [...previous, index])}>{token}</Button>)}</div><ol className="mt-3 flex flex-wrap gap-2" aria-label="Your response order">{ordered.map((index, order) => <li key={index}><Button type="button" variant="secondary" disabled={busy} aria-label={`Remove ${tokens[index]} at position ${order + 1}`} onClick={() => setOrdered((previous) => previous.filter((item) => item !== index))}>{order + 1}. {tokens[index]} ×</Button></li>)}</ol><Button className="mt-3" type="button" variant="ghost" disabled={busy || ordered.length === 0} onClick={() => setOrdered([])}>Clear order</Button></div>}
    {(kind === 'cell' || kind === 'cell_set') && <fieldset disabled={busy}><legend className="font-medium">{kind === 'cell' ? 'Choose one cell' : 'Choose cells'}</legend><div className={`mt-3 gap-2 ${columns ? 'grid' : 'flex flex-wrap'}`} style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}>{Array.from({ length: cellCount }, (_, index) => { const position = index + 1; return <button key={position} type="button" aria-label={columns ? `Row ${Math.floor(index / columns) + 1}, column ${index % columns + 1}` : `Position ${position}`} aria-pressed={positions.includes(position)} className={`min-h-12 rounded-lg border p-2 ${positions.includes(position) ? 'border-primary bg-primary/10' : ''}`} onClick={() => setPositions((previous) => kind === 'cell' ? [position] : previous.includes(position) ? previous.filter((item) => item !== position) : [...previous, position])}>{step.stimulus?.responseCells?.[index] ?? step.stimulus?.cells?.[index] ?? position}</button> })}</div></fieldset>}
    <Button className="mt-5" type="button" disabled={!usable} onClick={submit}>{step.event === 'practice' ? 'Continue practice' : 'Save & Continue'}</Button>
    {!usable && <p className="mt-2 text-sm text-muted-foreground">Choose a response to continue.</p>}
  </div>
}
