/**
 * Validates data/*.json before a build.
 *
 * Profiles arrive as hand-edited JSON via pull request, so this is the gate that
 * keeps a typo from reaching the live site. Run with `npm run validate`; CI runs
 * it on every PR, and `npm run build` runs it first.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const ROLES = [
  'undergraduate',
  'masters',
  'phd',
  'postdoc',
  'faculty',
  'research-staff',
  'affiliate'
]
const COLLAB = ['open', 'selective', 'closed']
const STAGES = ['idea', 'design', 'collecting', 'analysis', 'writing', 'published']
const ASK_SIZES = ['quick', 'hour', 'halfday', 'ongoing']
const ASK_KINDS = ['question', 'review', 'teach', 'data', 'equipment', 'join']
const ASK_STATUS = ['open', 'answered']

const errors = []
const warnings = []

/**
 * Read every record in data/<collection>/. Each file holds one object, and the
 * filename must match its `id` so the CMS and the repo agree on identity.
 */
function read(collection) {
  const dir = join(root, 'data', collection)
  let files
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
  } catch (err) {
    errors.push(`data/${collection}/: ${err.message}`)
    return []
  }
  if (files.length === 0) {
    warnings.push(`data/${collection}/ is empty`)
  }
  const records = []
  for (const file of files) {
    const where = `data/${collection}/${file}`
    let parsed
    try {
      parsed = JSON.parse(readFileSync(join(dir, file), 'utf8'))
    } catch (err) {
      errors.push(`${where}: ${err.message}`)
      continue
    }
    if (Array.isArray(parsed) || typeof parsed !== 'object' || parsed === null) {
      errors.push(`${where}: must contain a single JSON object, not an array`)
      continue
    }
    const expected = `${parsed.id}.json`
    if (parsed.id && file !== expected) {
      errors.push(`${where}: filename does not match id — should be ${expected}`)
    }
    records.push(parsed)
  }
  return records
}

const people = read('people')
const labs = read('labs')
const projects = read('projects')
const asks = read('asks')

function requireString(obj, field, where) {
  if (typeof obj[field] !== 'string' || obj[field].trim() === '') {
    errors.push(`${where}: "${field}" is required and must be a non-empty string`)
  }
}

function requireStringArray(obj, field, where) {
  if (obj[field] === undefined) return
  if (!Array.isArray(obj[field]) || obj[field].some((v) => typeof v !== 'string')) {
    errors.push(`${where}: "${field}" must be an array of strings`)
  }
}

function requireEnum(obj, field, allowed, where) {
  if (!allowed.includes(obj[field])) {
    errors.push(`${where}: "${field}" must be one of ${allowed.join(', ')} (got ${JSON.stringify(obj[field])})`)
  }
}

function requireIsoDate(obj, field, where) {
  const value = obj[field]
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    errors.push(`${where}: "${field}" must be a date like 2026-08-19`)
    return
  }
  if (Number.isNaN(new Date(value).getTime())) {
    errors.push(`${where}: "${field}" is not a real date (${value})`)
  }
}

function checkUniqueIds(items, name) {
  const seen = new Set()
  for (const item of items) {
    if (typeof item.id !== 'string' || item.id.trim() === '') {
      errors.push(`${name}: every entry needs a non-empty "id"`)
      continue
    }
    if (seen.has(item.id)) errors.push(`${name}: duplicate id "${item.id}"`)
    seen.add(item.id)
  }
  return seen
}

const personIds = checkUniqueIds(people, 'data/people')
const labIds = checkUniqueIds(labs, 'data/labs')
checkUniqueIds(projects, 'data/projects')
checkUniqueIds(asks, 'data/asks')

for (const person of people) {
  const where = `data/people/${person.id ?? '?'}.json`
  requireString(person, 'name', where)
  requireString(person, 'blurb', where)
  requireEnum(person, 'role', ROLES, where)
  requireEnum(person, 'collabStatus', COLLAB, where)
  requireIsoDate(person, 'updatedAt', where)
  for (const field of ['interests', 'methods', 'tools', 'populations', 'lookingFor', 'canHelpWith']) {
    requireStringArray(person, field, where)
  }
  if (person.labId && !labIds.has(person.labId)) {
    errors.push(`${where}: unknown labId "${person.labId}"`)
  }
  if (person.email && !person.email.includes('@')) {
    errors.push(`${where}: "email" does not look like an address`)
  }
  // Not fatal, but a profile with no tags is invisible to search.
  const tagCount =
    (person.interests?.length ?? 0) + (person.methods?.length ?? 0) + (person.tools?.length ?? 0)
  if (tagCount === 0) {
    warnings.push(`${where}: no interests, methods or tools — this profile won't surface in search`)
  }
}

