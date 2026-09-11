---
name: import-statement
description: Extract a Stockbit Sekuritas monthly Statement of Account (PDF) into the portfolio data file. Use when given one or more monthly statements / "state of account" PDFs to add to the portfolio page (e.g. "here are the Feb-Aug statements", "add September", "extract this statement"). Handles the transaction-vs-settlement date trap, the cash-row rule, and the reconciliation that proves the transcription is right.
---

# Import a Statement of Account into the portfolio

Turns a Stockbit Sekuritas monthly PDF into entries in
`src/data/portfolio.local.ts`. Derived from the first eight months
(Jan–Aug 2026), extracted in one pass. **Follow the order — the date rule and
the cash rule both exist because the obvious reading is wrong.**

## Privacy first — this is not an ordinary import

The statements carry the account holder's address, phone number, bank account
number, SID and email.

- **Never commit the figures.** `src/data/portfolio.local.ts` is gitignored
  (`.gitignore:27`). Confirm before writing:
  `git check-ignore -v src/data/portfolio.local.ts` must exit 0.
- **Never transcribe the PII** into any file. Only the numbers below are wanted.
- **Never echo it back** in the summary either — no address, no account number.
- `src/data/portfolio.ts` must keep building with the local file absent. That is
  what an `import.meta.glob` (not a plain import) buys; don't "simplify" it.

## The three regions of the PDF

| Region | Yields |
|---|---|
| The summary box | the `MonthSnapshot` — Cash, Undue Trading, Portfolio value, Equity NAB |
| `PORTFOLIO STATEMENT` table | `holdings[]` — qty, avg price, close, buying value, market value |
| The transaction ledger | `events[]` — but only some rows; see step 3 |

---

## 1. Read every statement before writing anything

Read all of them first. Cross-month facts (a trade printed on the wrong
statement, a position that closes out) are invisible one page at a time.

For each month record: closing date, Portfolio value, total Buying Value, Cash,
Undue Trading, Equity NAB, and the full holdings table.

## 2. Snapshot fields — transcribe as printed

```ts
{
  date: '2026-05-31',        // the day the statement closes
  marketValue: 453_702_209,  // "Portfolio" in the summary box
  costBasis: 465_917_043,    // the holdings table's TOTAL Buying Value
  cash: 16_824_243,
  undueTrading: -8_750_606,  // negative on the statement — keep the sign
  equityNav: 444_951_603,
}
```

Use `_` digit separators. Keep fractional average prices exactly
(`807.2857`, `1_323.4615`) — they are how the broker computed the lot.

**Keep the `IDR` holding.** The statement lists a 1-unit `IDR` line worth 1
rupiah. It looks like noise but it is inside the printed totals, so dropping it
breaks reconciliation by exactly 1.

Keep the ticker → company name map consistent across months, and keep the
holdings in one stable order (alphabetical, `IDR` last is the existing
convention).

## 3. The ledger — what becomes an event, and what does not

Only three kinds of row become events: **buys, sells, dividends (`D`)**.

**Cash rows (`P` and `R`) are never events.** The account sweeps to zero every
evening, so each `P`/`R` is the settlement of that day's net trading — including
the ones labelled `Payment to: <name>` and `Receipt From: <name>`, which read
like a withdrawal and a deposit but are not. Recording them double-counts the
trade that caused them.

> Checked across eight months: every `P`/`R` amount matched a day's net invoice.
> If you ever find one that matches **no** invoice, that is a genuine transfer —
> only then add a cash event, and say so in the summary.

The same applies to dividends: a `D` row is the dividend, and the `P` row a day
or two later is that same money leaving. **Record only the `D`.**

```ts
{ date: '2026-05-08', type: 'dividend', ticker: 'ADRO', quantity: 49_500,
  price: 118.26, amount: 5_853_870, note: 'Tax 0%' },
{ date: '2026-07-09', type: 'sell', ticker: 'MARK', quantity: 147_200,
  price: 1_050, amount: 154_173_600 },
```

`amount` is always positive — `type` carries the direction.

## 4. Transaction date, not settlement date — the double-count trap

