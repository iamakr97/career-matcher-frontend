import { useState } from 'react'

import { getResolvedMediaUrl, humanize } from '@/components/questions/format'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { QuestionMedia as Media, ResolvedAsset } from '@/types/question'

type MediaVariant = 'stimulus' | 'supporting' | 'option' | 'sequence'
interface Props { media: Media; assets: ResolvedAsset[]; variant?: MediaVariant; enlargeable?: boolean }

export function QuestionMedia({ media, assets, variant = 'supporting', enlargeable = false }: Props) {
  const primary = getResolvedMediaUrl(media, assets)
  const fallback = media.fallback ? getResolvedMediaUrl(media.fallback, assets) : null
  const [failedUrls, setFailedUrls] = useState<string[]>([])
  const source = primary && !failedUrls.includes(primary) ? primary : fallback && !failedUrls.includes(fallback) ? fallback : null
  const failed = failedUrls.length > 0 && !source
  const markFailed = () => { if (source) setFailedUrls((previous) => previous.includes(source) ? previous : [...previous, source]) }
  const label = media.altText ?? (media.role ? humanize(media.role) : 'Question media')
  const activeMedia = source === fallback && source !== primary ? media.fallback : media
  const type = activeMedia?.mediaType
  const fileKey = activeMedia?.fileKey
  const image = type === 'image' || type === 'svg'
  const imageSize = variant === 'option' ? 'max-h-40' : variant === 'sequence' ? 'max-h-44' : variant === 'stimulus' ? 'max-h-[22rem]' : 'max-h-[18rem]'

  return <figure className="min-w-0">
    {media.role && <figcaption className="sr-only">{humanize(media.role)}</figcaption>}
    {source && (fileKey?.endsWith('.json') || type === 'raw') ? (
      <a className="text-sm font-medium text-blue-700 underline underline-offset-4" href={source} target="_blank" rel="noreferrer">Open supporting template</a>
    ) : source && image && enlargeable ? (
      <Dialog>
        <DialogTrigger aria-label={`Enlarge ${label}`} className="block w-full cursor-zoom-in rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          <img src={source} alt={label} className={`mx-auto max-w-full rounded-lg object-contain ${imageSize}`} onError={markFailed} />
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogTitle>Image preview</DialogTitle>
          <DialogDescription>{media.altText ?? 'Question image preview'}</DialogDescription>
          <img src={source} alt={label} className="mx-auto max-h-[70vh] w-full object-contain" onError={markFailed} />
        </DialogContent>
      </Dialog>
    ) : source && image ? (
      <img src={source} alt={label} className={`mx-auto max-w-full rounded-lg object-contain ${imageSize}`} onError={markFailed} />
    ) : source && type === 'audio' ? (
      <audio controls preload="none" className="w-full" aria-label={label} src={source} onError={markFailed} />
    ) : source && type === 'video' ? (
      <video controls preload="none" className="max-h-[22rem] w-full" aria-label={label} src={source} onError={markFailed} />
    ) : (
      <div role="status" className="rounded-md bg-slate-50 p-2 text-xs leading-5 text-slate-600">
        <span>{failed ? 'Media unavailable: the file could not be loaded.' : 'Media unavailable: no resolved URL.'}</span>
        {media.altText && <span className="mt-1 block">{media.altText}</span>}
        {media.fileKey && <span className="mt-1 block break-all text-slate-500">{media.fileKey}</span>}
      </div>
    )}
  </figure>
}
