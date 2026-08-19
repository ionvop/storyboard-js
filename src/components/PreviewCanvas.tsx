import { useEffect, useMemo, useRef, useState } from 'react'
import type { SpriteAsset, SpriteDef } from '../lib/types'
import { sampleScene } from '../lib/scene'
import { getImage, makeDrawItem, renderSprite } from '../lib/render'

const WIDTH = 1280
const HEIGHT = 720

interface PreviewCanvasProps {
  sprites: SpriteDef[]
  assets: SpriteAsset[]
  time: number
}

export function PreviewCanvas({ sprites, assets, time }: PreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bufferRef = useRef<HTMLCanvasElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  // Keep the internal 16:9 buffer canvas.
  if (!bufferRef.current) {
    bufferRef.current = document.createElement('canvas')
    bufferRef.current.width = WIDTH
    bufferRef.current.height = HEIGHT
  }

  // Cache the asset lookup map and decoded images — pure functions of `assets`.
  const assetByName = useMemo(() => new Map(assets.map((a) => [a.name, a])), [assets])
  const imageByName = useMemo(
    () => new Map(assets.map((a) => [a.name, getImage(a.data)])),
    [assets],
  )

  // Auto-size the visible canvas to fit the container while keeping 16:9.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const measure = () => {
      const scale = Math.min(container.offsetWidth / 16, container.offsetHeight / 9)
      const width = 16 * scale * 0.9
      const height = 9 * scale * 0.9
      setSize({ width, height })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Render the current frame into the buffer and blit onto the visible canvas.
  useEffect(() => {
    const canvas = canvasRef.current
    const buffer = bufferRef.current
    if (!canvas || !buffer) return

    const ctx = canvas.getContext('2d')
    const bufferCtx = buffer.getContext('2d')
    if (!ctx || !bufferCtx) return

    const assetByName = new Map(assets.map((a) => [a.name, a]))
    const sampled = sampleScene(sprites, time)

    bufferCtx.clearRect(0, 0, WIDTH, HEIGHT)
    for (const sprite of sampled) {
      const asset = assetByName.get(sprite.name)
      if (!asset) continue
      const item = makeDrawItem(asset.data, sprite.properties)
      renderSprite(bufferCtx, buffer, item)
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(buffer, 0, 0, canvas.width, canvas.height)
  }, [sprites, assets, time, size, assetByName, imageByName])

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        width={Math.max(1, Math.round(size.width))}
        height={Math.max(1, Math.round(size.height))}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-lg"
      />
    </div>
  )
}