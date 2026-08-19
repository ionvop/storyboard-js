interface TopBarProps {
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onOpenExport: () => void
  onHelp: () => void
  rendering: boolean
  renderProgress?: string | null
}

export function TopBar({
  onNew,
  onOpen,
  onSave,
  onOpenExport,
  onHelp,
  rendering,
  renderProgress,
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