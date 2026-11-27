import type { AssessmentStateDto } from '@/types/assessment'
export const AssessmentProgress = ({ state }: { state: AssessmentStateDto }) => {
  const { progress, models } = state
  const ratio = progress.plannedQuestions > 0 ? Math.max(0, Math.min(100, progress.answeredQuestions / progress.plannedQuestions * 100)) : 0
  return <section aria-label="Assessment progress" className="rounded-xl border bg-card p-5"><h2 className="font-semibold">Progress</h2><p aria-live="polite" className="mt-2 text-sm">{progress.answeredQuestions} answered of {progress.plannedQuestions} currently planned questions · {progress.completedModels} of {progress.totalModels} model sections complete</p>{progress.plannedQuestions > 0 && <div className="mt-3 h-2 overflow-hidden rounded bg-muted" aria-hidden="true"><div className="h-full bg-primary" style={{ width: `${ratio}%` }} /></div>}<ul className="mt-4 flex flex-wrap gap-2">{models.map((model) => <li key={model.model} className="rounded-full border px-3 py-1 text-xs">{model.name}: {model.status === 'complete' ? 'complete' : model.status === 'incomplete' ? 'incomplete' : model.status === 'active' ? 'in progress' : 'not started'}</li>)}</ul></section>
}
