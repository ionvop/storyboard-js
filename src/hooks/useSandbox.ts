import { useEffect, useMemo, useRef, useState } from 'react'
import type { SandboxMessage, SpriteDef } from '../lib/types'

export interface SandboxState {
  status: 'idle' | 'running' | 'error'
  error: string | null
  printedText: string
  sprites: SpriteDef[]
}

const initialState: SandboxState = {
  status: 'idle',
  error: null,
  printedText: '',
  sprites: [],
}

/**
 * How long a worker may stay pending (posted code but no response) before it
 * is considered hung and killed. Dev-configurable: raise this if fast typing
 * on large projects triggers false positives.
 */
const HUNG_TIMEOUT_MS = 1000

/**
 * Spawns a sandbox Web Worker that evaluates the user's script and exposes
 * the resulting sprite definitions / status output.
 */
export function useSandbox() {
  const [state, setState] = useState<SandboxState>(initialState)
  const workerRef = useRef<Worker | null>(null)
  const latestStateRef = useRef<SandboxState>(initialState)
  /** True while a worker has been posted code but has not yet responded. */
  const pendingRef = useRef(false)
  /** Timestamp (ms) when the current worker was marked pending. */
  const pendingSinceRef = useRef(0)

  const updateState = (patch: Partial<SandboxState>) => {
    latestStateRef.current = { ...latestStateRef.current, ...patch }
    setState(latestStateRef.current)
  }

  /** Spawn a fresh sandbox worker and wire up its message handlers. */
  const spawnWorker = () => {
    const worker = new Worker(new URL('../worker/sandbox.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker

    worker.onmessage = (e: MessageEvent<SandboxMessage>) => {
      pendingRef.current = false
      pendingSinceRef.current = 0
      if (e.data.type === 'success') {
        updateState({
          status: 'idle',
          error: null,
          printedText: e.data.printedText,
          sprites: e.data.sprites,
        })
      } else {
        updateState({ status: 'error', error: e.data.message })
      }
    }

    worker.onerror = (e) => {
      pendingRef.current = false
      pendingSinceRef.current = 0
      updateState({ status: 'error', error: e.message || 'Worker error' })
    }
  }

  // Terminate any leftover worker when the component unmounts.
  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  /**
   * Post the current code to the sandbox and rebuild the scene.
   *
   * Each run kills the previous worker first so the latest code always wins.
   * If the previous worker never responded (e.g. it was stuck in an infinite
   * loop), it is treated as hung: we terminate it and surface an error.
   */
  const runCode = useMemo(
    () => (code: string) => {
      const previous = workerRef.current
      if (previous) {
        const wasHung =
          pendingRef.current && Date.now() - pendingSinceRef.current >= HUNG_TIMEOUT_MS
        previous.terminate()
        workerRef.current = null
        if (wasHung) {
          updateState({
            status: 'error',
            error: 'Previous script was interrupted (possible infinite loop).',
          })
        }
      }

      spawnWorker()
      pendingRef.current = true
      pendingSinceRef.current = Date.now()
      workerRef.current?.postMessage({ code })
      updateState({ status: 'running' })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return { ...state, runCode }
}