import type { AssessmentMediaDto, AssessmentPerformanceStepDto } from '@/types/assessment'

export const chcStimulusMedia = (step: AssessmentPerformanceStepDto, media: AssessmentMediaDto[]) => {
  if (step.event === 'hide' || step.event === 'retention' || step.event === 'cue' || step.exposureGap || step.event === 'response' && step.taskMode !== 'static_choice' && !step.timing.studyVisibleDuringResponse) return []
  const main = step.stimulus?.media
  const entries = [...media.filter((item) => !item.optionId && !['option', 'option_icon', 'option_image', 'palette', 'baseline', 'supporting'].includes(item.role)), ...(main && !main.optionId && !['option', 'option_icon', 'option_image'].includes(main.role) ? [main] : [])]
  return entries.filter((item, index) => item.mediaType !== 'audio' && entries.findIndex((candidate) => candidate.mediaId === item.mediaId || candidate.url === item.url) === index)
}
