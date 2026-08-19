import { RESOLUTIONS, type ExportFramerate, type ResolutionPreset, type VideoFormat } from '../lib/export'

export const FRAMERATES: ExportFramerate[] = [60, 30, 15]

interface ExportModalProps {
  open: boolean
  onClose: () => void
  onRender: () => void
  format: VideoFormat
  onFormatChange: (format: VideoFormat) => void
  framerate: ExportFramerate
  onFramerateChange: (framerate: ExportFramerate) => void
  resolution: ResolutionPreset
  onResolutionChange: (resolution: ResolutionPreset) => void
  mp4Supported: boolean
  webmSupported: boolean
}

/** Dedicated modal for configuring and starting a video export. */
export function ExportModal({
  open,
  onClose,
  onRender,
  format,
  onFormatChange,
  framerate,
  onFramerateChange,
  resolution,
  onResolutionChange,
  mp4Supported,
  webmSupported,
}: ExportModalProps) {
  return (
    <dialog className="modal" open={open ? true : undefined}>
      <div className="modal-box">
        <div className="mb-2 flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold">Export Video</h1>
          <button className="btn btn-circle btn-sm" onClick={onClose} aria-label="Close">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <hr className="mb-4 border-neutral" />

        <div className="space-y-4">
          {/* Format */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Format</span>
            </label>
            <select
              className="select select-bordered"
              value={format}
              onChange={(e) => onFormatChange(e.target.value as VideoFormat)}
              title="Export format"
            >
              <option value="mp4" disabled={!mp4Supported}>
                MP4 {mp4Supported ? '' : '(unavailable)'}
              </option>
              <option value="webm" disabled={!webmSupported}>
                WebM {webmSupported ? '' : '(unavailable)'}
              </option>
            </select>
          </div>

          {/* Framerate */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Framerate</span>
              <span className="label-text-alt">Lower = smaller file, less memory</span>
            </label>
            <select
              className="select select-bordered"
              value={framerate}
              onChange={(e) => onFramerateChange(Number(e.target.value) as ExportFramerate)}
              title="Export framerate"
            >
              {FRAMERATES.map((fps) => (
                <option key={fps} value={fps}>
                  {fps} fps
                </option>
              ))}
            </select>
          </div>

          {/* Resolution */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Resolution</span>
              <span className="label-text-alt">Lower = smaller file, less memory</span>
            </label>
            <select
              className="select select-bordered"
              value={resolution}
              onChange={(e) => onResolutionChange(e.target.value as ResolutionPreset)}
              title="Export resolution"
            >
              {(Object.keys(RESOLUTIONS) as ResolutionPreset[]).map((key) => (
                <option key={key} value={key}>
                  {RESOLUTIONS[key].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-4 text-xs text-base-content/60">
          Choosing a lower resolution and framerate reduces memory usage during export.
        </p>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onRender}>
            Render
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  )
}