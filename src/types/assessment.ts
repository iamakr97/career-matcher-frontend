import type { PisaEditor, PisaResponse } from '@/types/pisa-assessment'

export type PsychometricModel = 'riasec' | 'big_five' | 'oecd_sses' | 'chc' | 'pisa_creative_thinking' | 'sdt' | 'scct'
export type AssessmentLifecycleStatus = 'created' | 'active' | 'paused' | 'blocked' | 'completed'
export type AssessmentProcessingPhase = 'not_started' | 'administering' | 'awaiting_evaluation' | 'finalizing_scientific_results' | 'generating_report' | 'report_failed' | 'report_ready'
export type AssessmentModelStatus = 'not_started' | 'active' | 'complete' | 'incomplete'
export type AssessmentStepOperation = 'step' | 'draft' | 'submit' | 'skip' | 'interrupt'
export type AssessmentReportStatus = 'pending' | 'processing' | 'failed' | 'ready'
export type PsychometricParticipantGender = 'male' | 'female'
export type PsychometricPresentationMode = 'text' | 'mixed' | 'visual' | 'audio' | 'interactive'
export type PsychometricPresentationLayout = 'option_list' | 'option_cards' | 'scenario_choice' | 'image_cards' | 'image_comparison' | 'activity_workspace' | 'performance_task'
export type PsychometricMediaType = 'image' | 'audio' | 'video' | 'svg'
export type PsychometricMediaRole = 'supporting' | 'stimulus' | 'option_icon' | 'option_image' | 'option' | 'palette' | 'baseline'
export type PsychometricSelectionMode = 'single' | 'multiple'
export type PsychometricResponseFamily = 'single_select' | 'picture_comparison' | 'text_comparison' | 'situational_choice' | 'frequency' | 'feeling_intensity' | 'agreement' | 'functioning_degree' | 'future_expectation' | 'NEEDS_5' | 'REASONS_4' | 'confidence_5' | 'expectation_5' | 'intention_5' | 'experience_status' | 'support_status' | 'barrier_impact'

