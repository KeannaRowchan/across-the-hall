/**
 * Core data model for Across the Hall.
 *
 * Lives in src/shared so both the Electron main process and the React UI
 * can import the same definitions — one source of truth for the schema.
 */

export type PersonRole =
  | 'undergraduate'
  | 'masters'
  | 'phd'
  | 'postdoc'
  | 'faculty'
  | 'research-staff'
  | 'affiliate'

export const ROLE_LABELS: Record<PersonRole, string> = {
  undergraduate: 'Undergraduate',
  masters: "Master's",
  phd: 'PhD',
  postdoc: 'Postdoc',
  faculty: 'Faculty',
  'research-staff': 'Research staff',
  affiliate: 'Affiliate'
}

/** How receptive someone currently is to being approached about new work. */
export type CollabStatus = 'open' | 'selective' | 'closed'

export const COLLAB_LABELS: Record<CollabStatus, string> = {
  open: 'Open to collaborate',
  selective: 'Selectively open',
  closed: 'Not looking right now'
}

export interface Person {
  id: string
  name: string
  pronouns?: string
  role: PersonRole
  /** Job/position line, e.g. "3rd-year PhD candidate". */
  title?: string
  labId?: string
  email?: string
  /** Year they joined the department — helps spot who is new. */
  joinedYear?: number

  /** What questions they care about: "working memory", "predictive coding". */
  interests: string[]
  /** Acquisition techniques they have hands-on experience with: "EEG", "fMRI". */
  methods: string[]
  /** Software and analysis skills: "Python", "MNE", "mixed-effects models". */
  tools: string[]
  /** Populations they work with: "healthy adults", "children 4-8", "post-stroke". */
  populations: string[]

  /** Short self-description, first person. */
  blurb: string
  /** Gaps they would like a collaborator to fill. */
  lookingFor: string[]
  /** Things they are happy to advise on or lend a hand with. */
  canHelpWith: string[]

  collabStatus: CollabStatus
  /** What time they actually have. Optional — many people won't fill this in. */
  capacity?: Capacity
  links: { label: string; url: string }[]
  /** ISO date. Stale profiles are worse than no profiles, so we surface this. */
  updatedAt: string
}

export interface Lab {
  id: string
  name: string
  /** Person.id of the principal investigator. */
  piId: string
  /** One-line description of what the lab is about. */
  focus: string
  themes: string[]
  methods: string[]
  /** Building and room, so people can literally walk over. */
  location?: string
  /** Kit the lab has and could in principle share time on. */
  equipment: string[]
  website?: string
}

export type ProjectStage =
  | 'idea'
  | 'design'
  | 'collecting'
  | 'analysis'
  | 'writing'
  | 'published'

export const STAGE_LABELS: Record<ProjectStage, string> = {
  idea: 'Idea',
  design: 'Design',
  collecting: 'Collecting data',
  analysis: 'Analysis',
  writing: 'Writing up',
  published: 'Published'
}

export interface Project {
  id: string
  title: string
  /** Person.id of whoever is driving it. */
  leadId: string
  labId?: string
  stage: ProjectStage
  summary: string
  /** The headline signal for de-siloing: is there room for someone else? */
  seekingCollaborators: boolean
  /** Specific skills or methods the project is missing. */
  needs: string[]
  themes: string[]
  updatedAt: string
}

/** The tag families we let people filter the directory by. */
export type TagKind = 'interest' | 'method' | 'tool' | 'population'

export const TAG_KIND_LABELS: Record<TagKind, string> = {
  interest: 'Research interest',
  method: 'Method',
  tool: 'Tool / analysis',
  population: 'Population'
}

/**
 * How much of someone's time an ask costs.
 *
 * This is the whole point of the Asks board. Time scarcity is consistently the
 * most-reported barrier to collaboration — well over half of researchers name
 * competing demands and schedule incompatibility. "Would you like to
 * collaborate?" is an unbounded commitment, and nobody accepts an unbounded
 * commitment while they are behind on their own work. A priced ask competes
 * with a coffee break instead of with a grant deadline.
 */
export type AskSize = 'quick' | 'hour' | 'halfday' | 'ongoing'

export const ASK_SIZE_LABELS: Record<AskSize, string> = {
  quick: '15 minutes',
  hour: 'About an hour',
  halfday: 'Half a day',
  ongoing: 'Ongoing'
}

/** Ordered cheapest-first, so the board can lead with what costs least. */
export const ASK_SIZE_ORDER: AskSize[] = ['quick', 'hour', 'halfday', 'ongoing']

export type AskKind = 'question' | 'review' | 'teach' | 'data' | 'equipment' | 'join'

export const ASK_KIND_LABELS: Record<AskKind, string> = {
  question: 'Answer a question',
  review: 'Look something over',
  teach: 'Show me how',
  data: 'Share data or code',
  equipment: 'Equipment or facility time',
  join: 'Join the project'
}

export type AskStatus = 'open' | 'answered'

export interface Ask {
  id: string
  /** Person.id of whoever needs the help. */
  askerId: string
  /** Written as a specific request, not a topic. */
  title: string
  detail: string
  /** The time price. The board sorts and filters on this before anything else. */
  size: AskSize
  kind: AskKind
  /** Skills that would let someone answer this — matched against profiles. */
  needs: string[]
  /**
   * ISO date after which the ask is stale. An expired ask is worse than no ask:
   * it teaches people the board is abandoned.
   */
  neededBy?: string
  status: AskStatus
  /** Person.id of whoever helped. Recorded so small favours stay visible. */
  answeredById?: string
  createdAt: string
}

/**
 * What slack someone actually has.
 *
 * Declared capacity is the other half of the mechanism: it lets an ask land
 * against time a person has already set aside, rather than competing with
 * whatever is most urgent that week. Academic time is also seasonal, so
 * "not until term ends" is a useful and honest answer.
 */
export interface Capacity {
  /** Free text, in the person's own words. */
  note: string
  /** ISO date before which they have no slack at all. */
  freeFrom?: string
}
