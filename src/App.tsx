import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from './mdx/components'
import Library from './pages/Library'
import Doc from './pages/Doc'

export default function App() {
  return (
    // Every .mdx file rendered below can use anything in mdxComponents
    // without importing it.
    <MDXProvider components={mdxComponents}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/:slug" element={<Doc />} />
        </Routes>
      </BrowserRouter>
    </MDXProvider>
  )
}
