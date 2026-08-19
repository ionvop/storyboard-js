interface HelpModalProps {
  open: boolean
  onClose: () => void
}

/** In-app version of `old/help.html` rendered in a DaisyUI modal dialog. */
export function HelpModal({ open, onClose }: HelpModalProps) {
  return (
    <dialog id="help-modal" className="modal" open={open ? true : undefined}>
      <div className="modal-box max-w-3xl">
        <div className="mb-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">sbJS User Manual</h1>
            <p className="text-sm text-base-content/60">© 2026 ionvop</p>
          </div>
          <button className="btn btn-circle btn-sm" onClick={onClose}>
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

        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-2 text-sm">
          <HelpSection title="1. Overview">
            <p>
              <strong>sbJS</strong> is a browser-based tool for creating sprite-based animations
              synchronized to music, using JavaScript code.
            </p>
            <ul className="list-disc space-y-1 ps-5">
              <li>Upload a <strong>music track</strong>.</li>
              <li>Upload one or more <strong>sprite images</strong>.</li>
              <li>Write a <strong>script</strong> that animates those sprites over time.</li>
              <li>Preview the animation in real time.</li>
              <li>
                Export <strong>project files</strong> (<code>.dat</code>) you can reopen later, or{' '}
                <strong>video data</strong> (<code>.dat</code>) for an external encoder.
              </li>
            </ul>
          </HelpSection>

          <HelpSection title="2. Interface Overview">
            <p>
              A top bar holds <strong>sbJS</strong> plus <strong>New</strong> / <strong>Open</strong>{' '}
              / <strong>Save</strong> / <strong>Render</strong> / <strong>Help</strong>. Below it, a
              resizable 3-column layout:
            </p>
            <ul className="list-disc space-y-1 ps-5">
              <li>
                <strong>Left:</strong> the JavaScript code editor over the status console.
              </li>
              <li>
                <strong>Right:</strong> preview canvas, audio player, and sprite list.
              </li>
            </ul>
          </HelpSection>

          <HelpSection title="3. Writing Scripts">
            <p>Scripts are evaluated in a sandboxed worker, given two globals:</p>
            <ul className="list-disc space-y-1 ps-5">
              <li>
                <code>Sprite(name)</code> — creates an animated sprite. Name must match an uploaded
                sprite (case-sensitive).
              </li>
              <li>
                <code>print(text)</code> — logs to the status panel.
              </li>
            </ul>
            <p>Animation methods (all take <code>startTime</code> in seconds, synced to the music):</p>
            <ul className="list-disc space-y-1 ps-5">
              <li><code>moveX</code>, <code>moveY</code> — position (0 = edge, 1 = opposite edge).</li>
              <li><code>scale</code>, <code>scaleX</code>, <code>scaleY</code> — multipliers.</li>
              <li><code>rotate</code> — angle in radians.</li>
              <li><code>fade</code> — alpha (0–1).</li>
              <li><code>additive</code> — additive blending on/off (0 or 1).</li>
            </ul>
            <p>
              Each takes <code>(startTime, targetValue, duration = 0, easing = "linear")</code>.
              Easings: <code>linear</code>, <code>easeIn</code>, <code>easeOut</code>,{' '}
              <code>easeInOut</code>. A <code>duration</code> of 0 snaps instantly.
            </p>
            <p>
              <code>sample(time)</code> — returns the sprite's resolved properties at a given time
              (in seconds), exactly matching what is rendered on the canvas. Useful for reading
              back a value, e.g. <code>print(sprite.sample(2.5).x)</code>.
            </p>
          </HelpSection>

          <HelpSection title="4. Example">
            <pre className="overflow-x-auto rounded-lg bg-base-300 p-3 font-mono text-xs">
{`const logo = new Sprite("logo");

logo.moveX(0, 0.0);                   // left edge at t=0
logo.moveX(0, 1.0, 5, "easeInOut");   // slide to right over 5s
logo.fade(0, 0.0);
logo.fade(0, 1.0, 2, "easeOut");      // fade in
logo.rotate(4, 0);
logo.rotate(4, Math.PI * 2, 4);       // spin 360°

print(logo.sample(2.5).x);            // read back x at t=2.5`}
            </pre>
          </HelpSection>

          <HelpSection title="5. Project Files">
            <ul className="list-disc space-y-1 ps-5">
              <li>
                <strong>Save</strong> — base64-encodes <code>{'{ music, sprites, code }'}</code> into
                a file named <code>sbJS_Project_&lt;timestamp&gt;.dat</code>.
              </li>
              <li>
                <strong>Open</strong> — loads a previously saved <code>.dat</code> project.
              </li>
              <li>
                <strong>Render</strong> — exports every frame (60 fps) of the track plus audio into{' '}
                <code>sbJS_Video_&lt;timestamp&gt;.dat</code> for an external encoder.
              </li>
            </ul>
          </HelpSection>

          <HelpSection title="6. Tips & Limitations">
            <ul className="list-disc space-y-1 ps-5">
              <li>Keep <code>Sprite("name")</code> strings matching the sprite panel names.</li>
              <li>Later events override earlier ones for the same property.</li>
              <li><code>sample(time)</code> returns the same values the renderer uses.</li>
              <li>Rendering long tracks can produce very large files.</li>
              <li>Everything runs client-side; there is no undo — use Save often.</li>
            </ul>
          </HelpSection>
        </div>

        <div className="modal-action">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  )
}

function HelpSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}