// Reconciles src/data/portfolio.local.ts against the printed statements.
//
// Must run from the PROJECT ROOT — copy it to ./__reconcile.ts first. Node
// cannot import .ts, and Vite resolves both the relative import below and the
// import.meta.glob in portfolio.ts against the project, so a scratchpad copy
// fails to resolve. See the skill's step 6 for the exact commands.

import { months, events, totalOf, unrealised } from './src/data/portfolio'

let failures = 0

for (const month of months) {
  const holdings = month.holdings ?? []
  const cost = holdings.reduce((sum, h) => sum + h.costValue, 0)
  const market = holdings.reduce((sum, h) => sum + h.marketValue, 0)

  // The three identities every statement satisfies. The NAV one is free — it
  // catches a dropped minus sign on undueTrading, which is otherwise invisible.
  const okCost = cost === month.costBasis
  const okMarket = market === month.marketValue
  const okNav = month.marketValue + month.undueTrading === month.equityNav
  if (!okCost || !okMarket || !okNav) failures++

  const { value, percent } = unrealised(month)
  console.log(
    `${month.date}  ` +
      `cost ${okCost ? 'OK ' : `BAD ${cost} vs ${month.costBasis}`}  ` +
      `mkt ${okMarket ? 'OK ' : `BAD ${market} vs ${month.marketValue}`}  ` +
      `nav ${okNav ? 'OK ' : `BAD ${month.marketValue + month.undueTrading} vs ${month.equityNav}`}  ` +
      `unreal ${Math.round(value)} (${percent.toFixed(2)}%)`,
  )
}

console.log(`months ${months.length} events ${events.length} failures ${failures}`)

for (const type of ['dividend', 'buy', 'sell'] as const) {
  const matching = events.filter((event) => event.type === type)
  console.log(`${type} ${matching.length} total ${totalOf(type)}`)
}

// A duplicated trade usually lands adjacent to its twin, so an exact-duplicate
// scan is the cheapest guard against the settlement-date double count.
const seen = new Set<string>()
for (const event of events) {
  const key = `${event.date}|${event.type}|${event.ticker}|${event.quantity}|${event.amount}`
  if (seen.has(key)) console.log(`DUPLICATE ${key}`)
  seen.add(key)
}

process.exitCode = failures === 0 ? 0 : 1
