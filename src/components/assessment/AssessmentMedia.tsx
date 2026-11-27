import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { safeMediaUrl } from '@/lib/assessment-contract'
import type { AssessmentMediaDto } from '@/types/assessment'
interface Props { media: AssessmentMediaDto; onAvailability: (id: string, ready: boolean) => void }
export const AssessmentMedia = ({ media, onAvailability }: Props) => {
  const [fallback, setFallback] = useState(false)
  const [failed, setFailed] = useState(false)
  const source = fallback && media.fallback ? media.fallback : media
  const fail = () => { if (!fallback && media.fallback) setFallback(true); else { setFailed(true); onAvailability(media.mediaId, false) } }
  const retry = () => { setFallback(false); setFailed(false); onAvailability(media.mediaId, false) }
  if (!safeMediaUrl(source.url)) return <p role="alert" className="text-sm text-destructive">Issued media is unavailable. Please check again before answering.</p>
  if (failed) return <div role="alert" className="text-sm text-destructive">Issued media could not be loaded. <Button variant="outline" size="sm" onClick={retry}>Retry media</Button></div>
  const label = media.altText || 'Assessment media'
  if (source.mediaType === 'image' || source.mediaType === 'svg') return <img src={source.url} alt={label} onLoad={() => onAvailability(media.mediaId, true)} onError={fail} className="max-h-80 max-w-full rounded-lg object-contain" />
  if (source.mediaType === 'audio') return <audio src={source.url} controls onLoadedData={() => onAvailability(media.mediaId, true)} onError={fail} aria-label={label} className="max-w-full" />
  return <video src={source.url} controls onLoadedData={() => onAvailability(media.mediaId, true)} onError={fail} aria-label={label} className="max-h-80 max-w-full rounded-lg" />
}
