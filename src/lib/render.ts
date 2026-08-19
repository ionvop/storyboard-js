import type { SpriteProperties } from './types'

const imageCache = new Map<string, HTMLImageElement>()

export function getImage(dataUrl: string): HTMLImageElement {
  let img = imageCache.get(dataUrl)
  if (!img) {
    img = new Image()
    img.src = dataUrl
    imageCache.set(dataUrl, img)
  }
  return img
}

export interface RenderItem {
  img: HTMLImageElement
  x: number
  y: number
  size: number
  angle: number
  alpha: number
  additive: number
  sizeH: number
  sizeV: number
}

/**
 * Draw one sprite onto a canvas, centered at its normalized position,
 * applying scale, rotation, alpha and optional additive blending.
 * Mirrors `renderSprite` from `old/script.js`.
 */
export function renderSprite(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  item: RenderItem,
) {
  const img = item.img
  const cx = item.x * canvas.width
  const cy = item.y * canvas.height
  const w = img.width * item.size * Math.abs(item.sizeH)
  const h = img.height * item.size * Math.abs(item.sizeV)

  ctx.globalAlpha = item.alpha
  if (item.additive === 1) ctx.globalCompositeOperation = 'lighter'
  ctx.translate(cx, cy)
  ctx.rotate(item.angle)
  ctx.scale(item.sizeH < 0 ? -1 : 1, item.sizeV < 0 ? -1 : 1)
  ctx.drawImage(img, -w / 2, -h / 2, w, h)
  // Reset the transform manually instead of save()/restore() per sprite.
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

/** Turn a resolved set of properties into a draw item for the given asset. */
export function makeDrawItem(assetData: string, properties: SpriteProperties): RenderItem {
  return {
    img: getImage(assetData),
    x: properties.x,
    y: properties.y,
    size: properties.size,
    angle: properties.angle,
    alpha: properties.alpha,
    additive: properties.additive,
    sizeH: properties.sizeH,
    sizeV: properties.sizeV,
  }
}