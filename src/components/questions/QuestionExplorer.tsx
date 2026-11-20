import { useCallback, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'

import { QuestionFilters } from '@/components/questions/QuestionFilters'
import { QuestionInspector, QuestionPreview } from '@/components/questions/QuestionPreview'
import { QuestionList } from '@/components/questions/QuestionList'
import { errorStatus, errorText, readExplorerUrl } from '@/components/questions/format'
import { useGetQuestionDetailQuery, useGetQuestionFacetsQuery, useGetQuestionModelsQuery, useGetQuestionsQuery } from '@/services/questionApi'
import type { QuestionFilters as Filters } from '@/types/question'

const modelSpecific = ['primaryMeasureCode', 'categoryAxis', 'categoryCode', 'categoryName', 'interactionKind', 'presentationMode', 'presentationLayout']

export function QuestionExplorer() {
  const [params, setParams] = useSearchParams()
  const { filters, page, limit, questionId } = useMemo(() => readExplorerUrl(params), [params])
  const models = useGetQuestionModelsQuery()
  const facets = useGetQuestionFacetsQuery(filters.model || '', { skip: !filters.model })
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

  const changeFilters = useCallback((patch: Partial<Filters>, resetModel = false) => {
    updateParams((next) => {
      if (resetModel) modelSpecific.forEach((name) => next.delete(name))
      for (const [name, value] of Object.entries(patch)) {
        if (value === undefined || value === '') next.delete(name)
        else next.set(name, String(value))
      }
      next.delete('question')
      next.delete('page')
    })
  }, [updateParams])

  const selectQuestion = useCallback((id: string) => updateParams((next) => next.set('question', id)), [updateParams])
  useEffect(() => {
    if (!questionId && listData?.items.length) updateParams((next) => next.set('question', listData.items[0].questionId), true)
  }, [questionId, listData, updateParams])

  const detailStatus = errorStatus(detail.error)
  const recover = () => updateParams((next) => next.delete('question'))

  return <div className="min-h-screen bg-[#f7f9f8] text-slate-900">
    <header className="border-b border-slate-200 bg-white/80">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8 xl:px-10">
        <div className="flex min-w-0 items-center gap-3"><span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-900 text-white">◇</span><div className="min-w-0"><Link to="/" className="text-sm font-semibold text-slate-900 hover:text-teal-800">Career Matcher</Link><p className="text-xs text-slate-500"><Link to="/" className="hover:underline">Home</Link> / Question Explorer</p></div></div>
        <div className="flex items-center gap-3 text-xs text-slate-600"><span className="rounded-full border border-slate-200 px-3 py-1.5">Reviewer preview</span><span className="font-medium tabular-nums">{models.data?.total ?? '—'} questions</span></div>
      </div>
    </header>
    <main className="mx-auto max-w-[1800px] px-4 pb-16 pt-8 sm:px-8 xl:px-10">
      <div className="mb-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Question library</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Question Explorer</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Browse the live question bank and review each question in its scientific context.</p></div>
      {models.error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">Models could not load: {errorText(models.error)} <button type="button" onClick={() => models.refetch()} className="ml-2 font-semibold underline">Retry</button></div>}
      {facets.error && filters.model && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">Model filters could not load: {errorText(facets.error)} <button type="button" onClick={() => facets.refetch()} className="ml-2 font-semibold underline">Retry</button></div>}
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(270px,315px)_minmax(0,1fr)_minmax(230px,270px)]">
        <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <details className="xl:hidden"><summary className="cursor-pointer text-sm font-semibold text-slate-900">Models & filters</summary><div className="mt-5"><QuestionFilters models={models.data} facets={facets.data} filters={filters} onChange={changeFilters} loading={models.isLoading} /></div></details>
          <div className="hidden xl:block"><QuestionFilters models={models.data} facets={facets.data} filters={filters} onChange={changeFilters} loading={models.isLoading} /></div>
          <div className="mt-6"><QuestionList data={listData} models={models.data} selectedId={questionId} loading={list.isFetching && !listData} error={list.error ? errorText(list.error) : undefined} onRetry={() => list.refetch()} onSelect={selectQuestion} onPage={(target) => updateParams((next) => { next.set('page', String(target)); next.delete('question') })} /></div>
        </aside>
        <section aria-label="Question presentation" className="min-w-0 self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {detail.isFetching && !detailData ? <div className="space-y-5 p-8" aria-label="Loading question"><div className="h-5 w-2/3 animate-pulse rounded bg-slate-100" /><div className="h-10 w-full animate-pulse rounded bg-slate-100" /><div className="h-32 w-full animate-pulse rounded bg-slate-100" /></div>
            : detail.error ? <div className="p-8" role="alert"><h2 className="text-lg font-semibold text-slate-900">{detailStatus === 404 ? 'Question not found' : detailStatus === 400 ? 'Question outside these filters' : 'Question could not load'}</h2><p className="mt-2 text-sm text-slate-600">{errorText(detail.error)}</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={recover} className="rounded-lg bg-teal-900 px-4 py-2 text-sm text-white">Show first matching question</button><button type="button" onClick={() => detail.refetch()} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Retry</button></div></div>
            : detailData ? <QuestionPreview data={detailData} models={models.data} onNavigate={selectQuestion} />
            : <div className="p-8 text-sm text-slate-600">{listData?.items.length === 0 ? 'No questions match this selection.' : 'Select a question to preview it.'}</div>}
        </section>
        <aside className="min-w-0 self-start">{detailData && <QuestionInspector data={detailData} />}</aside>
      </div>
    </main>
  </div>
}
