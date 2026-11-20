import { createBrowserRouter } from 'react-router'

import HomePage from '@/pages/home'
import PageNotFound from '@/pages/page-not-found'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '*',
    element: <PageNotFound />,
  },
])
