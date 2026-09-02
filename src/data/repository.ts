/**
 * The one seam between the UI and where data lives.
 *
 * Right now the department's data is three JSON files under /data, bundled into
 * the site at build time. That keeps the app fully static — no server, no
 * database — and makes every change to a profile a reviewable diff.
 *
 * Every component reads through this interface, so swapping in a real API later
 * means writing one new implementation here and touching no components.
 */

import type { Ask, Lab, Person, Project } from '../types'

/**
 * Each record is its own file under data/<collection>/.
 *
 * One file per record rather than one array per collection: the CMS can then
 * present a list you click into instead of one enormous form, and two people
 * editing different profiles never touch the same file, so their commits cannot
 * conflict. Vite inlines all of these at build time, so the site stays static.
 */
const glob = <T,>(modules: Record<string, unknown>): T[] =>
  Object.entries(modules)
    // Sort by path so the bundle order is deterministic across builds.
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value as T)

const peopleModules = import.meta.glob('../../data/people/*.json', {
  eager: true,
  import: 'default'
})
const labsModules = import.meta.glob('../../data/labs/*.json', {
  eager: true,
  import: 'default'
})
const projectsModules = import.meta.glob('../../data/projects/*.json', {
  eager: true,
  import: 'default'
})
const asksModules = import.meta.glob('../../data/asks/*.json', {
  eager: true,
  import: 'default'
})

export interface DirectorySnapshot {
  people: Person[]
  labs: Lab[]
  projects: Project[]
  asks: Ask[]
  /** Non-fatal data problems worth showing a contributor. */
  warnings: string[]
}

export interface DirectoryRepository {
  readonly sourceLabel: string
  load(): Promise<DirectorySnapshot>
}

/**
 * JSON files are hand-edited by contributors, so we normalise rather than trust.
 * Optional list fields may be omitted entirely; we fill them with empty arrays
 * so no component has to write `person.tools ?? []`.
 */
function normalisePerson(raw: Record<string, unknown>): Person {
  return {
    ...(raw as unknown as Person),
    interests: (raw.interests as string[]) ?? [],
    methods: (raw.methods as string[]) ?? [],
    tools: (raw.tools as string[]) ?? [],
    populations: (raw.populations as string[]) ?? [],
    lookingFor: (raw.lookingFor as string[]) ?? [],
    canHelpWith: (raw.canHelpWith as string[]) ?? [],
    links: (raw.links as Person['links']) ?? []
  }
}

function normaliseLab(raw: Record<string, unknown>): Lab {
  return {
    ...(raw as unknown as Lab),
    themes: (raw.themes as string[]) ?? [],
    methods: (raw.methods as string[]) ?? [],
    equipment: (raw.equipment as string[]) ?? []
  }
}

function normaliseAsk(raw: Record<string, unknown>): Ask {
  return {
    ...(raw as unknown as Ask),
    needs: (raw.needs as string[]) ?? []
  }
}

function normaliseProject(raw: Record<string, unknown>): Project {
  return {
    ...(raw as unknown as Project),
    needs: (raw.needs as string[]) ?? [],
    themes: (raw.themes as string[]) ?? [],
    seekingCollaborators: Boolean(raw.seekingCollaborators)
  }
}

/**
 * Cross-file reference checks. `npm run validate` fails the build on these, but
 * we also check at runtime so a broken fork shows a message instead of a blank
 * page or a crash.
 */
function collectWarnings(
  people: Person[],
  labs: Lab[],
  projects: Project[],
  asks: Ask[]
): string[] {
  const warnings: string[] = []
  const personIds = new Set(people.map((p) => p.id))
  const labIds = new Set(labs.map((l) => l.id))

  for (const person of people) {
    if (person.labId && !labIds.has(person.labId)) {
      warnings.push(`${person.name} lists unknown lab "${person.labId}"`)
    }
  }
  for (const lab of labs) {
    if (!personIds.has(lab.piId)) {
      warnings.push(`${lab.name} lists unknown PI "${lab.piId}"`)
    }
  }
  for (const project of projects) {
    if (!personIds.has(project.leadId)) {
      warnings.push(`Project "${project.title}" lists unknown lead "${project.leadId}"`)
    }
    if (project.labId && !labIds.has(project.labId)) {
      warnings.push(`Project "${project.title}" lists unknown lab "${project.labId}"`)
    }
  }
  for (const ask of asks) {
    if (!personIds.has(ask.askerId)) {
      warnings.push(`Ask "${ask.title}" lists unknown asker "${ask.askerId}"`)
    }
    if (ask.answeredById && !personIds.has(ask.answeredById)) {
      warnings.push(`Ask "${ask.title}" credits unknown helper "${ask.answeredById}"`)
    }
  }
  return warnings
}

/** Reads the JSON files bundled from /data. */
export const jsonRepository: DirectoryRepository = {
  sourceLabel: 'data/ (one file per record)',
  async load() {
    const people = glob<Record<string, unknown>>(peopleModules).map(normalisePerson)
    const labs = glob<Record<string, unknown>>(labsModules).map(normaliseLab)
    const projects = glob<Record<string, unknown>>(projectsModules).map(normaliseProject)
    const asks = glob<Record<string, unknown>>(asksModules).map(normaliseAsk)

    people.sort((a, b) => a.name.localeCompare(b.name))
    labs.sort((a, b) => a.name.localeCompare(b.name))

    return { people, labs, projects, asks, warnings: collectWarnings(people, labs, projects, asks) }
  }
}

/** Swap this to change the whole app's data source. */
export const repository: DirectoryRepository = jsonRepository
