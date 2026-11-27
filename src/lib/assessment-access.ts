import { validLocator } from '@/lib/assessment-contract'
import type { SubmitChoiceResponseDto } from '@/types/assessment'

const key = 'career-matcher.assessment.session'
export interface PendingChoice { assessmentId: string; payload: SubmitChoiceResponseDto }
export interface AssessmentAccess { accessSecret: string; assessmentId: string | null; pending?: PendingChoice }
const canonicalSecret = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value)) return false
  try {
    const bytes = Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='), (character) => character.charCodeAt(0))
    return bytes.length === 32 && encode(bytes) === value
  } catch { return false }
}
const encode = (bytes: Uint8Array): string => btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const validPending = (value: unknown, assessmentId: string | null): value is PendingChoice => {
  if (!value || typeof value !== 'object' || !assessmentId) return false
  const receipt = value as Partial<PendingChoice>
  const p = receipt.payload
  return Object.keys(receipt).sort().join(',') === 'assessmentId,payload' && receipt.assessmentId === assessmentId && !!p && Object.keys(p).sort().join(',') === 'attemptId,expectedStateRevision,operation,requestId,response,step' && /^[a-fA-F0-9]{24}$/.test(p.attemptId) && typeof p.requestId === 'string' && p.requestId.length > 0 && p.requestId.length <= 128 && Array.from(p.requestId).every((character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127 }) && Number.isSafeInteger(p.expectedStateRevision) && p.expectedStateRevision >= 0 && typeof p.step === 'string' && p.step.length > 0 && p.step.length <= 128 && p.operation === 'submit' && p.response?.kind === 'choice' && Object.keys(p.response).sort().join(',') === 'kind,selectedOptionId' && typeof p.response.selectedOptionId === 'string' && p.response.selectedOptionId.length > 0 && p.response.selectedOptionId.length <= 128
}
export const readAssessmentAccess = (): AssessmentAccess | null => {
  const raw = sessionStorage.getItem(key)
  if (raw === null) return null
  const value: unknown = JSON.parse(raw)
  if (!value || typeof value !== 'object') throw new Error('corrupt session')
  const access = value as Partial<AssessmentAccess>
  if (Object.keys(access).some((name) => !['accessSecret', 'assessmentId', 'pending'].includes(name)) || !canonicalSecret(access.accessSecret) || !(access.assessmentId === null || validLocator(access.assessmentId)) || (access.pending !== undefined && !validPending(access.pending, access.assessmentId))) throw new Error('corrupt session')
  return access as AssessmentAccess
}
const write = (value: AssessmentAccess): AssessmentAccess => { sessionStorage.setItem(key, JSON.stringify(value)); return value }
export const createAssessmentAccess = (): AssessmentAccess => {
  const existing = readAssessmentAccess()
  if (existing) return existing
  return write({ accessSecret: encode(crypto.getRandomValues(new Uint8Array(32))), assessmentId: null })
}
export const bindAssessmentAccess = (assessmentId: string): AssessmentAccess => {
  if (!validLocator(assessmentId)) throw new Error('invalid assessment identity')
  const access = readAssessmentAccess()
  if (!access || (access.assessmentId && access.assessmentId !== assessmentId)) throw new Error('session changed')
  return write({ ...access, assessmentId })
}
export const setPendingChoice = (pending: PendingChoice): AssessmentAccess => {
  const access = readAssessmentAccess()
  if (!access || !validPending(pending, access.assessmentId) || access.pending) throw new Error('pending response unavailable')
  return write({ ...access, pending })
}
export const clearPendingChoice = (): AssessmentAccess => {
  const access = readAssessmentAccess()
  if (!access) throw new Error('session changed')
  return write({ accessSecret: access.accessSecret, assessmentId: access.assessmentId })
}
export const clearAssessmentAccess = (): void => sessionStorage.removeItem(key)
export const newRequestId = (): string => encode(crypto.getRandomValues(new Uint8Array(16)))
