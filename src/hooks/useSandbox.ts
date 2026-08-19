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
 * Spawns a sandbox Web Worker that evaluates the user's script and exposes
 * the resulting sprite definitions / status output.
 */
export function useSandbox() {
  const [state, setState] = useState<SandboxState>(initialState)
  const workerRef = useRef<Worker | null>(null)
  const latestStateRef = useRef<SandboxState>(initialState)

  const updateState = (patch: Partial<SandboxState>) => {
    latestStateRef.current = { ...latestStateRef.current, ...patch }
    setState(latestStateRef.current)
  }

  useEffect(() => {
    const worker = new Worker(new URL('../worker/sandbox.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker

    worker.onmessage = (e: MessageEvent<SandboxMessage>) => {
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
      updateState({ status: 'error', error: e.message || 'Worker error' })
    }

    return () => {
      worker.terminate()
      workerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Post the current code to the sandbox and rebuild the scene. */
  const runCode = useMemo(
    () => (code: string) => {
      workerRef.current?.postMessage({ code })
      updateState({ status: 'running' })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return { ...state, runCode }
}