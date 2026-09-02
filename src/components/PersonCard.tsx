import type { JSX } from 'react'
import { ROLE_LABELS, type Lab, type Person } from '../types'
import { Avatar, CollabBadge, TagRow } from './Bits'

export function PersonCard({
  person,
  lab,
  onOpen
}: {
  person: Person
  lab: Lab | undefined
  onOpen: () => void
}): JSX.Element {
  // Methods and tools are the tags people actually search by, so they lead.
  const headline = [...person.methods, ...person.tools]

  return (
    <button type="button" className="card" onClick={onOpen}>
      <div className="card-head">
        <Avatar name={person.name} />
        <div>
          <h3 className="card-name">{person.name}</h3>
          <div className="card-sub">
            {person.title ?? ROLE_LABELS[person.role]}
            {lab ? ` · ${lab.name}` : ''}
          </div>
        </div>
      </div>
      <p className="card-blurb">{person.blurb}</p>
      <TagRow values={headline} max={5} />
      <CollabBadge status={person.collabStatus} />
    </button>
  )
}
