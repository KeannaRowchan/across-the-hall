import type { JSX } from 'react'
import { useEffect } from 'react'
import { ROLE_LABELS, type Lab, type Person, type Project } from '../types'
import { formatDate, isStale } from '../lib/search'
import { Avatar, CollabBadge, ListSection, Section, TagRow } from './Bits'

export function PersonPanel({
  person,
  lab,
  projects,
  today,
  onClose
}: {
  person: Person
  lab: Lab | undefined
  projects: Project[]
  today: Date
  onClose: () => void
}): JSX.Element {
  // Escape should close the panel — expected of anything modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Stop the page scrolling behind the panel, and put it back on close.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const theirProjects = projects.filter((p) => p.leadId === person.id)
  const stale = isStale(person.updatedAt, today)

  return (
    <div
      className="overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-label={person.name}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-top">
          <div style={{ display: 'flex', gap: 12 }}>
            <Avatar name={person.name} />
            <div>
              <h2>
                {person.name}
                {person.pronouns ? (
                  <span className="panel-sub" style={{ marginLeft: 8, display: 'inline' }}>
                    ({person.pronouns})
                  </span>
                ) : null}
              </h2>
              <div className="panel-sub">
                {person.title ?? ROLE_LABELS[person.role]}
                {lab ? ` · ${lab.name}` : ''}
              </div>
            </div>
          </div>
          <button type="button" className="close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <CollabBadge status={person.collabStatus} />

        <Section title="About">
          <p>{person.blurb}</p>
        </Section>

        {person.methods.length > 0 && (
          <Section title="Methods">
            <TagRow values={person.methods} />
          </Section>
        )}
        {person.tools.length > 0 && (
          <Section title="Tools & analysis">
            <TagRow values={person.tools} />
          </Section>
        )}
        {person.interests.length > 0 && (
          <Section title="Research interests">
            <TagRow values={person.interests} />
          </Section>
        )}
        {person.populations.length > 0 && (
          <Section title="Populations">
            <TagRow values={person.populations} />
          </Section>
        )}

        {person.capacity && (
          <Section title="Time they have">
            <div className="capacity">
              {person.capacity.note}
              {person.capacity.freeFrom && (
                <span className="from">Not before {formatDate(person.capacity.freeFrom)}</span>
              )}
            </div>
          </Section>
        )}

        <ListSection title="Can help with" items={person.canHelpWith} />
        <ListSection title="Looking for" items={person.lookingFor} />

        {theirProjects.length > 0 && (
          <Section title="Leading">
            <ul>
              {theirProjects.map((project) => (
                <li key={project.id}>
                  {project.title}
                  {project.seekingCollaborators ? ' — seeking collaborators' : ''}
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Contact">
          {person.email ? (
            <p>
              <a href={`mailto:${person.email}`}>{person.email}</a>
            </p>
          ) : (
            <p className="card-sub">No email listed.</p>
          )}
          {lab?.location && <p className="card-sub">{lab.location}</p>}
          {person.links.map((link) => (
            <p key={link.url}>
              <a href={link.url} target="_blank" rel="noreferrer noopener">
                {link.label}
              </a>
            </p>
          ))}
        </Section>

        <Section title="Profile updated">
          <p className="card-sub">
            {formatDate(person.updatedAt)}
            {stale && <span className="stale"> · may be out of date</span>}
          </p>
        </Section>
      </div>
    </div>
  )
}
