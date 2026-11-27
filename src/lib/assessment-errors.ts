import type { ApiErrorResponse } from '@/types/common'

export interface AssessmentError { message: string; accessLost: boolean; ambiguous: boolean; reason?: string; fields: Record<string, string> }
const safeMessage = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.length < 1 || value.length > 240 || !/^[\x20-\x7e]+$/.test(value)) return null
  if (/[<>\\{}[\]]|https?:|www\.|\b(?:stack|trace|exception|select|insert|password|secret|token|credential|mongodb|postgres|file:|at [A-Za-z]+\.)\b/i.test(value)) return null
  return value
}
const knownLegacyMessage = (value: string): string | null => {
  if (value === 'Assessment deployment inputs are unavailable') return 'Assessment deployment inputs are unavailable. Please try later or contact the assessment provider.'
  if (value === 'Participant age group is not approved') return 'This age group is not approved by the assessment service. Check the selected group or contact the provider.'
  if (value === 'Verified report artifact is unavailable') return 'The report artifact is unavailable. Check again later or contact the provider.'
  return null
}
const messages: Record<string, string> = {
  INVALID_REQUEST: 'Please check the information and try again.', INVALID_RESPONSE: 'This response could not be accepted. Check the current question before trying again.', ACCESS_REQUIRED: 'Assessment access is unavailable.', ASSESSMENT_NOT_FOUND: 'Assessment access is unavailable.', CREATE_CONFLICT: 'This saved access belongs to different registration details. Re-enter the same details or choose a fresh local session.', STATE_CONFLICT: 'The assessment changed. Check its current state before continuing.', REQUEST_CONFLICT: 'This saved request conflicts with a previous attempt. Check the current state before continuing.', OPERATION_NOT_ALLOWED: 'This action is not available for the current question.', REPORT_NOT_STARTED: 'The report is still being prepared.', PARTICIPANT_NOT_ELIGIBLE: 'Registration is not available for these details.', PAYLOAD_TOO_LARGE: 'The response could not be accepted.', RATE_LIMITED: 'Too many requests. Please check again later.', ASSESSMENT_NOT_READY: 'The assessment service is not ready.', PROCESSING_UNAVAILABLE: 'Processing is temporarily unavailable. Your saved response can be checked or retried.'
}
export const assessmentError = (error: unknown): AssessmentError => {
  const value = error && typeof error === 'object' ? error as Record<string, unknown> : {}
  const status = value.status
  const data = value.data && typeof value.data === 'object' ? value.data as Partial<ApiErrorResponse> : null
  const detail = data?.data && typeof data.data === 'object' ? data.data as Record<string, unknown> : {}
  const reason = typeof detail.reason === 'string' && detail.reason in messages ? detail.reason : undefined
  const fields: Record<string, string> = {}
  if (Array.isArray(detail.errors)) for (const item of detail.errors) {
    if (item && typeof item === 'object' && 'field' in item && 'message' in item && typeof item.field === 'string' && typeof item.message === 'string' && /^participant\.(name|email|phone|class|ageGroup|gender|location)$/.test(item.field)) fields[item.field.slice(12)] = 'Please check this value.'
  }
  const accessLost = status === 401 || status === 404
  const ambiguous = typeof status !== 'number' || status >= 500 || reason === 'PROCESSING_UNAVAILABLE' || reason === 'STATE_CONFLICT' || reason === 'REQUEST_CONFLICT'
  const envelopeMessage = data?.success === false && typeof data.error_code === 'number' ? safeMessage(data.message) : null
  const actionable = envelopeMessage && (reason === 'ASSESSMENT_NOT_READY' || reason === 'PROCESSING_UNAVAILABLE' || reason === 'PARTICIPANT_NOT_ELIGIBLE') ? knownLegacyMessage(envelopeMessage) ?? `${envelopeMessage}. Check again later or contact the assessment provider.` : null
  const message = accessLost ? 'Assessment access was rejected. Check the saved session or start a fresh local session if access cannot be recovered.' : actionable ?? (reason ? messages[reason] : status === 'FETCH_ERROR' ? 'The assessment service could not be reached. Check your connection, then try again.' : status === 'PARSING_ERROR' ? 'The assessment service returned a response this app could not read. Check again or contact the provider.' : typeof status !== 'number' ? 'The assessment request could not be completed. Check the service connection, then try again.' : status === 400 ? 'The request was rejected. Check the entered details or current question before trying again.' : status === 409 ? 'The assessment changed or this request conflicts with a previous attempt. Check the current state.' : status === 503 ? 'The assessment service is unavailable. Check again later or contact the provider.' : 'The assessment service could not complete this request. Check the current state and try again.')
  return { message, accessLost, ambiguous, reason, fields }
}
