import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { assessmentError, type AssessmentError } from '@/lib/assessment-errors'
import { validChcIntent, validSubmitPayload } from '@/lib/chc-contract'
import { validPisaIntent } from '@/lib/pisa-contract'
import { useCreateAssessmentMutation, useLazyGetAssessmentQuery, useLazyGetAssessmentReportQuery, useSubmitResponseMutation } from '@/services/assessmentApi'
import type { AssessmentOperationIntent, AssessmentParticipant, AssessmentReportResponseDto, AssessmentStateDto, SubmitResponseDto } from '@/types/assessment'

type Operation = 'idle' | 'loading' | 'registering' | 'submitting' | 'checking' | 'report'
export type OperationOutcome = 'accepted' | 'rejected' | 'uncertain' | 'not_sent'
const processing = (state: AssessmentStateDto) => ['awaiting_evaluation', 'finalizing_scientific_results', 'generating_report'].includes(state.phase)
const progressed = (state: AssessmentStateDto, payload: SubmitResponseDto): boolean =>
  state.stateRevision > payload.expectedStateRevision && (
    state.status === 'completed' && state.phase === 'report_ready' ||
    state.currentQuestion !== null && (
      state.currentQuestion.attemptId !== payload.attemptId ||
      state.currentQuestion.currentStep !== payload.step
    )
  )

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
  const scope = useRef(assessmentId)
  const reportRequested = useRef(false)
  const [create] = useCreateAssessmentMutation()
  const [read] = useLazyGetAssessmentQuery()
  const [submit] = useSubmitResponseMutation()
  const [readReport] = useLazyGetAssessmentReportQuery()

  const clearPending = (payload: SubmitResponseDto) => {
    if (pending.current !== payload) return
    pending.current = null
    setHasPending(false)
    setError(null)
  }

  const commit = useCallback((next: AssessmentStateDto): boolean => {
    if (!mounted.current || scope.current !== assessmentId || next.assessmentId !== assessmentId || current.current && next.stateRevision < current.current.stateRevision) return false
    const previous = current.current
    current.current = next
    setState(next)
    if (pending.current && progressed(next, pending.current)) {
      pending.current = null
      setHasPending(false)
      setError(null)
    }
    if (!previous || previous.phase !== next.phase || previous.activeModel !== next.activeModel || previous.currentQuestion?.attemptId !== next.currentQuestion?.attemptId || previous.currentQuestion?.currentStep !== next.currentQuestion?.currentStep) setPollCount(0)
    return true
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
    const requestedId = assessmentId
    if (!requestedId || flight.current || !mounted.current || scope.current !== requestedId) return false
    flight.current = true
    setOperation(initial ? 'loading' : 'checking')
    try {
      const next = await read({ assessmentId: requestedId }, false).unwrap()
      if (mounted.current && scope.current === requestedId) {
        const applied = commit(next)
        if (applied && !pending.current) setError(null)
        return applied
      }
    } catch (cause) { if (mounted.current && scope.current === requestedId) setError(assessmentError(cause)) }
    finally { if (mounted.current && scope.current === requestedId) { flight.current = false; setOperation('idle') } }
    return false
  }, [assessmentId, read, commit])
  const fetchReport = useCallback(async () => {
    const requestedId = assessmentId
    if (!requestedId || flight.current || !mounted.current || scope.current !== requestedId) return
    flight.current = true
    setOperation('report')
    reportRequested.current = true
    try {
      const next = await readReport({ assessmentId: requestedId }, false).unwrap()
      if (mounted.current && scope.current === requestedId && next.assessmentId === requestedId) { setReport(next); setError(null) }
    } catch (cause) { if (mounted.current && scope.current === requestedId) setError(assessmentError(cause)) }
    finally { if (mounted.current && scope.current === requestedId) { flight.current = false; setOperation('idle') } }
  }, [assessmentId, readReport])
  useEffect(() => {
    mounted.current = true
    scope.current = assessmentId
    current.current = null
    pending.current = null
    flight.current = false
    reportRequested.current = false
    if (assessmentId) queueMicrotask(() => { if (mounted.current && scope.current === assessmentId) void refresh(true) })
    return () => { mounted.current = false; scope.current = undefined }
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
    const requestedId = assessmentId
    if (requestedId || !mounted.current || scope.current !== requestedId || !begin('registering')) return
    try {
      const next = await create({ participant }).unwrap()
      if (mounted.current && scope.current === requestedId) navigate(`/assessment/${encodeURIComponent(next.assessmentId)}`)
    } catch (cause) { if (mounted.current && scope.current === requestedId) setError(assessmentError(cause)) }
    finally { if (mounted.current && scope.current === requestedId) end() }
  }
  const send = async (payload: SubmitResponseDto): Promise<OperationOutcome> => {
    const requestedId = assessmentId
    if (!requestedId || !mounted.current || scope.current !== requestedId || !begin('submitting')) return 'not_sent'
    try {
      const next = await submit({ assessmentId: requestedId, payload }).unwrap()
      if (!mounted.current || scope.current !== requestedId) return 'not_sent'
      const applied = commit(next)
      if (!applied && current.current && progressed(current.current, payload)) { clearPending(payload); return 'accepted' }
      if (applied && (progressed(next, payload) || payload.operation === 'draft' && next.stateRevision > payload.expectedStateRevision && next.currentQuestion?.attemptId === payload.attemptId && next.currentQuestion.currentStep === payload.step)) {
        clearPending(payload)
        return 'accepted'
      }
      setError({ message: 'Your answer may have been saved. Check its status or retry the saved answer.', ambiguous: true, fields: {} })
      return 'uncertain'
    } catch (cause) {
      if (!mounted.current || scope.current !== requestedId) return 'not_sent'
      const failure = assessmentError(cause)
      if (failure.ambiguous || failure.status === 409) {
        try {
          const next = await read({ assessmentId: requestedId }, false).unwrap()
          if (!mounted.current || scope.current !== requestedId) return 'not_sent'
          if (commit(next) && progressed(next, payload) || current.current && progressed(current.current, payload)) { clearPending(payload); return 'accepted' }
        } catch (recoveryCause) {
          if (!mounted.current || scope.current !== requestedId) return 'not_sent'
          if (assessmentError(recoveryCause).status === 'PARSING_ERROR') setError({ message: 'The assessment service returned an unexpected response.', ambiguous: true, fields: {} })
        }
        setError({ message: failure.status === 'PARSING_ERROR' ? 'The assessment service returned an unexpected response.' : failure.status === 409 && failure.reason === 'REQUEST_CONFLICT' ? 'The saved request conflicts with another response. Check the current state before continuing.' : 'Your answer may have been saved. Check its status or retry the saved answer.', ambiguous: true, fields: {} })
        return 'uncertain'
      }
      clearPending(payload)
      setError(failure)
      return 'rejected'
    } finally { if (mounted.current && scope.current === requestedId) end() }
  }
  const submitOperation = async (intent: AssessmentOperationIntent): Promise<OperationOutcome> => {
    const saved = current.current
    const question = saved?.currentQuestion
    if (!saved || !question || flight.current || pending.current || saved.phase !== 'administering' || saved.status !== 'active' || !question.allowedOperations.includes(intent.operation) || question.recoveryRequired && intent.operation !== 'interrupt') return 'not_sent'
    if (question.interaction.kind === 'choice') {
      if (intent.operation !== 'submit' || intent.response.kind !== 'choice' || question.interaction.selectionMode !== 'single') return 'not_sent'
      const groupId = question.interaction.optionGroupId
      const selectedId = intent.response.selectedOptionId
      const group = question.presentation.options.find((item) => item.groupId === groupId)
      if (!group?.choices.some((choice) => choice.optionId === selectedId)) return 'not_sent'
    }
    if (question.interaction.kind === 'performance' && !validChcIntent(question, intent)) { setError({ message: 'This response does not match the issued performance step.', ambiguous: false, fields: {} }); return 'rejected' }
    if (question.interaction.kind === 'constructed_activity' && !validPisaIntent(question, intent)) { setError({ message: 'Complete the issued activity fields before continuing.', ambiguous: false, fields: {} }); return 'rejected' }
    const common = { attemptId: question.attemptId, requestId: crypto.randomUUID(), expectedStateRevision: saved.stateRevision, step: question.currentStep }
    const payload: SubmitResponseDto = { ...common, ...intent }
    if (!validSubmitPayload(payload)) { setError({ message: 'The response format is invalid.', ambiguous: false, fields: {} }); return 'rejected' }
    pending.current = payload
    setHasPending(true)
    return send(payload)
  }
  const submitChoice = (selectedOptionId: string) => submitOperation({ operation: 'submit', response: { kind: 'choice', selectedOptionId } })
  const retrySaved = async () => { if (pending.current) await send(pending.current) }
  const checkAgain = async () => {
    const hadPending = pending.current
    const checked = await refresh()
    if (checked && hadPending && pending.current === hadPending) setError({ message: 'Your answer may still be processing. Retry the same response if needed.', ambiguous: true, fields: {} })
  }
  return { state, report, error, operation, pollCount, hasPending, register, refresh: checkAgain, fetchReport, submitChoice, submitOperation, retrySaved }
}