for (const lab of labs) {
  const where = `data/labs/${lab.id ?? '?'}.json`
  requireString(lab, 'name', where)
  requireString(lab, 'focus', where)
  requireString(lab, 'piId', where)
  requireStringArray(lab, 'themes', where)
  requireStringArray(lab, 'methods', where)
  requireStringArray(lab, 'equipment', where)
  if (lab.piId && !personIds.has(lab.piId)) {
    errors.push(`${where}: unknown piId "${lab.piId}" — add them to people.json first`)
  }
}

for (const project of projects) {
  const where = `data/projects/${project.id ?? '?'}.json`
  requireString(project, 'title', where)
  requireString(project, 'summary', where)
  requireString(project, 'leadId', where)
  requireEnum(project, 'stage', STAGES, where)
  requireIsoDate(project, 'updatedAt', where)
  requireStringArray(project, 'needs', where)
  requireStringArray(project, 'themes', where)
  if (typeof project.seekingCollaborators !== 'boolean') {
    errors.push(`${where}: "seekingCollaborators" must be true or false`)
  }
  if (project.leadId && !personIds.has(project.leadId)) {
    errors.push(`${where}: unknown leadId "${project.leadId}" — add them to people.json first`)
  }
  if (project.labId && !labIds.has(project.labId)) {
    errors.push(`${where}: unknown labId "${project.labId}"`)
  }
  if (project.seekingCollaborators && (project.needs?.length ?? 0) === 0) {
    warnings.push(`${where}: seeking collaborators but "needs" is empty — say what would help`)
  }
}

for (const ask of asks) {
  const where = `data/asks/${ask.id ?? '?'}.json`
  requireString(ask, 'title', where)
  requireString(ask, 'detail', where)
  requireString(ask, 'askerId', where)
  requireEnum(ask, 'size', ASK_SIZES, where)
  requireEnum(ask, 'kind', ASK_KINDS, where)
  requireEnum(ask, 'status', ASK_STATUS, where)
  requireIsoDate(ask, 'createdAt', where)
  requireStringArray(ask, 'needs', where)
  if (ask.neededBy !== undefined) requireIsoDate(ask, 'neededBy', where)
  if (ask.askerId && !personIds.has(ask.askerId)) {
    errors.push(`${where}: unknown askerId "${ask.askerId}"`)
  }
  if (ask.answeredById && !personIds.has(ask.answeredById)) {
    errors.push(`${where}: unknown answeredById "${ask.answeredById}"`)
  }
  if (ask.status === 'answered' && !ask.answeredById) {
    warnings.push(`${where}: marked answered but nobody is credited — say who helped`)
  }
  // An ask nobody can match is an ask nobody will answer.
  if ((ask.needs?.length ?? 0) === 0) {
    warnings.push(`${where}: no "needs" listed, so it won't be matched to anyone`)
  }
}

// Capacity is optional, but a malformed date would silently mislead.
for (const person of people) {
  if (person.capacity === undefined) continue
  const where = `data/people/${person.id ?? '?'}.json capacity`
  requireString(person.capacity, 'note', where)
  if (person.capacity.freeFrom !== undefined) requireIsoDate(person.capacity, 'freeFrom', where)
}

for (const warning of warnings) console.warn(`warning  ${warning}`)

if (errors.length > 0) {
  console.error(`\n${errors.length} problem(s) found in data/:\n`)
  for (const error of errors) console.error(`  error  ${error}`)
  console.error('')
  process.exit(1)
}

console.log(
  `data/ OK — ${people.length} people, ${labs.length} labs, ${projects.length} projects, ` +
    `${asks.length} asks` +
    (warnings.length ? `, ${warnings.length} warning(s)` : '')
)
