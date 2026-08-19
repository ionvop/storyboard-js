import type { SpriteAsset, SpriteDef } from './types'
import { sampleScene } from './scene'
import { makeDrawItem, renderSprite } from './render'

export const WIDTH = 1280
export const HEIGHT = 720

/**
 * Draw a single frame of the scene into the given 1280x720 canvas context.
 * Used by both the live preview and the video exporters.
 */
export function renderFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  sprites: SpriteDef[],
  assets: SpriteAsset[],
  time: number,
) {
  const assetByName = new Map(assets.map((a) => [a.name, a]))
  const sampled = sampleScene(sprites, time)

  ctx.clearRect(0, 0, WIDTH, HEIGHT)
  for (const sprite of sampled) {
    const asset = assetByName.get(sprite.name)
    if (!asset) continue
    const item = makeDrawItem(asset.data, sprite.properties)
    renderSprite(ctx, canvas, item)
  }
}