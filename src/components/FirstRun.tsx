import type { JSX, ReactNode } from 'react'

/**
 * Shown when a collection has no records at all.
 *
 * Distinct from a no-results state on purpose: "nothing matches your filters"
 * and "nobody has added themselves yet" need different words and lead to
 * different actions. A new department seeing search advice would think the site
 * was broken.
 */
export function FirstRun({
  headline,
  children,
  actionLabel,
  actionHref
}: {
  headline: string
  children: ReactNode
  actionLabel?: string
  actionHref?: string
}): JSX.Element {
  return (
    <div className="first-run">
      <h2>{headline}</h2>
      <div className="first-run-body">{children}</div>
      {actionLabel && actionHref && (
        <a
          className="first-run-action"
          href={actionHref}
          target="_blank"
          rel="noreferrer noopener"
        >
          {actionLabel}
        </a>
      )}
    </div>
  )
}
