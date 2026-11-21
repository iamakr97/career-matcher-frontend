import { Layers3 } from 'lucide-react'

import type { FacetsData, ModelsData } from '@/types/question'

const purpose: Record<string, string> = {
  riasec: 'Interest',
  big_five: 'Personality',
  oecd_sses: 'Emotional & Social Skills (EQ)',
  chc: 'Aptitude & Reasoning',
  pisa_creative_thinking: 'Creative Thinking',
  sdt: 'Motivation',
  scct: 'Career Confidence & Goals',
}

const scientificName: Record<string, string> = {
  riasec: 'Holland RIASEC',
  big_five: 'Big Five',
  oecd_sses: 'OECD SSES',
  chc: 'CHC',
  pisa_creative_thinking: 'PISA',
  sdt: 'SDT',
  scct: 'SCCT',
}

export const chcBroadNames: Record<string, string> = {
  Gf: 'Fluid Reasoning',
  Gv: 'Visual Processing',
  Gwm: 'Short-Term Working Memory',
  Gl: 'Learning Efficiency',
  Gs: 'Processing Speed',
  Gc: 'Comprehension-Knowledge',
  Gq: 'Quantitative Knowledge',
}

interface Props {
  data?: ModelsData
  selectedModel?: string
  loading: boolean
  facets?: FacetsData
  facetsLoading: boolean
  facetsError: boolean
  onFacetsRetry: () => void
  selectedAreaCode?: string
  selectedAreaName?: string
  onSelect: (model?: string) => void
  onAreaSelect: (axis?: string, code?: string | null, name?: string) => void
}

export function QuestionModels({ data, selectedModel, loading, facets, facetsLoading, facetsError, onFacetsRetry, selectedAreaCode, selectedAreaName, onSelect, onAreaSelect }: Props) {
  const areas = facets?.categories.filter((category) => category.axis === 'broad_ability') ?? []
  return <section aria-label="Scientific models" className="min-w-0">
    <h2 className="mb-3 text-sm font-semibold text-slate-600">Assessments</h2>
    <div className="space-y-1">
      <button type="button" onClick={() => onSelect()} aria-current={!selectedModel ? 'true' : undefined} className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border-l-[3px] px-3 py-2 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${!selectedModel ? 'border-blue-600 bg-blue-50 font-semibold text-blue-700' : 'border-transparent text-slate-700 hover:bg-slate-50'}`}><span>All Questions</span><span className="rounded-full bg-white/80 px-2 py-0.5 text-xs tabular-nums text-slate-600">{data?.total ?? (loading ? '…' : '—')}</span></button>
      {data?.items.map((item) => {
        const selected = selectedModel === item.model
        return <button key={item.model} type="button" onClick={() => onSelect(item.model)} aria-current={selected ? 'true' : undefined} className={`flex w-full items-center gap-2.5 rounded-lg border-l-[3px] px-2.5 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${selected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-transparent text-slate-700 hover:bg-slate-50'}`}>
          <Layers3 aria-hidden="true" className={`size-4 shrink-0 ${selected ? 'text-blue-600' : 'text-slate-400'}`} />
          <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold leading-4">{purpose[item.model] ?? item.label}</span><span className="mt-0.5 block text-xs leading-4 text-slate-500">{scientificName[item.model] ?? item.label}</span></span>
          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs tabular-nums text-slate-600">{item.count}</span>
        </button>
      })}
    </div>
    {selectedModel === 'chc' && facetsError && <p role="alert" className="mt-3 text-xs text-rose-800">Abilities could not load. <button type="button" onClick={onFacetsRetry} className="font-semibold underline">Retry</button></p>}
    {selectedModel === 'chc' && facetsLoading && !facets && <p className="mt-3 text-xs text-slate-500">Loading abilities…</p>}
    {selectedModel === 'chc' && areas.length > 0 && <div className="mt-4 border-t border-slate-200 pt-3">
      <h3 className="mb-2 text-xs font-semibold text-slate-600">CHC broad abilities</h3>
      <div className="space-y-0.5">
        <button type="button" onClick={() => onAreaSelect()} aria-current={!selectedAreaCode && !selectedAreaName ? 'true' : undefined} className={`w-full rounded-md px-2.5 py-1.5 text-left text-xs focus-visible:outline-2 focus-visible:outline-blue-600 ${!selectedAreaCode && !selectedAreaName ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>All abilities</button>
        {areas.map((area) => {
          const selected = area.code ? selectedAreaCode === area.code : selectedAreaName === area.name
          return <button key={area.code ?? area.name} type="button" onClick={() => onAreaSelect(area.axis, area.code, area.name)} aria-current={selected ? 'true' : undefined} className={`flex w-full justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs focus-visible:outline-2 focus-visible:outline-blue-600 ${selected ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}><span className="min-w-0 break-words">{area.code ? `${area.code} · ${chcBroadNames[area.code] ?? area.name}` : area.name}</span><span className="shrink-0 tabular-nums">{area.count}</span></button>
        })}
      </div>
    </div>}
  </section>
}
