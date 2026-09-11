// Generated at build time by the `content-manifest` plugin in vite.config.ts.
// It reads the YAML frontmatter of every src/content/*.mdx file without
// importing the modules themselves, which is what keeps them code-splittable.
declare module 'virtual:content-manifest' {
  export interface ManifestEntry {
    slug: string
    title?: string
    description?: string
    date?: string
    tags?: string[]
    draft?: boolean
  }
  export const manifest: ManifestEntry[]
}

// Also generated in vite.config.ts, by the `search-index` plugin: every
// document flattened to plain text and split at its headings. Import it only
// with a dynamic `import()` — it is megabytes of prose and belongs in its own
// on-demand chunk, not in the initial graph.
declare module 'virtual:search-index' {
  export interface IndexedDoc {
    slug: string
    sections: { h: string; id: string; d: number; t: string }[]
  }
  export const index: IndexedDoc[]
}
