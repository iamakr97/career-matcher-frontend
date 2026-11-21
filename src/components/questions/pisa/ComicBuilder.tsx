import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw, RotateCw, Trash2, Undo2, Redo2, ZoomIn, ZoomOut } from 'lucide-react'

import { QuestionMedia } from '@/components/questions/QuestionMedia'
import { getResolvedMediaUrl } from '@/components/questions/format'
import type { ComicPaletteAsset, PreviewQuestion, QuestionMedia as Media, ResolvedAsset } from '@/types/question'

interface PlacedObject { id: string; key: string; x: number; y: number; size: number; rotation: number }
interface EditablePanel { objects: PlacedObject[]; action: string }
interface Scene { panels: EditablePanel[]; line: string }
export interface ComicDraft { past: Scene[]; present: Scene; future: Scene[] }
interface ComicEditor {
  kind: 'comic_builder'; variant: 'comic_locked_panels_v1'; panelCount: number; lockedPanels: number
  allowedActions: string[]; pieces: { key: string; label: string }[]; actions: string[]
  constraints: string[]; paletteAssets: ComicPaletteAsset[]
}
interface Props { question: PreviewQuestion; assets: ResolvedAsset[]; draft?: ComicDraft; onDraftChange: (draft: ComicDraft) => void }

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every((entry) => typeof entry === 'string')
const piece = (value: unknown): value is { key: string; label: string } => record(value) && typeof value.key === 'string' && typeof value.label === 'string'
const media = (value: unknown): value is Media => record(value) && typeof value.mediaType === 'string'
const paletteAsset = (value: unknown): value is ComicPaletteAsset => record(value) && typeof value.pieceKey === 'string' &&
  typeof value.label === 'string' && (value.status === 'available' || value.status === 'unmapped') &&
  (value.media === undefined || media(value.media))

function parseEditor(value: unknown): ComicEditor | null {
  if (!record(value) || value.kind !== 'comic_builder' || value.variant !== 'comic_locked_panels_v1' ||
    typeof value.panelCount !== 'number' || typeof value.lockedPanels !== 'number' ||
    !Number.isInteger(value.panelCount) || !Number.isInteger(value.lockedPanels) ||
    value.panelCount < 2 || value.lockedPanels < 1 || value.lockedPanels >= value.panelCount || value.panelCount > 8 ||
    !Array.isArray(value.pieces) || !value.pieces.every(piece) || !value.pieces.length ||
    !strings(value.actions) || !value.actions.length || !strings(value.allowedActions) ||
    !Array.isArray(value.paletteAssets) || !value.paletteAssets.every(paletteAsset)) return null
  return {
    kind: 'comic_builder', variant: 'comic_locked_panels_v1', panelCount: value.panelCount,
    lockedPanels: value.lockedPanels, pieces: value.pieces, actions: value.actions,
    allowedActions: value.allowedActions, constraints: strings(value.constraints) ? value.constraints : [],
    paletteAssets: value.paletteAssets,
  }
}

const blankScene = (count: number): Scene => ({ panels: Array.from({ length: count }, () => ({ objects: [], action: '' })), line: '' })
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))
const sameScene = (a: Scene, b: Scene) => JSON.stringify(a) === JSON.stringify(b)
const bounded = (item: PlacedObject): PlacedObject => {
  const margin = item.size * Math.SQRT2 / 2
  return { ...item, x: clamp(item.x, margin, 400 - margin), y: clamp(item.y, margin, 240 - margin) }
}

