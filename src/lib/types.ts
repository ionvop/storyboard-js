/** Shape of an uploaded sprite asset (data URL + name). */
export interface SpriteAsset {
  /** Stable unique id used as a React key so renaming doesn't remount the row. */
  id: string
  name: string
  data: string
}

/**
 * Resolved per-frame properties of a sprite.
 * Coordinates are normalized: x/y in [0,1], size/sizeH/sizeV are multipliers,
 * angle in radians, alpha in [0,1], additive is 0 or 1.
 */
export interface SpriteProperties {
  x: number
  y: number
  size: number
  angle: number
  alpha: number
  additive: number
  sizeH: number
  sizeV: number
}

/** A single animation event targeting one property. */
export interface SpriteEvent {
  type: keyof SpriteProperties | string
  startTime: number
  targetValue: number
  duration: number
  easing: string
}

/** A sprite definition created in the sandbox worker (serializable). */
export interface SpriteDef {
  name: string
  initialProperties: Partial<SpriteProperties>
  events: SpriteEvent[]
}

/** A sprite instance produced by the user's script, resolved at a given time. */
export interface SampledSprite {
  name: string
  properties: SpriteProperties
}

/** Request sent to the sandbox worker. */
export interface SandboxRequest {
  code: string
}

/** Success message posted by the sandbox worker. */
export interface SandboxSuccess {
  type: 'success'
  sprites: SpriteDef[]
  printedText: string
}

/** Error message posted by the sandbox worker. */
export interface SandboxError {
  type: 'error'
  message: string
}

export type SandboxMessage = SandboxSuccess | SandboxError

/** A project saved to / loaded from a `.dat` file. */
export interface ProjectData {
  music: string | null
  sprites: SpriteAsset[]
  code: string
}

