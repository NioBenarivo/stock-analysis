import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { manifest } from 'virtual:content-manifest'

export interface DocFrontmatter {
  title: string
  description?: string
  date?: string
  tags?: string[]
  draft?: boolean
}

interface MdxModule {
  default: ComponentType
}

export interface Doc extends DocFrontmatter {
  slug: string
  Component: LazyExoticComponent<ComponentType>
}

// Lazy glob — no `eager`, and nothing else imports these files statically, so
// each document becomes its own chunk fetched on navigation. Frontmatter for
// the library listing comes from the virtual manifest instead (see
// vite.config.ts) precisely so this stays the only import of the .mdx modules.
const loaders = import.meta.glob<MdxModule>('../content/*.mdx')

const loaderBySlug = new Map(
  Object.entries(loaders).map(([path, load]) => [
    path.split('/').pop()!.replace(/\.mdx$/, ''),
    load,
  ]),
)

// The YAML parser leaves unquoted dates as strings under the YAML 1.2 core
// schema, but a Date can still show up depending on the value written. Coerce
// to a sortable ISO day either way.
function normalizeDate(value: unknown): string | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value)
}

export const docs: Doc[] = manifest
  .flatMap((entry) => {
    const load = loaderBySlug.get(entry.slug)
    // A manifest entry with no loader would mean the file vanished between the
    // plugin reading the directory and the glob resolving. Skip rather than
    // hand React.lazy an undefined loader.
    if (!load) return []
    return [
      {
        ...entry,
        title: entry.title ?? entry.slug,
        date: normalizeDate(entry.date),
        Component: lazy(load),
      },
    ]
  })
  .filter((doc) => !doc.draft)
  .sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date)
    if (a.date) return -1
    if (b.date) return 1
    return a.title.localeCompare(b.title)
  })

export function getDoc(slug: string): Doc | undefined {
  return docs.find((doc) => doc.slug === slug)
}

export const allTags: string[] = [...new Set(docs.flatMap((doc) => doc.tags ?? []))].sort()

export function formatDate(date: string): string {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
