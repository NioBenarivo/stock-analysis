import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { mdxComponents } from './mdx/components'
import Layout from './components/Layout'
import Library from './pages/Library'
import Doc from './pages/Doc'

// Lazy: Recharts and the portfolio figures stay out of the initial bundle, so
// only a visitor who opens /portfolio downloads them. The calculator is lazy
// for the Recharts half of that reason alone — it holds no data.
const Portfolio = lazy(() => import('./pages/Portfolio'))
const Calculator = lazy(() => import('./pages/Calculator'))

export default function App() {
  return (
    // Every .mdx file rendered below can use anything in mdxComponents
    // without importing it.
    <MDXProvider components={mdxComponents}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Library />} />
          <Route
            path="/portfolio"
            element={
              <Suspense fallback={<Layout>{null}</Layout>}>
                <Portfolio />
              </Suspense>
            }
          />
          <Route
            path="/calculator"
            element={
              <Suspense fallback={<Layout>{null}</Layout>}>
                <Calculator />
              </Suspense>
            }
          />
          {/* Ranked below the static paths above, so neither is ever a slug. */}
          <Route path="/:slug" element={<Doc />} />
        </Routes>
      </BrowserRouter>
    </MDXProvider>
  )
}
