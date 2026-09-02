import type { Lab, Person, PersonRole, Project, TagKind } from '../types'

/** A selected filter, encoded as "kind:value" so it fits in a Set<string>. */
export type TagKey = string

export function tagKey(kind: TagKind, value: string): TagKey {
  return `${kind}:${value}`
}

export function parseTagKey(key: TagKey): { kind: TagKind; value: string } {
  const idx = key.indexOf(':')
  return { kind: key.slice(0, idx) as TagKind, value: key.slice(idx + 1) }
}

function tagsOf(person: Person, kind: TagKind): string[] {
  switch (kind) {
    case 'interest':
      return person.interests
    case 'method':
      return person.methods
    case 'tool':
      return person.tools
    case 'population':
      return person.populations
  }
}

export interface PeopleFilters {
  query: string
  tags: Set<TagKey>
  roles: Set<PersonRole>
  openOnly: boolean
}

export const EMPTY_FILTERS: PeopleFilters = {
  query: '',
  tags: new Set(),
  roles: new Set(),
  openOnly: false
}

/**
 * Free-text search across every field someone might plausibly type into the
 * box — including their lab's name, so "memory lab" finds its members.
 */
function matchesQuery(person: Person, lab: Lab | undefined, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    person.name,
    person.title ?? '',
    person.blurb,
    lab?.name ?? '',
    ...person.interests,
    ...person.methods,
    ...person.tools,
    ...person.populations,
    ...person.lookingFor,
    ...person.canHelpWith
  ]
    .join(' ')
    .toLowerCase()
  // Every whitespace-separated term must appear somewhere.
  return q.split(/\s+/).every((term) => haystack.includes(term))
}

export function filterPeople(
  people: Person[],
  labsById: Map<string, Lab>,
  filters: PeopleFilters
): Person[] {
  return people.filter((person) => {
    if (filters.openOnly && person.collabStatus === 'closed') return false
    if (filters.roles.size > 0 && !filters.roles.has(person.role)) return false

    // Selected tags are ANDed: "EEG" + "children 4-8" means both must hold.
    for (const key of filters.tags) {
      const { kind, value } = parseTagKey(key)
      if (!tagsOf(person, kind).includes(value)) return false
    }

    return matchesQuery(person, person.labId ? labsById.get(person.labId) : undefined, filters.query)
  })
}

export interface TagCount {
  value: string
  count: number
}

/** Tag vocabulary for one kind, ordered by how many people claim it. */
export function tagVocabulary(people: Person[], kind: TagKind): TagCount[] {
  const counts = new Map<string, number>()
  for (const person of people) {
    for (const value of tagsOf(person, kind)) {
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

/**
 * Words too common to signal a shared skill. Without these, "help with stats"
 * and "help with recruitment" would match each other on "help" and "with".
 */
const STOPWORDS = new Set([
  'a', 'an', 'and', 'any', 'for', 'from', 'help', 'in', 'more', 'my', 'of', 'on',
  'or', 'our', 'some', 'the', 'to', 'use', 'using', 'with'
])

/**
 * Split a skill phrase into comparable words. Matching on whole words rather than
 * raw substrings matters more than it looks: a plain `includes` check lets a
 * person whose only tool is "R" match a need for "MEG hardware expertise", on the
 * strength of the "r" in "hardware".
 *
 * `+` survives the split so names like "C++" stay intact.
 */
function skillTokens(phrase: string): Set<string> {
  return new Set(
    phrase
      .toLowerCase()
      .split(/[^a-z0-9+]+/)
      .filter((token) => token.length > 0 && !STOPWORDS.has(token))
  )
}

function shareAToken(a: Set<string>, b: Set<string>): boolean {
  for (const token of a) {
    if (b.has(token)) return true
  }
  return false
}

/**
 * The reason this app exists: given a project's stated needs, who in the
 * department has those methods or tools? Matches on method and tool tags plus
 * whatever people volunteered under canHelpWith.
 *
 * People outside the project's own lab are ranked first — a suggestion to talk to
 * your own supervisor is not what a de-siloing tool is for.
 */
export function suggestHelpers(project: Project, people: Person[]): Person[] {
  if (project.needs.length === 0) return []
  const needTokens = project.needs.map(skillTokens)

  const scored = people
    .filter((p) => p.id !== project.leadId && p.collabStatus !== 'closed')
    .map((person) => {
      // Populations count as an offer: whoever already tests infants is exactly
      // who a project needing "infant testing experience" should talk to.
      const offerTokens = [
        ...person.methods,
        ...person.tools,
        ...person.populations,
        ...person.canHelpWith
      ].map(skillTokens)

      const met = needTokens.filter((need) =>
        offerTokens.some((offer) => shareAToken(need, offer))
      ).length

      // Cross-lab is a thumb on the scale, not an override. Ranking it above
      // match quality would bury the best-qualified person for the sake of
      // novelty — and someone who meets two needs beats a stranger meeting one.
      const crossLabBonus = (project.labId ? person.labId !== project.labId : true) ? 0.5 : 0
      return { person, score: met + crossLabBonus }
    })
    // A bare cross-lab bonus is not a match, so require a real met need.
    .filter((entry) => entry.score >= 1)
    .sort((a, b) => b.score - a.score || a.person.name.localeCompare(b.person.name))

  return scored.slice(0, 4).map((entry) => entry.person)
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

/**
 * Parse a plain "YYYY-MM-DD" as a local date.
 *
 * `new Date('2026-08-18')` is specified to parse as UTC midnight, so rendering it
 * with toLocaleDateString anywhere west of UTC prints the previous day. Every
 * date in our data files is date-only, so all of them must be built from parts.
 */
export function parseLocalDate(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) {
    const loose = new Date(isoDate)
    return Number.isNaN(loose.getTime()) ? null : loose
  }
  const [, y, m, d] = match
  return new Date(Number(y), Number(m) - 1, Number(d))
}

/**
 * Whole days from `isoDate` until `today`; negative if the date is in the future.
 *
 * `today` is flattened to local midnight first. Comparing a date-only value
 * against a timestamp would otherwise count the elapsed part of today, making a
 * countdown read one day short and shift as the afternoon wears on.
 */
export function daysSince(isoDate: string, today: Date): number | null {
  const then = parseLocalDate(isoDate)
  if (!then) return null
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((midnight.getTime() - then.getTime()) / 86_400_000)
}

/** Profiles rot. Anything older than this gets a visible nudge. */
const STALE_AFTER_DAYS = 180

export function isStale(isoDate: string, today: Date): boolean {
  const days = daysSince(isoDate, today)
  return days === null ? false : days > STALE_AFTER_DAYS
}

export function formatDate(isoDate: string): string {
  const d = parseLocalDate(isoDate)
  if (!d) return isoDate
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
