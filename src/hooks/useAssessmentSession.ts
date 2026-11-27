import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { assessmentError, type AssessmentError } from '@/lib/assessment-errors'
import { validChcIntent, validSubmitPayload } from '@/lib/chc-contract'
import { validPisaIntent } from '@/lib/pisa-contract'
import { useCreateAssessmentMutation, useLazyGetAssessmentQuery, useLazyGetAssessmentReportQuery, useSubmitResponseMutation } from '@/services/assessmentApi'
import type { AssessmentOperationIntent, AssessmentParticipant, AssessmentReportResponseDto, AssessmentStateDto, SubmitResponseDto } from '@/types/assessment'

type Operation = 'idle' | 'loading' | 'registering' | 'submitting' | 'checking' | 'report'
const processing = (state: AssessmentStateDto) => ['awaiting_evaluation', 'finalizing_scientific_results', 'generating_report'].includes(state.phase)
const progressed = (state: AssessmentStateDto, payload: SubmitResponseDto) => state.status === 'completed' || state.phase === 'report_ready' || !!state.currentQuestion && (state.currentQuestion.attemptId !== payload.attemptId || state.currentQuestion.currentStep !== payload.step)

export const useAssessmentSession = (assessmentId?: string) => {
  const navigate = useNavigate()
  const [state, setState] = useState<AssessmentStateDto | null>(null)
  const [report, setReport] = useState<AssessmentReportResponseDto | null>(null)
  const [error, setError] = useState<AssessmentError | null>(null)
  const [operation, setOperation] = useState<Operation>('idle')
  const [pollCount, setPollCount] = useState(0)
  const [hasPending, setHasPending] = useState(false)
  const current = useRef<AssessmentStateDto | null>(null)
  const pending = useRef<SubmitResponseDto | null>(null)
  const flight = useRef(false)
  const mounted = useRef(true)
  const reportRequested = useRef(false)
  const [create] = useCreateAssessmentMutation()
  const [read] = useLazyGetAssessmentQuery()
  const [submit] = useSubmitResponseMutation()
  const [readReport] = useLazyGetAssessmentReportQuery()

  const commit = useCallback((next: AssessmentStateDto) => {
    if (!mounted.current || next.assessmentId !== assessmentId || current.current && next.stateRevision < current.current.stateRevision) return
    current.current = next
    setState(next)
    if (pending.current && progressed(next, pending.current)) { pending.current = null; setHasPending(false) }
  }, [assessmentId])
  const begin = (kind: Operation) => {
    if (flight.current) return false
    flight.current = true
    setOperation(kind)
    return true
  }
  const end = () => {
    flight.current = false
    if (mounted.current) setOperation('idle')
  }
  const refresh = useCallback(async (initial = false) => {
    if (!assessmentId || flight.current) return false
    flight.current = true
    setOperation(initial ? 'loading' : 'checking')
    try {
      const next = await read({ assessmentId }, false).unwrap()
      if (mounted.current) { commit(next); setError(null); return true }
    } catch (cause) { if (mounted.current) setError(assessmentError(cause)) }
    finally { flight.current = false; if (mounted.current) setOperation('idle') }
    return false
  }, [assessmentId, read, commit])
  const fetchReport = useCallback(async () => {
    if (!assessmentId || flight.current) return
    flight.current = true
    setOperation('report')
    reportRequested.current = true
    try {
      const next = await readReport({ assessmentId }, false).unwrap()
      if (mounted.current) { setReport(next); setError(null) }
    } catch (cause) { if (mounted.current) setError(assessmentError(cause)) }
    finally { flight.current = false; if (mounted.current) setOperation('idle') }
  }, [assessmentId, readReport])
  useEffect(() => {
    mounted.current = true
    if (assessmentId) queueMicrotask(() => { if (mounted.current) void refresh(true) })
    return () => { mounted.current = false }
  }, [assessmentId, refresh])
  useEffect(() => {
    if (state?.phase === 'report_ready' && state.status === 'completed' && !reportRequested.current && operation === 'idle') void fetchReport()
  }, [state, operation, fetchReport])
  useEffect(() => {
    if (!state || !processing(state) && !(state.phase === 'report_ready' && (report?.status === 'processing' || report?.status === 'pending' || error?.reason === 'REPORT_NOT_STARTED')) || state.currentQuestion || pollCount >= 12 || operation !== 'idle' || document.hidden) return
    const timer = window.setTimeout(() => {
      if (document.hidden) return
      setPollCount((count) => count + 1)
      if (state.phase === 'report_ready') void fetchReport()
      else void refresh()
    }, Math.min(10000, 2500 * 2 ** Math.min(pollCount, 2)))
    return () => window.clearTimeout(timer)
  }, [state, report?.status, error?.reason, pollCount, operation, refresh, fetchReport])
  const register = async (participant: AssessmentParticipant) => {
    if (assessmentId || !begin('registering')) return
    try {
      const next = await create({ participant }).unwrap()
      if (mounted.current) navigate(`/assessment/${encodeURIComponent(next.assessmentId)}`)
    } catch (cause) { if (mounted.current) setError(assessmentError(cause)) }
    finally { end() }
  }
  const send = async (payload: SubmitResponseDto) => {
    if (!assessmentId || !begin('submitting')) return
    let conflict = false
    try {
      const next = await submit({ assessmentId, payload }).unwrap()
      if (mounted.current) {
        commit(next)
        pending.current = null
        setHasPending(false)
        setError(null)
      }
    } catch (cause) {
      if (mounted.current) {
        const failure = assessmentError(cause)
        setError(failure)
        conflict = failure.status === 409
        if (!failure.ambiguous && failure.status !== 409) { pending.current = null; setHasPending(false) }
      }
    } finally { end() }
    if (conflict && mounted.current) {
      await refresh()
      if (pending.current && mounted.current) setError({ message: 'The assessment changed. Check the current state or retry the exact response.', status: 409, ambiguous: true, fields: {} })
    }
  }
  const submitOperation = async (intent: AssessmentOperationIntent) => {
    const saved = current.current
    const question = saved?.currentQuestion
    if (!saved || !question || flight.current || pending.current || saved.phase !== 'administering' || saved.status !== 'active' || !question.allowedOperations.includes(intent.operation) || question.recoveryRequired && intent.operation !== 'interrupt') return
    if (question.interaction.kind === 'choice') {
      if (intent.operation !== 'submit' || intent.response.kind !== 'choice' || question.interaction.selectionMode !== 'single') return
      const groupId = question.interaction.optionGroupId
      const selectedId = intent.response.selectedOptionId
      const group = question.presentation.options.find((item) => item.groupId === groupId)
      if (!group?.choices.some((choice) => choice.optionId === selectedId)) return
    }
    if (question.interaction.kind === 'performance' && !validChcIntent(question, intent)) { setError({ message: 'This response does not match the issued performance step.', ambiguous: false, fields: {} }); return }
    if (question.interaction.kind === 'constructed_activity' && !validPisaIntent(question, intent)) { setError({ message: 'Complete the issued activity fields before continuing.', ambiguous: false, fields: {} }); return }
    const common = { attemptId: question.attemptId, requestId: crypto.randomUUID(), expectedStateRevision: saved.stateRevision, step: question.currentStep }
    const payload: SubmitResponseDto = { ...common, ...intent }
    if (!validSubmitPayload(payload)) { setError({ message: 'The response format is invalid.', ambiguous: false, fields: {} }); return }
    pending.current = payload
    setHasPending(true)
    await send(payload)
  }
  const submitChoice = (selectedOptionId: string) => submitOperation({ operation: 'submit', response: { kind: 'choice', selectedOptionId } })
  const retrySaved = async () => { if (pending.current) await send(pending.current) }
  const checkAgain = async () => {
    const hadPending = pending.current
    await refresh()
    if (hadPending && pending.current && current.current?.currentQuestion?.attemptId === hadPending.attemptId && current.current.currentQuestion.currentStep === hadPending.step) setError({ message: 'The response may still be processing. Retry the same response if needed.', ambiguous: true, fields: {} })
  }
  return { state, report, error, operation, pollCount, hasPending, register, refresh: checkAgain, fetchReport, submitChoice, submitOperation, retrySaved }
}
