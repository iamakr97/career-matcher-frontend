import type { QuestionFilters, QuestionMedia, ResolvedAsset } from '@/types/question'

export const humanize = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

export const getResolvedMediaUrl = (media: QuestionMedia, assets: ResolvedAsset[]) => {
  if (media.url && /^https?:\/\//.test(media.url)) return media.url
  const url = assets.find((asset) => asset.fileKey === media.fileKey)?.url
  return url && /^https?:\/\//.test(url) ? url : null
}

const filterNames = ['model', 'search', 'primaryMeasureCode', 'categoryAxis', 'categoryCode', 'categoryName', 'interactionKind', 'presentationMode', 'presentationLayout'] as const

export const readExplorerUrl = (params: URLSearchParams) => {
  const filters: QuestionFilters = {}
  for (const name of filterNames) {
    const value = params.get(name)?.trim()
    if (value) filters[name] = name === 'search' ? value.slice(0, 100) : value
  }
  const grade = Number(params.get('grade'))
  if (Number.isInteger(grade) && grade >= 5 && grade <= 12) filters.grade = grade
  const sort = params.get('sort')
  if (sort === 'question_id_asc' || sort === 'question_id_desc') filters.sort = sort
  const page = Number(params.get('page'))
  const limit = Number(params.get('limit'))
  return {
    filters,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: Number.isInteger(limit) && limit >= 1 && limit <= 100 ? limit : 20,
    questionId: params.get('question') || null,
  }
}

export const errorText = (error: unknown) => {
  if (!error || typeof error !== 'object') return 'The request could not be completed.'
  const record = error as { data?: { message?: string }; error?: string; status?: unknown }
  return record.data?.message || record.error || `Request failed${record.status ? ` (${String(record.status)})` : ''}.`
}

export const errorStatus = (error: unknown) => {
  if (!error || typeof error !== 'object') return null
  return (error as { status?: unknown }).status
}
