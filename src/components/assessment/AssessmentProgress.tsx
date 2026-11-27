import type { AssessmentStateDto } from '@/types/assessment'

export const AssessmentProgress = ({ state }: { state: AssessmentStateDto }) => {
  const { progress, models } = state
  const ratio = progress.plannedQuestions > 0 && state.status === 'completed'
    ? 100
    : progress.plannedQuestions > 0
      ? Math.min(99, Math.max(0, progress.answeredQuestions / progress.plannedQuestions * 100))
      : 0

  return <section aria-label="Assessment progress" className="rounded-xl border bg-card p-5">
    <h2 className="font-semibold">Progress</h2>
    <p aria-live="polite" className="mt-2 text-sm">{progress.answeredQuestions} answered of {progress.plannedQuestions} currently planned questions · {progress.completedModels} of {progress.totalModels} model sections complete</p>
    {progress.plannedQuestions > 0 && <div className="mt-3 h-2 overflow-hidden rounded bg-muted" aria-hidden="true"><div className="h-full bg-primary" style={{ width: `${ratio}%` }} /></div>}
    <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{models.map((model) => <li key={model.model} className={`rounded-lg border px-3 py-2 text-sm ${state.activeModel === model.model ? 'border-primary bg-primary/5' : ''}`} aria-current={state.activeModel === model.model ? 'step' : undefined}>
      <p className="font-medium">{model.name}</p>
      <p className="text-xs text-muted-foreground">{model.status === 'complete' ? 'Complete' : model.status === 'incomplete' ? 'Incomplete' : model.status === 'active' ? 'In progress' : 'Not started'} · {model.answeredQuestions} of {model.plannedQuestions} answered</p>
    </li>)}</ul>
  </section>
}
