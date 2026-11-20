import { StaticChoicePreview } from '@/components/questions/ChoicePreview'
import { QuestionMedia } from '@/components/questions/QuestionMedia'
import { humanize } from '@/components/questions/format'
import type { PreviewQuestion, ResolvedAsset } from '@/types/question'

interface Props { question: PreviewQuestion; assets: ResolvedAsset[] }

const stringField = (value: unknown) => typeof value === 'string' ? value : undefined
const countField = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined
const stringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((line) => typeof line === 'string')

function MediaSet({ question, assets }: Props) {
  const media = question.presentation.media ?? []
  if (!media.length) return null
  return <div className="grid gap-4 sm:grid-cols-2">{media.map((item, index) => <QuestionMedia key={item.mediaId ?? item.fileKey ?? index} media={item} assets={assets} variant={media.length > 1 ? 'sequence' : item.role === 'stimulus' ? 'stimulus' : 'supporting'} enlargeable />)}</div>
}

function SafeProtocolSections({ protocol }: { protocol: Record<string, unknown> }) {
  const sections = (['study', 'trial', 'probe'] as const).flatMap((key) => {
    const value = protocol[key]
    if (typeof value === 'string') return [{ key, lines: [value] }]
    if (stringArray(value)) return [{ key, lines: value }]
    return []
  })
  if (!sections.length) return null
  return <div className="space-y-2">{sections.map(({ key, lines }) => <section key={key} className="rounded-lg bg-slate-50 p-3"><h3 className="text-xs font-semibold text-slate-600">{humanize(key)}</h3>{lines.map((line, index) => <p key={index} className="mt-1 whitespace-pre-line text-sm leading-5 text-slate-700">{line}</p>)}</section>)}</div>
}

function PerformancePreview({ question, assets }: Props) {
  if (question.interaction.kind !== 'performance') return null
  const protocol = question.interaction.protocol ?? {}
  const taskMode = stringField(protocol.taskMode)
  const optionGroupId = stringField(protocol.optionGroupId)
  const selectionMode = protocol.selectionMode === 'multiple' ? 'multiple' : 'single'
  return <div className="space-y-3">
    {taskMode && <p className="text-xs font-medium text-slate-500">Task mode: {humanize(taskMode)}</p>}
    <MediaSet question={question} assets={assets} />
    <SafeProtocolSections protocol={protocol} />
    {taskMode === 'static_choice'
      ? optionGroupId
        ? <StaticChoicePreview key={question.questionId} question={question} assets={assets} optionGroupId={optionGroupId} selectionMode={selectionMode} />
        : <p role="status" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Static choice group is unavailable in the detail response.</p>
      : <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">Interactive response control is not available in this reviewer preview.</p>}
  </div>
}

function StoryboardPreview({ question, assets, panelCount, lockedPanels }: Props & { panelCount: number; lockedPanels: number }) {
  const media = question.presentation.media ?? []
  return <section className="space-y-4 rounded-xl bg-blue-50/60 p-4" aria-label="Storyboard preview"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold text-slate-800">Storyboard preview</h3><span className="text-xs text-slate-500">{lockedPanels} provided · {panelCount - lockedPanels} empty</span></div><div className="grid gap-3 sm:grid-cols-2">
    {Array.from({ length: panelCount }, (_, index) => <section key={index} aria-label={`Storyboard panel ${index + 1}`} className="min-w-0 rounded-xl bg-white p-3 shadow-[0_1px_4px_rgba(30,58,138,0.05)]">
      <h4 className="mb-2 text-xs font-semibold text-slate-600">Panel {index + 1} · {index < lockedPanels ? 'Provided' : 'Student work area'}</h4>
      {index < lockedPanels
        ? media[index] ? <QuestionMedia media={media[index]} assets={assets} variant="sequence" enlargeable /> : <p className="text-xs text-slate-600">Provided panel media is unavailable.</p>
        : <div className="grid min-h-44 place-items-center rounded-lg border border-dashed border-blue-200 bg-blue-50/40 text-sm text-slate-500">Empty panel</div>}
    </section>)}
  </div>{media.length > lockedPanels && <div><h4 className="mb-2 text-xs font-semibold text-slate-600">Additional provided media</h4><div className="grid gap-3 sm:grid-cols-2">{media.slice(lockedPanels).map((item, index) => <QuestionMedia key={item.mediaId ?? item.fileKey ?? index} media={item} assets={assets} variant="sequence" enlargeable />)}</div></div>}</section>
}

function ConstructedActivityPreview({ question, assets }: Props) {
  if (question.interaction.kind !== 'constructed_activity') return null
  const editor = question.interaction.editor ?? {}
  const kind = stringField(editor.kind)
  const panelCount = countField(editor.panelCount)
  const lockedPanels = countField(editor.lockedPanels)
  const storyboard = kind === 'comic_builder' && panelCount !== undefined && panelCount > 0 && lockedPanels !== undefined && lockedPanels <= panelCount
  return <div className="space-y-4">
    {kind && <p className="text-sm font-medium text-slate-600">Activity: {humanize(kind)}</p>}
    {storyboard && panelCount !== undefined && lockedPanels !== undefined
      ? <StoryboardPreview question={question} assets={assets} panelCount={panelCount} lockedPanels={lockedPanels} />
      : <MediaSet question={question} assets={assets} />}
    {!storyboard && <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">Student work area is not interactive in this reviewer preview.</p>}
  </div>
}

export function SpecializedPreview(props: Props) {
  if (props.question.interaction.kind === 'performance') return <PerformancePreview {...props} />
  if (props.question.interaction.kind === 'constructed_activity') return <ConstructedActivityPreview {...props} />
  return null
}
