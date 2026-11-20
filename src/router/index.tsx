import { createBrowserRouter } from 'react-router'

import HomePage from '@/pages/home'
import QuestionsPage from '@/pages/questions'
import AssessmentPage from '@/pages/assessment'
import PageNotFound from '@/pages/page-not-found'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/questions',
    element: <QuestionsPage />,
  },
  {
    path: '/assessment',
    element: <AssessmentPage />,
  },
  {
    path: '*',
    element: <PageNotFound />,
  },
])
