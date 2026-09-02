import type { JSX } from 'react'
import { useMemo, useState } from 'react'
import { STAGE_LABELS, type Lab, type Person, type Project } from '../types'
import { formatDate, initialsOf, suggestHelpers } from '../lib/search'
import { Tag, TagRow } from './Bits'

/**
 * The collaboration board. This is the view that does the actual de-siloing:
 * for every project asking for help, it names people in the department whose
 * listed skills match what the project says it needs.
 */
export function ProjectsView({
  projects,
  people,
  labs,
  onOpenPerson
}: {
  projects: Project[]
  people: Person[]
  labs: Lab[]
  onOpenPerson: (personId: string) => void
}): JSX.Element {
  const [seekingOnly, setSeekingOnly] = useState(true)
  const [query, setQuery] = useState('')

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])
  const labsById = useMemo(() => new Map(labs.map((l) => [l.id, l])), [labs])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects
      .filter((project) => (seekingOnly ? project.seekingCollaborators : true))
      .filter((project) => {
        if (!q) return true
        const lead = peopleById.get(project.leadId)
        const haystack = [
          project.title,
          project.summary,
          lead?.name ?? '',
          ...project.needs,
          ...project.themes
        ]
          .join(' ')
          .toLowerCase()
        return q.split(/\s+/).every((term) => haystack.includes(term))
      })
      // Most recently updated first — a stale board stops being read.
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [projects, peopleById, seekingOnly, query])

  const seekingCount = projects.filter((p) => p.seekingCollaborators).length

  return (
    <>
      <div className="searchbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search projects, needs, themes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search projects"
        />
        <label className="toggle">
          <input
            type="checkbox"
            checked={seekingOnly}
            onChange={(e) => setSeekingOnly(e.target.checked)}
          />
          Seeking collaborators only ({seekingCount})
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <p>
            <strong>No projects match.</strong>
          </p>
          <p>Try clearing the search, or untick “seeking collaborators only”.</p>
        </div>
      ) : (
        <div className="project-list">
          {visible.map((project) => {
            const lead = peopleById.get(project.leadId)
            const lab = project.labId ? labsById.get(project.labId) : undefined
            const helpers = suggestHelpers(project, people)

            return (
              <article
                key={project.id}
                className={`project-card${project.seekingCollaborators ? ' seeking' : ''}`}
              >
                <div className="project-head">
                  <div>
                    <h3>{project.title}</h3>
                    <div className="card-sub">
                      {lead ? (
                        <button
                          type="button"
                          className="linkish"
                          onClick={() => onOpenPerson(project.leadId)}
                        >
                          {lead.name}
                        </button>
                      ) : (
                        'Unknown lead'
                      )}
                      {lab ? ` · ${lab.name}` : ''} · updated {formatDate(project.updatedAt)}
                    </div>
                  </div>
                  <span className="stage">{STAGE_LABELS[project.stage]}</span>
                </div>

                <p className="project-summary">{project.summary}</p>

                {project.themes.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <TagRow values={project.themes} />
                  </div>
                )}

                {project.seekingCollaborators && project.needs.length > 0 && (
                  <div className="needs">
                    <h5>Looking for</h5>
                    <div className="tag-row">
                      {project.needs.map((need) => (
                        <Tag key={need}>{need}</Tag>
                      ))}
                    </div>

                    {helpers.length > 0 && (
                      <div className="suggest">
                        <h5>Who in the department might help</h5>
                        <div className="suggest-people">
                          {helpers.map((person) => (
                            <button
                              key={person.id}
                              type="button"
                              className="suggest-btn"
                              onClick={() => onOpenPerson(person.id)}
                            >
                              <span className="mini" aria-hidden="true">
                                {initialsOf(person.name)}
                              </span>
                              {person.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
