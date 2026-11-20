import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const backendOrigin = import.meta.env.VITE_BE_API_URL?.trim().replace(/\/+$/, '')

if (!backendOrigin) {
  throw new Error('VITE_BE_API_URL must contain the backend origin, without /api')
}

let backendUrl: URL

try {
  backendUrl = new URL(backendOrigin)
} catch {
  throw new Error('VITE_BE_API_URL must be a valid http(s) backend origin, without /api')
}

if (
  !['http:', 'https:'].includes(backendUrl.protocol) ||
  backendUrl.pathname !== '/' ||
  backendUrl.search ||
  backendUrl.hash ||
  backendUrl.username ||
  backendUrl.password
) {
  throw new Error('VITE_BE_API_URL must be a valid http(s) backend origin, without /api')
}

export const baseQuery = fetchBaseQuery({
  baseUrl: `${backendOrigin}/api`,
})
