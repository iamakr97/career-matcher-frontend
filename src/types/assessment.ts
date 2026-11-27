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
export interface AssessmentPerformanceInteractionDto { kind: 'performance'; protocol: unknown }
export interface AssessmentConstructedInteractionDto { kind: 'constructed_activity'; requiredOutputs: 1 | 2; editor: unknown; draft: unknown }
export type AssessmentInteractionDto = AssessmentChoiceInteractionDto | AssessmentPerformanceInteractionDto | AssessmentConstructedInteractionDto
export interface AssessmentQuestionDto { attemptId: string; questionId: string; model: PsychometricModel; questionText?: string; description?: string; helperText?: string; instructions?: string; presentation: AssessmentPresentationDto; interaction: AssessmentInteractionDto; currentStep: string; allowedOperations: AssessmentStepOperation[]; recoveryRequired: boolean }
export interface AssessmentStateDto { assessmentId: string; status: AssessmentLifecycleStatus; phase: AssessmentProcessingPhase; stateRevision: number; activeModel: PsychometricModel | null; startedAt: string | null; completedAt: string | null; progress: AssessmentProgressDto; models: AssessmentModelProgressDto[]; currentQuestion: AssessmentQuestionDto | null }
export interface SubmitResponseBaseDto { attemptId: string; requestId: string; expectedStateRevision: number; step: string }
export interface AssessmentChoiceResponse { kind: 'choice'; selectedOptionId: string }
export interface SubmitChoiceResponseDto extends SubmitResponseBaseDto { operation: 'submit'; response: AssessmentChoiceResponse }
export type SubmitResponseDto = SubmitChoiceResponseDto
export interface AssessmentReportStatusDto { reportId: string; assessmentId: string; status: AssessmentReportStatus; generatedAt: string | null }
export interface AssessmentReportResponseDto extends AssessmentReportStatusDto { html: string | null }
