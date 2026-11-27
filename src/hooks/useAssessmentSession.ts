import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppDispatch } from '@/store/store'
import { assessmentApi, useCreateAssessmentMutation, useLazyGetAssessmentQuery, useLazyGetAssessmentReportQuery, useSubmitResponseMutation } from '@/services/assessmentApi'
import { assessmentError, type AssessmentError } from '@/lib/assessment-errors'
import { bindAssessmentAccess, clearAssessmentAccess, clearPendingChoice, createAssessmentAccess, newRequestId, readAssessmentAccess, setPendingChoice, type AssessmentAccess } from '@/lib/assessment-access'
import { validChcIntent, validSubmitPayload } from '@/lib/chc-contract'
import { validPisaIntent } from '@/lib/pisa-contract'
import type { AssessmentOperationIntent, AssessmentParticipant, AssessmentReportResponseDto, AssessmentStateDto, SubmitResponseDto } from '@/types/assessment'

type Operation = 'idle' | 'loading' | 'registering' | 'submitting' | 'checking' | 'report'
const pendingPhase = (state: AssessmentStateDto) => ['awaiting_evaluation', 'finalizing_scientific_results', 'generating_report'].includes(state.phase)
const initialAccess = (): { access: AssessmentAccess | null; corrupt: boolean } => {
  try { return { access: readAssessmentAccess(), corrupt: false } }
  catch { return { access: null, corrupt: true } }
}

