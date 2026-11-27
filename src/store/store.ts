import { configureStore } from '@reduxjs/toolkit'
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'

import { questionApi } from '@/services/questionApi'
import { assessmentApi } from '@/services/assessmentApi'

export const store = configureStore({
  reducer: {
    [questionApi.reducerPath]: questionApi.reducer,
    [assessmentApi.reducerPath]: assessmentApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(questionApi.middleware, assessmentApi.middleware),
  devTools: false,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
