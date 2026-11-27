import type { AssessmentReportResponseDto, AssessmentStateDto } from '@/types/assessment'
import type { ApiResponse } from '@/types/common'
import { validChcStep } from '@/lib/chc-contract'

const models = ['riasec', 'big_five', 'oecd_sses', 'chc', 'pisa_creative_thinking', 'sdt', 'scct']
const statuses = ['created', 'active', 'paused', 'blocked', 'completed']
const phases = ['not_started', 'administering', 'awaiting_evaluation', 'finalizing_scientific_results', 'generating_report', 'report_failed', 'report_ready']
const modelStatuses = ['not_started', 'active', 'complete', 'incomplete']
const operations = ['step', 'draft', 'submit', 'skip', 'interrupt']
const layouts = ['option_list', 'option_cards', 'scenario_choice', 'image_cards', 'image_comparison', 'activity_workspace', 'performance_task']
const modes = ['text', 'mixed', 'visual', 'audio', 'interactive']
const families = ['single_select', 'picture_comparison', 'text_comparison', 'situational_choice', 'frequency', 'feeling_intensity', 'agreement', 'functioning_degree', 'future_expectation', 'NEEDS_5', 'REASONS_4', 'confidence_5', 'expectation_5', 'intention_5', 'experience_status', 'support_status', 'barrier_impact']
const mediaTypes = ['image', 'audio', 'video', 'svg']
const mediaRoles = ['supporting', 'stimulus', 'option_icon', 'option_image', 'option', 'palette', 'baseline']
export const validLocator = (value: unknown): value is string => typeof value === 'string' && /^PSY-ASMT-[A-F0-9]{24}$/.test(value)
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const string = (value: unknown): value is string => typeof value === 'string'
const nonempty = (value: unknown): value is string => string(value) && value.trim().length > 0
const bounded = (value: unknown, max = 128): value is string => nonempty(value) && value.length <= max
const count = (value: unknown): value is number => Number.isSafeInteger(value) && typeof value === 'number' && value >= 0
const date = (value: unknown): value is string | null => value === null || (string(value) && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value)))
const member = (value: unknown, choices: string[]): value is string => string(value) && choices.includes(value)
const optional = (value: unknown): boolean => value === undefined || string(value)

export class AssessmentContractError extends Error { constructor() { super('The assessment service returned an unexpected response.') } }
const requireValid = (valid: boolean): void => { if (!valid) throw new AssessmentContractError() }
const media = (value: unknown): boolean => record(value) && bounded(value.mediaId) && member(value.mediaType, mediaTypes) && member(value.role, mediaRoles) && safeMediaUrl(value.url) && optional(value.format) && optional(value.altText) && optional(value.optionId) && (value.fallback === undefined || (record(value.fallback) && member(value.fallback.mediaType, mediaTypes) && safeMediaUrl(value.fallback.url) && optional(value.fallback.format)))
export const safeMediaUrl = (value: unknown): value is string => {
  if (!string(value)) return false
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && (window.location.protocol !== 'https:' || url.protocol === 'https:')
  } catch { return false }
}
const question = (value: unknown): boolean => {
  if (!record(value) || !string(value.attemptId) || !/^[a-fA-F0-9]{24}$/.test(value.attemptId) || !bounded(value.questionId) || !member(value.model, models) || !bounded(value.currentStep) || typeof value.recoveryRequired !== 'boolean' || !Array.isArray(value.allowedOperations) || !value.allowedOperations.every((item) => member(item, operations)) || ![value.questionText, value.description, value.helperText, value.instructions].every(optional)) return false
  const p = value.presentation
  const i = value.interaction
  if (!record(p) || !member(p.mode, modes) || !member(p.layout, layouts) || !optional(p.title) || !Array.isArray(p.media) || !p.media.every(media) || !Array.isArray(p.options) || !record(i)) return false
  if (i.kind === 'choice') {
    if (!member(i.responseFamily, families) || !bounded(i.optionGroupId) || !member(i.selectionMode, ['single', 'multiple'])) return false
  } else if (i.kind === 'performance') {
    if (value.model !== 'chc' || !validChcStep(i.protocol, media)) return false
  } else if (i.kind === 'constructed_activity') {
    if ((i.requiredOutputs !== 1 && i.requiredOutputs !== 2) || !('editor' in i) || !('draft' in i)) return false
  } else return false
  const ids = new Set<string>()
  for (const group of p.options) {
    if (!record(group) || !bounded(group.groupId) || ids.has(group.groupId) || !optional(group.prompt) || (group.layout !== undefined && !member(group.layout, layouts)) || !Array.isArray(group.choices)) return false
    ids.add(group.groupId)
    const optionIds = new Set<string>()
    for (const option of group.choices) {
      if (!record(option) || !bounded(option.optionId) || optionIds.has(option.optionId) || !optional(option.text) || !optional(option.value) || (option.values !== undefined && (!Array.isArray(option.values) || !option.values.every(string))) || (option.pair !== undefined && (!Array.isArray(option.pair) || !option.pair.every(string))) || (option.media !== undefined && !media(option.media))) return false
      optionIds.add(option.optionId)
    }
  }
  return i.kind !== 'choice' || p.options.filter((group) => group.groupId === i.optionGroupId).length === 1
}
export const parseState = (value: unknown, expectedId?: string): AssessmentStateDto => {
  requireValid(record(value) && validLocator(value.assessmentId) && (!expectedId || value.assessmentId === expectedId) && member(value.status, statuses) && member(value.phase, phases) && count(value.stateRevision) && (value.activeModel === null || member(value.activeModel, models)) && date(value.startedAt) && date(value.completedAt) && record(value.progress) && count(value.progress.totalModels) && count(value.progress.completedModels) && count(value.progress.answeredQuestions) && count(value.progress.plannedQuestions) && value.progress.completedModels <= value.progress.totalModels && Array.isArray(value.models) && value.models.length === value.progress.totalModels && value.models.every((model) => record(model) && member(model.model, models) && nonempty(model.name) && member(model.status, modelStatuses) && count(model.answeredQuestions) && count(model.plannedQuestions)) && new Set(value.models.map((model) => model.model)).size === value.models.length && (value.currentQuestion === null || (question(value.currentQuestion) && record(value.currentQuestion) && value.currentQuestion.model === value.activeModel)))
  return value as AssessmentStateDto
}
export const parseReport = (value: unknown, expectedId: string): AssessmentReportResponseDto => {
  requireValid(record(value) && value.assessmentId === expectedId && string(value.reportId) && /^PSY-RPT-[A-F0-9]{24}$/.test(value.reportId) && member(value.status, ['pending', 'processing', 'failed', 'ready']) && (value.status === 'ready' ? nonempty(value.html) && date(value.generatedAt) && value.generatedAt !== null : value.html === null && value.generatedAt === null))
  return value as AssessmentReportResponseDto
}
export const unwrap = <T>(value: unknown, parse: (data: unknown) => T): T => {
  requireValid(record(value) && value.success === true && 'data' in value)
  return parse((value as ApiResponse<unknown>).data)
}
