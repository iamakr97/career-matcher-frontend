import { ChevronLeft, ChevronRight } from 'lucide-react'

import { ChoicePreview } from '@/components/questions/ChoicePreview'
import { QuestionMedia } from '@/components/questions/QuestionMedia'
import { chcBroadNames } from '@/components/questions/QuestionModels'
import { SpecializedPreview } from '@/components/questions/SpecializedPreview'
import { humanize } from '@/components/questions/format'
import type { DetailData, ModelsData, PreviewQuestion } from '@/types/question'

interface Props { data: DetailData; models?: ModelsData; position?: number; total?: number; onNavigate: (id: string) => void }

const categoryName = (question: PreviewQuestion, category: PreviewQuestion['classification']['categories'][number]) =>
  question.model === 'chc' && category.axis === 'broad_ability' && category.code ? chcBroadNames[category.code] ?? category.name : category.name

export function QuestionPreview({ data, models, position, total, onNavigate }: Props) {
  const { question, resolvedAssets, navigation } = data
  const modelLabel = models?.items.find((item) => item.model === question.model)?.label ?? question.model
  const media = question.presentation.media ?? []
  const choice = question.interaction.kind === 'choice' || question.interaction.kind === 'conditional_choice'
  const adjacentMedia = choice && question.presentation.layout === 'option_list' && media.length === 1 && ['image', 'svg'].includes(media[0]?.mediaType ?? '')
  const situational = question.model === 'big_five' || question.model === 'oecd_sses'
  const format = `${humanize(question.presentation.mode)} + ${humanize(question.presentation.layout)}`

  return <div className="min-w-0">
    <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-5 text-slate-600"><span className="font-semibold text-slate-800">{modelLabel}</span>{question.classification.categories.map((category, index) => <span key={`${category.axis}-${index}`} className="min-w-0 break-words"><span aria-hidden="true" className="mr-2 text-slate-300">/</span>{humanize(category.axis)}: <span className="font-medium text-slate-700">{categoryName(question, category)}{category.code ? ` (${category.code})` : ''}</span></span>)}</div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
        {question.classification.primaryMeasureCode && <span className="rounded-full bg-blue-600 px-3 py-1.5 font-semibold text-white">Primary measure: {question.classification.primaryMeasureCode}</span>}
        <span className="rounded-full bg-blue-50 px-3 py-1.5 font-medium text-slate-700">{humanize(question.interaction.kind)}</span>
        <span className="rounded-full bg-blue-50 px-3 py-1.5 font-medium text-slate-700">{format}</span>
      </div>
      <p className="mt-3 break-words text-sm text-slate-500">Question ID <span className="font-medium text-slate-700">{question.questionId}</span>{position !== undefined && total !== undefined && <span className="ml-2 whitespace-nowrap">· Question {position} of {total} matching</span>}</p>
    </div>

    <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
      {question.presentation.title && question.presentation.title !== question.questionText && <p className="text-sm font-semibold text-blue-700">{question.presentation.title}</p>}
      <div><p className="mb-2 inline-flex rounded-full bg-blue-50 px-3 py-0.5 text-[13px] font-semibold text-blue-700">{question.interaction.kind === 'constructed_activity' ? 'Task' : 'Question'}</p><h2 className="max-w-[72ch] whitespace-pre-line break-words text-[20px] font-semibold leading-[1.35] tracking-tight text-slate-950 sm:text-[22px]">{question.questionText}</h2></div>
      {question.description && <div className="rounded-xl bg-blue-50/70 px-4 py-3.5"><p className="mb-1.5 text-[13px] font-semibold text-blue-700">{situational ? 'Scenario' : 'Context'}</p><p className="whitespace-pre-line text-[15px] leading-[1.55] text-slate-700">{question.description}</p></div>}
      {question.instructions && <div className="rounded-xl bg-slate-50 px-4 py-3"><p className="mb-1 text-[13px] font-semibold text-blue-700">Instructions</p><p className="whitespace-pre-line text-sm leading-6 text-slate-700">{question.instructions}</p></div>}
      {question.helperText && <div className="rounded-xl bg-blue-50/50 px-4 py-3"><p className="mb-1 text-[13px] font-semibold text-blue-700">Helper text</p><p className="whitespace-pre-line text-sm leading-6 text-slate-700">{question.helperText}</p></div>}
      {choice ? <div className={adjacentMedia ? 'grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] xl:items-start' : 'min-w-0 space-y-4'}>
        {!!media.length && <div className={adjacentMedia ? 'min-w-0' : media.length > 1 ? 'grid gap-4 sm:grid-cols-2' : 'max-w-2xl'}>{media.map((item, index) => <QuestionMedia key={item.mediaId ?? item.fileKey ?? index} media={item} assets={resolvedAssets} variant={media.length > 1 ? 'sequence' : item.role === 'stimulus' ? 'stimulus' : 'supporting'} enlargeable />)}</div>}
        <ChoicePreview question={question} assets={resolvedAssets} adjacentMedia={adjacentMedia} />
      </div> : <SpecializedPreview question={question} assets={resolvedAssets} />}
    </div>

    <nav aria-label="Question navigation" className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur-sm sm:px-6">
      <button type="button" disabled={!navigation.previousQuestionId} onClick={() => navigation.previousQuestionId && onNavigate(navigation.previousQuestionId)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"><ChevronLeft aria-hidden="true" className="size-4" />Previous</button>
      <button type="button" disabled={!navigation.nextQuestionId} onClick={() => navigation.nextQuestionId && onNavigate(navigation.nextQuestionId)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Next<ChevronRight aria-hidden="true" className="size-4" /></button>
    </nav>
  </div>
}

function DetailsRows({ question, modelLabel }: { question: PreviewQuestion; modelLabel: string }) {
  const rows = [
    ['Model', modelLabel],
    ...question.classification.categories.map((category) => [humanize(category.axis), `${categoryName(question, category)}${category.code ? ` (${category.code})` : ''}`] as const),
    ['Primary measure', question.classification.primaryMeasureCode],
    ['Response type', humanize(question.interaction.kind)],
    ['Format', `${humanize(question.presentation.mode)} + ${humanize(question.presentation.layout)}`],
    ['Question ID', question.questionId],
  ].filter((row) => row[1])
  return <><dl className="text-[13px] leading-5">{rows.map(([label, value], index) => <div key={`${label}-${index}`} className="grid grid-cols-[minmax(0,6.3rem)_minmax(0,1fr)] gap-3 border-t border-slate-200 py-3 first:border-0"><dt className="text-slate-500">{label}</dt><dd className="min-w-0 break-words font-medium text-slate-800">{value}</dd></div>)}</dl><p className="mt-2 rounded-xl bg-blue-50 px-3 py-3 text-xs leading-5 text-blue-800">Reviewer preview only.</p></>
}

export function QuestionInspector({ data, models }: { data: DetailData; models?: ModelsData }) {
  const { question } = data
  const modelLabel = models?.items.find((item) => item.model === question.model)?.label ?? question.model
  const card = 'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_3px_18px_rgba(30,58,138,0.04)] sm:p-5'
  return <>
    <details className={`${card} xl:hidden`}><summary className="cursor-pointer text-base font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600">Question details</summary><div className="mt-3"><DetailsRows question={question} modelLabel={modelLabel} /></div></details>
    <section aria-labelledby="question-details-heading" className={`${card} hidden xl:block`}><h2 id="question-details-heading" className="mb-2 text-base font-semibold text-slate-900">Question details</h2><DetailsRows question={question} modelLabel={modelLabel} /></section>
  </>
}
