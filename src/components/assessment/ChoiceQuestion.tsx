import { useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { AssessmentMedia, type MediaReadiness } from '@/components/assessment/AssessmentMedia'
import { Button } from '@/components/ui/button'
import { choiceMedia, choicePresentationKind } from '@/lib/assessment-media'
import type { OperationOutcome } from '@/hooks/useAssessmentSession'
import type { AssessmentChoiceInteractionDto, AssessmentQuestionDto } from '@/types/assessment'

interface Props { question: AssessmentQuestionDto; interaction: AssessmentChoiceInteractionDto; busy: boolean; locked: boolean; stimulusBlocked: boolean; onSubmit: (selected: string) => Promise<OperationOutcome>; onCheck: () => void; preceding: (string | undefined)[] }
const agreementFaces = ['😟', '🙁', '😐', '🙂', '😄']
const same = (a?: string, b?: string) => !!a && !!b && a.replace(/\s+/g, ' ').trim() === b.replace(/\s+/g, ' ').trim()
const labelFor = (choice: { text?: string; value?: string; pair?: string[]; values?: string[] }) => choice.text?.trim() || choice.pair?.join(' · ').trim() || choice.values?.join(' · ').trim() || choice.value?.trim() || ''
export const ChoiceQuestion = ({ question, interaction, busy, locked, stimulusBlocked, onSubmit, onCheck, preceding }: Props) => {
  const group = question.presentation.options.find((item) => item.groupId === interaction.optionGroupId)
  const associated = group ? choiceMedia(question.presentation, group) : undefined
  const options = associated?.options ?? []
  const kind = group ? choicePresentationKind(question, group) : 'vertical'
  const optionMedia = options.flatMap(({ media }) => media)
  const [readiness, setReadiness] = useState<Record<string, MediaReadiness>>(() => Object.fromEntries(optionMedia.map((item) => [item.mediaId, 'loading' as const])))
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [submissionFailed, setSubmissionFailed] = useState(false)
  const [mediaAttempt, setMediaAttempt] = useState(0)
  const sending = useRef(false)
  const availability = (id: string, _ready: boolean, next: MediaReadiness) => setReadiness((old) => old[id] === next ? old : { ...old, [id]: next })
  const visual = (item: { mediaType: string; role: string }) => item.mediaType === 'image' || item.mediaType === 'svg'
  const unsupportedMedia = optionMedia.some((item) => !visual(item))
  const missingResponse = options.some(({ choice, media }) => !labelFor(choice) && media.length === 0)
  const missingCards = question.model === 'riasec' && interaction.responseFamily === 'single_select' && (group?.layout ?? question.presentation.layout) === 'option_cards' && (options.length !== 4 || options.some(({ media }) => !media.some((item) => item.role === 'option_image' && visual(item))))
  const orphanedRequired = associated?.orphaned.some((item) => item.role === 'option_image' || item.role === 'option' && visual(item)) ?? false
  const invalid = !group || !options.length || interaction.selectionMode !== 'single' || missingResponse || missingCards || unsupportedMedia || orphanedRequired
  const requiredOptionIds = options.flatMap(({ choice, media }) => media.filter((item) => item.role === 'option_image' || visual(item) && item.role !== 'option_icon' || !labelFor(choice)).map((item) => item.mediaId))
  const requiredMediaBlocked = stimulusBlocked || invalid || requiredOptionIds.some((id) => readiness[id] !== 'ready')
  const failed = optionMedia.some((item) => readiness[item.mediaId] === 'failed')
  const canSubmit = question.allowedOperations.includes('submit') && !busy && !locked && !saving && !requiredMediaBlocked
  const submit = async (id: string) => {
    if (sending.current || !canSubmit || !group?.choices.some((choice) => choice.optionId === id)) return
    sending.current = true
    setSelected(id)
    setSaving(true)
    setSubmissionFailed(false)
    try {
      const outcome = await onSubmit(id)
      if (outcome === 'not_sent') setSelected(null)
    } catch { setSubmissionFailed(true) }
    finally { sending.current = false; setSaving(false) }
  }
  if (invalid) return <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive"><span>This issued response format is unavailable.</span><Button type="button" variant="outline" disabled={busy} onClick={onCheck}>Check current state</Button></div>
  const scale = kind === 'riasec_rating' || kind === 'agreement'
  return <div aria-busy={saving || busy}>
    {group.prompt && !preceding.some((item) => same(group.prompt, item)) && <p className="mb-3 whitespace-pre-wrap break-words text-sm font-medium text-slate-700">{group.prompt}</p>}
    <div className={scale ? 'grid grid-cols-5 gap-1 sm:gap-2' : kind === 'riasec_cards' ? 'grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3' : 'grid grid-cols-1 gap-2 sm:gap-3'}>
      {options.map(({ choice, media: assets }, index) => {
        const text = labelFor(choice)
        const label = text || `Option image ${index + 1}`
        const active = selected === choice.optionId
        const issuedIcon = assets.some((item) => item.role === 'option_icon')
        return <button key={choice.optionId} type="button" aria-label={label} aria-pressed={active} disabled={!canSubmit} onClick={() => void submit(choice.optionId)} className={`relative flex min-h-12 min-w-0 rounded-xl border bg-white text-slate-900 transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:cursor-default ${active ? 'border-teal-800 bg-teal-50 ring-1 ring-inset ring-teal-800' : 'border-slate-200 enabled:hover:border-teal-500 enabled:hover:bg-teal-50/40'} ${scale ? 'flex-col items-center gap-1.5 px-1 py-3 text-center sm:gap-2 sm:px-2' : kind === 'riasec_cards' ? 'flex-col items-center gap-2 p-2 text-center sm:p-3' : 'w-full items-center gap-3 px-3 py-3 text-left sm:px-4'}`}>
          {!scale && kind !== 'riasec_cards' && <span aria-hidden="true" className={`size-4 shrink-0 rounded-full border ${active ? 'border-teal-800 bg-teal-800' : 'border-slate-400'}`} />}
          {kind === 'agreement' && !issuedIcon && <span aria-hidden="true" className="text-2xl leading-none sm:text-3xl">{agreementFaces[index]}</span>}
          {assets.length > 0 && <span className="flex min-w-0 w-full flex-wrap justify-center gap-2">{assets.map((item) => <AssessmentMedia key={`${item.mediaId}:${item.url}:${mediaAttempt}`} media={item} variant={item.role === 'option_icon' ? 'icon' : kind === 'riasec_cards' ? 'visual-option' : 'option'} alt={item.role === 'option_icon' ? '' : text ? '' : label} onAvailability={availability} retryable={false} />)}</span>}
          <span className={scale ? 'min-w-0 whitespace-pre-wrap break-words text-[11px] leading-4 sm:text-sm sm:leading-5 [overflow-wrap:anywhere]' : 'min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-5 [overflow-wrap:anywhere]'}>{text || label}</span>
          <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center">{active && (saving || busy) ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : active ? <span className="size-2.5 rounded-full bg-teal-800" /> : null}</span>
        </button>
      })}
    </div>
    {failed && <div role="alert" className="mt-3 flex flex-wrap items-center gap-2 text-sm text-destructive"><span>A picture could not load. Retry the pictures before continuing.</span><Button type="button" variant="outline" disabled={busy || locked} onClick={() => { setReadiness(Object.fromEntries(optionMedia.map((item) => [item.mediaId, 'loading' as const]))); setMediaAttempt((value) => value + 1) }}>Retry media</Button></div>}
    {submissionFailed && <div role="alert" className="mt-3 flex flex-wrap items-center gap-2 text-sm text-destructive"><span>Unable to submit this answer. Check the current state before continuing.</span><Button type="button" variant="outline" disabled={busy} onClick={onCheck}>Check current state</Button></div>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3"><Button type="button" variant="outline" disabled title="Previous answers cannot be changed yet">Previous</Button><p role="status" aria-live="polite" className="min-h-5 text-sm text-teal-900">{saving || busy && selected ? 'Saving your answer…' : locked ? 'Your answer is selected. Check its status before continuing.' : ''}</p></div>
  </div>
}
