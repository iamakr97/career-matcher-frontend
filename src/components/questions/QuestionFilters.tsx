import { useEffect, useState } from 'react'

import { humanize } from '@/components/questions/format'
import type { FacetsData, ModelsData, QuestionFilters } from '@/types/question'

type Change = (patch: Partial<QuestionFilters>, resetModel?: boolean) => void
interface Props { models?: ModelsData; facets?: FacetsData; filters: QuestionFilters; onChange: Change; loading: boolean }

const selectClass = 'mt-1 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus-visible:outline-2 focus-visible:outline-teal-700'

export function QuestionFilters({ models, facets, filters, onChange, loading }: Props) {
  const [draft, setDraft] = useState(filters.search || '')
  useEffect(() => { setDraft(filters.search || '') }, [filters.search])
  useEffect(() => {
    if (draft === (filters.search || '')) return
    const timer = window.setTimeout(() => onChange({ search: draft.trim() || undefined }), 350)
    return () => window.clearTimeout(timer)
  }, [draft, filters.search, onChange])
  const categoryValue = filters.categoryAxis ? `${filters.categoryAxis}|${filters.categoryCode ? `code:${filters.categoryCode}` : `name:${filters.categoryName || ''}`}` : ''
  return <div className="space-y-6">
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Explore by model</h2>
      <div className="mt-3 space-y-1" aria-label="Scientific models">
        <button type="button" onClick={() => onChange({ model: undefined }, true)} aria-current={!filters.model ? 'true' : undefined} className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm focus-visible:outline-2 focus-visible:outline-teal-700 ${!filters.model ? 'bg-teal-900 font-semibold text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
          <span>All Questions</span><span>{models?.total ?? (loading ? '…' : '—')}</span>
        </button>
        {models?.items.map((item) => <button key={item.model} type="button" onClick={() => onChange({ model: item.model }, true)} aria-current={filters.model === item.model ? 'true' : undefined} className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm focus-visible:outline-2 focus-visible:outline-teal-700 ${filters.model === item.model ? 'bg-teal-900 font-semibold text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
          <span className="min-w-0">{item.label}</span><span className="tabular-nums">{item.count}</span>
        </button>)}
      </div>
    </div>
    <div className="border-t border-slate-200 pt-5">
      <label htmlFor="question-search" className="text-xs font-semibold text-slate-700">Search question ID or text</label>
      <div className="mt-1 flex gap-2">
        <input id="question-search" value={draft} maxLength={100} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onChange({ search: draft.trim() || undefined }) }} placeholder="Search questions" className={`${selectClass} mt-0`} />
        {draft && <button type="button" onClick={() => { setDraft(''); onChange({ search: undefined }) }} className="rounded-lg border border-slate-200 px-3 text-xs text-slate-600 hover:bg-slate-100">Clear</button>}
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
      <label className="text-xs font-semibold text-slate-700">Sort
        <select value={filters.sort || 'question_id_asc'} onChange={(event) => onChange({ sort: event.target.value as QuestionFilters['sort'] })} className={selectClass}>
          <option value="question_id_asc">Question ID · A to Z</option><option value="question_id_desc">Question ID · Z to A</option>
        </select>
      </label>
      <label className="text-xs font-semibold text-slate-700">Grade
        <select value={filters.grade || ''} onChange={(event) => onChange({ grade: event.target.value ? Number(event.target.value) : undefined })} className={selectClass}>
          <option value="">All grades</option>{(filters.model ? facets?.eligibleGrades.map((item) => item.value) || [] : Array.from({ length: 8 }, (_, index) => index + 5)).map((grade) => <option key={grade} value={grade}>Grade {grade}</option>)}
        </select>
      </label>
    </div>
    {filters.model && <details className="border-t border-slate-200 pt-5">
      <summary className="cursor-pointer text-sm font-semibold text-slate-800 focus-visible:outline-2 focus-visible:outline-teal-700">Refine this model</summary>
      {facets ? <div className="mt-4 space-y-4">
        <label className="block text-xs font-semibold text-slate-700">Category
          <select value={categoryValue} onChange={(event) => {
            const match = facets.categories.find((item) => `${item.axis}|${item.code ? `code:${item.code}` : `name:${item.name}`}` === event.target.value)
            onChange({ categoryAxis: match?.axis, categoryCode: match?.code || undefined, categoryName: match?.code ? undefined : match?.name })
          }} className={selectClass}>
            <option value="">All categories</option>{facets.categories.map((item) => <option key={`${item.axis}|${item.code || item.name}`} value={`${item.axis}|${item.code ? `code:${item.code}` : `name:${item.name}`}`}>{humanize(item.axis)} · {item.name}{item.code ? ` (${item.code})` : ''} · {item.count}</option>)}
          </select>
        </label>
        {([
          ['primaryMeasureCode', 'Primary measure', facets.primaryMeasures],
          ['interactionKind', 'Interaction', facets.interactionKinds],
          ['presentationMode', 'Presentation mode', facets.presentationModes],
          ['presentationLayout', 'Layout', facets.presentationLayouts],
        ] as const).map(([name, label, options]) => <label key={name} className="block text-xs font-semibold text-slate-700">{label}
          <select value={filters[name] || ''} onChange={(event) => onChange({ [name]: event.target.value || undefined })} className={selectClass}>
            <option value="">All {label.toLowerCase()}s</option>{options.map((item) => <option key={item.value} value={item.value}>{humanize(item.value)} · {item.count}</option>)}
          </select>
        </label>)}
      </div> : <p className="mt-3 text-xs text-slate-500">Loading model filters…</p>}
    </details>}
  </div>
}
