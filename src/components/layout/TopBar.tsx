import type { VideoFormat } from '../../lib/export'

interface TopBarProps {
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onOpenExport: () => void
  onHelp: () => void
  rendering: boolean
  renderProgress?: string | null
  format: VideoFormat
  onFormatChange: (format: VideoFormat) => void
  mp4Supported: boolean
  webmSupported: boolean
}

export function TopBar({
  onNew,
  onOpen,
  onSave,
  onOpenExport,
  onHelp,
  rendering,
  renderProgress,
  format,
  onFormatChange,
  mp4Supported,
  webmSupported,
}: TopBarProps) {
  return (
    <header className="flex items-center gap-1 border-b border-neutral bg-base-200 px-3">
      <span className="mr-3 px-2 py-3 text-lg font-bold">sbJS</span>

      <button className="btn btn-ghost btn-sm" onClick={onNew} disabled={rendering}>
        New
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onOpen} disabled={rendering}>
        Open
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onSave} disabled={rendering}>
        Save
      </button>
      <select
        className="select select-sm select-bordered"
        value={format}
        onChange={(e) => onFormatChange(e.target.value as VideoFormat)}
        disabled={rendering}
        title="Export format"
      >
        <option value="mp4" disabled={!mp4Supported}>
          MP4 {mp4Supported ? '' : '(unavailable)'}
        </option>
        <option value="webm" disabled={!webmSupported}>
          WebM {webmSupported ? '' : '(unavailable)'}
        </option>
      </select>
      <button className="btn btn-ghost btn-sm" onClick={onOpenExport} disabled={rendering}>
        {rendering ? renderProgress ?? 'Rendering…' : 'Render'}
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onHelp}>
        Help
      </button>

      <div className="flex-1" />

      <span className="px-2 text-xs text-base-content/60">© 2026 ionvop</span>
    </header>
  )
}