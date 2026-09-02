import type { JSX, ReactNode } from 'react'
import { COLLAB_LABELS, type CollabStatus } from '../types'
import { initialsOf } from '../lib/search'

export function Avatar({ name }: { name: string }): JSX.Element {
  return (
    <span className="avatar" aria-hidden="true">
      {initialsOf(name)}
    </span>
  )
}

export function CollabBadge({ status }: { status: CollabStatus }): JSX.Element {
  return <span className={`status status-${status}`}>{COLLAB_LABELS[status]}</span>
}

/** Non-interactive tag, for detail views where filtering isn't the point. */
export function Tag({ children }: { children: ReactNode }): JSX.Element {
  return <span className="chip-static">{children}</span>
}

export function TagRow({ values, max }: { values: string[]; max?: number }): JSX.Element | null {
  if (values.length === 0) return null
  const shown = max ? values.slice(0, max) : values
  const hidden = values.length - shown.length
  return (
    <div className="tag-row">
      {shown.map((v) => (
        <Tag key={v}>{v}</Tag>
      ))}
      {hidden > 0 && <span className="chip-static">+{hidden}</span>}
    </div>
  )
}

/** A labelled block that renders nothing when there's nothing to say. */
export function Section({
  title,
  children
}: {
  title: string
  children: ReactNode
}): JSX.Element {
  return (
    <div className="section">
      <h4>{title}</h4>
      {children}
    </div>
  )
}

export function ListSection({
  title,
  items
}: {
  title: string
  items: string[]
}): JSX.Element | null {
  if (items.length === 0) return null
  return (
    <Section title={title}>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Section>
  )
}
