import type { JSX } from 'react'
import { useMemo, useState } from 'react'
import {
  ASK_KIND_LABELS,
  ASK_SIZE_LABELS,
  ASK_SIZE_ORDER,
  type Ask,
  type AskSize,
  type Person
} from '../types'
import { daysSince, formatDate, initialsOf, suggestHelpers } from '../lib/search'
import { Tag } from './Bits'

/**
 * The Asks board.
 *
 * Time is the most-reported barrier to collaboration, so time is the primary
 * axis of this page: you filter by what you can afford before you ever see a
 * topic. Everything here follows from that one decision.
 */

/**
 * Reuses the project matcher — an ask's `needs` behave exactly like a project's —
 * then re-ranks so anyone who has actually declared spare time comes first. On a
 * page about time, a qualified person with no capacity is the weaker suggestion.
 */
function helpersForAsk(ask: Ask, people: Person[]): Person[] {
  const matched = suggestHelpers(
    {
      id: ask.id,
      title: ask.title,
      leadId: ask.askerId,
      stage: 'idea',
      summary: ask.detail,
      seekingCollaborators: true,
      needs: ask.needs,
      themes: [],
      updatedAt: ask.createdAt
    },
    people
  )
  // suggestHelpers already returns best-match-first, so use position as the match
  // rank and let declared capacity apply a half-step nudge. A thumb on the scale,
  // not an override: sending someone to a free but less-qualified colleague wastes
  // two people's time, which is the very thing this page exists to protect.
  return matched
    .map((person, rank) => ({ person, rank: rank - (person.capacity ? 0.5 : 0) }))
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => entry.person)
}

function daysUntil(iso: string, today: Date): number | null {
  const since = daysSince(iso, today)
  return since === null ? null : -since
}

export function AsksView({
  asks,
  people,
  today,
  onOpenPerson
}: {
  asks: Ask[]
  people: Person[]
  today: Date
  onOpenPerson: (personId: string) => void
}): JSX.Element {
  const [size, setSize] = useState<AskSize | 'all'>('all')
  const [showAnswered, setShowAnswered] = useState(false)

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])

  const openAsks = asks.filter((a) => a.status === 'open')
  const countFor = (s: AskSize): number => openAsks.filter((a) => a.size === s).length

  const visible = useMemo(() => {
    return asks
      .filter((a) => (showAnswered ? true : a.status === 'open'))
      .filter((a) => (size === 'all' ? true : a.size === size))
      .sort((a, b) => {
        // Cheapest first, then most urgent, then newest. Someone with ten spare
        // minutes should not have to scroll past a six-month commitment.
        const bySize = ASK_SIZE_ORDER.indexOf(a.size) - ASK_SIZE_ORDER.indexOf(b.size)
        if (bySize !== 0) return bySize
        if (a.neededBy && b.neededBy) return a.neededBy.localeCompare(b.neededBy)
        if (a.neededBy) return -1
        if (b.neededBy) return 1
        return b.createdAt.localeCompare(a.createdAt)
      })
  }, [asks, size, showAnswered])

  return (
    <>
      <div className="asks-intro">
        <p>
          Every ask below says what it costs. Nobody can accept an open-ended
          collaboration while they are behind on their own work &mdash; but most people can
          spare a quarter of an hour.
        </p>
      </div>

      <div className="size-filter" role="group" aria-label="Filter by time required">
        <button
          type="button"
          className="size-btn"
          aria-pressed={size === 'all'}
          onClick={() => setSize('all')}
        >
          Anything
          <span className="n">{openAsks.length}</span>
        </button>
        {ASK_SIZE_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            className="size-btn"
            aria-pressed={size === s}
            onClick={() => setSize(s)}
          >
            {ASK_SIZE_LABELS[s]}
            <span className="n">{countFor(s)}</span>
          </button>
        ))}
      </div>

      <div className="result-meta">
        <span>
          {visible.length} {visible.length === 1 ? 'ask' : 'asks'}
          {size !== 'all' && ` costing ${ASK_SIZE_LABELS[size].toLowerCase()}`}
        </span>
        <label className="toggle">
          <input
            type="checkbox"
            checked={showAnswered}
            onChange={(e) => setShowAnswered(e.target.checked)}
          />
          Include answered
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <p>
            <strong>Nothing at that price right now.</strong>
          </p>
          <p>Try a different amount of time, or check back — asks are added as they come up.</p>
        </div>
      ) : (
        <div className="ask-list">
          {visible.map((ask) => {
            const asker = peopleById.get(ask.askerId)
            const helpers = ask.status === 'open' ? helpersForAsk(ask, people) : []
            const answerer = ask.answeredById ? peopleById.get(ask.answeredById) : undefined
            const days = ask.neededBy ? daysUntil(ask.neededBy, today) : null
            const urgent = days !== null && days <= 21 && days >= 0
            const lapsed = days !== null && days < 0

            return (
              <article
                key={ask.id}
                className={`ask${ask.status === 'answered' ? ' ask-done' : ''}`}
              >
                <div className="ask-price">
                  <span className="ask-price-value">{ASK_SIZE_LABELS[ask.size]}</span>
                  <span className="ask-price-kind">{ASK_KIND_LABELS[ask.kind]}</span>
                </div>

                <div className="ask-body">
                  <h3>{ask.title}</h3>
                  <div className="ask-sub">
                    {asker ? (
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => onOpenPerson(ask.askerId)}
                      >
                        {asker.name}
                      </button>
                    ) : (
                      'Unknown'
                    )}
                    {' · asked '}
                    {formatDate(ask.createdAt)}
                    {ask.neededBy && !lapsed && (
                      <span className={urgent ? ' due-soon' : ''}>
                        {' · needed by '}
                        {formatDate(ask.neededBy)}
                        {urgent && days !== null && ` (${days} days)`}
                      </span>
                    )}
                    {lapsed && <span className="lapsed"> · date passed</span>}
                  </div>

                  <p className="ask-detail">{ask.detail}</p>

                  {ask.needs.length > 0 && (
                    <div className="tag-row">
                      {ask.needs.map((need) => (
                        <Tag key={need}>{need}</Tag>
                      ))}
                    </div>
                  )}

                  {ask.status === 'answered' && answerer && (
                    <p className="ask-answered">
                      Answered by{' '}
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => onOpenPerson(answerer.id)}
                      >
                        {answerer.name}
                      </button>
                    </p>
                  )}

                  {helpers.length > 0 && (
                    <div className="suggest">
                      <h5>Could probably answer this</h5>
                      <div className="suggest-people">
                        {helpers.map((person) => (
                          <button
                            key={person.id}
                            type="button"
                            className="suggest-btn"
                            onClick={() => onOpenPerson(person.id)}
                            title={person.capacity?.note}
                          >
                            <span className="mini" aria-hidden="true">
                              {initialsOf(person.name)}
                            </span>
                            {person.name}
                            {person.capacity && <span className="has-capacity">has time</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
