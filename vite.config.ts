import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import { parse as parseYaml } from 'yaml'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import rehypeSlug from 'rehype-slug'

const CONTENT_DIR = fileURLToPath(new URL('./src/content', import.meta.url))

// Exposes every document's frontmatter as `virtual:content-manifest` by reading
// the files directly at build time.
//
// Why this exists: the library page needs every title up front, but importing
// the .mdx modules to get them — even with `import: 'frontmatter'` — makes them
// static imports, and a module that is both statically and dynamically imported
// cannot be code-split (rolldown warns INEFFECTIVE_DYNAMIC_IMPORT). Reading the
// YAML off disk keeps the .mdx files purely dynamic, so each one becomes its own
// lazily-fetched chunk.
function contentManifest(): Plugin {
  const VIRTUAL_ID = 'virtual:content-manifest'
  const RESOLVED_ID = '\0' + VIRTUAL_ID

  function readManifest() {
    if (!existsSync(CONTENT_DIR)) return []
    return readdirSync(CONTENT_DIR)
      .filter((file) => file.endsWith('.mdx'))
      .map((file) => {
        const raw = readFileSync(join(CONTENT_DIR, file), 'utf8')
        const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
        const data = match ? ((parseYaml(match[1]) as object) ?? {}) : {}
        return { slug: file.replace(/\.mdx$/, ''), ...data }
      })
  }

  return {
    name: 'content-manifest',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      return `export const manifest = ${JSON.stringify(readManifest())}`
    },
    configureServer(server) {
      server.watcher.add(CONTENT_DIR)
      const refresh = (file: string) => {
        if (!file.endsWith('.mdx')) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
      server.watcher.on('change', refresh)
    },
  }
}

export default defineConfig({
  plugins: [
    contentManifest(),
    // Must run before the React plugin so it receives compiled JSX, not raw MDX.
    {
      enforce: 'pre',
      ...mdx({
        // Lets MDXProvider inject the component registry, so .mdx files can use
        // <Callout>, <Counter>, etc. without importing them.
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [
          remarkGfm,
          remarkFrontmatter,
          // Turns the YAML block into `export const frontmatter = {...}`.
          [remarkMdxFrontmatter, { name: 'frontmatter' }],
        ],
        rehypePlugins: [rehypeSlug],
      }),
    },
    // `include` is widened so Fast Refresh also covers .mdx files.
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
  ],
})
