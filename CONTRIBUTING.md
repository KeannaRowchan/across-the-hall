# Adding yourself to Across the Hall

You do not need to install anything, and you do not need to know git. Everything
below can be done in a web browser.

## Add or update your profile

1. Open [`data/people.json`](data/people.json) on GitHub.
2. Click the pencil icon (**Edit this file**).
3. Copy the template below, paste it into the list, and fill it in.
4. Scroll down, describe your change in a sentence, and click
   **Propose changes**, then **Create pull request**.

A check runs automatically and will tell you if anything is malformed. A
maintainer merges it, and the site updates itself within a couple of minutes.

### Profile template

```json
{
  "id": "p-yourlastname",
  "name": "Your Name",
  "pronouns": "they/them",
  "role": "phd",
  "title": "2nd-year PhD student",
  "labId": "lab-memory",
  "email": "you@example.edu",
  "joinedYear": 2025,
  "interests": ["episodic memory", "sleep"],
  "methods": ["EEG", "fMRI"],
  "tools": ["Python", "MNE", "R"],
  "populations": ["healthy adults"],
  "blurb": "One or two sentences, first person, about what you work on.",
  "lookingFor": ["a modelling collaborator", "help with mixed-effects models"],
  "canHelpWith": ["EEG preprocessing", "running participants"],
  "collabStatus": "open",
  "links": [{ "label": "Website", "url": "https://example.edu/~you" }],
  "updatedAt": "2026-08-19"
}
```

### Field reference

Required: `id`, `name`, `role`, `blurb`, `collabStatus`, `updatedAt`.
Everything else is optional and can be left out entirely.

| Field | Notes |
|---|---|
| `id` | Unique, lowercase, no spaces. `p-` then your surname works fine. |
| `role` | One of `undergraduate`, `masters`, `phd`, `postdoc`, `faculty`, `research-staff`, `affiliate`. |
| `title` | Free text, shown instead of the role when present. |
| `labId` | Must match an `id` in [`data/labs.json`](data/labs.json). Omit if you aren't in one lab. |
| `interests` | The *questions* you care about — "predictive coding", "word learning". |
| `methods` | Acquisition techniques you have hands-on experience with — "EEG", "MEG", "fMRI". |
| `tools` | Software and analysis skills — "Python", "MNE", "lme4". |
| `populations` | Who you test — "infants", "children 4-8", "older adults". |
| `canHelpWith` | **The most useful field in the file.** What you'd genuinely answer a knock on the door about. |
| `lookingFor` | Gaps a collaborator could fill. This is what makes you findable to someone with the missing skill. |
| `collabStatus` | `open`, `selective`, or `closed`. Honest is better than flattering. |
| `updatedAt` | Today's date, `YYYY-MM-DD`. Profiles older than six months get flagged as possibly stale. |

### On tags

Search combines selected tags with AND, so consistent spelling matters more than
completeness. Before inventing a tag, check whether the term already appears in
`people.json` — `EEG` and `eeg` are two different filters, and so are
`fMRI` and `functional MRI`.

## Add a lab

Edit [`data/labs.json`](data/labs.json). `piId` must match a person who already
exists in `people.json`, so add the PI first if they aren't listed.

## Add a project

Edit [`data/projects.json`](data/projects.json). `leadId` must match someone in
`people.json`.

Set `seekingCollaborators` to `true` and list what you need in `needs` — this is
what puts your project on the collaboration board and matches it against people's
skills. Be specific: `"Stan"` finds someone; `"help with stats"` does not.

`stage` is one of `idea`, `design`, `collecting`, `analysis`, `writing`,
`published`. Listing something at `idea` stage is encouraged — that's the point
at which a collaborator can still change the design.

## Post an ask

Edit [`data/asks.json`](data/asks.json). This is the most useful file in the
repository and the one to reach for first.

```json
{
  "id": "ask-something-short",
  "askerId": "p-yourlastname",
  "title": "Sanity-check my EEG montage before I order caps",
  "detail": "Two or three sentences. Say what you have tried and what specifically you need.",
  "size": "quick",
  "kind": "review",
  "needs": ["EEG", "children 4-8"],
  "neededBy": "2026-09-15",
  "status": "open",
  "createdAt": "2026-08-19"
}
```

| Field | Notes |
|---|---|
| `size` | `quick` (15 min), `hour`, `halfday`, or `ongoing`. **Be honest and be small.** A fifteen-minute ask gets answered; an open-ended one does not. |
| `kind` | `question`, `review`, `teach`, `data`, `equipment`, or `join`. |
| `title` | Phrase it as a specific request, not a topic. "Anyone into EEG?" gets nothing. |
| `needs` | Skills that would let someone answer. This is what matches you to people. |
| `neededBy` | Optional. The board counts down and flags it inside three weeks. Omit if genuinely open-ended. |
| `status` | `open`, or `answered` with `answeredById` set to whoever helped. |

When someone helps you, set `status` to `answered` and credit them. Small favours
only stay repeatable if they are visible.

### Say what time you have

Optionally add a `capacity` block to your own profile in `people.json`:

```json
"capacity": {
  "note": "Two afternoons a month. Sleep scoring questions are quick for me, so ask freely.",
  "freeFrom": "2026-11-01"
}
```

An honest "very little until March" is more useful than a polite maybe — it means
people ask you when you can actually say yes, and it marks you on the board as
someone with time when you do.

## Removing yourself

Delete your entry and open a pull request, or ask a maintainer. No explanation
needed.

## Checking your change locally (optional)

If you do have Node installed:

```bash
npm install
npm run validate
npm run dev
```
