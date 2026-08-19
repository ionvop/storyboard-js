import type { SpriteDef, SpriteProperties } from './types'

/** Default values applied to every sprite property. */
export const DEFAULT_PROPERTIES: SpriteProperties = {
  x: 0.5,
  y: 0.5,
  size: 1,
  angle: 0,
  alpha: 1,
  additive: 0,
  sizeH: 1,
  sizeV: 1,
}

/** Returns a number between 0 and 1 describing the eased progress of an event. */
export function ease(t: number, type: string): number {
  switch (type) {
    case 'easeIn':
    case 'i':
      return t * t
    case 'easeOut':
    case 'o':
      return 1 - (1 - t) * (1 - t)
    case 'easeInOut':
    case 'io':
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    default:
      return t
  }
}

/** Linear interpolation between a and b at progress t. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Resolve every sprite's properties at a given time (in seconds).
 * Mirrors the original `Scene.draw`/`Sprite.sample` logic: events are sorted
 * by start time and later events override earlier ones.
 */
export function sampleSprites(sprites: SpriteDef[], time: number): SpriteProperties[] {
  return sprites.map((sprite) => {
    const properties = { ...DEFAULT_PROPERTIES }
    Object.assign(properties, sprite.initialProperties)

    const sortedEvents = [...sprite.events].sort((a, b) => a.startTime - b.startTime)

    for (const key of Object.keys(properties)) {
      const events = sortedEvents.filter((e) => e.type === key)

      for (const event of events) {
        if (event.startTime > time) break

        if (event.startTime + event.duration > time) {
          if (event.duration === 0) {
            properties[key as keyof SpriteProperties] = event.targetValue
            continue
          }

          const t = (time - event.startTime) / event.duration
          const eased = ease(t, event.easing)
          properties[key as keyof SpriteProperties] = lerp(
            properties[key as keyof SpriteProperties],
            event.targetValue,
            eased,
          )
          continue
        }

        properties[key as keyof SpriteProperties] = event.targetValue
      }
    }

    return properties
  })
}

/** Build full sampled sprite records (name + properties) for the renderer. */
export function sampleScene(sprites: SpriteDef[], time: number) {
  const properties = sampleSprites(sprites, time)
  return sprites.map((sprite, i) => ({ name: sprite.name, properties: properties[i] }))
}