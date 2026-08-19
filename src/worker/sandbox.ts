import type { SandboxRequest, SpriteDef, SpriteProperties } from '../lib/types'
import { sampleOne } from '../lib/scene'

/**
 * Sandbox Web Worker (module type, bundled by Vite).
 * It evaluates the user's animation script in isolation, providing `Sprite`
 * and `print`, then posts back the serializable sprite definitions.
 * Ported from `old/sandbox.js`.
 */

/** The `Sprite` instance exposed to user scripts. */
export interface SpriteInstance {
  _set(type: string, startTime: number, targetValue: number, duration?: number, easing?: string): void
  moveX(startTime: number, targetValue: number, duration?: number, easing?: string): void
  moveY(startTime: number, targetValue: number, duration?: number, easing?: string): void
  scale(startTime: number, targetValue: number, duration?: number, easing?: string): void
  rotate(startTime: number, targetValue: number, duration?: number, easing?: string): void
  fade(startTime: number, targetValue: number, duration?: number, easing?: string): void
  additive(startTime: number, targetValue: number): void
  scaleX(startTime: number, targetValue: number, duration?: number, easing?: string): void
  scaleY(startTime: number, targetValue: number, duration?: number, easing?: string): void
  /** Resolve this sprite's properties at a given time (in seconds). */
  sample(time: number): SpriteProperties
}

/** Factory that produces the `Sprite` constructor exposed to user scripts. */
function makeSpriteFactory(register: (sprite: SpriteDef) => void) {
  return function Sprite(imageName: string, initialProperties: Partial<SpriteProperties> = {}) {
    const def: SpriteDef = {
      name: imageName,
      initialProperties,
      events: [],
    }
    register(def)

    return {
      _set(type: string, startTime: number, targetValue: number, duration = 0, easing = 'linear') {
        def.events.push({ type, startTime, targetValue, duration, easing })
      },
      moveX(startTime: number, targetValue: number, duration = 0, easing = 'linear') {
        this._set('x', startTime, targetValue, duration, easing)
      },
      moveY(startTime: number, targetValue: number, duration = 0, easing = 'linear') {
        this._set('y', startTime, targetValue, duration, easing)
      },
      scale(startTime: number, targetValue: number, duration = 0, easing = 'linear') {
        this._set('size', startTime, targetValue, duration, easing)
      },
      rotate(startTime: number, targetValue: number, duration = 0, easing = 'linear') {
        this._set('angle', startTime, targetValue, duration, easing)
      },
      fade(startTime: number, targetValue: number, duration = 0, easing = 'linear') {
        this._set('alpha', startTime, targetValue, duration, easing)
      },
      additive(startTime: number, targetValue: number) {
        this._set('additive', startTime, targetValue, 0, 'linear')
      },
      scaleX(startTime: number, targetValue: number, duration = 0, easing = 'linear') {
        this._set('sizeH', startTime, targetValue, duration, easing)
      },
      scaleY(startTime: number, targetValue: number, duration = 0, easing = 'linear') {
        this._set('sizeV', startTime, targetValue, duration, easing)
      },
      sample(time: number): SpriteProperties {
        return sampleOne(def, time)
      },
    } satisfies SpriteInstance
  } as unknown as {
    new (imageName: string, initialProperties?: Partial<SpriteProperties>): SpriteInstance
  }
}

self.onmessage = (e: MessageEvent<SandboxRequest>) => {
  const sprites: SpriteDef[] = []
  const printedLines: string[] = []
  const { code } = e.data

  function print(text: unknown) {
    printedLines.push(String(text))
  }

  const Sprite = makeSpriteFactory((def) => sprites.push(def))

  const fn = new Function('Sprite', 'print', code)

  try {
    fn(Sprite, print)

    postMessage({
      type: 'success',
      sprites,
      printedText: printedLines.join('\n'),
    })
  } catch (error) {
    postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    })
  }
}