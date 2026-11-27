import { useRef, useState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { AssessmentMedia } from '@/components/assessment/AssessmentMedia'
import { Button } from '@/components/ui/button'
import { choiceMedia } from '@/lib/assessment-media'
import type { OperationOutcome } from '@/hooks/useAssessmentSession'
import type { AssessmentChoiceInteractionDto, AssessmentQuestionDto } from '@/types/assessment'

interface Props { question: AssessmentQuestionDto; interaction: AssessmentChoiceInteractionDto; busy: boolean; locked: boolean; onSubmit: (selected: string) => Promise<OperationOutcome> }
const agreementFaces = ['😟', '🙁', '😐', '🙂', '😄']
const agreementLabels = ['strongly disagree', 'disagree', 'neither agree nor disagree', 'agree', 'strongly agree']

export const ChoiceQuestion = ({ question, interaction, busy, locked, onSubmit }: Props) => {
  const group = question.presentation.options.find((item) => item.groupId === interaction.optionGroupId)
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const sending = useRef(false)
  const [failed, setFailed] = useState<string[]>([])
  const [mediaAttempt, setMediaAttempt] = useState(0)
  const [pendingMedia, setPendingMedia] = useState<string[]>(() => group ? choiceMedia(question.presentation, group).options.flatMap(({ choice, media }) => !choice.text && !choice.value && !choice.pair?.length && !choice.values?.length ? media.map((item) => item.mediaId) : []) : [])
  if (!group || interaction.selectionMode !== 'single') return <p role="alert">This issued response format is unavailable.</p>
  const { options, orphaned } = choiceMedia(question.presentation, group)
  const layout = group.layout ?? question.presentation.layout
  const iconRow = question.model === 'riasec' && interaction.responseFamily === 'single_select' && layout === 'option_list' && options.length === 5 && options.every(({ media }) => media.some((item) => item.role === 'option_icon'))
  const visualCards = question.model === 'riasec' && interaction.responseFamily === 'single_select' && layout === 'option_cards' && options.length === 4 && options.every(({ media }) => media.some((item) => item.role === 'option_image'))
  const agreement = question.model === 'oecd_sses' && interaction.responseFamily === 'agreement' && options.length === 5 && options.every(({ choice }, index) => (choice.text ?? choice.value ?? '').trim().toLowerCase() === agreementLabels[index])
  const row = iconRow || visualCards || agreement
  const availability = (id: string, ready: boolean) => {
    setFailed((old) => ready ? old.filter((item) => item !== id) : old.includes(id) ? old : [...old, id])
    setPendingMedia((old) => ready ? old.filter((item) => item !== id) : old.includes(id) ? old : [...old, id])
  }
  const essentialOptionFailed = options.some(({ choice, media }) => !choice.text && !choice.value && !choice.pair?.length && !choice.values?.length && media.length === 0) || pendingMedia.length > 0
  const submit = async (id: string) => {
    if (sending.current || busy || locked || essentialOptionFailed || !question.allowedOperations.includes('submit')) return
    sending.current = true
    setSelected(id)
    setSaving(true)
    const outcome = await onSubmit(id)
    if (outcome !== 'accepted') { sending.current = false; setSaving(false) }
  }
  return <div aria-busy={saving || busy}>
    {group.prompt && <p className="mb-3 text-sm font-medium text-slate-700">{group.prompt}</p>}
    <div className={visualCards ? 'overflow-x-auto px-0.5 py-1' : ''}>
      <div className={iconRow || agreement ? 'grid grid-cols-5 gap-1.5 sm:gap-2' : visualCards ? 'grid min-w-[36rem] grid-cols-4 gap-2 sm:min-w-0' : 'grid gap-2'}>
        {options.map(({ choice, media: assets }, index) => {
          const label = choice.text || choice.pair?.join(' · ') || choice.values?.join(' · ') || choice.value || assets[0]?.altText || `Option ${index + 1}`
          const active = selected === choice.optionId
          const issuedIcon = assets.some((item) => item.role === 'option_icon')
          return <button key={choice.optionId} type="button" aria-label={label} aria-pressed={active} disabled={busy || locked || saving || essentialOptionFailed} onClick={() => void submit(choice.optionId)} className={`relative flex min-w-0 rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:cursor-default ${row ? 'flex-col items-center gap-2 text-center' : 'w-full items-center gap-3'} ${iconRow || agreement ? 'px-1 py-3 sm:px-2' : ''} ${active ? 'border-teal-800 bg-teal-50 shadow-[inset_0_0_0_1px_#115e59]' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
            {agreement && !issuedIcon && <span aria-hidden="true" className="text-2xl leading-none">{agreementFaces[index]}</span>}
            {assets.length > 0 && <span className={`flex min-w-0 flex-wrap justify-center gap-2 ${visualCards ? 'w-full' : ''}`}>{assets.map((item) => <AssessmentMedia key={`${item.mediaId}:${item.url}:${mediaAttempt}`} media={item} variant={iconRow || agreement && item.role === 'option_icon' ? 'icon' : 'option'} alt={choice.text ? '' : label} onAvailability={availability} retryable={false} />)}</span>}
            <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-5 [overflow-wrap:anywhere]">{label}</span>
            <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center">{active && (saving || busy) ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : active ? <Check className="size-4 text-teal-800" /> : null}</span>
          </button>
        })}
      </div>
    </div>
    <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-teal-900">{saving || busy && selected ? 'Saving your answer…' : ''}</p>
    {orphaned.length > 0 && <p role="alert" className="mt-2 text-xs text-destructive">Some option media has no issued option association.</p>}
    {failed.length > 0 && <div role="alert" className="mt-2 flex items-center gap-2 text-xs text-destructive"><span>Some option media could not load. Text responses remain available where complete.</span><Button type="button" variant="outline" size="sm" onClick={() => { setFailed([]); setMediaAttempt((value) => value + 1) }}>Retry media</Button></div>}
    <div className="mt-3 border-t border-slate-100 pt-4"><Button type="button" variant="outline" disabled>Previous</Button></div>
  </div>
}
