import type { ComponentPropsWithoutRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

// Overrides for the HTML elements markdown compiles to. Anything not listed
// here falls through to the `prose` typography styles on the reader page.

// Routes internal links through React Router so they don't full-page reload,
// and marks external ones visually.
export function Anchor({ href = '', children, ...props }: ComponentPropsWithoutRef<'a'>) {
  if (href.startsWith('/')) {
    return (
      <Link to={href} {...props}>
        {children}
      </Link>
    )
  }

  if (href.startsWith('#')) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }

  return (
    <a href={href} target="_blank" rel="noreferrer noopener" {...props}>
      {children}
      <ArrowUpRight className="ml-0.5 inline h-3 w-3 align-baseline" />
    </a>
  )
}

function HeadingAnchor({ id }: { id?: string }) {
  if (!id) return null
  return (
    <a
      href={`#${id}`}
      aria-label="Link to this section"
      className="ml-2 font-normal text-slate-300 no-underline opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100 dark:text-slate-600"
    >
      #
    </a>
  )
}

// rehype-slug puts an `id` on every heading; these expose it as a hover anchor.
export function H2({ id, children, ...props }: ComponentPropsWithoutRef<'h2'>) {
  return (
    <h2 id={id} className="group scroll-mt-20" {...props}>
      {children}
      <HeadingAnchor id={id} />
    </h2>
  )
}

export function H3({ id, children, ...props }: ComponentPropsWithoutRef<'h3'>) {
  return (
    <h3 id={id} className="group scroll-mt-20" {...props}>
      {children}
      <HeadingAnchor id={id} />
    </h3>
  )
}

// Long documents use h1 as a part divider below the frontmatter title, and h4
// for fourth-level detail. Both get anchors so deep links work anywhere.
export function H1({ id, children, ...props }: ComponentPropsWithoutRef<'h1'>) {
  return (
    <h1
      id={id}
      className="group mt-12 scroll-mt-20 border-b border-slate-200 pb-2 text-xl dark:border-slate-800"
      {...props}
    >
      {children}
      <HeadingAnchor id={id} />
    </h1>
  )
}

export function H4({ id, children, ...props }: ComponentPropsWithoutRef<'h4'>) {
  return (
    <h4 id={id} className="group scroll-mt-20" {...props}>
      {children}
      <HeadingAnchor id={id} />
    </h4>
  )
}

// Keeps prose table styling but stops wide tables from scrolling the page.
export function Table(props: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  )
}

export function Img(props: ComponentPropsWithoutRef<'img'>) {
  return <img className="rounded-xl border border-slate-200 dark:border-slate-800" {...props} />
}
