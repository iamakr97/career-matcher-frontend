import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AssessmentMedia } from '@/components/assessment/AssessmentMedia'
import type { AssessmentChoiceInteractionDto, AssessmentQuestionDto } from '@/types/assessment'
interface Props { assessmentId: string; question: AssessmentQuestionDto; interaction: AssessmentChoiceInteractionDto; busy: boolean; locked: boolean; onSubmit: (selected: string) => void }
export const ChoiceQuestion = ({ assessmentId, question, interaction, busy, locked, onSubmit }: Props) => {
  const group = question.presentation.options.find((item) => item.groupId === interaction.optionGroupId)
  const [selected, setSelected] = useState<string | null>(null)
  const [failedMedia, setFailedMedia] = useState<string[]>(() => group?.choices.flatMap((option) => option.media ? [option.media.mediaId] : []) ?? [])
  const taskKey = `${assessmentId}:${question.attemptId}:${question.currentStep}`
  const layout = group?.layout ?? question.presentation.layout
  if (!group || interaction.selectionMode !== 'single' || !['option_list', 'option_cards', 'scenario_choice', 'image_cards', 'image_comparison'].includes(layout)) return <p role="alert">This question needs a response format that is not available yet. Your assessment is saved.</p>
  const availability = (id: string, ready: boolean) => setFailedMedia((old) => ready ? old.filter((item) => item !== id) : old.includes(id) ? old : [...old, id])
  const cards = ['option_cards', 'image_cards', 'image_comparison'].includes(layout)
  const mediaIds = new Set<string>()
  for (const option of group.choices) if (option.media) mediaIds.add(option.media.mediaId)
  const usable = selected !== null && group.choices.some((item) => item.optionId === selected) && failedMedia.length === 0 && question.allowedOperations.includes('submit') && !busy && !locked
  return <form onSubmit={(event) => { event.preventDefault(); if (usable && selected) onSubmit(selected) }}><fieldset disabled={busy || locked} className="min-w-0"><legend className="font-semibold">{group.prompt || 'Choose one response'}</legend><div className={`mt-4 grid gap-3 ${cards ? 'sm:grid-cols-2' : ''}`}>{group.choices.map((option, index) => {
    const label = option.text?.trim() || option.pair?.join(' · ') || option.values?.join(' · ') || option.value?.trim() || option.media?.altText || `Option ${index + 1}`
    return <label key={option.optionId} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 focus-within:ring-2 focus-within:ring-primary ${selected === option.optionId ? 'border-primary bg-primary/5' : 'bg-card'}`}><input type="radio" name={`choice-${taskKey}`} value={option.optionId} checked={selected === option.optionId} onChange={() => setSelected(option.optionId)} className="mt-1 accent-primary" /><span className="grid min-w-0 gap-2"><span className="whitespace-pre-wrap break-words text-sm">{label}</span>{option.media && <AssessmentMedia key={`${option.media.mediaId}:${option.media.url}`} media={option.media} onAvailability={availability} />}</span></label>
  })}</div></fieldset><Button className="mt-6" type="submit" disabled={!usable}>Save &amp; Continue</Button>{failedMedia.length > 0 && <p role="alert" className="mt-2 text-sm text-destructive">Media must load before this response can be saved.</p>}</form>
}
