import { useEffect, useRef } from 'react'

interface StatusPanelProps {
  printedText: string
  error: string | null
}

export function StatusPanel({ printedText, error }: StatusPanelProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [printedText, error])

  return (
    <div
      ref={ref}
      className={`h-full overflow-auto px-4 py-3 font-mono text-sm whitespace-pre-wrap ${
        error ? 'text-error' : 'text-base-content/70'
      }`}
    >
      {error ?? printedText}
    </div>
  )
}