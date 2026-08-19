import { Muxer, ArrayBufferTarget } from 'mp4-muxer'
import type { SpriteAsset, SpriteDef } from './types'
import { WIDTH, HEIGHT, renderFrameToCanvas } from './video'

export type VideoFormat = 'mp4' | 'webm'

/** Supported output framerates. */
export type ExportFramerate = 60 | 30 | 15

export interface ExportOptions {
  sprites: SpriteDef[]
  assets: SpriteAsset[]
  /** Data URL of the uploaded music, or null for silent video. */
  audioDataUrl: string | null
  /** Output framerate in frames per second. */
  framerate?: ExportFramerate
  /** Output width in pixels (defaults to {@link WIDTH}). */
  width?: number
  /** Output height in pixels (defaults to {@link HEIGHT}). */
  height?: number
  onProgress?: (message: string) => void
}

/** Resolution presets exposed to the UI. */
export const RESOLUTIONS = {
  '720p': { width: 1280, height: 720, label: '720p (1280×720)' },
  '360p': { width: 640, height: 360, label: '360p (640×360)' },
  '144p': { width: 256, height: 144, label: '144p (256×144)' },
} as const

export type ResolutionPreset = keyof typeof RESOLUTIONS

/** Feature detection for the WebCodecs API. */
export function supportsWebCodecs(): boolean {
  return (
    typeof VideoEncoder !== 'undefined' &&
    typeof AudioEncoder !== 'undefined' &&
    typeof VideoFrame !== 'undefined' &&
    typeof AudioData !== 'undefined'
  )
}

/** Feature detection for the MediaRecorder API. */
export function supportsMediaRecorder(): boolean {
  return typeof MediaRecorder !== 'undefined'
}

/** Trigger a browser download of a Blob. */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function stamp(): string {
  return new Date().toISOString()
}

/** Decode a data URL into an AudioBuffer, or null if there is no audio. */
async function decodeAudio(dataUrl: string | null): Promise<AudioBuffer | null> {
  if (!dataUrl) return null
  const ctx = new AudioContext()
  try {
    const response = await fetch(dataUrl)
    const arrayBuffer = await response.arrayBuffer()
    return await ctx.decodeAudioData(arrayBuffer)
  } finally {
    void ctx.close()
  }
}

/* ------------------------------ WebCodecs MP4 ------------------------------ */

/**
 * Export the animation as an MP4 file using the WebCodecs API (offline, fast).
 * Requires Chrome/Edge. Falls back to {@link exportVideoMediaRecorder} elsewhere.
 */
export async function exportVideoWebCodecs(options: ExportOptions): Promise<void> {
  const { sprites, assets, audioDataUrl, onProgress } = options

  const fps = options.framerate ?? 60
  const width = options.width ?? WIDTH
  const height = options.height ?? HEIGHT
  const frameDurationUs = 1_000_000 / fps

  const audio = await decodeAudio(audioDataUrl)
  const duration = audio ? audio.duration : 0
  const frameCount = Math.max(1, Math.ceil(duration * fps))

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width, height, frameRate: fps },
    audio: audio
      ? { codec: 'aac', numberOfChannels: audio.numberOfChannels, sampleRate: audio.sampleRate }
      : undefined,
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  })

  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = width
  outputCanvas.height = height
  const outputCtx = outputCanvas.getContext('2d')
  if (!outputCtx) throw new Error('Could not create 2D context for video export')

  // Render at full 720p, then scale down each frame so sprite sizes stay
  // consistent regardless of output resolution. Only one frame is buffered at
  // a time, keeping memory bounded on long animations.
  const renderCanvas = document.createElement('canvas')
  renderCanvas.width = WIDTH
  renderCanvas.height = HEIGHT
  const renderCtx = renderCanvas.getContext('2d')
  if (!renderCtx) throw new Error('Could not create 2D context for video export')
  const needsScale = width !== WIDTH || height !== HEIGHT

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      throw e
    },
  })
  videoEncoder.configure({
    codec: 'avc1.42001f',
    width,
    height,
    bitrate: width >= 1280 ? 5_000_000 : 2_500_000,
    framerate: fps,
  })

  let audioEncoder: AudioEncoder | null = null
  if (audio) {
    audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => {
        throw e
      },
    })
    audioEncoder.configure({
      codec: 'mp4a.40.2',
      sampleRate: audio.sampleRate,
      numberOfChannels: audio.numberOfChannels,
      bitrate: 128_000,
    })
  }

  // Encode video frames.
  for (let i = 0; i < frameCount; i++) {
    const time = i / fps
    renderFrameToCanvas(renderCtx, renderCanvas, sprites, assets, time)
    if (needsScale) {
      outputCtx.clearRect(0, 0, width, height)
      outputCtx.drawImage(renderCanvas, 0, 0, width, height)
    }
    const frame = new VideoFrame(needsScale ? outputCanvas : renderCanvas, {
      timestamp: i * frameDurationUs,
      duration: frameDurationUs,
    })
    videoEncoder.encode(frame, { keyFrame: i % fps === 0 })
    frame.close()

    if (i % 10 === 0) onProgress?.(`Encoding video... ${i}/${frameCount}`)
    // Yield periodically so the UI can update.
    if (i % 30 === 0) await new Promise((r) => setTimeout(r, 0))
  }

  // Encode audio in ~1024-sample chunks.
  if (audio && audioEncoder) {
    const chunkSize = 1024
    const totalFrames = audio.length
    const channels = audio.numberOfChannels
    const channelData: Float32Array[] = []
    for (let c = 0; c < channels; c++) channelData.push(audio.getChannelData(c))

    for (let offset = 0; offset < totalFrames; offset += chunkSize) {
      const count = Math.min(chunkSize, totalFrames - offset)
      const data = new Float32Array(count * channels)
      for (let c = 0; c < channels; c++) {
        data.set(channelData[c].subarray(offset, offset + count), c * count)
      }
      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate: audio.sampleRate,
        numberOfFrames: count,
        numberOfChannels: channels,
        timestamp: (offset / audio.sampleRate) * 1_000_000,
        data,
      })
      audioEncoder.encode(audioData)
      audioData.close()
    }
  }

  onProgress?.('Finalizing...')
  await videoEncoder.flush()
  if (audioEncoder) await audioEncoder.flush()
  muxer.finalize()

  const buffer = muxer.target.buffer
  downloadBlob(new Blob([buffer], { type: 'video/mp4' }), `sbJS_Video_${stamp()}.mp4`)
}

