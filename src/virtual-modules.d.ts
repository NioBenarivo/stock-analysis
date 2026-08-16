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
