import { Link } from 'react-router'
import { AssessmentProgress } from '@/components/assessment/AssessmentProgress'
import { AssessmentQuestion } from '@/components/assessment/AssessmentQuestion'
import { AssessmentReport } from '@/components/assessment/AssessmentReport'
import { AssessmentStatus } from '@/components/assessment/AssessmentStatus'
import { RegistrationForm } from '@/components/assessment/RegistrationForm'
import { Button } from '@/components/ui/button'
import { useAssessmentSession } from '@/hooks/useAssessmentSession'

export const Assessment = () => {
  const learner = useAssessmentSession()
  const { access, corrupt, accessLost, state, report, error, operation } = learner
  const busy = operation !== 'idle'
  const receipt = access?.pending
  let content
  if (corrupt) content = <AssessmentStatus title="Saved access cannot be read" description="The access saved in this tab is damaged. A fresh local session will lose access to this assessment. You can clear it only by choosing the button below." />
  else if (accessLost) content = <AssessmentStatus title="Assessment access unavailable" description="This tab can no longer access the saved assessment. There is no public lookup or secret recovery. You may choose to discard local access and start again." />
  else if (!access || !access.assessmentId) content = <RegistrationForm busy={busy} pending={!!access} fields={{ ...error?.fields, _freeze: learner.registrationPending && error?.ambiguous ? 'yes' : '' }} onSubmit={learner.register} />
  else if (!state) content = <AssessmentStatus title="Loading your assessment" description={error?.message || 'Checking the assessment saved in this tab.'} onCheck={() => void learner.refresh()} busy={busy} />
  else if (state.status === 'blocked') content = <AssessmentStatus title="Assessment paused by the service" description="Progress cannot continue right now. Check again later." onCheck={() => void learner.refresh()} busy={busy} />
  else if (state.phase === 'report_ready' && state.status === 'completed') content = report?.status === 'ready' ? <AssessmentReport report={report} /> : <AssessmentStatus title={report?.status === 'pending' || report?.status === 'processing' ? 'Preparing your report' : report?.status === 'failed' ? 'Report preparation failed' : 'Report temporarily unavailable'} description={error?.message || (report?.status === 'failed' ? 'Your accepted assessment remains saved. Check again later.' : 'Your assessment is complete. Check again for the report.')} onCheck={() => void learner.fetchReport()} busy={busy} />
  else if (state.phase === 'report_ready' || state.status === 'completed') content = <AssessmentStatus title="Assessment status needs checking" description="The service returned an inconsistent completion state. Your progress remains saved." onCheck={() => void learner.refresh()} busy={busy} />
  else if (state.phase === 'report_failed') content = <AssessmentStatus title="Report preparation failed" description="Your accepted assessment remains saved. Check again later; this frontend cannot start report generation." onCheck={() => void learner.refresh()} onRetry={receipt ? learner.retrySaved : undefined} busy={busy} />
  else if (report?.status === 'failed') content = <AssessmentStatus title="Report preparation failed" description="Your accepted assessment remains saved. Check again later; this frontend cannot start report generation." onCheck={() => void learner.fetchReport()} onRetry={receipt ? learner.retrySaved : undefined} busy={busy} />
  else if (['awaiting_evaluation', 'finalizing_scientific_results', 'generating_report'].includes(state.phase)) content = <AssessmentStatus title="Preparing your next step" description="The service is processing saved work. You can check again. Automatic checks are limited." onCheck={() => void learner.refresh()} onRetry={receipt ? learner.retrySaved : undefined} busy={busy} />
  else if (receipt) content = <AssessmentStatus title="Saved response needs checking" description="A response may have been accepted. Check the current state or retry the exact saved response." onCheck={() => void learner.refresh()} onRetry={learner.retrySaved} busy={busy} />
  else if (state.status === 'active' && state.phase === 'administering' && state.currentQuestion) content = <AssessmentQuestion key={`${state.assessmentId}:${state.currentQuestion.attemptId}:${state.currentQuestion.currentStep}`} assessmentId={state.assessmentId} question={state.currentQuestion} busy={busy} locked={!!receipt} onSubmit={learner.submitChoice} onCheck={() => void learner.refresh()} />
  else content = <AssessmentStatus title="Assessment not ready to continue" description="There is no question available to answer right now. Check again later." onCheck={() => void learner.refresh()} busy={busy} />
  return <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-8 sm:px-6"><header className="mb-8 flex flex-wrap items-center justify-between gap-3"><div><Link to="/" className="text-sm font-semibold text-primary">Career Matcher</Link><h1 className="mt-2 text-3xl font-semibold tracking-tight">Learner assessment</h1></div><Link to="/" className="rounded-lg border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary">Back to Home</Link></header>{error && !accessLost && <p role="alert" className="mb-5 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{error.message}</p>}{state && !accessLost && <div className="mb-5"><AssessmentProgress state={state} /></div>}{content}{(corrupt || accessLost || (access && !receipt && operation === 'idle')) && <div className="mt-8"><Button variant="outline" onClick={learner.abandon}>Discard access stored in this tab</Button></div>}</main>
}