/* --------------------------- MediaRecorder WebM --------------------------- */

/**
 * Export the animation as a WebM file using MediaRecorder (real-time capture).
 * Works in all browsers that support MediaRecorder.
 */
export async function exportVideoMediaRecorder(options: ExportOptions): Promise<void> {
  const { sprites, assets, audioDataUrl, onProgress } = options

  const fps = options.framerate ?? 60
  const width = options.width ?? WIDTH
  const height = options.height ?? HEIGHT

  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = width
  outputCanvas.height = height
  const outputCtx = outputCanvas.getContext('2d')
  if (!outputCtx) throw new Error('Could not create 2D context for video export')

  // 720p render buffer, scaled down per frame into the streamed output canvas
  // so sprite sizes stay consistent across resolutions.
  const renderCanvas = document.createElement('canvas')
  renderCanvas.width = WIDTH
  renderCanvas.height = HEIGHT
  const renderCtx = renderCanvas.getContext('2d')
  if (!renderCtx) throw new Error('Could not create 2D context for video export')
  const needsScale = width !== WIDTH || height !== HEIGHT

  const stream = outputCanvas.captureStream(fps)

  // Attach audio track if music is present.
  let audioCtx: AudioContext | null = null
  if (audioDataUrl) {
    audioCtx = new AudioContext()
    const response = await fetch(audioDataUrl)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
    const source = audioCtx.createBufferSource()
    source.buffer = audioBuffer
    const dest = audioCtx.createMediaStreamDestination()
    source.connect(dest)
    source.start()
    for (const track of dest.stream.getAudioTracks()) stream.addTrack(track)
  }

  const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) =>
    MediaRecorder.isTypeSupported(m),
  )
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })

  recorder.start()

  const duration = audioCtx ? audioCtx.currentTime : 0
  const frameCount = Math.max(1, Math.ceil(duration * fps))

  for (let i = 0; i < frameCount; i++) {
    renderFrameToCanvas(renderCtx, renderCanvas, sprites, assets, i / fps)
    if (needsScale) {
      outputCtx.clearRect(0, 0, width, height)
      outputCtx.drawImage(renderCanvas, 0, 0, width, height)
    }
    if (i % 10 === 0) onProgress?.(`Recording... ${i}/${frameCount}`)
    await new Promise((r) => setTimeout(r, 1000 / fps))
  }

  recorder.stop()
  await stopped

  if (audioCtx) await audioCtx.close()

  const blob = new Blob(chunks, { type: 'video/webm' })
  downloadBlob(blob, `sbJS_Video_${stamp()}.webm`)
}

/** Export the animation in the requested format, choosing the best available backend. */
export async function exportVideo(format: VideoFormat, options: ExportOptions): Promise<void> {
  if (format === 'mp4') {
    if (supportsWebCodecs()) {
      await exportVideoWebCodecs(options)
      return
    }
    // MP4 not available; fall back to WebM via MediaRecorder.
    if (supportsMediaRecorder()) {
      await exportVideoMediaRecorder(options)
      return
    }
    throw new Error('No video export backend available in this browser')
  }

  // webm
  if (supportsMediaRecorder()) {
    await exportVideoMediaRecorder(options)
    return
  }
  throw new Error('MediaRecorder is not available in this browser')
}