**A trade prints on the statement of the month it *settles* in, carrying its own
earlier `Tr. Date`.** The 29/01 buys appear on February's statement. They belong
to January.

So when extracting month N:

- Use the **`Tr. Date`** column for every event's `date`.
- **Skip any row whose `Tr. Date` falls in a month already extracted.** Do not
  re-add it "to be safe" — `portfolio.ts` does not dedupe.
- Conversely, a trade late in month N may be missing from month N's own ledger.
  It will arrive on month N+1's statement; leave it for then.

A position held at month-end that was bought on the 29th will also show in
`undueTrading` — that is the same trade, seen from the cash side, and is already
covered by the snapshot. Don't turn it into a second event.

## 5. Write the file

Append to the `months` and `events` arrays in `src/data/portfolio.local.ts`,
keeping both in date order (the module sorts anyway, but a chronological file is
reviewable). Group events by month with a `// June` comment and a blank line
between days.

The type contract lives in `src/data/portfolio.ts` — read it rather than
guessing field names. If a statement needs a field the contract lacks, change
the contract deliberately and update every consumer:
`EVENT_FILTERS` in `src/pages/Portfolio.tsx`, and `EVENT_LABEL`,
`SHAPE_PRIORITY`, `PinKey` and the legend in `src/components/PortfolioChart.tsx`.

## 6. Reconcile — this is the step that proves the transcription

Three identities must hold for **every** month, and a fourth confirms it:

1. `Σ holdings.costValue === costBasis`
2. `Σ holdings.marketValue === marketValue`
3. `marketValue + undueTrading === equityNav`
4. the computed unrealised gain matches the statement's printed Unrealised column

`scripts/reconcile.ts` in this skill directory checks 1–3 and prints 4.

```bash
SP=<scratchpad>
cp .claude/skills/import-statement/scripts/reconcile.ts ./__reconcile.ts
npx vite build --ssr ./__reconcile.ts --outDir $SP/dist-check --logLevel error 2>&1 | tail -5
node $SP/dist-check/__reconcile.js
rm -f ./__reconcile.ts
```

**The probe must sit at the project root**, not in the scratchpad. Node 20
cannot import `.ts` at all, so it has to go through Vite — and Vite resolves
both the relative import and the `import.meta.glob` against the project, so a
scratchpad entry fails with `Cannot find module`. Copy in, run, delete.

Expected output — a failure names the month and both numbers:

```
2026-05-31  cost OK   mkt OK   nav OK   unreal -12214834 (-2.62%)
months 8 events 83 failures 0
```

## 7. Checks

`.ts` changes, unlike the `.mdx` imports, **do** get the full check run:

```bash
npx tsc -b && npx eslint . && npx vite build
```

The 3 MB `_virtual_search-index` chunk trips Vite's 500 kB notice. That is
pre-existing and deliberate — the chunk is lazily loaded. Do not "fix" it by
raising `chunkSizeWarningLimit`.

---

## Reporting back

Lead with the reconciliation table — month, market value, cost basis,
unrealised — because that is the evidence the numbers are right. Then:

- any trade moved to a different month than the statement it printed on
- any `P`/`R` row that did **not** match an invoice (there should be none)
- any position that closed out, and any new one
- what the shape of the chart now is (where cost basis and market value cross)

State plainly that the figures are unverified visually if you could not open the
page, and name what is worth looking at — a month with many trades on few days
crowds the event pins.

## Architecture worth knowing

- `src/data/portfolio.ts` is the contract and the loader; `portfolio.local.ts`
  is data only. The glob loader means a missing local file yields an empty
  portfolio and the deployed site renders its empty state — that is by design,
  not a bug to fix.
- `src/pages/Portfolio.tsx` is lazily routed, so Recharts (~400 kB) stays out of
  the initial bundle. Never import it or `PortfolioChart` from an eagerly loaded
  module.
- Chart colors come from `--viz-*` custom properties in `src/index.css`, defined
  for both `:root` and `.dark`. A new series takes the next `--viz-series-N`,
  and the palette is validated with the `dataviz` skill's
  `scripts/validate_palette.js` — don't eyeball it.
