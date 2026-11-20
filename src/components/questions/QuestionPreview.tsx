import { ChoicePreview } from '@/components/questions/ChoicePreview'
import { QuestionMedia } from '@/components/questions/QuestionMedia'
import { humanize } from '@/components/questions/format'
import type { DetailData, ModelsData } from '@/types/question'

interface Props { data: DetailData; models?: ModelsData; onNavigate: (id: string) => void }

export function QuestionPreview({ data, models, onNavigate }: Props) {
  const { question, resolvedAssets, navigation } = data
  const modelLabel = models?.items.find((item) => item.model === question.model)?.label || question.model
  const interaction = question.interaction
  return <div className="min-w-0">
    <div className="border-b border-slate-200 px-5 py-5 sm:px-8">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-semibold text-teal-800">{modelLabel}</span>
        {question.classification.categories.map((category, index) => <span key={`${category.axis}-${index}`} className="min-w-0 break-words">/ {humanize(category.axis)}: <span className="text-slate-700">{category.name}{category.code ? ` (${category.code})` : ''}</span></span>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-teal-50 px-3 py-1.5 font-medium text-teal-900">Primary measure: {question.classification.primaryMeasureCode}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">{humanize(interaction.kind)}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">{humanize(question.presentation.mode)} · {humanize(question.presentation.layout)}</span>
      </div>
      <p className="mt-4 text-xs text-slate-500">Question ID <span className="font-medium text-slate-700">{question.questionId}</span>{question.selection.eligibleGrades.length > 0 && ` · Grades ${question.selection.eligibleGrades.join(', ')}`}{question.selection.estimatedDurationSeconds != null && ` · About ${question.selection.estimatedDurationSeconds} sec`}</p>
    </div>
    <div className="px-5 py-8 sm:px-8 sm:py-10">
      {question.presentation.title && <p className="mb-3 text-sm font-semibold text-teal-800">{question.presentation.title}</p>}
      <h2 className="max-w-3xl whitespace-pre-line text-2xl leading-snug font-semibold tracking-tight text-slate-950 sm:text-3xl break-words">{question.questionText}</h2>
      {question.description && <p className="mt-5 max-w-3xl whitespace-pre-line text-base leading-7 text-slate-700">{question.description}</p>}
      {question.instructions && <div className="mt-6 max-w-3xl rounded-xl border-l-2 border-teal-700 bg-[#f7faf9] px-5 py-4"><p className="mb-1 text-xs font-semibold text-teal-800">Instructions</p><p className="whitespace-pre-line text-sm leading-6 text-slate-700">{question.instructions}</p></div>}
      {question.helperText && <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-500">{question.helperText}</p>}
      {!!question.presentation.media?.length && <div className="mt-8 grid gap-4 sm:grid-cols-2">{question.presentation.media.map((media, index) => <QuestionMedia key={media.mediaId || media.fileKey || index} media={media} assets={resolvedAssets} />)}</div>}
      {interaction.kind === 'choice' || interaction.kind === 'conditional_choice' ? <ChoicePreview key={question.questionId} question={question} assets={resolvedAssets} /> : <div className="mt-8 rounded-2xl border border-slate-200 bg-[#f8faf9] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">Specialized presentation</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{humanize(interaction.kind)}</h3>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Specialized presentation renderer follows in Phase 2. The question wording, instructions, media, and technical details remain available for review here.</p>
        <a href="#question-details" className="mt-4 inline-block text-sm font-semibold text-teal-800 underline underline-offset-4">View question details</a>
      </div>}
    </div>
    <nav aria-label="Question navigation" className="flex items-center justify-between gap-4 border-t border-slate-200 bg-[#fbfcfb] px-5 py-4 sm:px-8">
      <button type="button" disabled={!navigation.previousQuestionId} onClick={() => navigation.previousQuestionId && onNavigate(navigation.previousQuestionId)} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-teal-700">← Previous</button>
      <span className="hidden text-xs text-slate-500 sm:block">Browse the current selection</span>
      <button type="button" disabled={!navigation.nextQuestionId} onClick={() => navigation.nextQuestionId && onNavigate(navigation.nextQuestionId)} className="rounded-lg bg-teal-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-teal-700">Next →</button>
    </nav>
  </div>
}

export function QuestionInspector({ data }: { data: DetailData }) {
  const { question, resolvedAssets } = data
  const interaction = question.interaction
  return <details id="question-details" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 text-sm xl:sticky xl:top-5">
    <summary className="cursor-pointer font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-teal-700">Question details <span className="font-normal text-slate-500">· Media & structure</span></summary>
    <div className="mt-5 space-y-5 text-xs text-slate-600">
      <dl className="space-y-3 break-words">
        <div><dt className="font-semibold text-slate-800">Model</dt><dd>{question.model}</dd></div>
        <div><dt className="font-semibold text-slate-800">Primary measure</dt><dd>{question.classification.primaryMeasureCode}</dd></div>
        {question.classification.categories.map((category, index) => <div key={index}><dt className="font-semibold text-slate-800">{category.axis}</dt><dd>{category.name}{category.code && ` · ${category.code}`}</dd></div>)}
        <div><dt className="font-semibold text-slate-800">Interaction</dt><dd>{interaction.kind}{'responseFamily' in interaction && interaction.responseFamily && ` · ${interaction.responseFamily}`}</dd></div>
        <div><dt className="font-semibold text-slate-800">Presentation</dt><dd>{question.presentation.mode} · {question.presentation.layout}</dd></div>
        <div><dt className="font-semibold text-slate-800">Selection</dt><dd>Grades {question.selection.eligibleGrades.join(', ') || '—'}{question.selection.estimatedDurationSeconds != null && ` · ${question.selection.estimatedDurationSeconds} seconds`}</dd></div>
        {question.presentation.options?.map((group) => <div key={group.groupId}><dt className="font-semibold text-slate-800">Option group</dt><dd>{group.groupId} · {group.choices.length} choices</dd></div>)}
      </dl>
      <div className="border-t border-slate-200 pt-4"><h3 className="font-semibold text-slate-800">Media inventory</h3>
        {!data.mediaBaseUrl && <p className="mt-2 text-amber-800">Media URL not configured on backend.</p>}
        {question.presentation.media?.map((media, index) => <p key={media.mediaId || index} className="mt-2 break-all">{media.role || 'Media'} · {media.mediaId || 'No media ID'} · {media.fileKey || 'No file key'}</p>)}
        {question.presentation.options?.flatMap((group) => group.choices.filter((choice) => choice.media).map((choice) => ({ groupId: group.groupId, choice }))).map(({ groupId, choice }) => <p key={`${groupId}-${choice.optionId}`} className="mt-2 break-all">Option {choice.optionId} · {choice.media?.mediaId || 'No media ID'} · {choice.media?.fileKey || 'No file key'}</p>)}
        {resolvedAssets.length ? <ul className="mt-2 space-y-3">{resolvedAssets.map((asset) => <li key={asset.fileKey} className="break-all rounded-lg bg-slate-50 p-3"><p>{asset.fileKey}</p><p className="mt-1">{asset.resourceType} · {asset.deliveryPath}</p><p className={asset.url ? 'text-teal-800' : 'text-amber-800'}>{asset.url ? 'URL available' : 'Media URL not configured'}</p>{asset.url && <a href={asset.url} target="_blank" rel="noreferrer" className="font-semibold underline">Open asset</a>}</li>)}</ul> : <p className="mt-2">No resolved assets.</p>}
      </div>
      <details className="border-t border-slate-200 pt-4"><summary className="cursor-pointer font-semibold text-slate-800">API question object</summary><pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] leading-5 text-slate-100">{JSON.stringify(question, null, 2)}</pre></details>
    </div>
  </details>
}
