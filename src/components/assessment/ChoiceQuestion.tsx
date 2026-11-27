import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { AssessmentMedia } from '@/components/assessment/AssessmentMedia'
import { Button } from '@/components/ui/button'
import { choiceMedia } from '@/lib/assessment-media'
import type { AssessmentChoiceInteractionDto, AssessmentQuestionDto } from '@/types/assessment'

interface Props { assessmentId: string; question: AssessmentQuestionDto; interaction: AssessmentChoiceInteractionDto; busy: boolean; locked: boolean; onSubmit: (selected: string) => void }
export const ChoiceQuestion = ({ assessmentId, question, interaction, busy, locked, onSubmit }: Props) => {
  const group = question.presentation.options.find((item) => item.groupId === interaction.optionGroupId)
  const [selected, setSelected] = useState<string | null>(null)
  const sent = useRef(false)
  const [failed, setFailed] = useState<string[]>(() => group ? choiceMedia(question.presentation, group).options.flatMap(({ choice, media }) => !choice.text && !choice.value && !choice.pair?.length && !choice.values?.length ? media.map((item) => item.mediaId) : []) : [])
  useEffect(() => { if (!busy && !locked) sent.current = false }, [busy, locked])
  if (!group || interaction.selectionMode !== 'single') return <p role="alert">This issued response format is unavailable.</p>
  const { options, orphaned } = choiceMedia(question.presentation, group)
  const media = options.flatMap((item) => item.media)
  const iconRow = interaction.responseFamily === 'single_select' && media.some((item) => item.role === 'option_icon') && options.length === 5
  const visualCards = interaction.responseFamily === 'single_select' && media.some((item) => item.role === 'option_image') && options.length === 4
  const scale = interaction.responseFamily === 'picture_comparison' || ['frequency', 'feeling_intensity', 'agreement', 'functioning_degree', 'future_expectation', 'NEEDS_5', 'REASONS_4', 'confidence_5', 'expectation_5', 'intention_5'].includes(interaction.responseFamily)
  const shortRow = !iconRow && !visualCards && !scale && options.length >= 3 && options.length <= 4 && options.every(({ choice }) => (choice.text ?? choice.value ?? '').length <= 80)
  const row = iconRow || visualCards || scale || shortRow
  const availability = (id: string, ready: boolean) => setFailed((old) => ready ? old.filter((item) => item !== id) : old.includes(id) ? old : [...old, id])
  const essentialOptionFailed = options.some(({ choice, media }) => !choice.text && !choice.value && !choice.pair?.length && !choice.values?.length && (media.length === 0 || media.some((item) => failed.includes(item.mediaId))))
  const usable = selected !== null && group.choices.some((item) => item.optionId === selected) && !essentialOptionFailed && question.allowedOperations.includes('submit') && !busy && !locked
  return <form onSubmit={(event) => { event.preventDefault(); if (usable && selected && !sent.current) { sent.current = true; onSubmit(selected) } }}>
    <fieldset disabled={busy || locked} className="min-w-0"><legend className="text-sm font-medium text-slate-700">{group.prompt || 'Choose one response'}</legend>
      <div className={row ? 'mt-3 overflow-x-auto pb-2' : 'mt-3'}><div className={row ? `grid min-w-max gap-2 sm:min-w-0 ${visualCards ? 'grid-cols-4' : iconRow || scale && options.length === 5 ? 'grid-cols-5' : options.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}` : 'grid gap-2 sm:grid-cols-2'}>
        {options.map(({ choice, media: assets }, index) => {
          const label = choice.text || choice.pair?.join(' · ') || choice.values?.join(' · ') || choice.value || assets[0]?.altText || `Option ${index + 1}`
          const active = selected === choice.optionId
          return <label key={choice.optionId} className={`relative flex cursor-pointer rounded-xl border p-3 outline-none transition-colors focus-within:ring-2 focus-within:ring-teal-700 ${row ? `min-w-28 ${visualCards ? 'sm:min-w-0' : ''}` : ''} ${iconRow || visualCards ? 'flex-col items-center text-center' : 'items-start gap-2'} ${active ? 'border-teal-800 bg-teal-50 ring-1 ring-teal-800' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
            <input type="radio" name={`choice-${assessmentId}-${question.attemptId}`} value={choice.optionId} checked={active} onChange={() => setSelected(choice.optionId)} className={iconRow || visualCards ? 'sr-only' : 'mt-0.5 accent-teal-800'} />
            {(iconRow || visualCards) && <span aria-hidden="true" className={`absolute right-2 top-2 grid size-5 place-items-center rounded-full border ${active ? 'border-teal-800 bg-teal-800 text-white' : 'border-slate-400 bg-white'}`}>{active && <Check className="size-3" />}</span>}
            {assets.length > 0 && <span className={`flex flex-wrap justify-center gap-2 ${iconRow ? 'mb-2' : visualCards ? 'mb-3 w-full' : 'order-2'}`}>{assets.map((item) => <AssessmentMedia key={`${item.mediaId}:${item.url}`} media={item} variant={iconRow ? 'icon' : 'option'} alt={choice.text ? '' : label} onAvailability={availability} />)}</span>}
            <span className="whitespace-pre-wrap break-words text-sm leading-5">{label}</span>
          </label>
        })}
      </div></div>
    </fieldset>
    {orphaned.length > 0 && <p role="alert" className="mt-2 text-xs text-destructive">Some option media has no issued option association.</p>}
    {failed.length > 0 && <p role="alert" className="mt-2 text-xs text-destructive">Some option media could not load. Use Retry media; text responses remain available where complete.</p>}
    <div className="mt-5 flex justify-end"><Button className="w-full bg-teal-900 hover:bg-teal-800 sm:w-auto" type="submit" disabled={!usable}>Next <span aria-hidden="true">→</span></Button></div>
  </form>
}