export interface AssessmentParticipant { name: string; email: string; phone: string; class: number; ageGroup: string; gender: PsychometricParticipantGender; location: string }
export interface CreateAssessmentDto { participant: AssessmentParticipant }
export interface AssessmentProgressDto { totalModels: number; completedModels: number; answeredQuestions: number; plannedQuestions: number }
export interface AssessmentModelProgressDto { model: PsychometricModel; name: string; status: AssessmentModelStatus; answeredQuestions: number; plannedQuestions: number }
export interface AssessmentMediaFallbackDto { mediaType: PsychometricMediaType; url: string; format?: string }
export interface AssessmentMediaDto { mediaId: string; mediaType: PsychometricMediaType; role: PsychometricMediaRole; url: string; format?: string; altText?: string; optionId?: string; fallback?: AssessmentMediaFallbackDto }
export interface AssessmentOptionDto { optionId: string; text?: string; value?: string; values?: string[]; pair?: string[]; media?: AssessmentMediaDto }
export interface AssessmentOptionGroupDto { groupId: string; prompt?: string; layout?: PsychometricPresentationLayout; choices: AssessmentOptionDto[] }
export interface AssessmentPresentationDto { mode: PsychometricPresentationMode; layout: PsychometricPresentationLayout; title?: string; media: AssessmentMediaDto[]; options: AssessmentOptionGroupDto[] }
export interface AssessmentChoiceInteractionDto { kind: 'choice'; responseFamily: PsychometricResponseFamily; optionGroupId: string; selectionMode: PsychometricSelectionMode }
export type PsychometricPerformanceMode = 'static_choice' | 'audio_comprehension' | 'visual_memory' | 'sequence_memory' | 'learn_retain_retrieve' | 'timed_fluency'
export type PsychometricChcQuestionType = 'single_select' | 'multi_trial_single_select' | 'ordered_sequence' | 'ordered_position_sequence' | 'filtered_ordered_sequence' | 'multi_trial_binary' | 'multi_trial_multi_select'
export type PsychometricChcResponseFamily = 'picture_pattern_selection' | 'logic_number_selection' | 'shape_spatial' | 'picture_memory_order' | 'number_letter_memory' | 'learn_remember' | 'fast_matching' | 'words_pictures_listening'
export type ChcResponseKind = 'option' | 'ordered' | 'filtered_ordered' | 'unit_stream' | 'cell' | 'cell_set'
export type ChcUnitState = 'submitted' | 'omitted' | 'not_presented' | 'invalid'
export type ChcAdministrationEvent = 'presentation' | 'practice' | 'study' | 'retention' | 'cue' | 'interference' | 'playback' | 'response' | 'interruption' | 'technical_failure'
export interface AssessmentStepTimingDto { studyExposureMs: number | null; perTokenExposureMs: number | null; interTokenGapMs: number | null; retentionDelayMs: number | null; ruleCueExposureMs: number | null; interferenceDurationMs: number | null; responseWindowMs: number | null; interUnitGapMs: number | null; playbackLimit: number | null; allowReplay: boolean; studyVisibleDuringResponse: boolean }
export interface ChcStudyPairDto { cue: string; target?: string; targetSequence?: string[]; context?: string }
export interface ChcStudyFactDto { text?: string; signal?: string; object?: string; destination?: string; event?: string; location?: string }
export interface AssessmentPerformanceStimulusDto { text?: string; cue?: string; tokens?: string[]; numberTokens?: number[]; gridRows?: number; gridColumns?: number; highlightOrder?: string[]; cells?: string[]; responseCells?: string[]; current?: string; rowA?: string[]; rowB?: string[]; sample?: string; candidate?: string; studyPairs?: ChcStudyPairDto[]; studyFacts?: ChcStudyFactDto[]; studyText?: string; optionGroup?: AssessmentOptionGroupDto; media?: AssessmentMediaDto }
export interface AssessmentPerformanceStepDto { taskMode: PsychometricPerformanceMode; questionType: PsychometricChcQuestionType; responseFamily: PsychometricChcResponseFamily; phase: string; unitId: string | null; event: ChcAdministrationEvent; responseKind: ChcResponseKind | null; optionGroupId?: string; unitIndex: number | null; unitCount: number | null; timing: AssessmentStepTimingDto; stimulus?: AssessmentPerformanceStimulusDto; responseTokens?: string[]; practiceRound?: number; cellCount?: number; omissionAllowed?: boolean }
export interface AssessmentPerformanceInteractionDto { kind: 'performance'; protocol: AssessmentPerformanceStepDto }
export interface AssessmentConstructedInteractionDto { kind: 'constructed_activity'; requiredOutputs: 1 | 2; editor: PisaEditor; draft: PisaResponse | null }
export type AssessmentInteractionDto = AssessmentChoiceInteractionDto | AssessmentPerformanceInteractionDto | AssessmentConstructedInteractionDto
export interface AssessmentQuestionDto { attemptId: string; questionId: string; model: PsychometricModel; questionText?: string; description?: string; helperText?: string; instructions?: string; presentation: AssessmentPresentationDto; interaction: AssessmentInteractionDto; currentStep: string; allowedOperations: AssessmentStepOperation[]; recoveryRequired: boolean }
export interface AssessmentStateDto { assessmentId: string; status: AssessmentLifecycleStatus; phase: AssessmentProcessingPhase; stateRevision: number; activeModel: PsychometricModel | null; startedAt: string | null; completedAt: string | null; progress: AssessmentProgressDto; models: AssessmentModelProgressDto[]; currentQuestion: AssessmentQuestionDto | null }
export interface SubmitResponseBaseDto { attemptId: string; requestId: string; expectedStateRevision: number; step: string }
export interface AssessmentChoiceResponse { kind: 'choice'; selectedOptionId: string }
export interface SubmitChoiceResponseDto extends SubmitResponseBaseDto { operation: 'submit'; response: AssessmentChoiceResponse }
export interface ChcOptionResponse { kind: 'option'; optionId: string }
export interface ChcOrderedResponse { kind: 'ordered'; tokens: (string | null)[] }
export interface ChcFilteredOrderedResponse { kind: 'filtered_ordered'; tokens: string[] }
export interface ChcCellResponse { kind: 'cell'; position: number }
export interface ChcCellSetResponse { kind: 'cell_set'; positions: number[] }
export type ChcUnitItemResponse = ChcOptionResponse | ChcCellResponse | ChcCellSetResponse
export interface ChcUnitResponse { unitId: string; state: ChcUnitState; response?: ChcUnitItemResponse; elapsedMs?: number }
export interface ChcUnitStreamResponse { kind: 'unit_stream'; units: ChcUnitResponse[] }
export type ChcTaskResponse = ChcOptionResponse | ChcOrderedResponse | ChcFilteredOrderedResponse | ChcUnitStreamResponse
export interface AssessmentPerformanceResponse { kind: 'performance'; response: ChcTaskResponse }
export interface AssessmentCreativeResponse { kind: 'constructed_activity'; output: PisaResponse }
export interface CreativeObservationInputDto { mediaLoaded?: boolean; practiceCompleted?: boolean; technicalEvents?: string[] }
export interface ChcObservationInputDto { event: ChcAdministrationEvent; unitId?: string; observedElapsedMs?: number; observedDurationMs?: number; playbackCount?: number; practiceRound?: number; unitResponse?: ChcUnitResponse; response?: ChcTaskResponse; reason?: string }
export interface SubmitPerformanceResponseDto extends SubmitResponseBaseDto { operation: 'submit'; response: AssessmentPerformanceResponse; observation?: ChcObservationInputDto }
export interface SubmitChcStepDto extends SubmitResponseBaseDto { operation: 'step'; observation: ChcObservationInputDto }
export interface SubmitSkipDto extends SubmitResponseBaseDto { operation: 'skip'; reason: string }
export interface SubmitChcInterruptionDto extends SubmitResponseBaseDto { operation: 'interrupt'; reason: string; observation?: ChcObservationInputDto | CreativeObservationInputDto }
export interface SubmitCreativeStepDto extends SubmitResponseBaseDto { operation: 'step'; observation: CreativeObservationInputDto }
export interface SubmitCreativeDraftDto extends SubmitResponseBaseDto { operation: 'draft'; response: AssessmentCreativeResponse; observation?: CreativeObservationInputDto }
export interface SubmitCreativeFinalDto extends SubmitResponseBaseDto { operation: 'submit'; response: AssessmentCreativeResponse; observation?: CreativeObservationInputDto }
export type SubmitResponseDto = SubmitChoiceResponseDto | SubmitPerformanceResponseDto | SubmitChcStepDto | SubmitSkipDto | SubmitChcInterruptionDto | SubmitCreativeStepDto | SubmitCreativeDraftDto | SubmitCreativeFinalDto
export type AssessmentOperationIntent =
  | { operation: 'submit'; response: AssessmentChoiceResponse }
  | { operation: 'submit'; response: AssessmentPerformanceResponse; observation?: ChcObservationInputDto }
  | { operation: 'submit'; response: AssessmentCreativeResponse; observation?: CreativeObservationInputDto }
  | { operation: 'step'; observation: ChcObservationInputDto }
  | { operation: 'step'; observation: CreativeObservationInputDto }
  | { operation: 'draft'; response: AssessmentCreativeResponse; observation?: CreativeObservationInputDto }
  | { operation: 'skip'; reason: string }
  | { operation: 'interrupt'; reason: string; observation?: ChcObservationInputDto | CreativeObservationInputDto }
export interface AssessmentReportStatusDto { reportId: string; assessmentId: string; status: AssessmentReportStatus; generatedAt: string | null }
export interface AssessmentReportResponseDto extends AssessmentReportStatusDto { html: string | null }