export const useAssessmentSession = () => {
  const dispatch = useAppDispatch()
  const [initial] = useState(initialAccess)
  const [access, setAccess] = useState<AssessmentAccess | null>(initial.access)
  const [corrupt, setCorrupt] = useState(initial.corrupt)
  const [state, setState] = useState<AssessmentStateDto | null>(null)
  const [report, setReport] = useState<AssessmentReportResponseDto | null>(null)
  const [error, setError] = useState<AssessmentError | null>(null)
  const [operation, setOperation] = useState<Operation>('idle')
  const [registrationPending, setRegistrationPending] = useState<AssessmentParticipant | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const [choiceReset, setChoiceReset] = useState(0)
  const [accessLost, setAccessLost] = useState(false)
  const inFlight = useRef(false)
  const generation = useRef(0)
  const mounted = useRef(true)
  const current = useRef<AssessmentStateDto | null>(null)
  const session = useRef<AssessmentAccess | null>(initial.access)
  const reportRequestedFor = useRef<string | null>(null)
  const [create, createResult] = useCreateAssessmentMutation()
  const [read] = useLazyGetAssessmentQuery()
  const [submit, submitResult] = useSubmitResponseMutation()
  const [readReport] = useLazyGetAssessmentReportQuery()

  const updateAccess = (value: AssessmentAccess | null) => { session.current = value; setAccess(value) }
  const commit = (value: AssessmentStateDto) => {
    if (!mounted.current || session.current?.assessmentId !== value.assessmentId) return
    if (current.current && current.current.assessmentId === value.assessmentId && value.stateRevision < current.current.stateRevision) return
    current.current = value
    setState(value)
    const receipt = session.current.pending
    if (receipt && ((value.phase === 'report_ready' && value.status === 'completed') || (value.currentQuestion && (value.currentQuestion.attemptId !== receipt.payload.attemptId || value.currentQuestion.currentStep !== receipt.payload.step)))) {
      try { updateAccess(clearPendingChoice()) } catch { setError(assessmentError(null)) }
    }
  }
  const handleError = useCallback((cause: unknown) => {
    const parsed = assessmentError(cause)
    setError(parsed)
    if (parsed.accessLost) {
      generation.current++
      setAccessLost(true)
      current.current = null
      setState(null)
      setReport(null)
      dispatch(assessmentApi.util.resetApiState())
    }
  }, [dispatch])
  const begin = useCallback((next: Operation): number | null => {
    if (inFlight.current || accessLost || corrupt) return null
    inFlight.current = true
    setOperation(next)
    return generation.current
  }, [accessLost, corrupt])
  const finish = (token: number) => {
    inFlight.current = false
    if (mounted.current && token === generation.current) setOperation('idle')
  }
  const refresh = useCallback(async (initial = false) => {
    const identity = session.current?.assessmentId
    if (!identity || inFlight.current || accessLost) return false
    const token = begin(initial ? 'loading' : 'checking')
    if (token === null) return false
    try {
      const result = await read({ assessmentId: identity }, false).unwrap()
      if (mounted.current && token === generation.current && session.current?.assessmentId === identity) { commit(result); setError(null); return true }
    } catch (cause) { if (mounted.current && token === generation.current) handleError(cause) }
    finally { finish(token) }
    return false
  }, [read, accessLost, begin, handleError])
  const fetchReport = useCallback(async () => {
    const identity = session.current?.assessmentId
    if (!identity || inFlight.current || accessLost) return
    const token = begin('report')
    if (token === null) return
    reportRequestedFor.current = `${identity}:${current.current?.phase}`
    let checkParent = false
    try {
      const result = await readReport({ assessmentId: identity }, false).unwrap()
      if (mounted.current && token === generation.current && session.current?.assessmentId === identity) {
        setError(null)
        setReport(result)
        checkParent = result.status === 'ready' && (current.current?.status !== 'completed' || current.current.phase !== 'report_ready')
        if (result.status === 'failed') setError({ message: 'Report preparation failed. Your accepted assessment remains saved. Check again later.', accessLost: false, ambiguous: false, fields: {} })
      }
    } catch (cause) {
      if (mounted.current && token === generation.current) {
        setReport(null)
        checkParent = assessmentError(cause).reason === 'REPORT_NOT_STARTED'
        handleError(cause)
      }
    }
    finally { finish(token) }
    if (checkParent && mounted.current && token === generation.current) await refresh()
  }, [readReport, accessLost, begin, handleError, refresh])

  const refreshRef = useRef(refresh)
  useEffect(() => { refreshRef.current = refresh }, [refresh])

  useEffect(() => {
    const mountedFlag = mounted
    const generationFlag = generation
    const flightFlag = inFlight
    mounted.current = true
    if (session.current?.assessmentId) queueMicrotask(() => { if (mounted.current) void refreshRef.current(true) })
    return () => { mountedFlag.current = false; generationFlag.current++; flightFlag.current = false }
  }, [])
  useEffect(() => {
    if (state?.phase !== 'report_ready' || state.status !== 'completed' || report !== null || error?.accessLost || operation !== 'idle' || reportRequestedFor.current === `${state.assessmentId}:${state.phase}`) return
    void fetchReport()
  }, [state?.phase, state?.status, state?.assessmentId, report, error?.accessLost, operation, fetchReport])
  useEffect(() => {
    if (!state || !(pendingPhase(state) || (state.phase === 'report_ready' && ['pending', 'processing'].includes(report?.status ?? ''))) || report?.status === 'failed' || error?.reason === 'RATE_LIMITED' || accessLost || pollCount >= 12 || document.hidden || inFlight.current) return
    const timer = window.setTimeout(async () => {
      if (document.hidden) return
      setPollCount((count) => count + 1)
      if (state.phase === 'report_ready' || (state.phase === 'generating_report' && pollCount % 2 === 0)) await fetchReport()
      else await refresh()
    }, Math.min(10000, 2500 * 2 ** Math.min(pollCount, 2)))
    return () => window.clearTimeout(timer)
  }, [state, report?.status, error?.reason, pollCount, accessLost, operation, fetchReport, refresh])

  const register = async (participant: AssessmentParticipant) => {
    if (session.current?.assessmentId) return
    const token = begin('registering')
    if (token === null) return
    try {
      const retained = createAssessmentAccess()
      updateAccess(retained)
      setRegistrationPending(participant)
      const result = await create({ participant }).unwrap()
      if (token !== generation.current || !mounted.current) return
      updateAccess(bindAssessmentAccess(result.assessmentId))
      setRegistrationPending(null)
      commit(result)
      setError(null)
    } catch (cause) { if (mounted.current && token === generation.current) handleError(cause) }
    finally { finish(token); createResult.reset() }
  }
  const reconcile = async () => refresh()
  const sendSaved = async (payload: SubmitResponseDto, identity: string) => {
    const token = begin('submitting')
    if (token === null) return
    let failure: AssessmentError | null = null
    let checkCommitted = false
    try {
      const result = await submit({ assessmentId: identity, payload }).unwrap()
      if (mounted.current && token === generation.current && session.current?.assessmentId === identity) {
        commit(result)
        if (payload.operation === 'draft' && result.stateRevision > payload.expectedStateRevision && result.currentQuestion?.attemptId === payload.attemptId && result.currentQuestion.currentStep === payload.step && result.currentQuestion.interaction.kind === 'constructed_activity' && JSON.stringify(result.currentQuestion.interaction.draft) === JSON.stringify(payload.response.output) && session.current?.pending?.payload.requestId === payload.requestId) updateAccess(clearPendingChoice())
        checkCommitted = current.current?.phase === 'administering' && current.current.currentQuestion?.attemptId === payload.attemptId && current.current.currentQuestion.currentStep === payload.step && session.current?.pending?.payload.requestId === payload.requestId
        setError(null)
      }
    } catch (cause) { if (mounted.current && token === generation.current) { failure = assessmentError(cause); handleError(cause) } }
    finally { finish(token); submitResult.reset() }
    if (checkCommitted && mounted.current && token === generation.current) await reconcile()
    if (failure && !failure.accessLost && mounted.current && token === generation.current) {
      const confirmed = await reconcile()
      const issued = current.current?.currentQuestion
      const definitelyRejected = ['INVALID_REQUEST', 'INVALID_RESPONSE', 'OPERATION_NOT_ALLOWED', 'PAYLOAD_TOO_LARGE'].includes(failure.reason ?? '')
      if (confirmed && definitelyRejected && issued?.attemptId === payload.attemptId && issued.currentStep === payload.step && session.current?.pending?.payload.requestId === payload.requestId) {
        try {
          updateAccess(clearPendingChoice())
          if (payload.operation === 'submit' && payload.response.kind === 'choice') setChoiceReset((count) => count + 1)
          setError(failure)
        } catch { setError(assessmentError(null)) }
      }
    }
  }
  const submitOperation = async (intent: AssessmentOperationIntent) => {
    const committed = current.current
    const question = committed?.currentQuestion
    const identity = session.current?.assessmentId
    if (!committed || !question || !identity || identity !== committed.assessmentId || inFlight.current || session.current?.pending || committed.phase !== 'administering' || committed.status !== 'active' || !question.allowedOperations.includes(intent.operation) || (question.recoveryRequired && intent.operation !== 'interrupt')) { setError({ message: 'This action is unavailable for the current saved step. Check again before continuing.', accessLost: false, ambiguous: false, fields: {} }); return }
    if (question.interaction.kind === 'choice' && (intent.operation !== 'submit' || intent.response.kind !== 'choice')) return
    if (question.interaction.kind === 'performance' && !validChcIntent(question, intent)) { setError({ message: 'This response does not match the current issued performance step.', accessLost: false, ambiguous: false, fields: {} }); return }
    if (question.interaction.kind === 'constructed_activity' && !validPisaIntent(question, intent)) { setError({ message: 'Complete the issued activity fields before saving or submitting.', accessLost: false, ambiguous: false, fields: {} }); return }
    const common = { attemptId: question.attemptId, requestId: newRequestId(), expectedStateRevision: committed.stateRevision, step: question.currentStep }
    let payload: SubmitResponseDto
    if (intent.operation === 'step') payload = { ...common, ...intent }
    else if (intent.operation === 'skip') payload = { ...common, ...intent }
    else if (intent.operation === 'interrupt') payload = { ...common, ...intent }
    else if (intent.operation === 'draft') payload = { ...common, ...intent }
    else if (intent.response.kind === 'choice') payload = { ...common, operation: 'submit', response: intent.response }
    else payload = { ...common, ...intent }
    if (!validSubmitPayload(payload)) { setError({ message: 'This response cannot be saved because its format or size is invalid.', accessLost: false, ambiguous: false, fields: {} }); return }
    try { updateAccess(setPendingChoice({ assessmentId: identity, payload })) }
    catch { setError({ message: 'This response cannot be saved for recovery in this tab. Please check browser storage and try again.', accessLost: false, ambiguous: false, fields: {} }); return }
    await sendSaved(payload, identity)
  }
  const submitChoice = async (selectedOptionId: string) => {
    const committed = current.current
    const question = committed?.currentQuestion
    if (!committed || !question || question.interaction.kind !== 'choice' || question.interaction.selectionMode !== 'single' || !question.allowedOperations.includes('submit')) return
    const optionGroupId = question.interaction.optionGroupId
    const group = question.presentation.options.find((item) => item.groupId === optionGroupId)
    if (!group?.choices.some((option) => option.optionId === selectedOptionId)) return
    await submitOperation({ operation: 'submit', response: { kind: 'choice', selectedOptionId } })
  }
  const retrySaved = async () => {
    const receipt = session.current?.pending
    if (!receipt || !current.current || receipt.assessmentId !== current.current.assessmentId) return
    await sendSaved(receipt.payload, receipt.assessmentId)
  }
  const abandon = () => {
    if (!window.confirm('Discard access stored in this tab? You may not be able to return to this assessment. This does not delete anything on the server.')) return
    generation.current++
    clearAssessmentAccess()
    dispatch(assessmentApi.util.resetApiState())
    updateAccess(null); current.current = null; reportRequestedFor.current = null; setState(null); setReport(null); setError(null); setCorrupt(false); setAccessLost(false); setRegistrationPending(null); setPollCount(0); setChoiceReset(0)
  }
  return { access, corrupt, accessLost, state, report, error, operation, registrationPending, pollCount, choiceReset, register, refresh, fetchReport, submitChoice, submitOperation, retrySaved, abandon }
}
