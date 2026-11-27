import type { AssessmentStateDto } from '@/types/assessment'

export const AssessmentProgress = ({ state }: { state: AssessmentStateDto }) => {
  const { progress, models, currentQuestion } = state
  const index = models.findIndex((item) => item.model === state.activeModel)
  const model = index >= 0 ? models[index] : null
  const ratio = progress.plannedQuestions > 0 ? Math.min(100, Math.max(0, progress.answeredQuestions / progress.plannedQuestions * 100)) : 0
  return <section aria-label="Assessment progress" className="mb-5 border-b border-slate-200 pb-4">
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500"><span>{model?.name ?? 'Assessment'}</span><span>{model ? `Section ${index + 1} of ${models.length}` : `${progress.completedModels} of ${progress.totalModels} sections complete`}</span></div>
    <div className="mt-1 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-900">{model && currentQuestion?.interaction.kind === 'choice' && model.plannedQuestions > model.answeredQuestions ? `${Math.min(model.answeredQuestions + 1, model.plannedQuestions)} / ${model.plannedQuestions}` : model ? `${model.answeredQuestions} answered / ${model.plannedQuestions} planned` : 'Assessment progress'}</p><p className="text-xs text-slate-500">{progress.answeredQuestions} answered · {progress.plannedQuestions} planned</p></div>
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true"><div className="h-full rounded-full bg-teal-800" style={{ width: `${ratio}%` }} /></div>
  </section>
}
