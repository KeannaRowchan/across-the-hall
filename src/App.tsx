import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { useDirectory } from './data/useDirectory'
import { repository } from './data/repository'
import { PeopleView } from './components/PeopleView'
import { AsksView } from './components/AsksView'
import { ProjectsView } from './components/ProjectsView'
import { LabsView } from './components/LabsView'
import { FirstRun } from './components/FirstRun'

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

        {tab === 'people' && people.length === 0 && (
          <FirstRun
            headline="No one has added themselves yet"
            actionLabel="Add the first profile"
            actionHref={ADD_ME_URL}
          >
            <p>
              This is a directory of who does what in the department &mdash; the methods people
              know, what they can help with, and what they are looking for.
            </p>
            <p>It only works if people are in it. A reasonable way to start:</p>
            <ol>
              <li>Add yourself, so there is something to look at.</li>
              <li>Add the labs, so people can say which one they are in.</li>
              <li>Send the link round and let people add themselves.</li>
            </ol>
          </FirstRun>
        )}
        {tab === 'people' && people.length > 0 && (
          <PeopleView
            people={people}
            labs={labs}
            projects={projects}
            today={today}
            focusPersonId={focusPersonId}
            onFocusHandled={() => setFocusPersonId(null)}
          />
        )}
        {tab === 'asks' && asks.length === 0 && (
          <FirstRun headline="No asks yet">
            <p>
              An ask is a small, specific request with a time on it &mdash; &ldquo;fifteen minutes
              to sanity-check my EEG montage&rdquo;, not &ldquo;anyone interested in EEG?&rdquo;
            </p>
            <p>
              The point of pricing them is that nobody can accept an open-ended collaboration while
              they are behind on their own work, but most people can spare a quarter of an hour.
            </p>
            <p>Once there are profiles here, this board will suggest who could answer each one.</p>
          </FirstRun>
        )}
        {tab === 'asks' && asks.length > 0 && (
          <AsksView asks={asks} people={people} today={today} onOpenPerson={openPerson} />
        )}
        {tab === 'projects' && projects.length === 0 && (
          <FirstRun headline="No projects yet">
            <p>
              Projects listed here say what stage they are at and what they still need, and the
              site matches those needs against people&rsquo;s listed skills.
            </p>
            <p>
              Listing something at idea stage is encouraged &mdash; that is the point where a
              collaborator can still change the design.
            </p>
          </FirstRun>
        )}
        {tab === 'projects' && projects.length > 0 && (
          <ProjectsView
            projects={projects}
            people={people}
            labs={labs}
            onOpenPerson={openPerson}
          />
        )}
        {tab === 'labs' && labs.length === 0 && (
          <FirstRun headline="No labs yet">
            <p>
              Labs give people something to belong to, and list the equipment and resources a lab
              could in principle share time on.
            </p>
            <p>
              Add these before profiles if you can &mdash; a profile can then name its lab from a
              list rather than typing it.
            </p>
          </FirstRun>
        )}
        {tab === 'labs' && labs.length > 0 && (
          <LabsView labs={labs} people={people} onOpenPerson={openPerson} />
        )}
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
