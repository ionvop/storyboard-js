import type { ProjectData, SpriteAsset } from './types'

/** Default name used for new projects and as a fallback when none is set. */
export const defaultProjectName = 'New project'

/** Strip characters that are invalid in filenames, trimming surrounding whitespace. */
export function sanitizeFilename(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, '').trim()
  return cleaned || defaultProjectName
}

/** Base64-encode a UTF-8 string safely (handles non-Latin1 characters). */
export function base64Encode(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** Decode a base64 string that was produced by {@link base64Encode}. */
export function base64Decode(encoded: string): string {
  const binary = atob(encoded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/** Serialize and download an object as a base64 `.dat` file. */
function downloadData(title: string, data: unknown) {
  const encoded = base64Encode(JSON.stringify(data))
  const blob = new Blob([encoded], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.download = title
  a.href = url
  a.click()
  URL.revokeObjectURL(url)
}

/** Minimal typing for the File System Access API's save picker (not in older TS libs). */
type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName?: string
    types?: Array<{ description?: string; accept: Record<string, string[]> }>
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: string) => Promise<void>
      close: () => Promise<void>
    }>
  }>
}

/**
 * Save a project, asking where to put it via the native "Save As" dialog when
 * supported (Chrome/Edge). Falls back to a direct download otherwise.
 */
export async function saveProject(project: ProjectData) {
  const filename = `sbJS_${sanitizeFilename(project.name)}.dat`
  const encoded = base64Encode(JSON.stringify(project))

  const picker = (window as SaveFilePickerWindow).showSaveFilePicker
  if (picker) {
    try {
      const handle = await picker({
        suggestedName: filename,
        types: [{ description: 'Storyboard project', accept: { 'text/plain': ['.dat'] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(encoded)
      await writable.close()
      return
    } catch (err) {
      // User cancelled the dialog — don't fall back to a download.
      if (err instanceof Error && err.name === 'AbortError') return
      // Any other failure — fall through to the direct download below.
    }
  }

  downloadData(filename, project)
}

/** Open a previously saved project file via a file picker. */
export function openProject(onLoad: (data: ProjectData) => void) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.dat'

  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const project = JSON.parse(base64Decode(String(reader.result))) as ProjectData
        onLoad(project)
      } catch {
        // Invalid or corrupted project file.
      }
    }
    reader.readAsText(file)
  }

  input.click()
}

/* ------------------------------ file uploads ------------------------------ */

export function uploadMusicFile(onLoaded: (dataUrl: string) => void) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'audio/*'

  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onLoaded(String(reader.result))
    reader.readAsDataURL(file)
  }

  input.click()
}

export function uploadImageFile(onLoaded: (dataUrl: string) => void) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'

  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onLoaded(String(reader.result))
    reader.readAsDataURL(file)
  }

  input.click()
}

/** Generate a unique sprite name starting at `New sprite`. */
export function nextSpriteName(assets: SpriteAsset[]): string {
  let name = 'New sprite'
  let suffix = 2
  while (assets.some((s) => s.name === name)) {
    name = `New sprite (${suffix})`
    suffix += 1
  }
  return name
}