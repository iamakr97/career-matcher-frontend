import { Link } from 'react-router'
import { AssessmentProgress } from '@/components/assessment/AssessmentProgress'
import { AssessmentQuestion } from '@/components/assessment/AssessmentQuestion'
import { AssessmentReport } from '@/components/assessment/AssessmentReport'
import { AssessmentStatus } from '@/components/assessment/AssessmentStatus'
import { RegistrationForm } from '@/components/assessment/RegistrationForm'
import { Button } from '@/components/ui/button'
import { useAssessmentSession } from '@/hooks/useAssessmentSession'

export const Assessment = ({ assessmentId }: { assessmentId?: string }) => {
  const learner = useAssessmentSession(assessmentId)
  const { state, report, error, operation, hasPending } = learner
  const busy = operation !== 'idle'
  const retry = hasPending && !busy ? learner.retrySaved : undefined
  const showPendingRecovery = hasPending && !busy && state?.phase === 'administering' && !!state.currentQuestion
  let content
  if (!assessmentId) content = <RegistrationForm busy={busy} fields={error?.fields ?? {}} onSubmit={learner.register} />
  else if (!state && !error) content = <div role="status" aria-label="Loading assessment" className="animate-pulse rounded-2xl border bg-white p-6 motion-reduce:animate-none"><div className="mb-6 h-4 w-1/3 rounded bg-slate-200" /><div className="mb-4 h-7 w-3/4 rounded bg-slate-200" /><div className="mb-8 h-4 w-1/2 rounded bg-slate-200" /><div className="grid gap-3">{[1, 2, 3, 4].map((item) => <div key={item} className="h-14 rounded-xl bg-slate-100" />)}</div></div>
  else if (!state) content = <AssessmentStatus title={error?.status === 404 ? 'Assessment not found' : 'Unable to load assessment'} description={error?.message ?? 'Checking the current state.'} onCheck={() => void learner.refresh()} busy={busy} />
  else if (state.status === 'completed' && state.phase === 'report_ready') content = report?.status === 'ready' ? <AssessmentReport report={report} /> : <AssessmentStatus title={report?.status === 'failed' ? 'Report preparation failed' : 'Preparing your report…'} description={error?.message ?? 'Your assessment is complete. We are preparing your report.'} onCheck={() => void learner.fetchReport()} onRetry={retry} busy={busy} />
  else if (state.phase === 'report_failed' || report?.status === 'failed') content = <AssessmentStatus title="Report preparation failed" description={error?.message ?? 'Check the current status again.'} onCheck={() => void learner.refresh()} onRetry={retry} busy={busy} />
  else if (['awaiting_evaluation', 'finalizing_scientific_results', 'generating_report'].includes(state.phase)) content = <AssessmentStatus title={state.phase === 'generating_report' ? 'Preparing your report…' : 'Processing your answer…'} description={error?.message ?? (state.phase === 'generating_report' ? 'Your assessment is complete. We are preparing your report.' : 'Your answer is being processed.')} onCheck={() => void learner.refresh()} onRetry={retry} busy={busy} />
  else if (state.status === 'active' && state.phase === 'administering' && state.currentQuestion) content = <AssessmentQuestion key={state.currentQuestion.interaction.kind === 'performance' ? state.currentQuestion.attemptId : `${state.currentQuestion.attemptId}:${state.currentQuestion.currentStep}`} assessmentId={state.assessmentId} question={state.currentQuestion} busy={busy} locked={hasPending} onSubmit={learner.submitChoice} onOperation={learner.submitOperation} onCheck={() => void learner.refresh()} />
  else content = <AssessmentStatus title="Assessment is not ready" description={error?.message ?? 'Check the current status to continue.'} onCheck={() => void learner.refresh()} onRetry={retry} busy={busy} />
  return <main className="min-h-screen bg-[#f7f9f8] px-3 py-5 text-slate-900 sm:px-6 sm:py-8"><div className="mx-auto w-full min-w-0 max-w-4xl"><header className="mb-5 flex items-center justify-between gap-3"><Link to="/" className="text-sm font-semibold tracking-tight text-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">Career Matcher</Link></header>{state && state.status !== 'completed' && <AssessmentProgress state={state} />}{error && state?.phase === 'administering' && !hasPending && <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error.message}</p>}{showPendingRecovery && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="mb-2 text-sm text-amber-950">{error?.message ?? 'Your answer may have been saved. Check its status before continuing.'}</p><div className="flex flex-wrap gap-2"><Button type="button" onClick={() => void learner.retrySaved()}>Retry saved answer</Button><Button type="button" variant="outline" onClick={() => void learner.refresh()}>Check current state</Button></div></div>}{!state && error && !assessmentId && <p role="alert" className="mx-auto max-w-md text-sm text-destructive">{error.message}</p>}{content}{assessmentId && !state && error?.status === 404 && <Link className="mt-4 inline-block text-sm text-teal-900 underline" to="/assessment">Start again</Link>}</div></main>
}
