import type { AssessmentMediaDto, AssessmentOptionGroupDto, AssessmentPresentationDto } from '@/types/assessment'

const optionRole = (item: AssessmentMediaDto) => item.role === 'option_icon' || item.role === 'option_image' || item.role === 'option'
export const choiceMedia = (presentation: AssessmentPresentationDto, group: AssessmentOptionGroupDto) => {
  const options = group.choices.map((choice) => {
    const entries = [choice.media, ...presentation.media.filter((item) => item.optionId === choice.optionId)].filter((item): item is AssessmentMediaDto => !!item && (!item.optionId || item.optionId === choice.optionId))
    const seenIds = new Set<string>()
    const seenUrls = new Set<string>()
    const media = entries.filter((item) => {
      if (seenIds.has(item.mediaId) || seenUrls.has(item.url)) return false
      seenIds.add(item.mediaId)
      seenUrls.add(item.url)
      return true
    })
    return { choice, media }
  })
  const stimulus = presentation.media.filter((item) => !item.optionId && !optionRole(item) && item.role !== 'palette' && item.role !== 'baseline')
  const issuedIds = new Set(group.choices.map((choice) => choice.optionId))
  const orphaned = presentation.media.filter((item) => optionRole(item) && (!item.optionId || !issuedIds.has(item.optionId)))
  return { options, stimulus, orphaned }
}