export function ComicBuilder({ question, assets, draft, onDraftChange }: Props) {
  const editor = question.interaction.kind === 'constructed_activity' ? parseEditor(question.interaction.editor) : null
  const [panelIndex, setPanelIndex] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [failedUrls, setFailedUrls] = useState<Record<string, string[]>>({})
  const [checked, setChecked] = useState(false)
  const drag = useRef<{ panel: number; id: string; start: Scene; latest: Scene } | null>(null)
  const svgRefs = useRef<(SVGSVGElement | null)[]>([])

  if (!editor) return <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Comic editor configuration or palette asset mapping is unavailable. Check the question detail API.</p>
  const editableCount = editor.panelCount - editor.lockedPanels
  const state = draft?.present.panels.length === editableCount ? draft : { past: [], present: blankScene(editableCount), future: [] }
  const scene = state.present
  const currentPanel = clamp(panelIndex, 0, editableCount - 1)
  const selected = scene.panels[currentPanel]?.objects.find((item) => item.id === selectedId)
  const supplied = (question.presentation.media ?? []).filter((item) => item.role !== 'palette' && item.role !== 'baseline' && item.role !== 'option')
  const missing = editor.pieces.filter((item) => !editor.paletteAssets.some((asset) => asset.pieceKey === item.key && asset.status === 'available' && asset.media))
  const can = (action: string) => editor.allowedActions.includes(action)
  const optionalLine = /short line/i.test(question.instructions ?? '')

  const commit = (next: Scene) => {
    if (sameScene(scene, next)) return
    onDraftChange({ past: [...state.past, scene], present: next, future: [] })
    setChecked(false)
  }
  const changePanel = (index: number, update: (panel: EditablePanel) => EditablePanel) => {
    commit({ ...scene, panels: scene.panels.map((panel, at) => at === index ? update(panel) : panel) })
  }
  const changeObject = (update: (item: PlacedObject) => PlacedObject) => {
    if (!selected) return
    changePanel(currentPanel, (panel) => ({ ...panel, objects: panel.objects.map((item) => item.id === selected.id ? bounded(update(item)) : item) }))
  }
  const add = (key: string) => {
    if (!can('add') || missing.some((item) => item.key === key)) return
    const id = crypto.randomUUID()
    changePanel(currentPanel, (panel) => ({ ...panel, objects: [...panel.objects, { id, key, x: 200, y: 120, size: 76, rotation: 0 }] }))
    setSelectedId(id)
  }
  const undo = () => {
    if (!state.past.length || !can('undo')) return
    onDraftChange({ past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [scene, ...state.future] })
    setSelectedId(null)
    setChecked(false)
  }
  const redo = () => {
    if (!state.future.length || !can('redo')) return
    onDraftChange({ past: [...state.past, scene], present: state.future[0], future: state.future.slice(1) })
    setSelectedId(null)
    setChecked(false)
  }
  const urlFor = (key: string) => {
    const entry = editor.paletteAssets.find((item) => item.pieceKey === key)
    const primary = entry?.media && getResolvedMediaUrl(entry.media, assets)
    const fallback = entry?.media?.fallback && getResolvedMediaUrl(entry.media.fallback, assets)
    const failed = failedUrls[key] ?? []
    return primary && !failed.includes(primary) ? primary : fallback && !failed.includes(fallback) ? fallback : null
  }
  const failAsset = (key: string, url: string) => setFailedUrls((previous) => ({
    ...previous, [key]: previous[key]?.includes(url) ? previous[key] : [...(previous[key] ?? []), url],
  }))
  const unresolved = editor.pieces.filter((item) => !missing.some((missingItem) => missingItem.key === item.key) && !urlFor(item.key))
  const point = (index: number, event: PointerEvent<SVGSVGElement>) => {
    const svg = svgRefs.current[index]
    const matrix = svg?.getScreenCTM()?.inverse()
    if (!matrix) return null
    const result = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix)
    return { x: result.x, y: result.y }
  }
  const startDrag = (index: number, id: string, event: PointerEvent<SVGImageElement>) => {
    if (!can('move')) return
    setPanelIndex(index)
    setSelectedId(id)
    drag.current = { panel: index, id, start: scene, latest: scene }
    svgRefs.current[index]?.setPointerCapture(event.pointerId)
    event.preventDefault()
  }
  const moveDrag = (index: number, event: PointerEvent<SVGSVGElement>) => {
    const active = drag.current
    if (!active || active.panel !== index) return
    const nextPoint = point(index, event)
    if (!nextPoint) return
    const nextScene = { ...scene, panels: scene.panels.map((panel, at) => at === index
      ? { ...panel, objects: panel.objects.map((item) => item.id === active.id ? bounded({ ...item, ...nextPoint }) : item) } : panel) }
    active.latest = nextScene
    onDraftChange({ ...state, present: nextScene })
  }
  const endDrag = () => {
    const active = drag.current
    if (!active) return
    drag.current = null
    if (!sameScene(active.start, active.latest)) onDraftChange({ past: [...state.past, active.start], present: active.latest, future: [] })
  }
  const complete = scene.panels.every((panel) => panel.objects.length > 0 && !!panel.action)

  return <section aria-label="Comic builder" className="space-y-5 rounded-2xl border border-border bg-secondary/40 p-3 sm:p-5">
    {editor.constraints.length > 0 && <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">{editor.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}</ul>}
    {missing.length > 0 && <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">Artwork is unavailable for: {missing.map((item) => `${item.label} (${item.key})`).join(', ')}. These pieces cannot be placed until their assets are mapped.</p>}
    {unresolved.length > 0 && <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">Artwork URLs could not be loaded for: {unresolved.map((item) => item.key).join(', ')}. Check the backend media configuration or CDN assets.</p>}
    {supplied.length < editor.lockedPanels && <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">Provided comic frames are missing from this question.</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: editor.panelCount }, (_, index) => index < editor.lockedPanels
        ? <section key={index} className="min-w-0 rounded-xl bg-card p-3 shadow-sm" aria-label={`Panel ${index + 1}, provided and locked`}>
          <h3 className="mb-2 text-sm font-semibold">Panel {index + 1} <span className="font-normal text-muted-foreground">· Provided</span></h3>
          {supplied[index] ? <QuestionMedia media={supplied[index]} assets={assets} variant="sequence" enlargeable /> : <p role="status" className="text-sm text-amber-900">Provided frame unavailable.</p>}
        </section>
        : (() => {
          const at = index - editor.lockedPanels
          const panel = scene.panels[at]
          return <section key={index} className={`min-w-0 rounded-xl border bg-card p-3 shadow-sm ${currentPanel === at ? 'border-primary' : 'border-border'}`} aria-label={`Panel ${index + 1}, editable`}>
            <div className="mb-2 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Panel {index + 1}</h3><button type="button" onClick={() => { setPanelIndex(at); setSelectedId(null) }} className="rounded-md px-2 py-1 text-xs text-primary hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary">Select panel</button></div>
            <svg ref={(node) => { svgRefs.current[at] = node }} viewBox="0 0 400 240" role="img" aria-label={`Editable comic canvas for panel ${index + 1}`} onPointerMove={(event) => moveDrag(at, event)} onPointerUp={endDrag} onLostPointerCapture={endDrag} className="aspect-[5/3] w-full touch-none rounded-lg border border-dashed border-primary/40 bg-white">
              {panel.objects.map((item) => {
                const source = urlFor(item.key)
                const chosen = currentPanel === at && selectedId === item.id
                return <g key={item.id} transform={`translate(${item.x} ${item.y}) rotate(${item.rotation})`}>
                  {chosen && <rect x={-item.size / 2 - 3} y={-item.size / 2 - 3} width={item.size + 6} height={item.size + 6} fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="5 3" />}
                  {source && <image href={source} x={-item.size / 2} y={-item.size / 2} width={item.size} height={item.size} preserveAspectRatio="xMidYMid meet" onPointerDown={(event) => startDrag(at, item.id, event)} onClick={() => { setPanelIndex(at); setSelectedId(item.id) }} onError={() => failAsset(item.key, source)} className="cursor-grab active:cursor-grabbing" />}
                </g>
              })}
            </svg>
            <label className="mt-3 block text-xs font-semibold text-slate-700">What happens here?
              <select value={panel.action} onChange={(event) => { setPanelIndex(at); setSelectedId(null); changePanel(at, (before) => ({ ...before, action: event.target.value })) }} className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-normal focus-visible:outline-2 focus-visible:outline-primary">
                <option value="">Choose an action</option>{editor.actions.map((action) => <option key={action} value={action}>{action}</option>)}
              </select>
            </label>
          </section>
        })())}
    </div>
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Objects for panel {editor.lockedPanels + currentPanel + 1}</h3><div className="flex gap-2">
        {can('undo') && <button type="button" disabled={!state.past.length} onClick={undo} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs disabled:opacity-40"><Undo2 className="size-3.5" />Undo</button>}
        {can('redo') && <button type="button" disabled={!state.future.length} onClick={redo} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs disabled:opacity-40"><Redo2 className="size-3.5" />Redo</button>}
      </div></div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">{editor.pieces.map((item) => {
        const source = urlFor(item.key)
        return <button key={item.key} type="button" disabled={!source || !can('add')} onClick={() => add(item.key)} className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-white p-2 text-center text-[11px] leading-tight hover:border-primary hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50">
          {source ? <img src={source} alt="" className="h-10 max-w-full object-contain" onError={() => failAsset(item.key, source)} /> : <span className="text-amber-800">Unavailable</span>}<span>{item.label}</span>
        </button>
      })}</div>
      {scene.panels[currentPanel].objects.length > 0 && <div className="mt-3 flex flex-wrap gap-2" aria-label="Objects in selected panel">{scene.panels[currentPanel].objects.map((item, index) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} aria-pressed={selectedId === item.id} className={`rounded-md border px-2 py-1 text-xs focus-visible:outline-2 focus-visible:outline-primary ${selectedId === item.id ? 'border-primary bg-secondary text-primary' : 'border-border hover:bg-secondary'}`}>{editor.pieces.find((piece) => piece.key === item.key)?.label ?? item.key} {index + 1}</button>)}</div>}
      {selected && <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3 [&_button]:min-h-9 [&_button]:min-w-9 [&_button]:rounded-md [&_button]:border [&_button]:border-border [&_button]:p-1 [&_button]:hover:bg-secondary [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-primary"><span className="mr-1 text-xs font-semibold">Selected: {editor.pieces.find((item) => item.key === selected.key)?.label ?? selected.key}</span>
        {can('move') && <><button type="button" aria-label="Move left" onClick={() => changeObject((item) => ({ ...item, x: clamp(item.x - 10, 20, 380) }))}><ArrowLeft className="size-5" /></button><button type="button" aria-label="Move right" onClick={() => changeObject((item) => ({ ...item, x: clamp(item.x + 10, 20, 380) }))}><ArrowRight className="size-5" /></button><button type="button" aria-label="Move up" onClick={() => changeObject((item) => ({ ...item, y: clamp(item.y - 10, 20, 220) }))}><ArrowUp className="size-5" /></button><button type="button" aria-label="Move down" onClick={() => changeObject((item) => ({ ...item, y: clamp(item.y + 10, 20, 220) }))}><ArrowDown className="size-5" /></button></>}
        {can('resize') && <><button type="button" aria-label="Make smaller" onClick={() => changeObject((item) => ({ ...item, size: clamp(item.size - 10, 32, 128) }))}><ZoomOut className="size-5" /></button><button type="button" aria-label="Make larger" onClick={() => changeObject((item) => ({ ...item, size: clamp(item.size + 10, 32, 128) }))}><ZoomIn className="size-5" /></button></>}
        {can('rotate') && <><button type="button" aria-label="Rotate left" onClick={() => changeObject((item) => ({ ...item, rotation: item.rotation - 15 }))}><RotateCcw className="size-5" /></button><button type="button" aria-label="Rotate right" onClick={() => changeObject((item) => ({ ...item, rotation: item.rotation + 15 }))}><RotateCw className="size-5" /></button></>}
        {can('remove') && <button type="button" aria-label="Remove selected object" onClick={() => { changePanel(currentPanel, (panel) => ({ ...panel, objects: panel.objects.filter((item) => item.id !== selected.id) })); setSelectedId(null) }}><Trash2 className="size-5" /></button>}
      </div>}
      {editor.pieces.some((item) => failedUrls[item.key]?.length && !urlFor(item.key)) && <p role="alert" className="mt-3 text-xs text-amber-900">Image load failed for: {editor.pieces.filter((item) => failedUrls[item.key]?.length && !urlFor(item.key)).map((item) => item.key).join(', ')}.</p>}
    </div>
    {optionalLine && <label className="block text-sm font-medium">Optional short story line<input value={scene.line} maxLength={160} onChange={(event) => commit({ ...scene, line: event.target.value })} className="mt-1 block w-full rounded-lg border border-border bg-white px-3 py-2 focus-visible:outline-2 focus-visible:outline-primary" /></label>}
    <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => setChecked(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-primary">Check my work</button>{checked && <p role="status" className="text-sm text-slate-700">{complete ? 'Every editable panel has an object and an action.' : 'Add an object and choose an action in each editable panel.'}</p>}</div>
  </section>
}
