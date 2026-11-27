import type { ApiErrorResponse } from '@/types/common'

export interface AssessmentError { message: string; status?: number | string; reason?: string; ambiguous: boolean; fields: Record<string, string> }
const safe = (value: unknown): string | null => typeof value === 'string' && value.length > 0 && value.length <= 240 && !/[<>]|https?:|\b(?:stack|trace|exception|password|secret|token|credential|mongodb|postgres)\b/i.test(value) ? value : null

export const assessmentError = (error: unknown): AssessmentError => {
  const value = error && typeof error === 'object' ? error as Record<string, unknown> : {}
  const status = typeof value.status === 'number' || typeof value.status === 'string' ? value.status : undefined
  const data = value.data && typeof value.data === 'object' ? value.data as Partial<ApiErrorResponse> : null
  const detail = data?.data && typeof data.data === 'object' ? data.data as Record<string, unknown> : {}
  const reason = typeof detail.reason === 'string' ? detail.reason : undefined
  const fields: Record<string, string> = {}
  if (Array.isArray(detail.errors)) for (const item of detail.errors) {
    if (item && typeof item === 'object' && 'field' in item && 'message' in item && typeof item.field === 'string' && /^participant\.(name|email)$/.test(item.field)) fields[item.field.slice(12)] = safe(item.message) ?? 'Please check this value.'
  }
  const message = safe(data?.message) ?? (status === 404 ? 'Assessment not found.' : status === 409 ? 'The assessment changed. Check again before continuing.' : status === 'FETCH_ERROR' ? 'The assessment service could not be reached. Check your connection.' : status === 500 || status === 503 ? 'The service is temporarily unavailable. Retry the response or check again.' : 'The assessment request could not be completed.')
  return { message, status, reason, ambiguous: status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR' || typeof status !== 'number' || status >= 500, fields }
}
