import { createApi } from '@reduxjs/toolkit/query/react'
import { readAssessmentAccess } from '@/lib/assessment-access'
import { parseReport, parseState, unwrap, validLocator } from '@/lib/assessment-contract'
import { baseQuery } from '@/services/api'
import type { AssessmentReportResponseDto, AssessmentStateDto, CreateAssessmentDto, SubmitChoiceResponseDto } from '@/types/assessment'

const root = 'career-matcher/assessment'
const authorization = (assessmentId?: string): Headers => {
  const access = readAssessmentAccess()
  if (!access || (assessmentId !== undefined && (!validLocator(assessmentId) || access.assessmentId !== assessmentId))) throw new Error('assessment access unavailable')
  const headers = new Headers()
  headers.set('Authorization', `Bearer ${access.accessSecret}`)
  return headers
}
export const assessmentApi = createApi({
  reducerPath: 'assessmentApi', baseQuery, keepUnusedDataFor: 0,
  endpoints: (builder) => ({
    createAssessment: builder.mutation<AssessmentStateDto, CreateAssessmentDto>({
      query: (body) => ({ url: root, method: 'POST', body, headers: authorization(), cache: 'no-store' }),
      transformResponse: (value: unknown) => unwrap(value, (data) => parseState(data)),
    }),
    getAssessment: builder.query<AssessmentStateDto, { assessmentId: string }>({
      query: ({ assessmentId }) => ({ url: `${root}/${encodeURIComponent(assessmentId)}`, method: 'GET', headers: authorization(assessmentId), cache: 'no-store' }),
      transformResponse: (value: unknown, _meta, arg) => unwrap(value, (data) => parseState(data, arg.assessmentId)),
    }),
    submitResponse: builder.mutation<AssessmentStateDto, { assessmentId: string; payload: SubmitChoiceResponseDto }>({
      query: ({ assessmentId, payload }) => ({ url: `${root}/${encodeURIComponent(assessmentId)}/submit-response`, method: 'POST', body: payload, headers: authorization(assessmentId), cache: 'no-store' }),
      transformResponse: (value: unknown, _meta, arg) => unwrap(value, (data) => parseState(data, arg.assessmentId)),
    }),
    getAssessmentReport: builder.query<AssessmentReportResponseDto, { assessmentId: string }>({
      query: ({ assessmentId }) => ({ url: `${root}/${encodeURIComponent(assessmentId)}/report`, method: 'GET', headers: authorization(assessmentId), cache: 'no-store' }),
      transformResponse: (value: unknown, _meta, arg) => unwrap(value, (data) => parseReport(data, arg.assessmentId)),
    }),
  }),
})
export const { useCreateAssessmentMutation, useLazyGetAssessmentQuery, useSubmitResponseMutation, useLazyGetAssessmentReportQuery } = assessmentApi
