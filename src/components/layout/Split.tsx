import { useCallback, useEffect, useRef, useState } from 'react'

type SplitDirection = 'row' | 'column'

interface SplitProps {
  direction: SplitDirection
  /** Initial size of the first pane in pixels. */
  initialSize: number
  children: [React.ReactNode, React.ReactNode]
  gutterClassName?: string
}

/**
 * A resizable two-pane splitter. `direction === 'row'` puts the panes side
 * by side (dragging horizontally changes width); `direction === 'column'`
 * stacks them (dragging vertically changes height).
 */
export function Split({ direction, initialSize, children, gutterClassName }: SplitProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(initialSize)
  const draggingRef = useRef(false)

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    draggingRef.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const isRow = direction === 'row'
      const total = isRow ? rect.width : rect.height
      const offset = isRow ? e.clientX - rect.left : e.clientY - rect.top
      setSize(Math.min(Math.max(offset, 40), total - 40))
    },
    [direction],
  )

  const stopDragging = useCallback(() => {
    draggingRef.current = false
  }, [])

  useEffect(() => {
    if (!draggingRef.current) return
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [onPointerMove, stopDragging])

  const isRow = direction === 'row'
  const gutterClass = isRow ? 'cursor-col-resize w-1' : 'cursor-row-resize h-1'

  return (
    <div
      ref={containerRef}
      className={isRow ? 'flex h-full w-full overflow-hidden' : 'flex h-full w-full flex-col overflow-hidden'}
    >
      <div style={isRow ? { width: `${size}px` } : { height: `${size}px` }} className="min-h-0 min-w-0 overflow-hidden">
        {children[0]}
      </div>
      <div
        onPointerDown={onPointerDown}
        className={`shrink-0 bg-neutral ${gutterClass} ${gutterClassName ?? ''}`}
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children[1]}</div>
    </div>
  )
}