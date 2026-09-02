import type { JSX } from 'react'
import { useMemo } from 'react'
import { ROLE_LABELS, type Lab, type Person } from '../types'
import { TagRow } from './Bits'

export function LabsView({
  labs,
  people,
  onOpenPerson
}: {
  labs: Lab[]
  people: Person[]
  onOpenPerson: (personId: string) => void
}): JSX.Element {
  const membersByLab = useMemo(() => {
    const map = new Map<string, Person[]>()
    for (const person of people) {
      if (!person.labId) continue
      const list = map.get(person.labId)
      if (list) list.push(person)
      else map.set(person.labId, [person])
    }
    return map
  }, [people])

  const unaffiliated = people.filter((p) => !p.labId)

  return (
    <div className="card-grid">
      {labs.map((lab) => {
        const pi = people.find((p) => p.id === lab.piId)
        const members = (membersByLab.get(lab.id) ?? []).filter((p) => p.id !== lab.piId)

        return (
          <article className="lab-card" key={lab.id}>
            <h3>{lab.name}</h3>
            <div className="card-sub">
              {pi ? (
                <>
                  PI:{' '}
                  <button type="button" className="linkish" onClick={() => onOpenPerson(pi.id)}>
                    {pi.name}
                  </button>
                </>
              ) : (
                'PI not listed'
              )}
              {lab.location ? ` · ${lab.location}` : ''}
            </div>
            <p className="lab-focus">{lab.focus}</p>

            <div className="lab-meta">
              {lab.methods.length > 0 && (
                <div className="lab-meta-row">
                  <span className="label">Methods</span>
                  <TagRow values={lab.methods} />
                </div>
              )}
              {lab.equipment.length > 0 && (
                <div className="lab-meta-row">
                  <span className="label">Equipment & resources</span>
                  <TagRow values={lab.equipment} />
                </div>
              )}
              {members.length > 0 && (
                <div className="lab-meta-row">
                  <span className="label">Members ({members.length})</span>
                  <div className="members">
                    {members.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        className="chip"
                        onClick={() => onOpenPerson(person.id)}
                      >
                        {person.name}
                        <span className="n">{ROLE_LABELS[person.role]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {lab.website && (
                <div className="lab-meta-row">
                  <a href={lab.website} target="_blank" rel="noreferrer noopener">
                    Lab website
                  </a>
                </div>
              )}
            </div>
          </article>
        )
      })}

      {unaffiliated.length > 0 && (
        <article className="lab-card">
          <h3>Not attached to a lab</h3>
          <p className="lab-focus">
            Core staff and affiliates who work across the department rather than in one lab.
          </p>
          <div className="lab-meta">
            <div className="lab-meta-row">
              <div className="members">
                {unaffiliated.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    className="chip"
                    onClick={() => onOpenPerson(person.id)}
                  >
                    {person.name}
                    <span className="n">{ROLE_LABELS[person.role]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </article>
      )}
    </div>
  )
}
