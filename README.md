# Markdown Reader

A markdown reader where documents can mount live React components. Content lives
in `src/content/*.mdx`, compiled at build time by MDX — so a document can use
JSX, props, imports, and JavaScript expressions alongside ordinary markdown.

```bash
npm install
npm run dev
```

## Adding a document

Drop a `.mdx` file into `src/content`. The filename becomes the URL —
`src/content/notes.mdx` is served at `/notes`. Nothing to register.

```mdx
---
title: My Document
description: Shown on the library card and under the page title.
date: '2026-08-16'
tags: [guide]
draft: false
---

Ordinary **markdown**, plus components:

<Callout type="tip">
  This is a real React component.
</Callout>
```

Only `title` is required. `draft: true` hides a document from the library
without deleting it. Quote the `date` — unquoted YAML dates can parse as a
`Date` rather than a string.

## Adding a component to the markdown vocabulary

Register it once in [`src/mdx/components.ts`](src/mdx/components.ts):

```ts
export const mdxComponents: MDXComponents = {
  Callout,
  Counter,
  MyThing, // now usable in any .mdx file, no import
}
```

For something used in a single document, skip the registry and import it in
that document directly:

```mdx
import Stat from '../components/Stat'
```

## Layout

```
src/
  content/          .mdx documents — the content, one file per page
  mdx/
    components.ts   the registry: what .mdx files can use without importing
    primitives.tsx  overrides for HTML elements markdown compiles to
  components/       React components (Callout, Counter, CodeBlock, Stat, …)
  pages/            Library (index) and Doc (reader)
  lib/docs.ts       pairs the frontmatter manifest with lazy document loaders
  virtual-modules.d.ts  types for virtual:content-manifest
```

## How it fits together

`vite.config.ts` runs `@mdx-js/rollup` ahead of the React plugin, with
`remark-gfm` for GitHub-flavored markdown, `remark-frontmatter` +
`remark-mdx-frontmatter` to export the YAML block as `frontmatter`, and
`rehype-slug` to give headings anchor ids.

`App.tsx` wraps the router in `MDXProvider`, which is what makes the registry
available inside documents.

## Code splitting — why there is a virtual module

Each document is its own chunk, fetched only when opened. Adding a long report
costs nothing until someone reads it.

Getting there needed one non-obvious piece. The library page needs every title
up front, but importing the `.mdx` modules to read them — even with Vite's
`import: 'frontmatter'` option — makes them *static* imports, and a module
that is both statically and dynamically imported cannot be split:

```
[INEFFECTIVE_DYNAMIC_IMPORT] src/content/tapg-analysis.mdx is dynamically
imported but also statically imported, dynamic import will not move module
into another chunk.
```

So the `content-manifest` plugin in [`vite.config.ts`](vite.config.ts) reads the
YAML frontmatter straight off disk and exposes it as `virtual:content-manifest`.
[`src/lib/docs.ts`](src/lib/docs.ts) pairs that metadata with a lazy glob, which
stays the only import of the `.mdx` files — so they split cleanly. The module's
type lives in [`src/virtual-modules.d.ts`](src/virtual-modules.d.ts).

**Consequence worth knowing:** frontmatter is now read by two different parsers —
the plugin's for the listing, `remark-mdx-frontmatter`'s for the page. They
agree today, but if you add an exotic YAML value and the library card disagrees
with the document, that split is why.

## Tradeoff

MDX compiles at build time. That buys full JSX, imports, expressions, and
type-checked component props — but content has to be in the repo. Rendering
markdown supplied at runtime (uploaded, fetched, pasted) would mean either
compiling MDX in the browser or swapping to a plain-markdown renderer with a
component registry keyed off fenced blocks.
