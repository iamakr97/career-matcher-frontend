import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { safeMediaUrl } from '@/lib/assessment-contract'
import type { AssessmentMediaDto } from '@/types/assessment'

interface Props { media: AssessmentMediaDto; onAvailability: (id: string, ready: boolean) => void; variant?: 'stimulus' | 'comparison' | 'option' | 'icon'; alt?: string }
export const AssessmentMedia = ({ media, onAvailability, variant = 'stimulus', alt }: Props) => {
  const resource = `${media.mediaId}:${media.url}`
  const [load, setLoad] = useState({ resource, fallback: false, failed: false, attempt: 0 })
  const active = load.resource === resource ? load : { resource, fallback: false, failed: false, attempt: 0 }
  const source = active.fallback && media.fallback ? media.fallback : media
  const fail = () => {
    if (!active.fallback && media.fallback && safeMediaUrl(media.fallback.url)) setLoad({ ...active, fallback: true })
    else { setLoad({ ...active, failed: true }); onAvailability(media.mediaId, false) }
  }
  const retry = () => { setLoad({ resource, fallback: false, failed: false, attempt: active.attempt + 1 }); onAvailability(media.mediaId, false) }
  if (!safeMediaUrl(source.url) || active.failed) return <span role="alert" className="inline-flex items-center gap-2 text-xs text-destructive">Media unavailable <Button type="button" variant="outline" size="sm" onClick={retry}>Retry media</Button></span>
  const label = alt ?? media.altText ?? 'Assessment media'
  const size = variant === 'icon' ? 'h-12 w-12 object-contain' : variant === 'option' ? 'h-36 w-full object-contain' : variant === 'comparison' ? 'max-h-64 w-full object-contain' : 'max-h-72 max-w-full object-contain'
  const key = `${media.mediaId}:${source.url}:${active.attempt}`
  if (source.mediaType === 'image' || source.mediaType === 'svg') return <img key={key} src={source.url} alt={label} onLoad={() => onAvailability(media.mediaId, true)} onError={fail} className={size} />
  if (source.mediaType === 'audio') return <audio key={key} src={source.url} controls onLoadedData={() => onAvailability(media.mediaId, true)} onError={fail} aria-label={label} className="max-w-full" />
  return <video key={key} src={source.url} controls onLoadedData={() => onAvailability(media.mediaId, true)} onError={fail} aria-label={label} className="max-h-72 max-w-full" />
}
