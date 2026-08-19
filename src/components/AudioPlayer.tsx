import { useEffect, useRef } from 'react'

interface AudioPlayerProps {
  music: string | null
  onTimeUpdate?: (time: number) => void
  onSeeked?: (time: number) => void
}

export function AudioPlayer({ music, onTimeUpdate, onSeeked }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const onTimeUpdateRef = useRef(onTimeUpdate)
  const onSeekedRef = useRef(onSeeked)

  // Keep the latest callbacks in refs so the render loop never goes stale.
  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate
  }, [onTimeUpdate])
  useEffect(() => {
    onSeekedRef.current = onSeeked
  }, [onSeeked])

  // Drive smooth preview updates with requestAnimationFrame instead of relying
  // on the throttled `timeupdate` event (~4-5 times/sec).
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    let rafId = 0
    let lastTime = -1

    const tick = () => {
      const current = audio.currentTime
      // Only report when the value actually changed to avoid redundant renders.
      if (current !== lastTime) {
        lastTime = current
        onTimeUpdateRef.current?.(current)
      }
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <audio
        ref={audioRef}
        controls
        src={music ?? undefined}
        className="w-full"
        onSeeked={(e) => onSeekedRef.current?.(e.currentTarget.currentTime)}
        onLoadedData={(e) => onSeekedRef.current?.(e.currentTarget.currentTime)}
      />
    </div>
  )
}