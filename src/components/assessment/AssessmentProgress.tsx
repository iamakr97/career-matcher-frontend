import type { AssessmentStateDto } from '@/types/assessment'

export const AssessmentProgress = ({ state }: { state: AssessmentStateDto }) => {
  const { progress, models, currentQuestion } = state
  const index = models.findIndex((item) => item.model === state.activeModel)
  const model = index >= 0 ? models[index] : null
  const issued = models.reduce((sum, item) => sum + (item.additionalQuestionsIssued ?? 0), 0)
  const currentPlan = Math.max(progress.plannedQuestions + issued, progress.answeredQuestions + (currentQuestion ? 1 : 0))
  const ratio = currentPlan > 0 ? Math.min(state.status === 'completed' ? 100 : 99, progress.answeredQuestions / currentPlan * 100) : 0
  const extra = model?.additionalQuestionsIssued
  const showNotice = !!model && (currentQuestion?.isAdditionalQuestion === true || currentQuestion?.isAdditionalQuestion === undefined && model.answeredQuestions >= model.plannedQuestions && !!currentQuestion && model.plannedQuestions > 0)
  const modelCount = model ? `${model.answeredQuestions} answered · ${model.plannedQuestions} initially planned${extra ? ` · ${extra} additional issued${model.additionalQuestionsAnswered !== undefined ? ` (${model.additionalQuestionsAnswered} answered)` : ''}` : ''}` : 'Assessment progress'
  return <section aria-label="Assessment progress" className="mb-5 border-b border-slate-200 pb-4">
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500"><span>{model?.name ?? 'Assessment'}</span><span>{model ? `Section ${index + 1} of ${models.length}` : `${progress.completedModels} of ${progress.totalModels} sections complete`}</span></div>
    <div className="mt-1 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-900">{modelCount}</p><p className="text-xs text-slate-500">{progress.answeredQuestions} answered · {currentPlan} currently planned overall</p></div>
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true"><div className="h-full rounded-full bg-teal-800" style={{ width: `${ratio}%` }} /></div>
    {showNotice && <p className="mt-3 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">A few additional questions will help us understand your responses more clearly.</p>}
  </section>
}
