import type { JSX } from 'react'
import { useMemo, useState } from 'react'
import type { Lab, Person, PersonRole, Project } from '../types'
import {
  EMPTY_FILTERS,
  filterPeople,
  parseTagKey,
  type PeopleFilters,
  type TagKey
} from '../lib/search'
import { useMediaQuery } from '../lib/useMediaQuery'
import { FilterSidebar } from './FilterSidebar'
import { PersonCard } from './PersonCard'
import { PersonPanel } from './PersonPanel'

export function PeopleView({
  people,
  labs,
  projects,
  today,
  focusPersonId,
  onFocusHandled
}: {
  people: Person[]
  labs: Lab[]
  projects: Project[]
  today: Date
  /** Set when another view asks us to open a specific profile. */
  focusPersonId: string | null
  onFocusHandled: () => void
}): JSX.Element {
  const [filters, setFilters] = useState<PeopleFilters>(EMPTY_FILTERS)
  const [openId, setOpenId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Matches the breakpoint where app.css stacks the sidebar above the results.
  const isNarrow = useMediaQuery('(max-width: 860px)')

  const labsById = useMemo(() => new Map(labs.map((lab) => [lab.id, lab])), [labs])

  // A request from another tab wins over whatever was open here.
  const activeId = focusPersonId ?? openId
  const activePerson = activeId ? people.find((p) => p.id === activeId) : undefined

  const closePanel = (): void => {
    setOpenId(null)
    onFocusHandled()
  }

  const visible = useMemo(() => filterPeople(people, labsById, filters), [people, labsById, filters])

  const toggleTag = (key: TagKey): void =>
    setFilters((prev) => {
      const tags = new Set(prev.tags)
      if (!tags.delete(key)) tags.add(key)
      return { ...prev, tags }
    })

  const toggleRole = (role: PersonRole): void =>
    setFilters((prev) => {
      const roles = new Set(prev.roles)
      if (!roles.delete(role)) roles.add(role)
      return { ...prev, roles }
    })


  const activeFilterCount = filters.tags.size + filters.roles.size + (filters.openOnly ? 1 : 0)

  return (
    <>
      <div className="searchbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search people, methods, tools, interests…"
          value={filters.query}
          onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
          aria-label="Search people"
        />
        <label className="toggle">
          <input
            type="checkbox"
            checked={filters.openOnly}
            onChange={(e) => setFilters((prev) => ({ ...prev, openOnly: e.target.checked }))}
          />
          Open to collaborate only
        </label>
      </div>

      {isNarrow && (
        <button
          type="button"
          className="filter-toggle"
          aria-expanded={showFilters}
          onClick={() => setShowFilters((v) => !v)}
        >
          {showFilters ? 'Hide filters' : 'Filters'}
          {activeFilterCount > 0 && <span className="n">{activeFilterCount}</span>}
        </button>
      )}

      <div className="with-sidebar">
        {(!isNarrow || showFilters) && (
          <FilterSidebar
            people={people}
            filters={filters}
            onToggleTag={toggleTag}
            onToggleRole={toggleRole}
          />
        )}

        <div>
          <div className="result-meta">
            <span>
              {visible.length} of {people.length} people
              {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`}
            </span>
            {(activeFilterCount > 0 || filters.query) && (
              <button type="button" className="linkish" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear all
              </button>
            )}
          </div>

          {visible.length === 0 ? (
            <div className="empty">
              <p>
                <strong>Nothing matches that combination.</strong>
              </p>
              <p>
                Selected tags are combined with AND, so asking for several specialised methods at
                once often has no single answer. Try removing one.
              </p>
              {filters.tags.size > 0 && (
                <div className="tag-row" style={{ justifyContent: 'center', marginTop: 12 }}>
                  {[...filters.tags].map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="chip"
                      aria-pressed={true}
                      onClick={() => toggleTag(key)}
                    >
                      {parseTagKey(key).value} ✕
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card-grid">
              {visible.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  lab={person.labId ? labsById.get(person.labId) : undefined}
                  onOpen={() => setOpenId(person.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {activePerson && (
        <PersonPanel
          person={activePerson}
          lab={activePerson.labId ? labsById.get(activePerson.labId) : undefined}
          projects={projects}
          today={today}
          onClose={closePanel}
        />
      )}
    </>
  )
}
