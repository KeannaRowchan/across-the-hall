import { useEffect, useState } from 'react'
import { repository, type DirectorySnapshot } from './repository'

interface DirectoryState {
  data: DirectorySnapshot | null
  error: string | null
  loading: boolean
}

/** Loads the directory once on mount. */
export function useDirectory(): DirectoryState {
  const [state, setState] = useState<DirectoryState>({
    data: null,
    error: null,
    loading: true
  })

  useEffect(() => {
    let cancelled = false
    repository
      .load()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            error: err instanceof Error ? err.message : 'Failed to load directory',
            loading: false
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
