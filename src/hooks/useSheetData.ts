import { useState, useEffect } from 'react'
import { SECTOR_SHEETS } from '../config/sheets'
import { fetchSheetData } from '../data/sheets'
import type { SheetData } from '../data/sheets'

export function useSheetData(sector: string): { data: SheetData | null; loading: boolean } {
  const url = SECTOR_SHEETS[sector] ?? ''
  const [data, setData] = useState<SheetData | null>(null)
  const [loading, setLoading] = useState(!!url)

  useEffect(() => {
    if (!url) {
      setLoading(false)
      setData(null)
      return
    }
    setLoading(true)
    fetchSheetData(url).then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [url])

  return { data, loading }
}
