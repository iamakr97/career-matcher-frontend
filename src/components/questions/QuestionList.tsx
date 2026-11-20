import { humanize } from '@/components/questions/format'
import type { ModelsData, QuestionsData } from '@/types/question'

interface Props { data?: QuestionsData; models?: ModelsData; selectedId: string | null; loading: boolean; onSelect: (id: string) => void; onPage: (page: number) => void; onRetry: () => void; error?: string }

export function QuestionList({ data, models, selectedId, loading, onSelect, onPage, onRetry, error }: Props) {
  return <section aria-label="Question list" className="min-w-0 border-t border-slate-200 pt-6">
    <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-900">Questions</h2><span className="text-xs text-slate-500">{data?.pagination.total ?? '—'} results</span></div>
    {loading ? <div className="space-y-2" aria-label="Loading questions">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-100" />)}</div>
      : error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"><p>{error}</p><button type="button" onClick={onRetry} className="mt-3 font-semibold underline">Retry</button></div>
      : !data?.items.length ? <p className="rounded-xl border border-slate-200 p-5 text-sm text-slate-500">No questions match these filters.</p>
      : <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1 xl:max-h-[50rem]">{data.items.map((item) => <button type="button" key={item.questionId} onClick={() => onSelect(item.questionId)} aria-current={selectedId === item.questionId ? 'true' : undefined} className={`w-full min-w-0 rounded-xl border p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${selectedId === item.questionId ? 'border-teal-700 bg-teal-50/70' : 'border-slate-200 bg-white hover:border-teal-300'}`}>
        <span className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-teal-800 break-all">{item.questionId}</span><span className="text-[11px] text-slate-500">{humanize(item.interaction.kind)}</span></span>
        <span className="mt-2 line-clamp-2 block text-sm leading-5 text-slate-800">{item.questionText}</span>
        <span className="mt-2 block truncate text-xs text-slate-500">{models?.items.find((model) => model.model === item.model)?.label || item.model} · {item.classification.categories.map((category) => category.name).join(' / ') || item.classification.primaryMeasureCode} · {humanize(item.presentation.mode)}</span>
      </button>)}</div>}
    {data && <div className="mt-5 flex items-center justify-between gap-2 text-xs text-slate-600">
      <button type="button" disabled={data.pagination.page <= 1} onClick={() => onPage(data.pagination.page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Previous page</button>
      <span>Page {data.pagination.page} of {data.pagination.pages}</span>
      <button type="button" disabled={data.pagination.page >= data.pagination.pages} onClick={() => onPage(data.pagination.page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Next page</button>
    </div>}
  </section>
}
