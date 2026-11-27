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
  let content
  if (!assessmentId) content = <RegistrationForm busy={busy} fields={error?.fields ?? {}} onSubmit={learner.register} />
  else if (!state) content = <AssessmentStatus title={error?.status === 404 ? 'Assessment not found' : error ? 'Unable to load assessment' : 'Loading assessment'} description={error?.message ?? 'Checking the current state.'} onCheck={() => void learner.refresh()} busy={busy} />
  else if (state.status === 'completed' && state.phase === 'report_ready') content = report?.status === 'ready' ? <AssessmentReport report={report} /> : <AssessmentStatus title={report?.status === 'failed' ? 'Report preparation failed' : 'Preparing your report…'} description={error?.message ?? (report?.status === 'failed' ? 'Check the report status again.' : 'Your assessment is complete.')} onCheck={() => void learner.fetchReport()} onRetry={hasPending ? learner.retrySaved : undefined} busy={busy} />
  else if (state.phase === 'report_failed' || report?.status === 'failed') content = <AssessmentStatus title="Report preparation failed" description={error?.message ?? 'Check the current status again.'} onCheck={() => void learner.refresh()} onRetry={hasPending ? learner.retrySaved : undefined} busy={busy} />
  else if (['awaiting_evaluation', 'finalizing_scientific_results', 'generating_report'].includes(state.phase)) content = <AssessmentStatus title={state.phase === 'generating_report' ? 'Preparing your report…' : 'Processing your response…'} description={error?.message ?? 'Check the current status if this takes longer than expected.'} onCheck={() => void learner.refresh()} onRetry={hasPending ? learner.retrySaved : undefined} busy={busy} />
  else if (state.status === 'active' && state.phase === 'administering' && state.currentQuestion) content = <AssessmentQuestion key={`${state.currentQuestion.attemptId}:${state.currentQuestion.currentStep}`} assessmentId={state.assessmentId} question={state.currentQuestion} busy={busy} locked={hasPending} onSubmit={learner.submitChoice} onOperation={learner.submitOperation} onCheck={() => void learner.refresh()} />
  else content = <AssessmentStatus title="Assessment is not ready" description={error?.message ?? 'Check the current status to continue.'} onCheck={() => void learner.refresh()} onRetry={hasPending ? learner.retrySaved : undefined} busy={busy} />
  return <main className="min-h-screen bg-[#f7f9f8] px-4 py-6 text-slate-900 sm:px-6 sm:py-10"><div className="mx-auto w-full max-w-5xl"><header className="mb-6"><Link to="/" className="text-sm font-semibold tracking-tight text-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">Career Matcher</Link></header>{state && state.status !== 'completed' && <AssessmentProgress state={state} />}{error && state && <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error.message}</p>}{hasPending && state?.phase === 'administering' && state.currentQuestion && <div className="mb-4 flex flex-wrap gap-2"><Button type="button" onClick={() => void learner.retrySaved()} disabled={busy}>Retry response</Button><Button type="button" variant="outline" onClick={() => void learner.refresh()} disabled={busy}>Check again</Button></div>}{!state && error && !assessmentId && <p role="alert" className="mx-auto max-w-md text-sm text-destructive">{error.message}</p>}{content}{assessmentId && !state && error?.status === 404 && <Link className="mt-4 inline-block text-sm text-teal-900 underline" to="/assessment">Start again</Link>}</div></main>
}
