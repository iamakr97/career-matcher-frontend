export interface ApiSuccess<T> {
  success: true
  data: T
  message?: string
}

export type QuestionSort = 'question_id_asc' | 'question_id_desc'

export interface QuestionFilters {
  model?: string
  search?: string
  primaryMeasureCode?: string
  categoryAxis?: string
  categoryCode?: string
  categoryName?: string
  interactionKind?: string
  presentationMode?: string
  presentationLayout?: string
  grade?: number
  sort?: QuestionSort
}

export interface QuestionListQuery extends QuestionFilters {
  page: number
  limit: number
}

export interface ModelItem { model: string; label: string; count: number }
export interface ModelsData { items: ModelItem[]; total: number }
export interface FacetValue { value: string; count: number }
export interface CategoryFacet { axis: string; code: string | null; name: string; count: number }
export interface FacetsData {
  model: string
  total: number
  primaryMeasures: FacetValue[]
  categories: CategoryFacet[]
  interactionKinds: FacetValue[]
  presentationModes: FacetValue[]
  presentationLayouts: FacetValue[]
  eligibleGrades: { value: number; count: number }[]
}

export interface Classification {
  primaryMeasureCode: string
  categories: { axis: string; code?: string; name: string }[]
}
export interface QuestionSummary {
  questionId: string
  model: string
  questionText: string
  classification: Classification
  presentation: { mode: string; layout: string; title?: string }
  interaction: { kind: string; responseFamily?: string; selectionMode?: string; taskMode?: string; questionType?: string; editorKind?: string; editorVariant?: string }
  eligibleGrades: number[]
  estimatedDurationSeconds?: number
}
export interface QuestionsData {
  items: QuestionSummary[]
  pagination: { page: number; pages: number; limit: number; total: number }
}

export interface QuestionMedia {
  mediaId?: string
  mediaType: string
  role?: string
  fileKey?: string
  altText?: string
  url?: string | null
  fallback?: QuestionMedia
}
export interface ComicPaletteAsset {
  pieceKey: string
  label: string
  status: 'available' | 'unmapped'
  media?: QuestionMedia
}
export interface QuestionOption {
  optionId: string
  text?: string
  value?: string
  values?: string[]
  pair?: string[]
  media?: QuestionMedia
}
export interface OptionGroup {
  groupId: string
  prompt?: string
  layout?: string
  choices: QuestionOption[]
}
export interface ChoiceInteraction {
  kind: 'choice'
  responseFamily: string
  optionGroupId: string
  selectionMode: 'single' | 'multiple'
}
export interface ConditionalInteraction {
  kind: 'conditional_choice'
  responseFamily: string
  steps: { stepId: string; optionGroupId: string; selectionMode: 'single' | 'multiple'; showWhen?: { stepId: string; optionIds: string[] } }[]
}
export interface SpecializedInteraction {
  kind: 'performance' | 'constructed_activity'
  responseFamily?: string
  protocol?: Record<string, unknown>
  editor?: Record<string, unknown>
  [key: string]: unknown
}
export type PreviewInteraction = ChoiceInteraction | ConditionalInteraction | SpecializedInteraction
export interface PreviewQuestion {
  questionId: string
  model: string
  questionText: string
  description?: string
  helperText?: string
  instructions?: string
  classification: Classification
  presentation: { mode: string; layout: string; title?: string; media?: QuestionMedia[]; options?: OptionGroup[] }
  interaction: PreviewInteraction
  selection: { eligibleGrades: number[]; estimatedDurationSeconds?: number }
}
export interface ResolvedAsset { fileKey: string; resourceType: 'image' | 'video' | 'raw'; deliveryPath: string; url: string | null }
export interface DetailData {
  question: PreviewQuestion
  mediaBaseUrl: string | null
  resolvedAssets: ResolvedAsset[]
  navigation: { previousQuestionId: string | null; nextQuestionId: string | null; position: number; total: number }
}
