import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { safeMediaUrl } from '@/lib/assessment-contract'
import type { AssessmentMediaDto } from '@/types/assessment'

interface Props { media: AssessmentMediaDto; limit: number; allowReplay: boolean; busy: boolean; onPlayingChange: (playing: boolean) => void; onComplete: (count: number, durationMs: number) => void; onFailure: () => void }
export const ChcAudio = ({ media, limit, allowReplay, busy, onPlayingChange, onComplete, onFailure }: Props) => {
  const audio = useRef<HTMLAudioElement>(null)
  const started = useRef<number | null>(null)
  const count = useRef(0)
  const [playbackCount, setPlaybackCount] = useState(0)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const [fallback, setFallback] = useState(false)
  useEffect(() => () => { audio.current?.pause(); audio.current?.removeAttribute('src'); audio.current?.load() }, [])
  const source = fallback && media.fallback?.mediaType === 'audio' && safeMediaUrl(media.fallback.url) ? media.fallback.url : media.url
  if (!safeMediaUrl(source) || media.mediaType !== 'audio' || limit < 1) return <p role="alert">Listening is unavailable. Check this activity again.</p>
  const fail = () => {
    started.current = null
    setPlaying(false)
    onPlayingChange(false)
    if (!fallback && media.fallback?.mediaType === 'audio' && safeMediaUrl(media.fallback.url)) { setReady(false); setFallback(true) }
    else { setFailed(true); onFailure() }
  }
  const play = async () => {
    if (!audio.current || !ready || playing || busy || count.current >= limit || count.current > 0 && !allowReplay) return
    try { started.current = performance.now(); setPlaying(true); onPlayingChange(true); await audio.current.play() }
    catch { setPlaying(false); onPlayingChange(false); fail() }
  }
  const ended = () => {
    if (started.current === null) return
    const elapsed = Math.max(0, performance.now() - started.current)
    started.current = null
    count.current += 1
    setPlaybackCount(count.current)
    setPlaying(false)
    onPlayingChange(false)
    onComplete(count.current, elapsed)
  }
  return <div className="mt-5"><audio ref={audio} src={source} preload="metadata" onCanPlay={() => setReady(true)} onEnded={ended} onError={fail} aria-label={media.altText || 'Assessment audio'} /><Button type="button" disabled={!ready || busy || playing || failed || playbackCount >= limit || playbackCount > 0 && !allowReplay} onClick={() => void play()}>{playing ? 'Listening…' : playbackCount > 0 ? 'Play again' : 'Play audio'}</Button><p className="mt-2 text-sm text-slate-600">{failed ? 'Audio could not be completed.' : playing ? 'Audio is playing.' : playbackCount > 0 ? 'Playback completed.' : ready ? 'Ready to play.' : 'Loading audio.'}</p></div>
}
