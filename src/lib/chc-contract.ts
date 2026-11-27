import type { AssessmentOperationIntent, AssessmentPerformanceStepDto, AssessmentQuestionDto, ChcObservationInputDto, ChcTaskResponse, SubmitResponseDto } from '@/types/assessment'
import { validCreativeObservation, validPisaResponseShape } from '@/lib/pisa-contract'

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const text = (value: unknown, max = 4096): value is string => typeof value === 'string' && value.length <= max
const id = (value: unknown): value is string => text(value, 128) && value.length > 0
const integer = (value: unknown, minimum = 0): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum
const duration = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0
const list = (value: unknown, check: (item: unknown) => boolean, max = 256): value is unknown[] => Array.isArray(value) && value.length <= max && value.every(check)
const keys = (value: Record<string, unknown>, allowed: string[]): boolean => Object.keys(value).every((key) => allowed.includes(key))
const optional = (value: unknown, check: (item: unknown) => boolean): boolean => value === undefined || check(value)
const oneOf = (value: unknown, choices: string[]): boolean => typeof value === 'string' && choices.includes(value)
const events = ['presentation', 'practice', 'study', 'retention', 'cue', 'interference', 'playback', 'response', 'interruption', 'technical_failure']
const kinds = ['option', 'ordered', 'filtered_ordered', 'unit_stream', 'cell', 'cell_set']

const optionGroup = (value: unknown, media: (value: unknown) => boolean): boolean => {
  if (!record(value) || !id(value.groupId) || !optional(value.prompt, text) || !list(value.choices, (choice) => record(choice) && id(choice.optionId) && optional(choice.text, text) && optional(choice.value, text) && optional(choice.values, (items) => list(items, text)) && optional(choice.pair, (items) => list(items, text)) && optional(choice.media, media))) return false
  const ids = value.choices.map((choice) => record(choice) ? choice.optionId : null)
  return new Set(ids).size === ids.length
}

export const validChcStep = (value: unknown, media: (value: unknown) => boolean): value is AssessmentPerformanceStepDto => {
  if (!record(value) || !oneOf(value.taskMode, ['static_choice', 'audio_comprehension', 'visual_memory', 'sequence_memory', 'learn_retain_retrieve', 'timed_fluency']) || !oneOf(value.questionType, ['single_select', 'multi_trial_single_select', 'ordered_sequence', 'ordered_position_sequence', 'filtered_ordered_sequence', 'multi_trial_binary', 'multi_trial_multi_select']) || !oneOf(value.responseFamily, ['picture_pattern_selection', 'logic_number_selection', 'shape_spatial', 'picture_memory_order', 'number_letter_memory', 'learn_remember', 'fast_matching', 'words_pictures_listening']) || !id(value.phase) || !oneOf(value.event, events) || !(value.responseKind === null || oneOf(value.responseKind, kinds)) || !(value.unitId === null || id(value.unitId)) || !optional(value.optionGroupId, id) || !(value.unitIndex === null || integer(value.unitIndex, 1)) || !(value.unitCount === null || integer(value.unitCount, 1)) || (value.unitIndex !== null && value.unitCount !== null && value.unitIndex > value.unitCount)) return false
  const timing = value.timing
  if (!record(timing) || !['studyExposureMs', 'perTokenExposureMs', 'interTokenGapMs', 'retentionDelayMs', 'ruleCueExposureMs', 'interferenceDurationMs', 'responseWindowMs', 'interUnitGapMs'].every((key) => timing[key] === null || duration(timing[key])) || !(timing.playbackLimit === null || integer(timing.playbackLimit, 1)) || typeof timing.allowReplay !== 'boolean' || typeof timing.studyVisibleDuringResponse !== 'boolean') return false
  const s = value.stimulus
  if (s !== undefined && (!record(s) || !['text', 'cue', 'current', 'sample', 'candidate', 'studyText'].every((key) => optional(s[key], text)) || !['tokens', 'highlightOrder', 'cells', 'responseCells', 'rowA', 'rowB'].every((key) => optional(s[key], (items) => list(items, text))) || !optional(s.numberTokens, (items) => list(items, (item) => typeof item === 'number' && Number.isFinite(item))) || !optional(s.gridRows, (item) => integer(item, 1)) || !optional(s.gridColumns, (item) => integer(item, 1)) || (s.gridRows !== undefined && s.gridColumns !== undefined && (Number(s.gridRows) * Number(s.gridColumns) > 256 || (Array.isArray(s.cells) && s.cells.length > Number(s.gridRows) * Number(s.gridColumns)))) || !optional(s.studyPairs, (items) => list(items, (pair) => record(pair) && id(pair.cue) && optional(pair.target, text) && optional(pair.targetSequence, (tokens) => list(tokens, text)) && optional(pair.context, text))) || !optional(s.studyFacts, (items) => list(items, (fact) => record(fact) && ['text', 'signal', 'object', 'destination', 'event', 'location'].every((key) => optional(fact[key], text)))) || !optional(s.optionGroup, (group) => optionGroup(group, media)) || !optional(s.media, media))) return false
  return optional(value.responseTokens, (items) => list(items, text)) && optional(value.practiceRound, (item) => integer(item, 1)) && optional(value.cellCount, (item) => integer(item, 1) && item <= 256) && optional(value.omissionAllowed, (item) => typeof item === 'boolean')
}

