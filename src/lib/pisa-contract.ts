import type { AssessmentOperationIntent, AssessmentQuestionDto } from '@/types/assessment'
import type { PisaEditor, PisaResponse } from '@/types/pisa-assessment'

const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const printable = (value: string, multiline = false): boolean => [...value].every((character) => { const code = character.charCodeAt(0); return code >= 32 && code !== 127 || multiline && (code === 9 || code === 10 || code === 13) })
const token = (value: unknown): value is string => typeof value === 'string' && value.length >= 1 && value.length <= 128 && printable(value)
const readable = (value: unknown): value is string => typeof value === 'string' && value.length >= 1 && value.length <= 4096 && printable(value, true)
const line = (value: unknown): value is string => typeof value === 'string' && value.length <= 512 && printable(value) && !/[<>]/.test(value)
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const integer = (value: unknown, min = 0): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= min
const array = (value: unknown, valid: (item: unknown) => boolean, max = 256): value is unknown[] => Array.isArray(value) && value.length <= max && value.every(valid)
const pair = (value: unknown, valid: (item: unknown) => boolean): value is [unknown, unknown] => Array.isArray(value) && value.length === 2 && value.every(valid)
const unique = (items: unknown[]): boolean => new Set(items).size === items.length
const domain = (value: unknown, choices: string[]): value is string => token(value) && choices.includes(value)
const strings = (value: unknown): value is string[] => array(value, token)
const pieces = (value: unknown): value is { key: string; label: string }[] => array(value, (piece) => object(piece) && token(piece.key) && readable(piece.label)) && unique(value.map((piece) => object(piece) ? piece.key : null))
const keys = (value: Record<string, unknown>, allowed: string[]): boolean => Object.keys(value).every((key) => allowed.includes(key))
const actions = ['add', 'add_condition', 'add_rule', 'add_step', 'assign_group', 'change_minutes', 'change_variable', 'choose', 'choose_check', 'choose_rule', 'clear', 'connect', 'delete_step', 'join_steps', 'move', 'move_group', 'preview', 'recolour', 'redo', 'remove', 'remove_step', 'reorder', 'reorder_steps', 'repeat', 'replace', 'resize', 'resize_cloth', 'rotate', 'set_time', 'set_water', 'undo']
const variants: Record<string, string> = {
  meaning_roles_3part_v1: 'meaning_builder', comic_locked_panels_v1: 'comic_builder', paired_visual_layout_v1: 'room_layout',
  sign_asset_palette_v1: 'sign_designer', poster_template_v1: 'poster_editor', paired_space_plan_locked_v1: 'park_planner',
  social_flow_extended_v1: 'shop_flow', timed_allocation_template_v1: 'water_schedule', resource_return_revision_v1: 'water_schedule',
  causal_pair_v1: 'drying_cause_map', cloth_experiment_v1: 'cloth_experiment', general_experiment_v1: 'cloth_experiment',
  story_revision_v1: 'story_revision_builder', investigation_builder_v1: 'investigation_builder',
}
const assetMappings = (value: unknown, issued: { key: string }[]): boolean => array(value, (item) => object(item) && token(item.pieceKey) && token(item.mediaId) && issued.some((piece) => piece.key === item.pieceKey)) && unique(value.map((item) => object(item) ? item.pieceKey : null))
const baseline = (value: unknown, field: string): boolean => object(value) && field in value && (field === 'waterSlots' ? array(value.waterSlots, (slot) => object(slot) && token(slot.group) && integer(slot.minutes, 1)) : field === 'resourceReturn' ? object(value.resourceReturn) && strings(value.resourceReturn.groups) && strings(value.resourceReturn.tools) && strings(value.resourceReturn.steps) && typeof value.resourceReturn.returnTracking === 'boolean' : field === 'clothExperiment' ? object(value.clothExperiment) && cloth(value.clothExperiment.clothA) && cloth(value.clothExperiment.clothB) && readable(value.clothExperiment.check) && integer(value.clothExperiment.repeats, 1) : field === 'generalExperiment' ? object(value.generalExperiment) && domain(value.generalExperiment.kind, ['paper_bridge', 'toy_car', 'ice_melting', 'seed_growth', 'paper_plane']) && integer(value.generalExperiment.repeats, 1) : object(value.storyRevision) && readable(value.storyRevision.story) && readable(value.storyRevision.originalEnding) && array(value.storyRevision.lockedFacts, readable))
export const validPisaEditor = (value: unknown): value is PisaEditor => {
  if (!object(value) || !token(value.variant) || variants[value.variant] !== value.kind || !array(value.allowedActions, (item) => domain(item, actions)) || (value.constraints !== undefined && !array(value.constraints, readable))) return false
  switch (value.variant) {
    case 'meaning_roles_3part_v1': return array(value.roles, (role) => object(role) && token(role.key) && readable(role.label) && pieces(role.choices)) && unique(value.roles.map((role) => object(role) ? role.key : null))
    case 'comic_locked_panels_v1': return pieces(value.pieces) && (value.pieceAssets === undefined || assetMappings(value.pieceAssets, value.pieces)) && (value.actions === undefined || strings(value.actions)) && value.panelCount === 4 && value.lockedPanels === 2
    case 'paired_visual_layout_v1': return pieces(value.pieces) && (value.pieceAssets === undefined || assetMappings(value.pieceAssets, value.pieces)) && value.canvasCount === 2 && strings(value.lockedLayers)
    case 'sign_asset_palette_v1': return pieces(value.pieces) && (value.pieceAssets === undefined || assetMappings(value.pieceAssets, value.pieces)) && value.canvasCount === 1 && value.allowText === false && object(value.editableCanvas) && finite(value.editableCanvas.width) && value.editableCanvas.width > 0 && finite(value.editableCanvas.height) && value.editableCanvas.height > 0
    case 'poster_template_v1': return pieces(value.pieces) && (value.pieceAssets === undefined || assetMappings(value.pieceAssets, value.pieces)) && strings(value.protectedText) && token(value.baselineId) && (value.baselineMediaId === undefined || token(value.baselineMediaId)) && (value.baselineTemplateUrl === undefined || typeof value.baselineTemplateUrl === 'string') && strings(value.editableDecorationIds) && value.baselineLocked === true && value.canvasCount === 1
    case 'paired_space_plan_locked_v1': return strings(value.groups) && strings(value.zones) && strings(value.times) && strings(value.rules) && value.boards === 2 && strings(value.lockedLayers)
    case 'social_flow_extended_v1': return strings(value.participants) && strings(value.actions) && strings(value.items) && strings(value.places) && strings(value.conditions) && integer(value.maxSteps, 1) && integer(value.minConnectedSteps, 1) && value.minConnectedSteps <= value.maxSteps
    case 'timed_allocation_template_v1': return baseline(value.baseline, 'waterSlots') && token(value.baselineId) && array(value.groupLabels, (group) => object(group) && token(group.code) && token(group.label)) && integer(value.totalMinutes, 1) && integer(value.resourceCount, 1) && (value.resourceLabel === undefined || token(value.resourceLabel)) && strings(value.rules) && value.originalLocked === true
    case 'resource_return_revision_v1': return baseline(value.baseline, 'resourceReturn') && pieces(value.stepChoices) && strings(value.ruleChoices)
    case 'causal_pair_v1': return object(value.parts) && pieces(value.parts.cause) && array(value.parts.changesByCause, (item) => object(item) && token(item.causeKey) && pieces(item.changes)) && pieces(value.parts.effect) && strings(value.links) && value.outputCount === 2
    case 'cloth_experiment_v1': return baseline(value.baseline, 'clothExperiment') && strings(value.sizes) && array(value.cupCounts, (item) => integer(item, 1)) && pieces(value.checks) && array(value.repeatCounts, (item) => integer(item, 1))
    case 'general_experiment_v1': return baseline(value.baseline, 'generalExperiment') && strings(value.changeChoices) && pieces(value.checks) && array(value.repeatCounts, (item) => integer(item, 1))
    case 'story_revision_v1': return baseline(value.baseline, 'storyRevision') && object(value.storyPieces) && array(value.storyPieces.groups, (group) => object(group) && token(group.key) && pieces(group.choices)) && typeof value.optionalShortLine === 'boolean'
    case 'investigation_builder_v1': return token(value.lockedQuestion) && pieces(value.materials) && strings(value.planNodes) && strings(value.links)
    default: return false
  }
}
const pose = (value: unknown, editor: PisaEditor): boolean => object(value) && token(value.instanceId) && token(value.pieceKey) && 'pieces' in editor && editor.pieces.some((piece) => piece.key === value.pieceKey) && finite(value.x) && value.x >= 0 && value.x <= 1 && finite(value.y) && value.y >= 0 && value.y <= 1 && finite(value.width) && value.width > 0 && value.width <= 1 && finite(value.height) && value.height > 0 && value.height <= 1 && finite(value.rotationDeg) && value.rotationDeg >= 0 && value.rotationDeg < 360 && integer(value.zIndex) && (value.color === undefined || editor.allowedActions.includes('recolour') && typeof value.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.color))
const board = (value: unknown, editor: PisaEditor): boolean => object(value) && keys(value, ['objects']) && array(value.objects, (item) => pose(item, editor)) && unique(value.objects.map((item) => object(item) ? item.instanceId : null)) && unique(value.objects.map((item) => object(item) ? item.zIndex : null))
const cloth = (value: unknown): boolean => object(value) && token(value.size) && integer(value.cups, 1)
const roleMap = (value: unknown, roles: { key: string; choices: { key: string }[] }[]): boolean => object(value) && Object.keys(value).length <= 64 && Object.entries(value).every(([key, selected]) => roles.some((role) => role.key === key && role.choices.some((choice) => choice.key === selected)))
const edgeList = (value: unknown, ids: string[], links?: string[]): boolean => array(value, (edge) => object(edge) && token(edge.from) && token(edge.to) && edge.from !== edge.to && ids.includes(edge.from) && ids.includes(edge.to) && (edge.link === undefined || typeof edge.link === 'string' && links?.includes(edge.link) === true), 512) && unique(value.map((edge) => object(edge) ? `${edge.from}:${edge.to}` : null))
const shortLine = (value: Record<string, unknown>): boolean => value.shortLine === undefined || line(value.shortLine)
export const validPisaOutput = (value: unknown, editor: PisaEditor, complete = false): value is PisaResponse => {
  if (!object(value) || value.variant !== editor.variant) return false
  switch (editor.variant) {
    case 'meaning_roles_3part_v1': return keys(value, ['variant', 'ideas']) && pair(value.ideas, (item) => roleMap(item, editor.roles) && (!complete || object(item) && Object.keys(item).length === editor.roles.length))
    case 'comic_locked_panels_v1': return keys(value, ['variant', 'panels', 'shortLine']) && shortLine(value) && pair(value.panels, (panel) => object(panel) && (panel.index === 3 || panel.index === 4) && board({ objects: panel.objects }, editor) && array(panel.actions, (action) => object(action) && token(action.actorInstanceId) && token(action.action) && (editor.actions ?? []).includes(action.action) && Array.isArray(panel.objects) && panel.objects.some((item) => object(item) && item.instanceId === action.actorInstanceId) && (action.targetInstanceId === undefined || Array.isArray(panel.objects) && panel.objects.some((item) => object(item) && item.instanceId === action.targetInstanceId))) && (!complete || Array.isArray(panel.objects) && panel.objects.length > 0 && Array.isArray(panel.actions) && panel.actions.length > 0)) && object(value.panels[0]) && value.panels[0].index === 3 && object(value.panels[1]) && value.panels[1].index === 4
    case 'paired_visual_layout_v1': return keys(value, ['variant', 'layouts']) && pair(value.layouts, (item) => board(item, editor) && (!complete || object(item) && Array.isArray(item.objects) && item.objects.length > 0))
    case 'sign_asset_palette_v1': return keys(value, ['variant', 'sign']) && board(value.sign, editor) && (!complete || object(value.sign) && Array.isArray(value.sign.objects) && value.sign.objects.length > 0)
    case 'poster_template_v1': return keys(value, ['variant', 'final']) && board(value.final, editor)
    case 'paired_space_plan_locked_v1': return keys(value, ['variant', 'plans']) && pair(value.plans, (plan) => object(plan) && array(plan.assignments, (row) => object(row) && domain(row.group, editor.groups) && domain(row.zone, editor.zones) && domain(row.time, editor.times)) && array(plan.rules, (rule) => domain(rule, editor.rules)) && unique(plan.rules) && (!complete || plan.assignments.length > 0))
    case 'social_flow_extended_v1': {
      if (!keys(value, ['variant', 'steps', 'edges']) || !array(value.steps, (step) => object(step) && token(step.id) && domain(step.participant, editor.participants) && domain(step.action, editor.actions) && domain(step.place, editor.places) && (step.item === undefined || domain(step.item, editor.items)) && (step.condition === undefined || domain(step.condition, editor.conditions)), editor.maxSteps)) return false
      const ids = value.steps.map((step) => object(step) ? String(step.id) : '')
      return unique(ids) && edgeList(value.edges, ids) && (!complete || value.steps.length >= editor.minConnectedSteps && Array.isArray(value.edges) && value.edges.length === value.steps.length - 1)
    }
    case 'timed_allocation_template_v1': return keys(value, ['variant', 'turns', 'rule']) && array(value.turns, (turn) => object(turn) && domain(turn.group, editor.groupLabels.map((group) => group.code)) && integer(turn.minutes, 1)) && (!complete || value.turns.length > 0) && (value.rule === undefined || domain(value.rule, editor.rules))
    case 'resource_return_revision_v1': return keys(value, ['variant', 'steps', 'rule']) && array(value.steps, (step) => domain(step, editor.stepChoices.map((choice) => choice.key))) && (!complete || value.steps.length > 0) && (value.rule === undefined || domain(value.rule, editor.ruleChoices))
    case 'causal_pair_v1': return keys(value, ['variant', 'reasons']) && pair(value.reasons, (reason) => object(reason) && domain(reason.causeKey, editor.parts.cause.map((part) => part.key)) && domain(reason.changeKey, editor.parts.changesByCause.find((item) => item.causeKey === reason.causeKey)?.changes.map((part) => part.key) ?? []) && domain(reason.effectKey, editor.parts.effect.map((part) => part.key)) && domain(reason.link, editor.links))
    case 'cloth_experiment_v1': return keys(value, ['variant', 'clothA', 'clothB', 'check', 'repeats']) && cloth(value.clothA) && cloth(value.clothB) && object(value.clothA) && object(value.clothB) && typeof value.clothA.size === 'string' && typeof value.clothB.size === 'string' && typeof value.clothA.cups === 'number' && typeof value.clothB.cups === 'number' && editor.sizes.includes(value.clothA.size) && editor.sizes.includes(value.clothB.size) && editor.cupCounts.includes(value.clothA.cups) && editor.cupCounts.includes(value.clothB.cups) && domain(value.check, editor.checks.map((item) => item.key)) && typeof value.repeats === 'number' && editor.repeatCounts.includes(value.repeats)
    case 'general_experiment_v1': return keys(value, ['variant', 'changes', 'check', 'repeats']) && array(value.changes, (item) => domain(item, editor.changeChoices)) && unique(value.changes) && (!complete || value.changes.length > 0) && domain(value.check, editor.checks.map((item) => item.key)) && editor.repeatCounts.includes(value.repeats as number)
    case 'story_revision_v1': return keys(value, ['variant', 'choices', 'shortLine']) && shortLine(value) && roleMap(value.choices, editor.storyPieces.groups) && (!complete || object(value.choices) && Object.keys(value.choices).length === editor.storyPieces.groups.length)
    case 'investigation_builder_v1': {
      if (!keys(value, ['variant', 'materialKeys', 'nodes', 'edges']) || !array(value.materialKeys, (item) => domain(item, editor.materials.map((material) => material.key))) || !unique(value.materialKeys)) return false
      const selectedMaterials = value.materialKeys.filter((item): item is string => typeof item === 'string')
      if (!array(value.nodes, (node) => object(node) && token(node.id) && domain(node.nodeKey, editor.planNodes) && array(node.materialKeys, (item) => domain(item, selectedMaterials)) && unique(node.materialKeys))) return false
      const ids = value.nodes.map((node) => object(node) ? String(node.id) : '')
      return unique(ids) && edgeList(value.edges, ids, editor.links) && (!complete || value.nodes.length >= 2 && Array.isArray(value.edges) && value.edges.length >= value.nodes.length - 1)
    }
  }
}
export const validCreativeObservation = (value: unknown): boolean => object(value) && keys(value, ['mediaLoaded', 'practiceCompleted', 'technicalEvents']) && (value.mediaLoaded === undefined || value.mediaLoaded === true) && (value.practiceCompleted === undefined || value.practiceCompleted === true) && (value.technicalEvents === undefined || array(value.technicalEvents, token, 32))
export const validPisaResponseShape = (value: unknown): value is PisaResponse => {
  if (!object(value) || !token(value.variant) || !(value.variant in variants)) return false
  switch (value.variant) {
    case 'meaning_roles_3part_v1': return pair(value.ideas, (idea) => object(idea) && Object.keys(idea).length <= 64 && Object.values(idea).every(token))
    case 'comic_locked_panels_v1': return pair(value.panels, (panel) => object(panel) && (panel.index === 3 || panel.index === 4) && array(panel.objects, object) && array(panel.actions, object)) && (value.shortLine === undefined || line(value.shortLine))
    case 'paired_visual_layout_v1': return pair(value.layouts, (item) => object(item) && array(item.objects, object))
    case 'sign_asset_palette_v1': return object(value.sign) && array(value.sign.objects, object)
    case 'poster_template_v1': return object(value.final) && array(value.final.objects, object)
    case 'paired_space_plan_locked_v1': return pair(value.plans, (plan) => object(plan) && array(plan.assignments, object) && strings(plan.rules))
    case 'social_flow_extended_v1': return array(value.steps, object) && array(value.edges, object, 512)
    case 'timed_allocation_template_v1': return array(value.turns, object) && (value.rule === undefined || token(value.rule))
    case 'resource_return_revision_v1': return strings(value.steps) && (value.rule === undefined || token(value.rule))
    case 'causal_pair_v1': return pair(value.reasons, object)
    case 'cloth_experiment_v1': return cloth(value.clothA) && cloth(value.clothB) && token(value.check) && integer(value.repeats, 1)
    case 'general_experiment_v1': return strings(value.changes) && token(value.check) && integer(value.repeats, 1)
    case 'story_revision_v1': return object(value.choices) && Object.values(value.choices).every(token) && (value.shortLine === undefined || line(value.shortLine))
    case 'investigation_builder_v1': return strings(value.materialKeys) && array(value.nodes, object) && array(value.edges, object, 512)
    default: return false
  }
}
export const validPisaIntent = (question: AssessmentQuestionDto, intent: AssessmentOperationIntent): boolean => {
  if (question.model !== 'pisa_creative_thinking' || question.interaction.kind !== 'constructed_activity' || !question.allowedOperations.includes(intent.operation)) return false
  const editor = question.interaction.editor
  if (intent.operation === 'draft' || intent.operation === 'submit') return question.currentStep === 'editor' && intent.response.kind === 'constructed_activity' && validPisaOutput(intent.response.output, editor, intent.operation === 'submit') && (!('observation' in intent) || intent.observation === undefined || validCreativeObservation(intent.observation))
  if (intent.operation === 'step') return validCreativeObservation(intent.observation) && (question.currentStep === 'media' ? 'mediaLoaded' in intent.observation && intent.observation.mediaLoaded === true : question.currentStep === 'practice' && 'practiceCompleted' in intent.observation && intent.observation.practiceCompleted === true)
  if (intent.operation === 'interrupt') return token(intent.reason) && validCreativeObservation(intent.observation) && object(intent.observation) && array(intent.observation.technicalEvents, token, 32) && intent.observation.technicalEvents.length > 0
  return false
}
