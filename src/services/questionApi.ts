import { createApi } from '@reduxjs/toolkit/query/react'

import { baseQuery } from '@/services/api'

export const questionApi = createApi({
  reducerPath: 'questionApi',
  baseQuery,
  endpoints: () => ({}),
})