export const validChcTaskResponse = (value: unknown): value is ChcTaskResponse => {
  if (!record(value)) return false
  if (value.kind === 'option') return keys(value, ['kind', 'optionId']) && id(value.optionId)
  if (value.kind === 'ordered') return keys(value, ['kind', 'tokens']) && list(value.tokens, (item) => item === null || text(item))
  if (value.kind === 'filtered_ordered') return keys(value, ['kind', 'tokens']) && list(value.tokens, text)
  if (value.kind === 'unit_stream') return keys(value, ['kind', 'units']) && list(value.units, validChcUnit)
  return false
}

const validChcUnit = (value: unknown): boolean => {
  if (!record(value) || !keys(value, ['unitId', 'state', 'response', 'elapsedMs']) || !id(value.unitId) || !oneOf(value.state, ['submitted', 'omitted', 'not_presented', 'invalid']) || !optional(value.elapsedMs, duration)) return false
  if (value.state !== 'submitted') return value.response === undefined
  const response = value.response
  return record(response) && ((response.kind === 'option' && keys(response, ['kind', 'optionId']) && id(response.optionId)) || (response.kind === 'cell' && keys(response, ['kind', 'position']) && integer(response.position, 1)) || (response.kind === 'cell_set' && keys(response, ['kind', 'positions']) && list(response.positions, (item) => integer(item, 1)) && new Set(response.positions).size === response.positions.length))
}

export const validChcObservation = (value: unknown): value is ChcObservationInputDto => record(value) && keys(value, ['event', 'unitId', 'observedElapsedMs', 'observedDurationMs', 'playbackCount', 'practiceRound', 'unitResponse', 'response', 'reason']) && oneOf(value.event, events) && optional(value.unitId, id) && optional(value.observedElapsedMs, duration) && optional(value.observedDurationMs, duration) && optional(value.playbackCount, (item) => integer(item, 1)) && optional(value.practiceRound, (item) => integer(item, 1)) && optional(value.unitResponse, validChcUnit) && optional(value.response, validChcTaskResponse) && optional(value.reason, (item) => text(item, 256))

