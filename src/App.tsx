import type { JSX } from 'react'

/**
 * Across the Hall — starting from an empty page.
 *
 * Nothing is rendered yet. The pieces built so far are still in the repository
 * and still compile, they are simply not referenced from here:
 *
 *   components/PeopleView.tsx    the searchable directory
 *   components/AsksView.tsx      the time-priced asks board
 *   components/ProjectsView.tsx  the collaboration board
 *   components/LabsView.tsx      labs, members and equipment
 *   data/useDirectory.ts         loads data/ via the repository seam
 *   lib/search.ts                search, filtering and skill matching
 *
 * The full working version is on the `directory-v1` branch if it is ever needed
 * back wholesale. Otherwise, add things here one at a time.
 */
export default function App(): JSX.Element {
  return <></>
}
