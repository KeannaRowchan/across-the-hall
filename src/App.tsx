import type { JSX } from 'react'
import { useState } from 'react'
import { Hallway } from './components/Hallway'
import { Directory } from './components/Directory'

type View = 'hall' | 'directory'

export default function App(): JSX.Element {
  const [view, setView] = useState<View>('hall')

  return view === 'hall' ? (
    <Hallway onEnter={() => setView('directory')} />
  ) : (
    <Directory onBackToHall={() => setView('hall')} />
  )
}
