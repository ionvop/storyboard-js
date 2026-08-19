import type { SpriteAsset, SpriteDef } from './types'
import { sampleScene } from './scene'
import { makeDrawItem, renderSprite } from './render'

export const WIDTH = 1280
export const HEIGHT = 720

/**
 * Draw a single frame of the scene into the given canvas context.
 * Used by both the live preview and the video exporters.
 *
 * @param width  Canvas width in pixels (defaults to {@link WIDTH}).
 * @param height Canvas height in pixels (defaults to {@link HEIGHT}).
 */
export function renderFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  sprites: SpriteDef[],
  assets: SpriteAsset[],
  time: number,
  width = WIDTH,
  height = HEIGHT,
) {
  const assetByName = new Map(assets.map((a) => [a.name, a]))
  const sampled = sampleScene(sprites, time)

  // Paint an opaque white background instead of clearing so that transparent
  // pixels do not become black in the encoded video.
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  for (const sprite of sampled) {
    const asset = assetByName.get(sprite.name)
    if (!asset) continue
    const item = makeDrawItem(asset.data, sprite.properties)
    renderSprite(ctx, canvas, item)
  }
}