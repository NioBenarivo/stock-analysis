import type { MDXComponents } from 'mdx/types'
import { Anchor, H1, H2, H3, H4, Table, Img } from './primitives'
import CodeBlock from '../components/CodeBlock'
import Callout from '../components/Callout'
import Counter from '../components/Counter'

// The markdown vocabulary. Everything here is available inside every .mdx file
// with no import — add a component to this object and it becomes usable in
// content immediately. Anything used in only one document should be imported
// directly by that document instead.
export const mdxComponents: MDXComponents = {
  // Markdown primitives with behaviour worth overriding.
  a: Anchor,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  pre: CodeBlock,
  table: Table,
  img: Img,

  // Custom components — the actual point of MDX.
  Callout,
  Counter,
}
