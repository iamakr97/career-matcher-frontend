import type { AssessmentStateDto } from '@/types/assessment'

export const AssessmentProgress = ({ state }: { state: AssessmentStateDto }) => {
  const { progress, models, currentQuestion } = state
  const index = models.findIndex((item) => item.model === state.activeModel)
  const model = index >= 0 ? models[index] : undefined
  const hasExtraCounts = models.every((item) => item.additionalQuestionsIssued !== undefined && item.additionalQuestionsAnswered !== undefined)
  const extrasIssued = models.reduce((sum, item) => sum + (item.additionalQuestionsIssued ?? 0), 0)
  const extrasAnswered = models.reduce((sum, item) => sum + (item.additionalQuestionsAnswered ?? 0), 0)
  const currentPlan = progress.plannedQuestions + extrasIssued
  const determinate = hasExtraCounts || progress.answeredQuestions <= progress.plannedQuestions
  const denominator = hasExtraCounts ? currentPlan : progress.plannedQuestions
  const ratio = denominator > 0 ? Math.min(state.status === 'completed' ? 100 : 99, Math.max(0, progress.answeredQuestions / denominator * 100)) : 0
  const baseAnswered = model && model.additionalQuestionsAnswered !== undefined ? model.answeredQuestions - model.additionalQuestionsAnswered : undefined
  return <section aria-label="Assessment progress" className="mb-5 border-b border-slate-200 pb-4">
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500"><span>{model?.name ?? 'Assessment'}</span><span>{model ? `Section ${index + 1} of ${models.length}` : `${progress.completedModels} of ${progress.totalModels} sections complete`}</span></div>
    <div className="mt-2 flex flex-wrap items-start justify-between gap-x-6 gap-y-2"><div className="text-sm font-medium text-slate-900">{model && (baseAnswered === undefined ? <p>{model.answeredQuestions} answered · {model.plannedQuestions} initially planned</p> : <><p>{baseAnswered} / {model.plannedQuestions} base questions answered</p>{!!model.additionalQuestionsIssued && <p className="text-xs font-normal text-slate-500">Additional questions: {model.additionalQuestionsAnswered} answered / {model.additionalQuestionsIssued} issued</p>}</>)}</div><div className="text-xs text-slate-500"><p>{progress.answeredQuestions} answered · {hasExtraCounts ? `${currentPlan} currently planned overall` : `${progress.plannedQuestions} initially planned overall`}</p>{hasExtraCounts && extrasIssued > 0 && <p>{extrasAnswered} additional answered</p>}</div></div>
    {determinate && <div role="progressbar" aria-label="Questions answered" aria-valuemin={0} aria-valuemax={denominator} aria-valuenow={progress.answeredQuestions} aria-valuetext={`${progress.answeredQuestions} answered out of ${denominator} ${hasExtraCounts ? 'currently planned' : 'initially planned'} questions`} className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-teal-800 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${ratio}%` }} /></div>}
    {currentQuestion?.isAdditionalQuestion === true && <p className="mt-3 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-teal-900">A few additional questions will help us understand your responses more clearly.</p>}
  </section>
}
