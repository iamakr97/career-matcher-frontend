import { useState } from 'react'

import { QuestionMedia } from '@/components/questions/QuestionMedia'
import { humanize } from '@/components/questions/format'
import type { OptionGroup, PreviewQuestion, ResolvedAsset } from '@/types/question'

interface Props { question: PreviewQuestion; assets: ResolvedAsset[] }

function OptionStep({ group, selectionMode, assets, layout, selected, onSelect }: {
  group: OptionGroup; selectionMode: 'single' | 'multiple'; assets: ResolvedAsset[]; layout: string
  selected: string[]; onSelect: (optionId: string) => void
}) {
  const cards = layout === 'image_cards' || layout === 'image_comparison'
  return (
    <section className="space-y-4">
      {group.prompt && <p className="whitespace-pre-line text-base font-medium leading-7 text-slate-800">{group.prompt}</p>}
      <p className="text-xs text-slate-500">{selectionMode === 'multiple' ? 'Select any that apply' : 'Select one'} · Reviewer preview only</p>
      <div className={cards ? 'grid gap-3 sm:grid-cols-2' : 'space-y-2'}>
        {group.choices.map((option) => {
          const active = selected.includes(option.optionId)
          const authoredParts = [option.text, option.pair?.join(' / '), option.values?.join(', '), option.value].filter((part): part is string => !!part)
          const label = [...new Set(authoredParts)].join(' · ') || option.media?.altText || option.optionId
          return (
            <button key={option.optionId} type="button" aria-pressed={active} onClick={() => onSelect(option.optionId)} className={`w-full min-w-0 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${active ? 'border-teal-700 bg-teal-50' : 'border-slate-200 bg-white hover:border-teal-300'}`}>
              {option.media && <QuestionMedia media={option.media} assets={assets} compact />}
              <span className="mt-2 flex items-start gap-3">
                <span aria-hidden="true" className={`mt-1 block size-4 shrink-0 border ${selectionMode === 'single' ? 'rounded-full' : 'rounded'} ${active ? 'border-teal-800 bg-teal-800 shadow-[inset_0_0_0_3px_white]' : 'border-slate-400'}`} />
                <span className="min-w-0 whitespace-pre-line text-sm leading-6 text-slate-800 break-words">{label}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function ChoicePreview({ question, assets }: Props) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const groups = question.presentation.options || []
  const interaction = question.interaction
  const steps = interaction.kind === 'choice'
    ? [{ stepId: 'choice', optionGroupId: interaction.optionGroupId, selectionMode: interaction.selectionMode }]
    : interaction.kind === 'conditional_choice' ? interaction.steps : []
  const missing = steps.filter((step) => !groups.some((group) => group.groupId === step.optionGroupId))
  const choose = (stepId: string, optionId: string, selectionMode: 'single' | 'multiple') => {
    setAnswers((previous) => {
      const current = previous[stepId] || []
      const next = selectionMode === 'multiple'
        ? current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
        : [optionId]
      const updated: Record<string, string[]> = { ...previous, [stepId]: next }
      const start = steps.findIndex((step) => step.stepId === stepId)
      steps.slice(start + 1).forEach((step) => { delete updated[step.stepId] })
      return updated
    })
  }
  return (
    <div className="mt-8 space-y-8 border-t border-slate-200 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Response preview</h3>
        {'responseFamily' in interaction && interaction.responseFamily && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{humanize(interaction.responseFamily)}</span>}
      </div>
      {steps.map((step, index) => {
        const group = groups.find((entry) => entry.groupId === step.optionGroupId)
        if (!group) return null
        if ('showWhen' in step && step.showWhen) {
          const condition = step.showWhen
          if (!(answers[condition.stepId] || []).some((id) => condition.optionIds.includes(id))) return null
        }
        return <div key={step.stepId}>
          {steps.length > 1 && <p className="mb-3 text-xs font-semibold text-teal-800">Step {index + 1} · {humanize(step.stepId)}</p>}
          <OptionStep group={group} selectionMode={step.selectionMode} assets={assets} layout={group.layout || question.presentation.layout} selected={answers[step.stepId] || []} onSelect={(optionId) => choose(step.stepId, optionId, step.selectionMode)} />
        </div>
      })}
      {missing.length > 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Unsupported or missing response configuration: {missing.map((step) => step.optionGroupId).join(', ')}. See Question details.</p>}
    </div>
  )
}
