import { Muxer, ArrayBufferTarget } from 'mp4-muxer'
import type { SpriteAsset, SpriteDef } from './types'
import { WIDTH, HEIGHT, renderFrameToCanvas } from './video'

export type VideoFormat = 'mp4' | 'webm'

export interface ExportOptions {
  sprites: SpriteDef[]
  assets: SpriteAsset[]
  /** Data URL of the uploaded music, or null for silent video. */
  audioDataUrl: string | null
  onProgress?: (message: string) => void
}

const FPS = 60
const FRAME_DURATION_US = 1_000_000 / FPS

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

  const audio = await decodeAudio(audioDataUrl)
  const duration = audio ? audio.duration : 0
  const frameCount = Math.max(1, Math.ceil(duration * FPS))

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: WIDTH, height: HEIGHT, frameRate: FPS },
    audio: audio
      ? { codec: 'aac', numberOfChannels: audio.numberOfChannels, sampleRate: audio.sampleRate }
      : undefined,
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  })

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create 2D context for video export')

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      throw e
    },
  })
  videoEncoder.configure({
    codec: 'avc1.42001f',
    width: WIDTH,
    height: HEIGHT,
    bitrate: 5_000_000,
    framerate: FPS,
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
    const time = i / FPS
    renderFrameToCanvas(ctx, canvas, sprites, assets, time)
    const frame = new VideoFrame(canvas, {
      timestamp: i * FRAME_DURATION_US,
      duration: FRAME_DURATION_US,
    })
    videoEncoder.encode(frame, { keyFrame: i % FPS === 0 })
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

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create 2D context for video export')

  const stream = canvas.captureStream(FPS)

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
  const frameCount = Math.max(1, Math.ceil(duration * FPS))

  for (let i = 0; i < frameCount; i++) {
    renderFrameToCanvas(ctx, canvas, sprites, assets, i / FPS)
    if (i % 10 === 0) onProgress?.(`Recording... ${i}/${frameCount}`)
    await new Promise((r) => setTimeout(r, 1000 / FPS))
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
