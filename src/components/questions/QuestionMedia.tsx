import { useEffect, useState } from 'react'

import { getResolvedMediaUrl, humanize } from '@/components/questions/format'
import type { QuestionMedia as Media, ResolvedAsset } from '@/types/question'

interface Props { media: Media; assets: ResolvedAsset[]; compact?: boolean }

export function QuestionMedia({ media, assets, compact = false }: Props) {
  const primary = getResolvedMediaUrl(media, assets)
  const fallback = media.fallback ? getResolvedMediaUrl(media.fallback, assets) : null
  const [source, setSource] = useState(primary || fallback)
  const [failed, setFailed] = useState(false)
  useEffect(() => { setSource(primary || fallback); setFailed(false) }, [primary, fallback, media.mediaId])
  const label = media.altText || (media.role ? humanize(media.role) : 'Question media')
  const type = source === fallback && source !== primary ? media.fallback?.mediaType : media.mediaType

  return (
    <figure className={`min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-[#f8faf9] ${compact ? 'p-3' : 'p-4 sm:p-5'}`}>
      {source && !failed && (media.fileKey?.endsWith('.json') || type === 'raw') ? (
        <a className="text-sm font-medium text-teal-800 underline underline-offset-4" href={source} target="_blank" rel="noreferrer">Open supporting template</a>
      ) : source && !failed && (type === 'image' || type === 'svg') ? (
        <img src={source} alt={label} className="mx-auto max-h-80 w-full object-contain" onError={() => {
          if (fallback && source !== fallback) setSource(fallback)
          else setFailed(true)
        }} />
      ) : source && !failed && type === 'audio' ? (
        <audio controls preload="none" className="w-full" aria-label={label} src={source} onError={() => setFailed(true)} />
      ) : source && !failed && type === 'video' ? (
        <video controls preload="none" className="max-h-80 w-full" aria-label={label} src={source} onError={() => setFailed(true)} />
      ) : (
        <div className="py-6 text-center text-sm text-slate-500">{failed ? 'Media could not be loaded.' : 'Media URL not configured.'}</div>
      )}
      {media.altText && <figcaption className="mt-3 text-xs leading-5 text-slate-500">{media.altText}</figcaption>}
    </figure>
  )
}
