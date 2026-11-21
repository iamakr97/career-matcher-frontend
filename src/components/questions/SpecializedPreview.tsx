import { StaticChoicePreview } from '@/components/questions/ChoicePreview'
import { ComicBuilder } from '@/components/questions/pisa/ComicBuilder'
import type { ComicDraft } from '@/components/questions/pisa/ComicBuilder'
import { QuestionMedia } from '@/components/questions/QuestionMedia'
import { humanize } from '@/components/questions/format'
import type { PreviewQuestion, ResolvedAsset } from '@/types/question'

interface BaseProps { question: PreviewQuestion; assets: ResolvedAsset[] }
interface Props extends BaseProps { comicDraft?: ComicDraft; onComicDraftChange: (draft: ComicDraft) => void }

const stringField = (value: unknown) => typeof value === 'string' ? value : undefined
const stringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((line) => typeof line === 'string')

function MediaSet({ question, assets }: BaseProps) {
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

function ConstructedActivityPreview({ question, assets, comicDraft, onComicDraftChange }: Props) {
  if (question.interaction.kind !== 'constructed_activity') return null
  const editor = question.interaction.editor ?? {}
  const kind = stringField(editor.kind)
  if (kind === 'comic_builder') return <ComicBuilder key={question.questionId} question={question} assets={assets} draft={comicDraft} onDraftChange={onComicDraftChange} />
  return <div className="space-y-4">
    {kind && <p className="text-sm font-medium text-slate-600">Activity: {humanize(kind)}</p>}
    <MediaSet question={question} assets={assets} />
    <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">Student work area is not interactive in this reviewer preview.</p>
  </div>
}

export function SpecializedPreview(props: Props) {
  if (props.question.interaction.kind === 'performance') return <PerformancePreview {...props} />
  if (props.question.interaction.kind === 'constructed_activity') return <ConstructedActivityPreview {...props} />
  return null
}
