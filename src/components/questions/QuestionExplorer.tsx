import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Layers3 } from 'lucide-react'

import { QuestionInspector, QuestionPreview } from '@/components/questions/QuestionPreview'
import { QuestionList } from '@/components/questions/QuestionList'
import { QuestionModels } from '@/components/questions/QuestionModels'
import type { ComicDraft } from '@/components/questions/pisa/ComicBuilder'
import { errorStatus, errorText, readExplorerUrl } from '@/components/questions/format'
import { useGetQuestionDetailQuery, useGetQuestionFacetsQuery, useGetQuestionModelsQuery, useGetQuestionsQuery } from '@/services/questionApi'

const modelSpecific = ['primaryMeasureCode', 'categoryAxis', 'categoryCode', 'categoryName', 'interactionKind', 'presentationMode', 'presentationLayout']

export function QuestionExplorer() {
  const [params, setParams] = useSearchParams()
  const [choiceDrafts, setChoiceDrafts] = useState<Record<string, Record<string, string[]>>>({})
  const [comicDrafts, setComicDrafts] = useState<Record<string, ComicDraft>>({})
  const { filters, page, limit, questionId } = useMemo(() => readExplorerUrl(params), [params])
  const models = useGetQuestionModelsQuery()
  const chcFacets = useGetQuestionFacetsQuery('chc', { skip: filters.model !== 'chc' })
  const list = useGetQuestionsQuery({ ...filters, page, limit })
  const detail = useGetQuestionDetailQuery({ questionId: questionId || '', filters }, { skip: !questionId })
  const listData = list.currentData
  const detailData = detail.currentData

  const updateParams = useCallback((edit: (next: URLSearchParams) => void, replace = false) => {
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      edit(next)
      return next
    }, { replace })
  }, [setParams])

  const selectModel = useCallback((model?: string) => {
    updateParams((next) => {
      next.delete('model')
      if (model) next.set('model', model)
      modelSpecific.forEach((name) => next.delete(name))
      next.delete('question')
      next.delete('page')
    })
  }, [updateParams])

  const selectQuestion = useCallback((id: string) => updateParams((next) => next.set('question', id)), [updateParams])
  const selectArea = useCallback((axis?: string, code?: string | null, name?: string) => {
    updateParams((next) => {
      for (const key of ['categoryAxis', 'categoryCode', 'categoryName', 'question', 'page']) next.delete(key)
      if (axis) next.set('categoryAxis', axis)
      if (code) next.set('categoryCode', code)
      else if (name) next.set('categoryName', name)
    })
  }, [updateParams])
  const navigateQuestion = useCallback((id: string) => {
    updateParams((next) => {
      const items = listData?.items ?? []
      const at = items.findIndex((item) => item.questionId === id)
      if (at < 0 && detailData) {
        const targetPosition = detailData.navigation.nextQuestionId === id
          ? detailData.navigation.position + 1
          : detailData.navigation.previousQuestionId === id ? detailData.navigation.position - 1 : undefined
        if (targetPosition && targetPosition > 0) next.set('page', String(Math.ceil(targetPosition / limit)))
      }
      next.set('question', id)
    })
  }, [detailData, listData, limit, updateParams])

  useEffect(() => {
    if (!questionId && listData?.items.length) updateParams((next) => next.set('question', listData.items[0].questionId), true)
  }, [questionId, listData, updateParams])

  const detailStatus = errorStatus(detail.error)
  const recover = () => updateParams((next) => next.delete('question'))
  const updateChoiceDraft = (id: string, answers: Record<string, string[]>) => {
    setChoiceDrafts((previous) => ({ ...previous, [id]: answers }))
  }

  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-slate-200/80 bg-white shadow-[0_2px_12px_rgba(30,58,138,0.04)]">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6"><Link to="/" className="shrink-0 text-lg font-bold tracking-tight text-slate-900 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 sm:text-xl">Career Matcher</Link><span aria-hidden="true" className="h-6 w-px bg-slate-200" /><h1 className="truncate text-sm font-semibold text-slate-600 sm:text-base">Question Explorer</h1></div>
        <span className="flex shrink-0 items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold tabular-nums text-blue-700 sm:text-sm"><Layers3 aria-hidden="true" className="size-4" />{models.data?.total ?? '—'} <span className="max-sm:sr-only">questions</span></span>
      </div>
    </header>
    <main className="grid items-start gap-4 px-3 py-5 sm:px-5 lg:grid-cols-[minmax(235px,255px)_minmax(0,1fr)] xl:grid-cols-[clamp(250px,18vw,285px)_minmax(0,1fr)_clamp(240px,17vw,275px)] xl:px-6 xl:py-6">
      <aside aria-label="Question navigation" className="order-1 flex max-h-[min(40vh,20rem)] min-w-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-4 lg:col-start-1 lg:row-start-1 lg:max-h-[calc(100vh-6rem)] xl:p-5">
        {models.error && <div role="alert" className="rounded-lg bg-rose-50 p-2 text-xs text-rose-900">Models could not load: {errorText(models.error)} <button type="button" onClick={() => models.refetch()} className="font-semibold underline">Retry</button></div>}
        <QuestionModels data={models.data} selectedModel={filters.model} loading={models.isLoading} onSelect={selectModel} facets={chcFacets.data} facetsLoading={chcFacets.isFetching} facetsError={Boolean(chcFacets.error)} onFacetsRetry={() => chcFacets.refetch()} selectedAreaCode={filters.categoryCode} selectedAreaName={filters.categoryName} onAreaSelect={selectArea} />
        <QuestionList data={listData} selectedId={questionId} loading={list.isFetching && !listData} error={list.error ? errorText(list.error) : undefined} onRetry={() => list.refetch()} onSelect={selectQuestion} onPage={(target) => updateParams((next) => { next.set('page', String(target)); next.delete('question') })} />
      </aside>
      <section aria-label="Question presentation" className="order-2 min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-start-2 lg:row-start-1 xl:max-h-[calc(100vh-112px)] xl:overflow-y-auto">
        {detail.isFetching && !detailData ? <div className="space-y-4 p-5" aria-label="Loading question"><div className="h-5 w-2/3 animate-pulse rounded bg-slate-100" /><div className="h-10 w-full animate-pulse rounded bg-slate-100" /><div className="h-32 w-full animate-pulse rounded bg-slate-100" /></div>
          : detail.error ? <div className="p-5" role="alert"><h2 className="text-lg font-semibold text-slate-900">{detailStatus === 404 ? 'Question not found' : detailStatus === 400 ? 'Question outside these filters' : 'Question could not load'}</h2><p className="mt-2 text-sm text-slate-600">{errorText(detail.error)}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={recover} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">Show first matching question</button><button type="button" onClick={() => detail.refetch()} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Retry</button></div></div>
          : detailData ? <QuestionPreview data={detailData} choiceDraft={choiceDrafts[detailData.question.questionId] ?? {}} onChoiceDraftChange={updateChoiceDraft} comicDraft={comicDrafts[detailData.question.questionId]} onComicDraftChange={(draft) => setComicDrafts((previous) => ({ ...previous, [detailData.question.questionId]: draft }))} onNavigate={navigateQuestion} />
          : <div className="p-5 text-sm text-slate-600">{listData?.items.length === 0 ? 'No questions match this selection.' : 'Select a question to preview it.'}</div>}
      </section>
      <aside className="order-3 min-w-0 lg:col-start-2 lg:row-start-2 xl:sticky xl:top-6 xl:col-start-3 xl:row-start-1">{detailData && <QuestionInspector data={detailData} models={models.data} />}</aside>
    </main>
  </div>
}
