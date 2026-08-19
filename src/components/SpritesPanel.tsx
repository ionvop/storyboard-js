import type { SpriteAsset } from '../lib/types'

interface SpritesPanelProps {
  assets: SpriteAsset[]
  onUpload: () => void
  onUploadMusic: () => void
  onRename: (index: number, name: string) => void
  onDelete: (index: number) => void
}

export function SpritesPanel({ assets, onUpload, onUploadMusic, onRename, onDelete }: SpritesPanelProps) {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Vertical toolbar */}
      <div className="flex w-14 shrink-0 flex-col border-r border-neutral">
        <button
          className="flex flex-1 items-center justify-center border-b border-neutral text-base-content/70 transition-colors hover:bg-base-200"
          title="Set track"
          onClick={onUploadMusic}
        >
          <MusicIcon />
        </button>
        <button
          className="flex flex-1 items-center justify-center border-b border-neutral text-base-content/70 transition-colors hover:bg-base-200"
          title="Upload new sprite"
          onClick={onUpload}
        >
          <ImageIcon />
        </button>
      </div>

      {/* Sprite list */}
      <div className="flex-1 overflow-y-auto">
        {assets.length === 0 ? (
          <p className="p-4 text-sm text-base-content/50">
            No sprites yet. Use the image button to upload one.
          </p>
        ) : (
          assets.map((asset, index) => (
            <div
              key={`${asset.name}-${index}`}
              className="flex items-center border-b border-neutral"
            >
              <div className="w-12 shrink-0 p-1.5">
                <img
                  src={asset.data}
                  alt={asset.name}
                  className="h-12 w-12 object-contain"
                />
              </div>
              <div className="min-w-0 flex-1 px-1">
                <input
                  className="w-full border-0 border-b border-neutral bg-transparent py-2 text-sm text-base-content outline-none focus:border-primary"
                  value={asset.name}
                  onChange={(e) => onRename(index, e.target.value)}
                />
              </div>
              <button
                className="flex shrink-0 items-center justify-center p-4 text-base-content/70 hover:text-error"
                title="Delete sprite"
                onClick={() => onDelete(index)}
              >
                <TrashIcon />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function MusicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
      <path d="M127-167q-47-47-47-113t47-113q47-47 113-47 23 0 42.5 5.5T320-418v-308q0-15 9.5-26.5T353-766l400-66q18-3 32.5 8.5T800-793v433q0 66-47 113t-113 47q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T720-498v-165l-320 63v320q0 66-47 113t-113 47q-66 0-113-47Z" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm80-160h400q12 0 18-11t-2-21l-110-147q-6-8-16-8t-16 8L450-320l-74-99q-6-8-16-8t-16 8l-80 107q-8 10-2 21t18 11Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
      <path d="M280-120q-33 0-56.5-23.5T200-200v-520q-17 0-28.5-11.5T160-760q0-17 11.5-28.5T200-800h160q0-17 11.5-28.5T400-840h160q17 0 28.5 11.5T600-800h160q17 0 28.5 11.5T800-760q0 17-11.5 28.5T760-720v520q0 33-23.5 56.5T680-120H280Zm148.5-120Q440-303 440-320v-280q0-17-11.5-28.5T400-640q-17 0-28.5 11.5T360-600v280q0 17 11.5 28.5T400-280q17 0 28.5-11.5Zm160 0Q600-303 600-320v-280q0-17-11.5-28.5T560-640q-17 0-28.5 11.5T520-600v280q0 17 11.5 28.5T560-280q17 0 28.5-11.5Z" />
    </svg>
  )
}