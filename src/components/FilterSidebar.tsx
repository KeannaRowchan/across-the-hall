import type { JSX } from 'react'
import { ROLE_LABELS, TAG_KIND_LABELS, type Person, type PersonRole, type TagKind } from '../types'
import { tagKey, tagVocabulary, type PeopleFilters, type TagKey } from '../lib/search'

const TAG_KINDS: TagKind[] = ['method', 'tool', 'interest', 'population']
const ROLE_ORDER: PersonRole[] = [
  'faculty',
  'postdoc',
  'phd',
  'masters',
  'undergraduate',
  'research-staff',
  'affiliate'
]

/**
 * Tag counts come from the *unfiltered* people list on purpose: if they shrank as
 * you selected, you could never tell whether a combination has no matches or the
 * option simply vanished.
 */
export function FilterSidebar({
  people,
  filters,
  onToggleTag,
  onToggleRole
}: {
  people: Person[]
  filters: PeopleFilters
  onToggleTag: (key: TagKey) => void
  onToggleRole: (role: PersonRole) => void
}): JSX.Element {
  const rolesPresent = ROLE_ORDER.filter((role) => people.some((p) => p.role === role))

  return (
    <aside className="sidebar">
      <div className="filter-group">
        <h3>Role</h3>
        <div className="filter-list">
          {rolesPresent.map((role) => (
            <button
              key={role}
              type="button"
              className="chip"
              aria-pressed={filters.roles.has(role)}
              onClick={() => onToggleRole(role)}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      </div>

      {TAG_KINDS.map((kind) => {
        const vocab = tagVocabulary(people, kind)
        if (vocab.length === 0) return null
        return (
          <div className="filter-group" key={kind}>
            <h3>{TAG_KIND_LABELS[kind]}</h3>
            <div className="filter-list">
              {vocab.map(({ value, count }) => {
                const key = tagKey(kind, value)
                return (
                  <button
                    key={key}
                    type="button"
                    className="chip"
                    aria-pressed={filters.tags.has(key)}
                    onClick={() => onToggleTag(key)}
                  >
                    {value}
                    <span className="n">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </aside>
  )
}