export const validSubmitPayload = (value: unknown): value is SubmitResponseDto => {
  if (!record(value) || typeof value.attemptId !== 'string' || !/^[a-fA-F0-9]{24}$/.test(value.attemptId) || !id(value.requestId) || [...value.requestId].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) || !integer(value.expectedStateRevision) || !id(value.step)) return false
  try { if (new TextEncoder().encode(JSON.stringify(value)).length > 1024 * 1024) return false } catch { return false }
  if (value.operation === 'step') return keys(value, ['attemptId', 'requestId', 'expectedStateRevision', 'step', 'operation', 'observation']) && (validChcObservation(value.observation) || validCreativeObservation(value.observation))
  if (value.operation === 'draft') return keys(value, ['attemptId', 'requestId', 'expectedStateRevision', 'step', 'operation', 'response', 'observation']) && record(value.response) && keys(value.response, ['kind', 'output']) && value.response.kind === 'constructed_activity' && validPisaResponseShape(value.response.output) && (value.observation === undefined || validCreativeObservation(value.observation))
  if (value.operation === 'skip') return keys(value, ['attemptId', 'requestId', 'expectedStateRevision', 'step', 'operation', 'reason']) && id(value.reason) && value.reason.length <= 256
  if (value.operation === 'interrupt') return keys(value, ['attemptId', 'requestId', 'expectedStateRevision', 'step', 'operation', 'reason', 'observation']) && id(value.reason) && value.reason.length <= 256 && optional(value.observation, (item) => validChcObservation(item) || validCreativeObservation(item))
  if (value.operation !== 'submit' || !record(value.response)) return false
  if (value.response.kind === 'choice') return keys(value, ['attemptId', 'requestId', 'expectedStateRevision', 'step', 'operation', 'response']) && keys(value.response, ['kind', 'selectedOptionId']) && id(value.response.selectedOptionId)
  if (value.response.kind === 'constructed_activity') return keys(value, ['attemptId', 'requestId', 'expectedStateRevision', 'step', 'operation', 'response', 'observation']) && keys(value.response, ['kind', 'output']) && validPisaResponseShape(value.response.output) && (value.observation === undefined || validCreativeObservation(value.observation))
  return keys(value, ['attemptId', 'requestId', 'expectedStateRevision', 'step', 'operation', 'response', 'observation']) && value.response.kind === 'performance' && keys(value.response, ['kind', 'response']) && validChcTaskResponse(value.response.response) && optional(value.observation, validChcObservation)
}

export const validChcIntent = (question: AssessmentQuestionDto, intent: AssessmentOperationIntent): boolean => {
  if (question.interaction.kind !== 'performance') return false
  const step = question.interaction.protocol
  if (intent.operation === 'interrupt') return question.allowedOperations.includes('interrupt')
  if (intent.operation === 'skip') return question.allowedOperations.includes('skip')
  const group = step.stimulus?.optionGroup ?? question.presentation.options.find((item) => item.groupId === step.optionGroupId)
  const responseValid = (response: unknown): boolean => {
    if (!record(response)) return false
    if (response.kind === 'option') return !!group?.choices.some((choice) => choice.optionId === response.optionId)
    if (response.kind === 'ordered' || response.kind === 'filtered_ordered') {
      if (!Array.isArray(response.tokens) || !step.responseTokens) return false
      const remaining = [...step.responseTokens]
      for (const token of response.tokens) {
        if (token === null && response.kind === 'ordered') continue
        if (typeof token !== 'string') return false
        const index = remaining.indexOf(token)
        if (index < 0) return false
        remaining.splice(index, 1)
      }
      return true
    }
    if (response.kind === 'cell') {
      const count = step.cellCount ?? step.stimulus?.responseCells?.length ?? step.stimulus?.cells?.length ?? 0
      return count > 0 && integer(response.position, 1) && response.position <= count
    }
    if (response.kind === 'cell_set') {
      const count = step.cellCount ?? step.stimulus?.responseCells?.length ?? step.stimulus?.cells?.length ?? 0
      return count > 0 && list(response.positions, (position) => integer(position, 1) && position <= count) && new Set(response.positions).size === response.positions.length
    }
    return false
  }
  if (intent.operation === 'submit') return intent.response.kind === 'performance' && (!('observation' in intent) || intent.observation === undefined) && step.event === 'response' && step.responseKind === intent.response.response.kind && responseValid(intent.response.response)
  if (intent.operation !== 'step' || !('event' in intent.observation)) return false
  const observation = intent.observation
  if (observation.event !== step.event && observation.event !== 'interruption' && observation.event !== 'technical_failure') return false
  if (step.unitId !== null && observation.unitId !== step.unitId) return false
  if (observation.playbackCount !== undefined && (step.event !== 'playback' || step.timing.playbackLimit === null || observation.playbackCount > step.timing.playbackLimit)) return false
  if (step.event === 'practice' && (step.practiceRound === undefined || observation.practiceRound !== step.practiceRound || step.responseKind !== 'option')) return false
  if (observation.unitResponse && (observation.unitResponse.unitId !== step.unitId || (observation.unitResponse.state === 'omitted' ? !(step.event === 'response' && step.omissionAllowed === true && observation.unitResponse.response === undefined) : observation.unitResponse.state !== 'submitted' || !responseValid(observation.unitResponse.response)))) return false
  if (observation.response && !responseValid(observation.response)) return false
  return true
}
