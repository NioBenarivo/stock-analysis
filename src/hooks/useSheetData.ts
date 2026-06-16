import { useState, useEffect } from 'react'
import { SECTOR_SHEETS } from '../config/sheets'
import { fetchSheetData } from '../data/sheets'
import type { SheetData } from '../data/sheets'

export function useSheetData(sector: string): { data: SheetData | null; loading: boolean } {
  const url = SECTOR_SHEETS[sector] ?? ''
  const [data, setData] = useState<SheetData | null>(null)

  useEffect(() => {
    if (!url) return
    fetchSheetData(url).then(setData)
  }, [url])

  return { data, loading: !!url && data === null }
}
