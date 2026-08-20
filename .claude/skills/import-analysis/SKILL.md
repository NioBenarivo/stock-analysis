---
name: import-analysis
description: Convert a Markdown analysis/report into an MDX document in this reader. Use when asked to import, add, check, validate or convert a .md report (e.g. "check this TAPG analysis", "add GEMS to the site", "convert this markdown"). Handles the MDX escaping, frontmatter quoting and verification that these documents reliably need.
---

# Import a Markdown report into the reader

Turns a `.md` analysis into `src/content/<slug>.mdx`. Derived from seven real
conversions (TAPG, GEMS, AALI, NSSS, SSMS, STAA, BWPT). **Follow the order —
several steps exist because a shortcut failed in practice.**

Source reports usually live in `~/Documents/Claude/`. Never edit the original;
always copy into `src/content/`.

## The whole problem in one line

MDX reserves exactly two characters that plain Markdown does not: **`<`** starts
a component, **`{`** starts a JS expression. Everything else in Markdown behaves
identically. Both are inert inside fenced code blocks.

---

## 1. Locate and pre-flight scan

```bash
cd ~/Documents/Claude && file -I <NAME>.md && wc -lc <NAME>.md
```

Then the fence-aware hazard scan — run all four:

```bash
cd ~/Documents/Claude
echo "=== H1 ===";     grep -n '^# ' <NAME>.md
echo "=== braces ==="; awk '/^```/ { f = !f; next } /[{}]/ { printf "  %-5d %-8s : %s\n", NR, (f ? "INSIDE" : "outside"), substr($0,1,60) }' <NAME>.md
echo "=== angles ==="; awk '/^```/ { f = !f; next } /</  { printf "  %-5d %-8s : %s\n", NR, (f ? "INSIDE" : "outside"), substr($0,1,60) }' <NAME>.md
echo "=== head ===";   sed -n '1,10p' <NAME>.md
```

Read the results:

- **`INSIDE` rows need no action.** Fenced content is inert. Escaping it would
  print a visible `\` in the reader's ASCII diagrams.
- **`outside` rows must be escaped** (step 3).
- **Encoding:** `file -I` should say `charset=utf-8`. If a pasted copy looks like
  mojibake (`â`, `Ã`) but the file on disk is clean UTF-8, the corruption is in
  the paste, not the file. Ignore it.
- **The head** tells you the title, any `###` subtitle, and whether the title
  contains `:` or `**bold**` (step 4).

## 2. Copy in

```bash
cp ~/Documents/Claude/<NAME>.md src/content/<slug>.mdx
```

Slug = lowercase, hyphenated, no underscores: `TAPG_Analysis.md` →
`tapg-analysis.mdx`. **The filename is the URL** — no route to register.

## 3. Escape `<` outside code fences

Only if step 1 found `outside` rows.

```bash
perl -i -pe 'BEGIN{$f=0} if (/^```/) { $f = !$f } elsif (!$f) { s/(?<!\\)<(?=[0-9A-Za-z])/\\</g }' src/content/<slug>.mdx
```

**Use this exact form.** Do not use Perl's `..` flip-flop
(`unless /^```/ .. /^```/`) — it tests both ends on the same line, so every
fence opens and closes instantly and fence interiors are never protected. That
bug silently escaped two ASCII diagrams in AALI before it was caught.

Match `[0-9A-Za-z]`, not just digits. Real cases seen: `<5%`, `<1%`, `<4 yrs`,
`<0.4%`, `<US$5m`, `<Rp 2,000m`. The letter forms (`<US`, `<Rp`) are the
dangerous ones — MDX reads them as a tag name and hunts for a closing `>`.

Then **verify both sides**:

```bash
grep -n '\\<' src/content/<slug>.mdx          # should match only the outside rows
sed -n '<FENCED_LINE>p' src/content/<slug>.mdx # fenced lines must have NO backslash
```

`{` and `}` outside fences have not yet occurred in practice. If they do, wrap
the text in backticks or rewrite it — there is no escape that reads cleanly.

## 4. Frontmatter

Replace the `# Title` line, any `### subtitle`, and nothing else:

```yaml
---
title: "Full Title Here"
description: "One sentence — becomes the library card subtitle."
date: '2026-08-19'
tags: [analysis, palm-oil, idx]
---
```

**Quoting rules — these have caused two build failures:**

| Value contains | Use | Why |
|---|---|---|
| `: ` (e.g. `IDX: STAA`) | **double quotes** | YAML reads it as a nested mapping and the build dies |
| `'` (e.g. `group's`) | **double quotes** | single quotes would terminate early |
| `**bold**` | **strip the asterisks** | frontmatter is plain text; they'd render literally |
| anything else | quotes anyway | costs nothing, prevents surprises |

Always quote `date` — an unquoted YAML date can parse as a `Date` object.

**Delete the body's `# Title` line.** `Doc.tsx` renders `title` as the page
`<h1>`; leaving it prints the title twice. Keep `# 01 — MANAGEMENT`-style part
dividers — `H1` is styled for exactly that.

Only `title` is required. `draft: true` hides a document without deleting it.

## 5. Wire up cross-references (when present)

These reports often cite their siblings as bare `[AALI], [TAPG]` — Markdown
shortcut links with no definition, which render as literal brackets.

```bash
grep -n '\[AALI\]\|\[TAPG\]\|\[NSSS\]\|\[SSMS\]\|\[STAA\]\|\[GEMS\]\|\[BWPT\]' src/content/<slug>.mdx
```

If the target exists in `src/content/`, point it at the route:
`[AALI](/aali-analysis)`. The `Anchor` primitive routes `/`-prefixed links
through React Router. Mention it in the summary — it's a judgment call.

## 6. Build — quietly

The user does not want build output on success, and **never run `npm run lint`**
— `eslint.config.js` scopes to `**/*.{ts,tsx}` and cannot see `.mdx` at all.

```bash
SP=<scratchpad>; npm run build > $SP/build.log 2>&1
if [ $? -ne 0 ]; then echo "BUILD FAILED:"; grep -iE "error|Unexpected|YAML|mapping" $SP/build.log | head -8
else echo "build OK"; grep -E "<slug>|index-.*js" $SP/build.log; fi
```

The build is the only check that catches MDX breakage. Both historical failures
were invisible to static inspection:

- `904:53: Unexpected character '0' (U+0030) before name` — a bare `<0.4%`
- `Nested mappings are not allowed in compact mappings` — an unquoted `IDX: AALI`

## 7. Verify the compiled output

```bash
grep -o '<SOME_ESCAPED_PHRASE>[^`]*' dist/assets/<slug>-*.js | head -2
```

Escapes must appear as `<`, not `\<`. If a fenced diagram was wrongly escaped,
a stray backslash shows here.

---

## Reporting back

State plainly: what was escaped and why, what frontmatter quoting was needed,
anything left alone deliberately (fenced `<`), and the chunk sizes. If the
document needed nothing but frontmatter, say so — that is the good outcome and
it happens often.

## Architecture worth knowing

- Documents are **lazily loaded**, one chunk each. Adding a 130 kB report costs
  the initial bundle ~0.3 kB (its manifest entry only).
- That works because `src/lib/docs.ts` is the *only* importer of `.mdx` files.
  Frontmatter for the library page comes from `virtual:content-manifest`, a
  build-time plugin in `vite.config.ts` that reads the YAML off disk. **Never
  import a `.mdx` file elsewhere** — a module that is both statically and
  dynamically imported cannot be code-split, and the split fails silently.
- Components available in any document without importing are registered in
  `src/mdx/components.ts`.
