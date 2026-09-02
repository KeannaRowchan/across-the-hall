import { useEffect, useState } from 'react'

/**
 * Tracks a CSS media query in React state.
 *
 * Used to collapse the filter sidebar on phones: on a narrow screen the tag
 * vocabulary is well over a screenful, so leaving it expanded pushes the actual
 * people off the bottom of the page.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent): void => setMatches(e.matches)
    setMatches(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}
