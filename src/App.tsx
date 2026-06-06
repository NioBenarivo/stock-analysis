import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Company from './pages/Company'
import Metrics from './pages/Metrics'
import MetricsDetail from './pages/MetricsDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/company/:id" element={<Company />} />
        <Route path="/metrics" element={<Metrics />} />
        <Route path="/metrics/:id" element={<MetricsDetail />} />
      </Routes>
    </BrowserRouter>
  )
}
