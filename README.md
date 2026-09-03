# Across the Hall

A department directory that makes research skills, methods, projects and
collaboration openings visible across labs.

Departments tend to be siloed by accident rather than by intent: the person who
could rescue your analysis is two doors down, and neither of you knows it. This
is a small, static website that answers three questions:

- **Who here knows how to do X?** — search by method, tool, interest or population.
- **What is everyone working on?** — a board of current projects and their stage.
- **Where is there room to join in?** — projects say what they need, and the site
  names people whose listed skills match.
- **What could I help with in fifteen minutes?** — the Asks board, where every
  request is priced in time.

The Asks board exists because time, not willingness, is the most-reported barrier
to collaboration. "Would you like to collaborate?" is an unbounded commitment and
nobody accepts one of those while they are behind on their own work. Every ask
states what it costs — fifteen minutes, an hour, half a day, ongoing — and the
board is filtered by what you can afford before you ever see a topic.

## How it works

There is no server and no database. The department's data lives in three JSON
files in this repository, bundled into a static site at build time and hosted
free on GitHub Pages.

That choice has consequences worth understanding:

| Consequence | Why it matters |
|---|---|
| Adding yourself is a pull request | Changes are reviewed, attributed, and never silently lost |
| The whole directory is version-controlled | You can see who changed what, and revert |
| Nothing to run or pay for | No server, no database, no maintenance burden on the department |
| Another department can fork it | They replace `data/`, and the design travels for free |
| Edits need a GitHub account | This is the real cost — see *Contribution friction* below |

## Quick start

```bash
npm install
npm run dev
```

Then open the URL it prints. Other useful commands:

```bash
npm run validate
```

Checks `data/*.json` for malformed entries and broken cross-references.

```bash
npm run build
```

Validates, typechecks, then builds the static site into `dist/`.

## Repository layout

```
data/                  The department's actual content — one file per record
  people/              p-kovacs.json, p-tanaka.json, …
  labs/
  projects/
  asks/
public/
  admin/               The form-based editor (Sveltia CMS)
    config.yml         Defines the editing forms
src/
  types.ts             The data model; read this first
  data/repository.ts   The single seam between UI and data source
  lib/search.ts        Search, filtering, and skill-matching logic
  components/          UI
scripts/
  validate-data.mjs    Data validation, run in CI and before every build
.github/workflows/     Deploy to Pages; validate pull requests
```

## Editing through the website

> **Status: not yet enabled.** The editor at `/admin/` is built and committed, but
> `base_url` in [`public/admin/config.yml`](public/admin/config.yml) is still a
> placeholder, so signing in will fail until the one-time setup below is done.
> Until then the site's "Add or edit your profile" link goes to a GitHub issue
> form instead, which needs no setup.

Colleagues do not need to touch JSON. `/admin/` on the live site is a form-based
editor (Sveltia CMS) that reads and writes this repository directly: someone signs
in with GitHub, fills in a form, clicks save, and that becomes a commit. The
deploy workflow then rebuilds the site, so the change is live in about ninety
seconds.

Editors still need a GitHub account — that is inherent to git-backed editing,
because the commit is attributed to a person and GitHub's permissions do the
authorising. They do not need to install anything.

### One-time setup

A static site cannot hold a secret, so the GitHub OAuth exchange has to happen
somewhere with a server. A free Cloudflare Worker does it, and you deploy it once.

1. **Deploy the auth worker.** Go to
   [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) and use
   its deploy button (or `wrangler deploy` if you prefer). Copy the resulting
   Worker URL, e.g. `https://sveltia-cms-auth.yourname.workers.dev`.

2. **Register a GitHub OAuth app.** Settings → Developer settings → OAuth Apps →
   New OAuth App. Set **Authorization callback URL** to your Worker URL with
   `/callback` on the end. Generate a client secret.

3. **Give the worker its credentials.** In the Cloudflare dashboard, on the
   worker: Settings → Variables. Add `GITHUB_CLIENT_ID` and
   `GITHUB_CLIENT_SECRET` (use the Encrypt button on the secret). Also add
   `ALLOWED_DOMAINS` set to `keannarowchan.github.io` — optional but recommended,
   as it stops other sites using your worker to mint tokens.

4. **Point the CMS at it.** In [`public/admin/config.yml`](public/admin/config.yml),
   replace the placeholder `base_url` with your Worker URL. Commit and push.

Then give department members write access under Settings → Collaborators. Anyone
without access can still sign in and propose changes; `publish_mode:
editorial_workflow` in the config means every edit arrives as a pull request until
you decide otherwise.

### Why one file per record

Each person, lab, project and ask is its own file under `data/<collection>/`,
named after its `id`. That is deliberate: the CMS can show a list you click into
rather than one enormous form, and two people editing different profiles never
touch the same file, so their commits cannot conflict.

## Adding or updating a profile

Easiest route is the form at `/admin/` on the live site. If you would rather edit
the files directly, see [CONTRIBUTING.md](CONTRIBUTING.md) — the data is plain
JSON and CI tells you if anything is wrong either way.

## Adopting this for another department

1. Fork or use this repository as a template.
2. Delete the contents of `data/people.json`, `data/labs.json` and
   `data/projects.json`, replacing them with your own (`[]` is a valid start).
3. In Settings → Pages, set **Source** to **GitHub Actions**.
4. Push to `main`. The deploy workflow derives the base URL from your repository
   name, so nothing needs editing.

The tag vocabularies are not hardcoded — the filter sidebar builds itself from
whatever methods, tools, interests and populations appear in your data. A
psycholinguistics department and an fMRI-heavy one will get different filters
without touching any code.

## Before you put real people in this

`data/` starts empty. Fictional examples live in
[`examples/sample-data/`](examples/sample-data), which the site does not read —
copy one into `data/` if you want a template showing every available field.

Adding real colleagues raises two questions worth settling first:

**Consent.** Profiles describe what people are good at and what they want help
with. That should be opt-in, written by the person themselves, and removable on
request. A pull-request workflow gives you this by default — nobody can be added
without an explicit, attributable commit.

**Public email addresses.** If this repository is public, so is every email in
`data/people.json`, in a form scrapers read easily. Options, roughly in order of
how much friction they add:

- Omit `email` entirely and let people find each other through the existing
  institutional directory.
- Keep the repository private and host the built site somewhere behind
  institutional login. (GitHub Pages on a private repository requires a paid
  plan.)
- Accept it — many academics already publish their address on a lab page.

This is a departmental decision, not a technical one. The app works either way:
`email` is optional, and profiles without one render fine.

## Contribution friction

A pull request is a real barrier for anyone who doesn't use git. If uptake
stalls, the usual fixes are a short screencast showing GitHub's web editor
(which handles the whole flow in a browser, no git install needed), or a form
that generates the JSON for someone else to commit.

Adoption is the hard part of a directory like this, not the code. An empty
directory and a stale directory fail the same way.

## Licence

MIT — see [LICENSE](LICENSE).
