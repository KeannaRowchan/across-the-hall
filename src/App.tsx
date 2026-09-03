import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { useDirectory } from './data/useDirectory'
import { repository } from './data/repository'
import { PeopleView } from './components/PeopleView'
import { AsksView } from './components/AsksView'
import { ProjectsView } from './components/ProjectsView'
import { LabsView } from './components/LabsView'

type TabId = 'people' | 'asks' | 'projects' | 'labs'

const REPO_URL = 'https://github.com/KeannaRowchan/across-the-hall'

/**
 * Where "add me" points.
 *
 * A GitHub issue form: friendly fields, a consent checkbox, and no JSON. It
 * works with no setup beyond the repository itself.
 *
 * The form editor at /admin/ is a nicer experience but needs an OAuth relay
 * deployed first, so it stays unlinked until `base_url` in
 * public/admin/config.yml points at a real worker. Pointing visitors at a login
 * that cannot succeed is worse than not offering it.
 */
const ADD_ME_URL = `${REPO_URL}/issues/new?template=profile-request.yml`

export default function App(): JSX.Element {
  const { data, error, loading } = useDirectory()
  const [tab, setTab] = useState<TabId>('people')
  /** Set when a project or lab links to a person; the People tab opens them. */
  const [focusPersonId, setFocusPersonId] = useState<string | null>(null)

  // Evaluated once per render rather than per card, so every staleness check in
  // a single pass agrees with the others.
  const today = new Date()

  // Without this, jumping to a person from the projects board drops you into the
  // middle of the people list at whatever offset the previous view was scrolled to.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [tab])

  const openPerson = (personId: string): void => {
    setFocusPersonId(personId)
    setTab('people')
  }

  if (loading) {
    return (
      <div className="app">
        <main className="main">
          <p className="card-sub">Loading directory…</p>
        </main>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="app">
        <main className="main">
          <div className="notice notice-warn">
            <strong>Could not load the directory</strong>
            {error ?? 'Unknown error'}
          </div>
        </main>
      </div>
    )
  }

  const { people, labs, projects, asks, warnings } = data
  const seekingCount = projects.filter((p) => p.seekingCollaborators).length

  const openAsks = asks.filter((a) => a.status === 'open').length

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'people', label: 'People', count: people.length },
    { id: 'asks', label: 'Asks', count: openAsks },
    { id: 'projects', label: 'Projects', count: seekingCount },
    { id: 'labs', label: 'Labs', count: labs.length }
  ]

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead-inner">
          <div className="wordmark">
            <h1>Across the Hall</h1>
            <span className="tagline">
              Who does what, what they can help with, and where there&rsquo;s room to join in.
            </span>
          </div>
          <nav className="tabs" role="tablist" aria-label="Sections">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                className="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                <span className="count">{t.count}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        {warnings.length > 0 && (
          <div className="notice notice-warn">
            <strong>
              {warnings.length} data problem{warnings.length > 1 ? 's' : ''} in this directory
            </strong>
            <ul>
              {warnings.slice(0, 5).map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            {warnings.length > 5 && <p>…and {warnings.length - 5} more.</p>}
          </div>
        )}

        {tab === 'people' && (
          <PeopleView
            people={people}
            labs={labs}
            projects={projects}
            today={today}
            focusPersonId={focusPersonId}
            onFocusHandled={() => setFocusPersonId(null)}
          />
        )}
        {tab === 'asks' && (
          <AsksView asks={asks} people={people} today={today} onOpenPerson={openPerson} />
        )}
        {tab === 'projects' && (
          <ProjectsView
            projects={projects}
            people={people}
            labs={labs}
            onOpenPerson={openPerson}
          />
        )}
        {tab === 'labs' && <LabsView labs={labs} people={people} onOpenPerson={openPerson} />}
      </main>

      <footer className="foot">
        <a className="edit-link" href={ADD_ME_URL} target="_blank" rel="noreferrer noopener">
          Add or edit your profile
        </a>
        <span className="foot-sep" aria-hidden="true">
          ·
        </span>
        Every change is saved to{' '}
        <a href={REPO_URL} target="_blank" rel="noreferrer noopener">
          the repository
        </a>
        , so nothing is ever lost. Reading from <code>{repository.sourceLabel}</code>.
      </footer>
    </div>
  )
}
