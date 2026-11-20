import { createApi } from '@reduxjs/toolkit/query/react'

import { baseQuery } from '@/services/api'
import type { ApiSuccess, DetailData, FacetsData, ModelsData, QuestionFilters, QuestionListQuery, QuestionsData } from '@/types/question'

const root = 'career-matcher/questions'

const filterParams = (filters: QuestionFilters) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  return params
}

const withParams = (path: string, params: URLSearchParams) =>
  `${path}${params.size ? `?${params.toString()}` : ''}`

export const questionApi = createApi({
  reducerPath: 'questionApi',
  baseQuery,
  endpoints: (builder) => ({
    getQuestionModels: builder.query<ModelsData, void>({
      query: () => `${root}/models`,
      transformResponse: (response: ApiSuccess<ModelsData>) => response.data,
    }),
    getQuestionFacets: builder.query<FacetsData, string>({
      query: (model) => withParams(`${root}/facets`, new URLSearchParams({ model })),
      transformResponse: (response: ApiSuccess<FacetsData>) => response.data,
    }),
    getQuestions: builder.query<QuestionsData, QuestionListQuery>({
      query: ({ page, limit, ...filters }) => {
        const params = filterParams(filters)
        params.set('page', String(page))
        params.set('limit', String(limit))
        return withParams(root, params)
      },
      transformResponse: (response: ApiSuccess<QuestionsData>) => response.data,
    }),
    getQuestionDetail: builder.query<DetailData, { questionId: string; filters: QuestionFilters }>({
      query: ({ questionId, filters }) => withParams(`${root}/${encodeURIComponent(questionId)}`, filterParams(filters)),
      transformResponse: (response: ApiSuccess<DetailData>) => response.data,
    }),
  }),
})

export const {
  useGetQuestionModelsQuery,
  useGetQuestionFacetsQuery,
  useGetQuestionsQuery,
  useGetQuestionDetailQuery,
} = questionApi
