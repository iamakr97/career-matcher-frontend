import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { safeMediaUrl } from '@/lib/assessment-contract'
import type { AssessmentMediaDto } from '@/types/assessment'

export type MediaReadiness = 'loading' | 'ready' | 'failed'
interface Props { media: AssessmentMediaDto; onAvailability: (id: string, ready: boolean, readiness: MediaReadiness) => void; variant?: 'stimulus' | 'comparison' | 'option' | 'icon' | 'activity' | 'visual-option'; alt?: string; retryable?: boolean; retryDisabled?: boolean }
export const AssessmentMedia = ({ media, onAvailability, variant = 'stimulus', alt, retryable = true, retryDisabled = false }: Props) => {
  const resource = `${media.mediaId}:${media.url}`
  const [load, setLoad] = useState({ resource, fallback: false, failed: false, attempt: 0 })
  const active = load.resource === resource ? load : { resource, fallback: false, failed: false, attempt: 0 }
  const source = active.fallback && media.fallback ? media.fallback : media
  const callback = useRef(onAvailability)
  useEffect(() => { callback.current = onAvailability }, [onAvailability])
  const nonRenderable = !safeMediaUrl(source.url) || active.failed
  useEffect(() => { if (nonRenderable) callback.current(media.mediaId, false, 'failed') }, [resource, source.url, active.attempt, nonRenderable, media.mediaId])
  const fail = () => {
    if (!active.fallback && media.fallback && safeMediaUrl(media.fallback.url)) setLoad({ ...active, fallback: true })
    else setLoad({ ...active, failed: true })
  }
  const retry = () => { setLoad({ resource, fallback: false, failed: false, attempt: active.attempt + 1 }); onAvailability(media.mediaId, false, 'loading') }
  if (nonRenderable) return <span role="alert" className="inline-flex items-center gap-2 text-xs text-destructive">Media unavailable {retryable && <Button type="button" variant="outline" size="sm" disabled={retryDisabled} onClick={retry}>Retry media</Button>}</span>
  const label = alt ?? media.altText ?? 'Assessment media'
  const size = variant === 'icon' ? 'mx-auto size-8 shrink-0 object-contain sm:size-12' : variant === 'option' ? 'h-36 w-full object-contain' : variant === 'comparison' ? 'mx-auto h-36 w-full object-contain sm:h-56' : variant === 'activity' ? 'mx-auto h-auto max-h-56 w-auto max-w-full object-contain sm:max-h-72' : variant === 'visual-option' ? 'mx-auto h-28 w-full object-contain sm:h-36' : 'max-h-72 max-w-full object-contain'
  const key = `${media.mediaId}:${source.url}:${active.attempt}`
  if (source.mediaType === 'image' || source.mediaType === 'svg') return <img key={key} src={source.url} alt={label} onLoad={() => onAvailability(media.mediaId, true, 'ready')} onError={fail} className={size} />
  if (source.mediaType === 'audio') return <audio key={key} src={source.url} controls onLoadedData={() => onAvailability(media.mediaId, true, 'ready')} onError={fail} aria-label={label} className="max-w-full" />
  return <video key={key} src={source.url} controls onLoadedData={() => onAvailability(media.mediaId, true, 'ready')} onError={fail} aria-label={label} className="max-h-72 max-w-full" />
}
