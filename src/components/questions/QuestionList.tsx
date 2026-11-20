import { useEffect, useRef } from 'react'

import type { QuestionsData } from '@/types/question'

interface Props { data?: QuestionsData; selectedId: string | null; loading: boolean; onSelect: (id: string) => void; onPage: (page: number) => void; onRetry: () => void; error?: string }

export function QuestionList({ data, selectedId, loading, onSelect, onPage, onRetry, error }: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const list = listRef.current
    const selected = selectedRef.current
    if (!list || !selected) return
    const bounds = list.getBoundingClientRect()
    const item = selected.getBoundingClientRect()
    if (item.top < bounds.top) list.scrollTop += item.top - bounds.top
    else if (item.bottom > bounds.bottom) list.scrollTop += item.bottom - bounds.bottom
  }, [data, selectedId])
  return <section aria-label="Question list" className="min-w-0 border-t border-slate-200 pt-4">
    <div className="mb-2 flex items-center justify-between gap-2"><h2 className="text-sm font-semibold text-slate-600">Question list</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs tabular-nums text-slate-500">{data?.pagination.total ?? '—'}</span></div>
    {loading ? <div className="space-y-2" aria-label="Loading questions">{[1, 2, 3].map((item) => <div key={item} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}</div>
      : error ? <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"><p>{error}</p><button type="button" onClick={onRetry} className="mt-2 font-semibold underline">Retry</button></div>
      : !data?.items.length ? <p className="text-sm text-slate-500">No questions match this selection.</p>
      : <div ref={listRef} className="max-h-[34vh] space-y-0.5 overflow-y-auto pr-1 max-lg:max-h-64">{data.items.map((item) => {
        const selected = selectedId === item.questionId
        return <button type="button" ref={selected ? selectedRef : null} key={item.questionId} title={item.questionId} aria-label={`Question ${item.questionId}`} aria-current={selected ? 'true' : undefined} onClick={() => onSelect(item.questionId)} className={`flex min-h-10 w-full min-w-0 items-center rounded-lg border-l-[3px] px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${selected ? 'border-blue-600 bg-blue-50 font-semibold text-blue-700' : 'border-transparent text-slate-700 hover:bg-slate-50'}`}><span className="min-w-0 truncate">{item.questionId}</span></button>
      })}</div>}
    {data && data.pagination.pages > 1 && <nav aria-label="Question list pages" className="mt-3 flex items-center justify-between gap-1 border-t border-slate-200 pt-3 text-xs text-slate-600">
      <button type="button" aria-label="Previous question list page" disabled={data.pagination.page <= 1} onClick={() => onPage(data.pagination.page - 1)} className="rounded-md px-2 py-1.5 font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-40">Previous</button>
      <span className="tabular-nums" aria-label={`List page ${data.pagination.page} of ${data.pagination.pages}`}>Page {data.pagination.page} / {data.pagination.pages}</span>
      <button type="button" aria-label="Next question list page" disabled={data.pagination.page >= data.pagination.pages} onClick={() => onPage(data.pagination.page + 1)} className="rounded-md px-2 py-1.5 font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-40">Next</button>
    </nav>}
  </section>
}
