import { useCallback, useEffect, useRef, useState } from 'react'
import { useSandbox } from './hooks/useSandbox'
import { TopBar } from './components/layout/TopBar'
import { Split } from './components/layout/Split'
import { CodeEditor } from './components/CodeEditor'
import { StatusPanel } from './components/StatusPanel'
import { PreviewCanvas } from './components/PreviewCanvas'
import { AudioPlayer } from './components/AudioPlayer'
import { SpritesPanel } from './components/SpritesPanel'
import { HelpModal } from './components/HelpModal'
import { ExportModal } from './components/ExportModal'
import { nextSpriteName, openProject, saveProject, uploadImageFile, uploadMusicFile } from './lib/file'
import { defaultProjectName } from './lib/file'
import {
  RESOLUTIONS,
  exportVideo,
  supportsMediaRecorder,
  supportsWebCodecs,
  type ExportFramerate,
  type ResolutionPreset,
  type VideoFormat,
} from './lib/export'
import type { ProjectData, SpriteAsset } from './lib/types'

const DEFAULT_CODE = `print("Hello, world!");`

function App() {
  const [name, setName] = useState(defaultProjectName)
  const [music, setMusic] = useState<string | null>(null)
  const [assets, setAssets] = useState<SpriteAsset[]>([])
  const [code, setCode] = useState(DEFAULT_CODE)
  const [helpOpen, setHelpOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState<string | null>(null)
  const [format, setFormat] = useState<VideoFormat>(supportsWebCodecs() ? 'mp4' : 'webm')
  const [framerate, setFramerate] = useState<ExportFramerate>(60)
  const [resolution, setResolution] = useState<ResolutionPreset>('720p')
  const [time, setTime] = useState(0)

  const sandbox = useSandbox()
  const audioRef = useRef<HTMLAudioElement>(null)

  // Re-evaluate the script whenever the code changes.
  useEffect(() => {
    sandbox.runCode(code)
  }, [code, sandbox.runCode])

  const handleNew = useCallback(() => {
    if (!confirm('New project? All unsaved changes will be lost')) return
    setName(defaultProjectName)
    setMusic(null)
    setAssets([])
    setCode(DEFAULT_CODE)
    setTime(0)
  }, [])

  const handleOpen = useCallback(() => {
    if (!confirm('Open project? All unsaved changes will be lost')) return
    openProject((project: ProjectData) => {
      // Backfill the name for projects saved by older versions that lack it.
      setName(project.name ?? defaultProjectName)
      setMusic(project.music ?? null)
      // Backfill stable ids for sprites saved by older versions that lack them.
      setAssets((project.sprites ?? []).map((s) => ({ ...s, id: s.id ?? crypto.randomUUID() })))
      setCode(project.code ?? DEFAULT_CODE)
      setTime(0)
    })
  }, [])

  const handleSave = useCallback(() => {
    saveProject({ name, music, sprites: assets, code })
  }, [name, music, assets, code])

  const handleUploadMusic = useCallback(() => {
    if (music !== null && !confirm('Replace music?')) return
    uploadMusicFile((dataUrl) => setMusic(dataUrl))
  }, [music])

  const handleUploadSprite = useCallback(() => {
    uploadImageFile((dataUrl) => {
      setAssets((prev) => [
        ...prev,
        { id: crypto.randomUUID(), name: nextSpriteName(prev), data: dataUrl },
      ])
    })
  }, [])

  const handleRenameSprite = useCallback((index: number, name: string) => {
    setAssets((prev) => prev.map((a, i) => (i === index ? { ...a, name } : a)))
  }, [])

  const handleDeleteSprite = useCallback(
    (index: number) => {
      const name = assets[index]?.name
      if (!confirm(`Delete ${name}?`)) return
      setAssets((prev) => prev.filter((_, i) => i !== index))
    },
    [assets],
  )

  const handleRender = useCallback(async () => {
    if (rendering) return

    setExportOpen(false)
    setRendering(true)
    setRenderProgress('Rendering...')
    await new Promise((r) => setTimeout(r, 100))

    const { width, height } = RESOLUTIONS[resolution]
    try {
      await exportVideo(format, {
        name,
        sprites: sandbox.sprites,
        assets,
        audioDataUrl: music,
        framerate,
        width,
        height,
        onProgress: setRenderProgress,
      })
    } catch (err) {
      console.error(err)
      setRenderProgress(`Render failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setRendering(false)
      setRenderProgress(null)
    }
  }, [assets, format, framerate, music, rendering, resolution, sandbox.sprites])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-base-100 text-base-content">
      <TopBar
        name={name}
        onNameChange={setName}
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onOpenExport={() => setExportOpen(true)}
        onHelp={() => setHelpOpen(true)}
        rendering={rendering}
        renderProgress={renderProgress}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Split direction="row" initialSize={560}>
          {/* LEFT: editor (top) + status (bottom) */}
          <Split direction="column" initialSize={380}>
            <CodeEditor code={code} onChange={setCode} />
            <StatusPanel printedText={sandbox.printedText} error={sandbox.error} />
          </Split>

          {/* RIGHT: preview+audio (top) + sprites (bottom) */}
          <Split direction="column" initialSize={420}>
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-hidden p-4">
                <PreviewCanvas sprites={sandbox.sprites} assets={assets} time={time} />
              </div>
              <div className="shrink-0 border-t border-neutral">
                <AudioPlayer music={music} onTimeUpdate={setTime} onSeeked={setTime} />
              </div>
            </div>
            <SpritesPanel
              assets={assets}
              onUpload={handleUploadSprite}
              onUploadMusic={handleUploadMusic}
              onRename={handleRenameSprite}
              onDelete={handleDeleteSprite}
            />
          </Split>
        </Split>
      </div>

      <audio ref={audioRef} src={music ?? undefined} hidden />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onRender={handleRender}
        format={format}
        onFormatChange={setFormat}
        framerate={framerate}
        onFramerateChange={setFramerate}
        resolution={resolution}
        onResolutionChange={setResolution}
        mp4Supported={supportsWebCodecs()}
        webmSupported={supportsMediaRecorder()}
      />
    </div>
  )
}

export default App
