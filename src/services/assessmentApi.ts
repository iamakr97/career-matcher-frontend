import { createApi } from '@reduxjs/toolkit/query/react'
import { parseReport, parseState, unwrap } from '@/lib/assessment-contract'
import { baseQuery } from '@/services/api'
import type { AssessmentReportResponseDto, AssessmentStateDto, CreateAssessmentDto, SubmitResponseDto } from '@/types/assessment'

const root = 'career-matcher/assessment'
export const assessmentApi = createApi({
  reducerPath: 'assessmentApi', baseQuery, keepUnusedDataFor: 0,
  endpoints: (builder) => ({
    createAssessment: builder.mutation<AssessmentStateDto, CreateAssessmentDto>({
      query: (body) => ({ url: root, method: 'POST', body, cache: 'no-store' }),
      transformResponse: (value: unknown) => unwrap(value, (data) => parseState(data)),
    }),
    getAssessment: builder.query<AssessmentStateDto, { assessmentId: string }>({
      query: ({ assessmentId }) => ({ url: `${root}/${encodeURIComponent(assessmentId)}`, method: 'GET', cache: 'no-store' }),
      transformResponse: (value: unknown, _meta, arg) => unwrap(value, (data) => parseState(data, arg.assessmentId)),
    }),
    submitResponse: builder.mutation<AssessmentStateDto, { assessmentId: string; payload: SubmitResponseDto }>({
      query: ({ assessmentId, payload }) => ({ url: `${root}/${encodeURIComponent(assessmentId)}/submit-response`, method: 'POST', body: payload, cache: 'no-store' }),
      transformResponse: (value: unknown, _meta, arg) => unwrap(value, (data) => parseState(data, arg.assessmentId)),
    }),
    getAssessmentReport: builder.query<AssessmentReportResponseDto, { assessmentId: string }>({
      query: ({ assessmentId }) => ({ url: `${root}/${encodeURIComponent(assessmentId)}/report`, method: 'GET', cache: 'no-store' }),
      transformResponse: (value: unknown, _meta, arg) => unwrap(value, (data) => parseReport(data, arg.assessmentId)),
    }),
  }),
})
export const { useCreateAssessmentMutation, useLazyGetAssessmentQuery, useSubmitResponseMutation, useLazyGetAssessmentReportQuery } = assessmentApi
