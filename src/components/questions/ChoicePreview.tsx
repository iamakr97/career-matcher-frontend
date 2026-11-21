import { useState } from 'react'

import { QuestionMedia } from '@/components/questions/QuestionMedia'
import type { OptionGroup, PreviewQuestion, QuestionOption, ResolvedAsset } from '@/types/question'

interface BaseProps { question: PreviewQuestion; assets: ResolvedAsset[]; adjacentMedia?: boolean }
interface Props extends BaseProps { answers: Record<string, string[]>; onAnswersChange: (answers: Record<string, string[]>) => void }

const optionLabel = (option: QuestionOption) =>
  option.text ?? option.pair?.join(' / ') ?? option.values?.join(', ') ?? option.value ?? option.media?.altText ?? option.optionId

function OptionStep({ questionId, stepId, group, selectionMode, assets, layout, selected, onSelect }: {
  questionId: string; stepId: string; group: OptionGroup; selectionMode: 'single' | 'multiple'
  assets: ResolvedAsset[]; layout: string; selected: string[]; onSelect: (optionId: string) => void
}) {
  const cards = layout === 'image_cards' || layout === 'image_comparison' || group.choices.some((choice) => choice.media)
  return <section className="space-y-3" aria-label={group.prompt || 'Response options'}>
    {group.prompt && <p className="whitespace-pre-line text-[15px] font-medium leading-6 text-slate-800">{group.prompt}</p>}
    <div className={cards ? 'grid gap-3 sm:grid-cols-2' : 'space-y-2'}>
      {group.choices.map((option) => {
        const active = selected.includes(option.optionId)
        const inputId = `${questionId}-${stepId}-${option.optionId}`
        const label = optionLabel(option)
        return <div key={option.optionId} className={`min-w-0 rounded-xl border bg-white px-4 py-3 shadow-[0_1px_3px_rgba(30,58,138,0.03)] transition-colors focus-within:ring-2 focus-within:ring-blue-500 ${active ? 'border-blue-600 bg-blue-50/70' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/50'} ${cards ? 'space-y-3' : ''}`}>
          {option.media && <QuestionMedia media={option.media} assets={assets} variant="option" enlargeable />}
          <div className="flex min-h-5 items-start gap-3">
            <input id={inputId} name={`${questionId}-${stepId}`} type={selectionMode === 'single' ? 'radio' : 'checkbox'} checked={active} onChange={() => onSelect(option.optionId)} aria-label={label || option.optionId} className="mt-0.5 size-[18px] shrink-0 accent-blue-600" />
            <label htmlFor={inputId} className="min-w-0 flex-1 cursor-pointer whitespace-pre-line break-words text-[15px] leading-6 text-slate-800">{label}</label>
          </div>
        </div>
      })}
    </div>
  </section>
}

function ChoiceResponse({ question, assets, adjacentMedia = false, answers, onAnswersChange }: Props) {
  const groups = question.presentation.options ?? []
  const interaction = question.interaction
  const steps = interaction.kind === 'choice'
    ? [{ stepId: 'choice', optionGroupId: interaction.optionGroupId, selectionMode: interaction.selectionMode }]
    : interaction.kind === 'conditional_choice' ? interaction.steps : []

  const choose = (stepId: string, optionId: string, selectionMode: 'single' | 'multiple') => {
    const current = answers[stepId] ?? []
    const next = selectionMode === 'multiple'
      ? current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
      : [optionId]
    const updated: Record<string, string[]> = { ...answers, [stepId]: next }
    steps.forEach((step) => {
      if ('showWhen' in step && step.showWhen &&
        !(updated[step.showWhen.stepId] ?? []).some((id) => step.showWhen?.optionIds.includes(id))) {
        delete updated[step.stepId]
      }
    })
    onAnswersChange(updated)
  }

  return <div className={`min-w-0 space-y-3 ${adjacentMedia ? '' : 'border-t border-slate-200 pt-4'}`}>
    {steps.map((step, index) => {
      const group = groups.find((entry) => entry.groupId === step.optionGroupId)
      if (!group || !group.choices.length) return <p key={step.stepId} role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">Response group {step.optionGroupId} is unavailable.</p>
      if (interaction.kind === 'conditional_choice') {
        const condition = 'showWhen' in step ? step.showWhen : undefined
        const referenceIndex = condition ? steps.findIndex((entry) => entry.stepId === condition.stepId) : -1
        const referencedGroup = referenceIndex >= 0 ? groups.find((entry) => entry.groupId === steps[referenceIndex].optionGroupId) : undefined
        const invalidOptions = condition && (!condition.optionIds.length || condition.optionIds.some((id) => !referencedGroup?.choices.some((choice) => choice.optionId === id)))
        if ((index > 0 && !condition) || (condition && (referenceIndex < 0 || referenceIndex >= index || invalidOptions))) {
          return <p key={step.stepId} role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">Conditional response {step.stepId} has an unavailable condition.</p>
        }
        if (condition && !(answers[condition.stepId] ?? []).some((id) => condition.optionIds.includes(id))) return null
      }
      return <div key={step.stepId} className="space-y-2">
        {steps.length > 1 && <p className="text-xs font-semibold text-blue-700">Step {index + 1}</p>}
        <OptionStep questionId={question.questionId} stepId={step.stepId} group={group} selectionMode={step.selectionMode} assets={assets} layout={group.layout ?? question.presentation.layout} selected={answers[step.stepId] ?? []} onSelect={(optionId) => choose(step.stepId, optionId, step.selectionMode)} />
      </div>
    })}
  </div>
}

export function ChoicePreview(props: Props) {
  return <ChoiceResponse {...props} />
}

export function StaticChoicePreview({ question, assets, optionGroupId, selectionMode }: BaseProps & { optionGroupId: string; selectionMode: 'single' | 'multiple' }) {
  const [selected, setSelected] = useState<string[]>([])
  const group = question.presentation.options?.find((entry) => entry.groupId === optionGroupId)
  if (!group || !group.choices.length) return <p role="status" className="text-sm text-amber-800">Response group {optionGroupId} is unavailable.</p>
  const choose = (optionId: string) => setSelected((previous) => selectionMode === 'multiple'
    ? previous.includes(optionId) ? previous.filter((id) => id !== optionId) : [...previous, optionId]
    : [optionId])
  return <div className="border-t border-slate-200 pt-4">
    <OptionStep questionId={question.questionId} stepId="static-choice" group={group} selectionMode={selectionMode} assets={assets} layout={group.layout ?? question.presentation.layout} selected={selected} onSelect={choose} />
  </div>
}
