import { useRef } from 'react'

interface AudioPlayerProps {
  music: string | null
  onTimeUpdate?: (time: number) => void
  onSeeked?: (time: number) => void
}

export function AudioPlayer({ music, onTimeUpdate, onSeeked }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <audio
        ref={audioRef}
        controls
        src={music ?? undefined}
        className="w-full"
        onTimeUpdate={(e) => onTimeUpdate?.(e.currentTarget.currentTime)}
        onSeeked={(e) => onSeeked?.(e.currentTarget.currentTime)}
        onLoadedData={(e) => onSeeked?.(e.currentTarget.currentTime)}
      />
    </div>
  )
}