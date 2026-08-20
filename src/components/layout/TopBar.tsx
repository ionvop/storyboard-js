interface TopBarProps {
  name: string
  onNameChange: (value: string) => void
  onNew: () => void
  onOpen: () => void
  onSave: () => void
  onOpenExport: () => void
  onHelp: () => void
  rendering: boolean
  renderProgress?: string | null
}

export function TopBar({
  name,
  onNameChange,
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

      <input
        className="input input-sm input-bordered w-48 min-w-0 text-sm"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Project name"
        aria-label="Project name"
        disabled={rendering}
      />

      <span className="px-2 text-xs text-base-content/60">© 2026 ionvop</span>
    </header>
  )
}