import { Assessment } from '@/components/assessment/Assessment'
import { useParams } from 'react-router'

const AssessmentPage = () => {
  const { assessmentId } = useParams()
  return <Assessment key={assessmentId ?? 'start'} assessmentId={assessmentId} />
}

export default AssessmentPage
