import { ChevronLeft, ChevronRight } from 'lucide-react'

import { ChoicePreview } from '@/components/questions/ChoicePreview'
import { QuestionMedia } from '@/components/questions/QuestionMedia'
import { chcBroadNames } from '@/components/questions/QuestionModels'
import { SpecializedPreview } from '@/components/questions/SpecializedPreview'
import type { ComicDraft } from '@/components/questions/pisa/ComicBuilder'
import { humanize } from '@/components/questions/format'
import type { DetailData, ModelsData, PreviewQuestion } from '@/types/question'

interface Props {
  data: DetailData
  choiceDraft: Record<string, string[]>
  onChoiceDraftChange: (id: string, answers: Record<string, string[]>) => void
  comicDraft?: ComicDraft
  onComicDraftChange: (draft: ComicDraft) => void
  onNavigate: (id: string) => void
}

const categoryName = (question: PreviewQuestion, category: PreviewQuestion['classification']['categories'][number]) =>
  question.model === 'chc' && category.axis === 'broad_ability' && category.code
    ? chcBroadNames[category.code] ?? category.name : category.name

// The center keeps source wording and response controls; scientific metadata lives in the inspector.
export function QuestionPreview({ data, choiceDraft, onChoiceDraftChange, comicDraft, onComicDraftChange, onNavigate }: Props) {
  const { question, resolvedAssets, navigation } = data
  const media = (question.presentation.media ?? []).filter((item) =>
    item.role !== 'palette' && item.role !== 'baseline' && item.role !== 'option')
  const choice = question.interaction.kind === 'choice' || question.interaction.kind === 'conditional_choice'
  const adjacentMedia = choice && question.presentation.layout === 'option_list' && media.length === 1 &&
    ['image', 'svg'].includes(media[0]?.mediaType ?? '')
  const situational = question.model === 'big_five' || question.model === 'oecd_sses'

  return <div className="min-w-0">
    <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
      <p className="text-xs font-medium tabular-nums text-muted-foreground">Question {navigation.position} of {navigation.total}</p>
      {question.presentation.title && question.presentation.title !== question.questionText &&
        <p className="text-sm font-semibold text-primary">{question.presentation.title}</p>}
      <h2 className="max-w-[72ch] whitespace-pre-line break-words text-[20px] font-semibold leading-[1.35] tracking-tight text-slate-950 sm:text-[22px]">{question.questionText}</h2>
      {question.description && <section className="rounded-xl bg-secondary px-4 py-3.5">
        <h3 className="mb-1.5 text-[13px] font-semibold text-secondary-foreground">{situational ? 'Scenario' : 'Context'}</h3>
        <p className="whitespace-pre-line text-[15px] leading-[1.55] text-slate-700">{question.description}</p>
      </section>}
      {question.instructions && <section className="rounded-xl bg-muted px-4 py-3">
        <h3 className="mb-1 text-[13px] font-semibold text-slate-700">Instructions</h3>
        <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{question.instructions}</p>
      </section>}
      {question.helperText && <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{question.helperText}</p>}
      {choice ? <div className={adjacentMedia ? 'grid min-w-0 gap-5 xl:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] xl:items-start' : 'min-w-0 space-y-4'}>
        {!!media.length && <div className={adjacentMedia ? 'min-w-0' : media.length > 1 ? 'grid gap-4 sm:grid-cols-2' : 'max-w-2xl'}>
          {media.map((item, index) => <QuestionMedia key={item.mediaId ?? item.fileKey ?? index} media={item} assets={resolvedAssets} variant={media.length > 1 ? 'sequence' : item.role === 'stimulus' ? 'stimulus' : 'supporting'} enlargeable />)}
        </div>}
        <ChoicePreview question={question} assets={resolvedAssets} adjacentMedia={adjacentMedia} answers={choiceDraft} onAnswersChange={(answers) => onChoiceDraftChange(question.questionId, answers)} />
      </div> : <SpecializedPreview question={question} assets={resolvedAssets} comicDraft={comicDraft} onComicDraftChange={onComicDraftChange} />}
    </div>
    <nav aria-label="Question navigation" className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-card/95 px-5 py-3 backdrop-blur-sm sm:px-6">
      <button type="button" disabled={!navigation.previousQuestionId} onClick={() => navigation.previousQuestionId && onNavigate(navigation.previousQuestionId)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:border-primary hover:bg-secondary disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><ChevronLeft aria-hidden="true" className="size-4" />Previous</button>
      <button type="button" disabled={!navigation.nextQuestionId} onClick={() => navigation.nextQuestionId && onNavigate(navigation.nextQuestionId)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Next<ChevronRight aria-hidden="true" className="size-4" /></button>
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
  return <dl className="text-[13px] leading-5">{rows.map(([label, value], index) =>
    <div key={`${label}-${index}`} className="grid grid-cols-[minmax(0,6.3rem)_minmax(0,1fr)] gap-3 border-t border-border py-3 first:border-0">
      <dt className="text-muted-foreground">{label}</dt><dd className="min-w-0 break-words font-medium text-foreground">{value}</dd>
    </div>)}</dl>
}

export function QuestionInspector({ data, models }: { data: DetailData; models?: ModelsData }) {
  const { question } = data
  const modelLabel = models?.items.find((item) => item.model === question.model)?.label ?? question.model
  const card = 'rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5'
  return <>
    <details className={`${card} xl:hidden`}><summary className="cursor-pointer text-base font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary">Question details</summary><div className="mt-3"><DetailsRows question={question} modelLabel={modelLabel} /></div></details>
    <section aria-labelledby="question-details-heading" className={`${card} hidden xl:block`}><h2 id="question-details-heading" className="mb-2 text-base font-semibold text-foreground">Question details</h2><DetailsRows question={question} modelLabel={modelLabel} /></section>
  </>
}
