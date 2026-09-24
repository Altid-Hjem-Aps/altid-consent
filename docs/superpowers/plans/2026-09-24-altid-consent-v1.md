# altid-consent v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the consent sentences, version, state and checkbox component as one package owned by Altid Hjem, and move altidforsikring.dk onto it without any visible change.

**Architecture:** A small TypeScript package with two entry points: `altid-consent` (text, version, state, event names; no React, safe in server code and mails) and `altid-consent/react` (the `ConsentBlock` component, inline styles only). It is installed by git tag and built by npm's `prepare` on install. It never touches a database; sites map its `{ own, group }` flags onto their own columns.

**Tech Stack:** TypeScript 5.9.3 (`module`/`moduleResolution: NodeNext`), React 19 (peer), Vitest 4 + Testing Library + jsdom. Consumer: altid-forsikring-site (Next.js 16, React 19.2.4, Vitest 4).

**Spec:** `docs/design.md` in this repository. Read it first; this plan argues from it and corrects it in three places (see "Where v1 deliberately differs from the spec").

## Global Constraints

- Package name `altid-consent`, `"private": true` (never published to a registry), installed as `github:Altid-Hjem-Aps/altid-consent#<tag>`.
- React is a `peerDependency` (`^19.0.0`), never a `dependency` — two React copies break hooks.
- The package says `own` and `group`. The string `mad` must not appear anywhere in `src/`.
- The package never imports a database client and never names a column.
- No class names in the component. Inline styles only: Tailwind does not scan `node_modules`, so utility classes would silently not exist on consuming sites.
- The first template must reproduce altidforsikring.dk's live text exactly, character for character (its `CONSENT_VERSION` `2026-09-23.3-af`).
- `CONSENT_TEMPLATE_VERSION` is `'2026-09-24.1'`. Its recorded fingerprint is `dc1e8d91465fd571ae7d219741af411e70eb177b0d3514724556ac89770a871a`.
- Every relative import in `src/` ends in `.js` (NodeNext). The built output must load under plain Node ESM, because Vitest loads `node_modules` without transforming them.
- Nothing lands on `main` of this repository except through a PR approved by Altid Hjem. All Part A work happens on branch `v1`.
- In altid-forsikring-site, existing tests change only by import paths — with one named exception, the hard-coded version assertion (Task 7).
- Every commit ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Where v1 deliberately differs from the spec

Found while reading the code this plan moves. Task 5 writes these corrections into `docs/design.md`.

1. **The consent token stays in the sites for v1.** The spec says `lib/consent-token.ts` "lifts unchanged". It cannot: it is named `mad` throughout (`ConsentSet = { mad, group }`, and the confirm form posts `value="mad"`). Lifting it would carry `mad` into the one place built to be free of it, or force every site to rename first. It moves in once a site speaks `own`/`group` end to end.
2. **The confirmation mail body stays in the sites for v1.** The mail already quotes its consent sentences from each site's `lib/copy.ts`, which after adoption re-exports them from the package. Only the mail headings remain site-owned. With neither the token nor the mail in v1, there is no server code, so the entry points are text + react rather than client + server.
3. **Integration is three lines, not one.** The site holds the consent state because it needs it at submit: one `useState`, the component, and `consentFlags(...)` at submit.

Also found, and fixed separately in Task 6: altidforsikring.dk's confirmation mail heading for group-only consent still names the pre-PR-#18 brand set.

## File Structure

**altid-consent** (this repository, branch `v1`):

| File | Responsibility |
| --- | --- |
| `package.json` | name, exports map (`.` and `./react`), `prepare` build, peer React |
| `tsconfig.json` | typecheck for `src` and `test` (no emit) |
| `tsconfig.build.json` | emits `src` to `dist` |
| `vitest.config.ts`, `test/setup.ts` | jsdom + jest-dom |
| `.gitignore` | `node_modules/`, `dist/` |
| `src/brands.ts` | `FAMILY`, `Brand`, `BRAND_NAMES`, `listJoin` |
| `src/sentences.ts` | `consentSentences(brand)` |
| `src/version.ts` | `CONSENT_TEMPLATE_VERSION`, `consentVersion(brand)` |
| `src/state.ts` | `ConsentState`, `INITIAL_CONSENT`, `consentFlags` |
| `src/events.ts` | `CONSENT_EVENTS` |
| `src/index.ts` | text entry point (no React) |
| `src/react/ConsentBlock.tsx` | the component (`'use client'`) |
| `src/react/index.ts` | react entry point |
| `test/sentences.test.ts` | exact Forsikring text, second brand, own+group = all |
| `test/version.test.ts` | fingerprint guard, brand suffix |
| `test/state.test.ts` | flag truth table |
| `test/consent-block.test.tsx` | component behaviour |
| `README.md` | adoption guide |
| `DECISIONS.md` | the rules and why |
| `CHANGELOG.md` | exact text of every version |
| `docs/design.md` | spec; corrected in Task 5 |

**altid-forsikring-site** (`/Users/kristofferhimmelstrup/Documents/repos/altid-forsikring-site`, branch `consent/unifiedconsent`):

| File | Change |
| --- | --- |
| `emails/consent-confirm.ts` | Task 6: fix the group-only heading |
| `test/consent-confirm-mail.test.ts` | Task 6: new |
| `package.json`, `package-lock.json` | Tasks 7, 9: the dependency |
| `lib/copy.ts` | Task 7: consent constants re-exported from the package |
| `test/waitlist-form.test.tsx` | Task 7: the one version assertion |
| `components/WaitlistForm.tsx` | Task 8: `ConsentBox` replaced by `ConsentBlock` |

---

# Part A — the package

All Part A commands run in `/Users/kristofferhimmelstrup/Documents/repos/altid-consent` on branch `v1`.

### Task 1: Scaffold, brands and sentences

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.build.json`, `vitest.config.ts`, `.gitignore`, `test/setup.ts`
- Create: `src/brands.ts`, `src/sentences.ts`, `src/index.ts`
- Test: `test/sentences.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `FAMILY: readonly ['forsikring', 'energi', 'mobil', 'mad']`
  - `type Brand = 'forsikring' | 'energi' | 'mobil' | 'mad'`
  - `BRAND_NAMES: Record<Brand, string>`
  - `listJoin(items: readonly string[]): string`
  - `type ConsentSentences = { all; own; group; withdraw; narrowLink; broadLink }` (all `string`, in that key order)
  - `consentSentences(brand: Brand): ConsentSentences`

- [ ] **Step 1: Create the tooling files**

`package.json`:

```json
{
  "name": "altid-consent",
  "version": "1.0.0",
  "description": "Marketing consent for every Altid landing page, decided once at Altid Hjem level",
  "private": true,
  "license": "UNLICENSED",
  "type": "module",
  "files": ["dist"],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./react": { "types": "./dist/react/index.d.ts", "import": "./dist/react/index.js" }
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "prepare": "npm run build",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^20",
    "@types/react": "^19",
    "@vitejs/plugin-react": "^6.0.2",
    "jsdom": "^29.1.1",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "typescript": "5.9.3",
    "vitest": "^4.1.8"
  }
}
```

`prepare` is what makes a git-tag install work: npm installs a git dependency's devDependencies, runs `prepare`, and keeps only `files` (`dist`).

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "strict": true,
    "declaration": true,
    "outDir": "dist",
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src", "test"]
}
```

`tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "rootDir": "src",
    "noEmit": false
  },
  "include": ["src"]
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
  },
})
```

`test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())
```

`.gitignore`:

```
node_modules/
dist/
```

- [ ] **Step 2: Install**

Run: `npm install --no-fund --no-audit`
Expected: `added … packages`, and a `package-lock.json` appears. The `prepare` build fails here because `src/` is empty — that is expected; ignore it until Step 5.

- [ ] **Step 3: Write the failing test**

`test/sentences.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { BRAND_NAMES, FAMILY, listJoin } from '../src/brands.js'
import { consentSentences } from '../src/sentences.js'

describe('consentSentences', () => {
  // The first template must reproduce altidforsikring.dk's live text exactly
  // (its CONSENT_VERSION 2026-09-23.3-af), so adopting the package changes
  // nothing a visitor can read.
  it('reproduces the live Forsikring text character for character', () => {
    expect(consentSentences('forsikring')).toEqual({
      all: 'Ja tak til nyt og gode tilbud på mail fra Altid Hjem og hele familien: Forsikring, Energi, Mobil og Mad.',
      own: 'Ja tak til nyt og gode tilbud på mail om Altid Forsikring fra Altid Hjem.',
      group: 'Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: Energi, Mobil og Mad.',
      withdraw: 'Afmeld når som helst',
      narrowLink: 'Kun Forsikring? Skift her',
      broadLink: 'Hele familien igen? Skift her',
    })
  })

  it('writes a second brand without a Forsikring assumption leaking in', () => {
    const mad = consentSentences('mad')
    expect(mad.own).toBe('Ja tak til nyt og gode tilbud på mail om Altid Mad fra Altid Hjem.')
    expect(mad.group).toBe(
      'Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: Forsikring, Energi og Mobil.',
    )
    expect(mad.narrowLink).toBe('Kun Mad? Skift her')
  })

  it('shows every brand the same broad sentence', () => {
    const broad = new Set([...FAMILY].map((b) => consentSentences(b).all))
    expect(broad.size).toBe(1)
  })

  // The invariant PR #18 left unguarded: own + group must name exactly the
  // brands `all` names. If they drift, a confirmation mail quotes a consent
  // other than the one the person ticked.
  it.each([...FAMILY])('%s: own and group together cover exactly what all covers', (brand) => {
    const s = consentSentences(brand)
    for (const b of FAMILY) {
      const name = BRAND_NAMES[b]
      expect(s.all).toContain(name)
      expect(s.own.includes(`Altid ${name}`) || s.group.includes(name)).toBe(true)
    }
    expect(s.group).not.toContain(BRAND_NAMES[brand])
    expect(s.own).toContain('fra Altid Hjem')
    expect(s.group).toContain('fra Altid Hjem')
  })
})

describe('listJoin', () => {
  it('joins the Danish way', () => {
    expect(listJoin(['A'])).toBe('A')
    expect(listJoin(['A', 'B'])).toBe('A og B')
    expect(listJoin(['A', 'B', 'C'])).toBe('A, B og C')
  })
})
```

- [ ] **Step 4: Run it to see it fail**

Run: `npx vitest run test/sentences.test.ts`
Expected: FAIL — `Failed to resolve import "../src/brands.js"`.

- [ ] **Step 5: Implement**

`src/brands.ts`:

```ts
// The Altid family, in the order every sentence lists it. Altid Hjem is not a
// member: it is the parent and the sender, named in every sentence as "fra
// Altid Hjem". Adding a brand here changes what "hele familien" covers, which
// is a new consent scope: bump CONSENT_TEMPLATE_VERSION (src/version.ts).
export const FAMILY = ['forsikring', 'energi', 'mobil', 'mad'] as const

export type Brand = (typeof FAMILY)[number]

export const BRAND_NAMES: Record<Brand, string> = {
  forsikring: 'Forsikring',
  energi: 'Energi',
  mobil: 'Mobil',
  mad: 'Mad',
}

/** Danish list: "A", "A og B", "A, B og C". */
export function listJoin(items: readonly string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} og ${items[items.length - 1]}`
}
```

`src/sentences.ts`:

```ts
import { BRAND_NAMES, FAMILY, listJoin, type Brand } from './brands.js'

export type ConsentSentences = {
  /** Altid Hjem and every brand in the family. The default view. */
  all: string
  /** This site's own brand only. Stored as the `own` flag. */
  own: string
  /** Altid Hjem and every brand except this one. Stored as the `group` flag. */
  group: string
  withdraw: string
  /** Shown while `all` is showing; switches to `own`. */
  narrowLink: string
  /** Shown while `own` is showing; switches back to `all`. */
  broadLink: string
}

// `own` and `group` stay whole sentences on purpose: a site's confirmation mail
// quotes one of them as the consent itself — clicking the link in that mail IS
// the act of consenting — so neither may ever become a fragment. Together they
// cover exactly what `all` covers (test/sentences.test.ts enforces it).
//
// Key order matters: test/version.test.ts fingerprints this object.
export function consentSentences(brand: Brand): ConsentSentences {
  const name = BRAND_NAMES[brand]
  const everyone = FAMILY.map((b) => BRAND_NAMES[b])
  const rest = FAMILY.filter((b) => b !== brand).map((b) => BRAND_NAMES[b])
  return {
    all: `Ja tak til nyt og gode tilbud på mail fra Altid Hjem og hele familien: ${listJoin(everyone)}.`,
    own: `Ja tak til nyt og gode tilbud på mail om Altid ${name} fra Altid Hjem.`,
    group: `Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: ${listJoin(rest)}.`,
    withdraw: 'Afmeld når som helst',
    narrowLink: `Kun ${name}? Skift her`,
    broadLink: 'Hele familien igen? Skift her',
  }
}
```

`src/index.ts`:

```ts
export { BRAND_NAMES, FAMILY, type Brand } from './brands.js'
export { consentSentences, type ConsentSentences } from './sentences.js'
```

- [ ] **Step 6: Run the tests and typecheck**

Run: `npx vitest run test/sentences.test.ts && npm run typecheck`
Expected: `Tests  8 passed (8)`, then no typecheck output.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.build.json vitest.config.ts .gitignore test/setup.ts test/sentences.test.ts src/brands.ts src/sentences.ts src/index.ts
git commit -F - <<'EOF'
Generate consent sentences per brand from one family list

Every Altid landing page gets its sentences from here instead of a
hand-written copy. The first template reproduces altidforsikring.dk's
live text character for character, and a test asserts it, so adopting
the package changes nothing a visitor can read.

Also guards the invariant PR #18 left open: the own and group sentences
together name exactly the brands the broad sentence names.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 2: Derived version, fingerprint guard, CHANGELOG

**Files:**
- Create: `src/version.ts`, `CHANGELOG.md`
- Modify: `src/index.ts`
- Test: `test/version.test.ts`

**Interfaces:**
- Consumes: `FAMILY`, `consentSentences` (Task 1).
- Produces:
  - `CONSENT_TEMPLATE_VERSION: '2026-09-24.1'`
  - `consentVersion(brand: Brand): string` → `` `${CONSENT_TEMPLATE_VERSION}-${brand}` ``

- [ ] **Step 1: Write the failing test**

`test/version.test.ts`:

```ts
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { FAMILY } from '../src/brands.js'
import { consentSentences } from '../src/sentences.js'
import { CONSENT_TEMPLATE_VERSION, consentVersion } from '../src/version.js'

// sha256 of every sentence for every brand, per template version. This is what
// makes a shared package safe for legally binding text: change a sentence or
// the family without bumping CONSENT_TEMPLATE_VERSION and this fails.
//
// To make a deliberate change: bump the version, add its exact text to
// CHANGELOG.md, then add the new fingerprint here (the failure prints it).
// Never edit or remove an existing entry.
const RECORDED: Record<string, string> = {
  '2026-09-24.1': 'dc1e8d91465fd571ae7d219741af411e70eb177b0d3514724556ac89770a871a',
}

function fingerprint(): string {
  const everything = FAMILY.map((b) => [b, consentSentences(b)])
  return createHash('sha256').update(JSON.stringify(everything)).digest('hex')
}

describe('template version', () => {
  it('matches the recorded fingerprint of the current text', () => {
    const actual = fingerprint()
    expect(
      RECORDED[CONSENT_TEMPLATE_VERSION],
      `The consent text changed without a new version, or the new version is not recorded. ` +
        `Bump CONSENT_TEMPLATE_VERSION, record the text in CHANGELOG.md, then add ` +
        `'${CONSENT_TEMPLATE_VERSION}': '${actual}' here.`,
    ).toBe(actual)
  })

  it('suffixes the brand, so every stored row names its landing page', () => {
    expect(consentVersion('forsikring')).toBe(`${CONSENT_TEMPLATE_VERSION}-forsikring`)
    expect(consentVersion('mad')).toBe(`${CONSENT_TEMPLATE_VERSION}-mad`)
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run test/version.test.ts`
Expected: FAIL — `Failed to resolve import "../src/version.js"`.

- [ ] **Step 3: Implement**

`src/version.ts`:

```ts
import type { Brand } from './brands.js'

// The version of the consent TEMPLATE: every sentence in sentences.ts and the
// family list in brands.ts. Changing either changes what people accept, so it
// moves this. test/version.test.ts refuses a text change that does not, and
// CHANGELOG.md records the exact text of every version.
export const CONSENT_TEMPLATE_VERSION = '2026-09-24.1'

/**
 * What a site stores with each consent: the template version plus the brand.
 * Sites never write one by hand. The suffix makes every row say which landing
 * page it came from, so the separate signup databases stay comparable.
 */
export function consentVersion(brand: Brand): string {
  return `${CONSENT_TEMPLATE_VERSION}-${brand}`
}
```

`src/index.ts`:

```ts
export { BRAND_NAMES, FAMILY, type Brand } from './brands.js'
export { consentSentences, type ConsentSentences } from './sentences.js'
export { CONSENT_TEMPLATE_VERSION, consentVersion } from './version.js'
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run test/version.test.ts`
Expected: `Tests  2 passed (2)`.

If the fingerprint test fails, **do not paste the printed hash into `RECORDED`.** The recorded value was computed from the exact sentences in Task 1; a mismatch means `src/sentences.ts` differs from them. Diff it against Task 1 Step 5 and fix the sentences.

- [ ] **Step 5: Write the CHANGELOG**

`CHANGELOG.md`:

```markdown
# Changelog

The exact consent text of every template version. A stored `consent_version` is
only proof of what a person accepted if you can show what that version said, so
every version is recorded here in full and never edited afterwards.

Stored versions are `<template version>-<brand>`, e.g. `2026-09-24.1-forsikring`.
Versions from before this package (e.g. `2026-07-14.2-mad`, `2026-09-23.3-af`)
were site-specific; their text lives in each site's git history.

## 2026-09-24.1

First template. Reproduces altidforsikring.dk's text exactly as it stood under
that site's own version `2026-09-23.3-af`: a row stored as `2026-09-23.3-af` and a
row stored as `2026-09-24.1-forsikring` accepted identical wording.

Family, in order: Forsikring, Energi, Mobil, Mad. Sender: Altid Hjem.

Broad sentence (`all`), the same for every brand:

> Ja tak til nyt og gode tilbud på mail fra Altid Hjem og hele familien: Forsikring, Energi, Mobil og Mad.

Withdraw line: `Afmeld når som helst`. Link back to the broad sentence: `Hele familien igen? Skift her`.

### forsikring

- own: Ja tak til nyt og gode tilbud på mail om Altid Forsikring fra Altid Hjem.
- group: Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: Energi, Mobil og Mad.
- narrow link: Kun Forsikring? Skift her

### energi

- own: Ja tak til nyt og gode tilbud på mail om Altid Energi fra Altid Hjem.
- group: Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: Forsikring, Mobil og Mad.
- narrow link: Kun Energi? Skift her

### mobil

- own: Ja tak til nyt og gode tilbud på mail om Altid Mobil fra Altid Hjem.
- group: Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: Forsikring, Energi og Mad.
- narrow link: Kun Mobil? Skift her

### mad

- own: Ja tak til nyt og gode tilbud på mail om Altid Mad fra Altid Hjem.
- group: Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: Forsikring, Energi og Mobil.
- narrow link: Kun Mad? Skift her
```

- [ ] **Step 6: Verify the CHANGELOG matches the code**

Run:

```bash
for b in forsikring energi mobil mad; do npx tsx -e "import('./src/sentences.ts').then(m => { const s = m.consentSentences('$b'); console.log(s.own); console.log(s.group); console.log(s.narrowLink) })"; done | while IFS= read -r line; do grep -qF -- "$line" CHANGELOG.md && echo "ok   $line" || echo "MISSING $line"; done
```

Expected: 12 lines, all starting `ok`. (`npx tsx` downloads tsx on first use.)

- [ ] **Step 7: Run everything and commit**

Run: `npm test && npm run typecheck`
Expected: `Tests  10 passed (10)`.

```bash
git add src/version.ts src/index.ts test/version.test.ts CHANGELOG.md
git commit -F - <<'EOF'
Derive the stored consent version, and refuse text changes without one

Sites store consentVersion(brand), the template version plus the brand,
and never write a version by hand. A fingerprint test fails if any
sentence or the family list changes without a new template version, so
the stored proof of what each person accepted cannot drift from the
wording. CHANGELOG.md records the exact text of every version, which is
what makes a stored version string mean something.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 3: Consent state, event names and the component

**Files:**
- Create: `src/state.ts`, `src/events.ts`, `src/react/ConsentBlock.tsx`, `src/react/index.ts`
- Modify: `src/index.ts`
- Test: `test/state.test.ts`, `test/consent-block.test.tsx`

**Interfaces:**
- Consumes: `Brand` (Task 1), `consentSentences` (Task 1).
- Produces:
  - `type ConsentScope = 'all' | 'own'`
  - `type ConsentState = { checked: boolean; scope: ConsentScope }`
  - `INITIAL_CONSENT: ConsentState` = `{ checked: false, scope: 'all' }`
  - `consentFlags(state: ConsentState): { own: boolean; group: boolean }`
  - `CONSENT_EVENTS = { given: 'Consent Given', scopeChanged: 'Consent Scope Changed' }`
  - `type ConsentColors = { text: string; muted: string; accent: string }`
  - `ConsentBlock(props: { brand: Brand; value: ConsentState; onChange: (next: ConsentState) => void; dark?: boolean; colors?: Partial<ConsentColors> })`, exported from `altid-consent/react`

- [ ] **Step 1: Write the failing tests**

`test/state.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { INITIAL_CONSENT, consentFlags } from '../src/state.js'

describe('consentFlags', () => {
  it('starts unticked on the broad sentence', () => {
    expect(INITIAL_CONSENT).toEqual({ checked: false, scope: 'all' })
    expect(consentFlags(INITIAL_CONSENT)).toEqual({ own: false, group: false })
  })

  it('broad sentence ticked: both flags', () => {
    expect(consentFlags({ checked: true, scope: 'all' })).toEqual({ own: true, group: true })
  })

  it('narrow sentence ticked: own only', () => {
    expect(consentFlags({ checked: true, scope: 'own' })).toEqual({ own: true, group: false })
  })

  it('unticked on the narrow sentence: nothing', () => {
    expect(consentFlags({ checked: false, scope: 'own' })).toEqual({ own: false, group: false })
  })
})
```

`test/consent-block.test.tsx`:

```tsx
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ConsentBlock } from '../src/react/ConsentBlock.js'
import { consentSentences } from '../src/sentences.js'
import { INITIAL_CONSENT, consentFlags, type ConsentState } from '../src/state.js'
import type { Brand } from '../src/brands.js'

// Sites own the state because they need it at submit, so the tests drive the
// component the same way a site does.
function Harness({ brand, onState }: { brand: Brand; onState?: (s: ConsentState) => void }) {
  const [value, setValue] = useState(INITIAL_CONSENT)
  return (
    <ConsentBlock
      brand={brand}
      value={value}
      onChange={(next) => {
        setValue(next)
        onState?.(next)
      }}
    />
  )
}

const F = consentSentences('forsikring')

describe('ConsentBlock', () => {
  it('shows the broad sentence with the box never pre-ticked', () => {
    render(<Harness brand="forsikring" />)
    expect(screen.getByText(F.all)).toBeVisible()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('narrows to this brand and back via the text link', () => {
    render(<Harness brand="forsikring" />)
    fireEvent.click(screen.getByRole('button', { name: F.narrowLink }))
    expect(screen.getByText(F.own)).toBeVisible()
    expect(screen.queryByText(F.all)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: F.broadLink }))
    expect(screen.getByText(F.all)).toBeVisible()
  })

  it('clears an existing tick when the scope switches', () => {
    const seen: ConsentState[] = []
    render(<Harness brand="forsikring" onState={(s) => seen.push(s)} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('checkbox')).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: F.narrowLink }))
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(consentFlags(seen[seen.length - 1])).toEqual({ own: false, group: false })
  })

  it('reports the flags a site stores', () => {
    const seen: ConsentState[] = []
    render(<Harness brand="forsikring" onState={(s) => seen.push(s)} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(consentFlags(seen[seen.length - 1])).toEqual({ own: true, group: true })
    fireEvent.click(screen.getByRole('button', { name: F.narrowLink }))
    fireEvent.click(screen.getByRole('checkbox'))
    expect(consentFlags(seen[seen.length - 1])).toEqual({ own: true, group: false })
  })

  it('describes the box with the withdraw line', () => {
    render(<Harness brand="forsikring" />)
    const id = screen.getByRole('checkbox').getAttribute('aria-describedby')
    expect(id).toBeTruthy()
    expect(document.getElementById(id!)).toHaveTextContent(F.withdraw)
  })

  it('never lets the scope link submit a surrounding form', () => {
    render(<Harness brand="forsikring" />)
    expect(screen.getByRole('button', { name: F.narrowLink })).toHaveAttribute('type', 'button')
  })

  it('speaks for whichever brand the site is', () => {
    render(<Harness brand="mad" />)
    expect(screen.getByRole('button', { name: 'Kun Mad? Skift her' })).toBeInTheDocument()
  })

  it('uses no class names, since Tailwind cannot see into node_modules', () => {
    const { container } = render(<Harness brand="forsikring" />)
    expect(container.querySelector('[class]')).toBeNull()
  })
})
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run test/state.test.ts test/consent-block.test.tsx`
Expected: FAIL — `Failed to resolve import "../src/state.js"` and `"../src/react/ConsentBlock.js"`.

- [ ] **Step 3: Implement state and events**

`src/state.ts`:

```ts
export type ConsentScope = 'all' | 'own'

export type ConsentState = { checked: boolean; scope: ConsentScope }

/** Unticked, broad sentence showing. The box is NEVER pre-ticked. */
export const INITIAL_CONSENT: ConsentState = { checked: false, scope: 'all' }

/**
 * The two flags a site stores. The package never names a column: each site maps
 * these onto its own (altidforsikring.dk still calls `own` marketing_consent_mad).
 */
export function consentFlags(state: ConsentState): { own: boolean; group: boolean } {
  return { own: state.checked, group: state.checked && state.scope === 'all' }
}
```

`src/events.ts`:

```ts
// Analytics event names, identical on every landing page, so consent can be
// compared across sites later without reconciling three vocabularies. The
// package sends nothing: each site passes these to its own tracker, with the
// properties { brand, scope }.
export const CONSENT_EVENTS = {
  given: 'Consent Given',
  scopeChanged: 'Consent Scope Changed',
} as const
```

`src/index.ts`:

```ts
export { BRAND_NAMES, FAMILY, type Brand } from './brands.js'
export { consentSentences, type ConsentSentences } from './sentences.js'
export { CONSENT_TEMPLATE_VERSION, consentVersion } from './version.js'
export { INITIAL_CONSENT, consentFlags, type ConsentScope, type ConsentState } from './state.js'
export { CONSENT_EVENTS } from './events.js'
```

- [ ] **Step 4: Implement the component**

`src/react/ConsentBlock.tsx`:

```tsx
'use client'

import { useId, type CSSProperties } from 'react'
import type { Brand } from '../brands.js'
import { consentSentences } from '../sentences.js'
import type { ConsentState } from '../state.js'

export type ConsentColors = { text: string; muted: string; accent: string }

// Defaults are altidforsikring.dk's, so it renders exactly as before adoption.
// Other sites override what differs — usually just `accent`.
const LIGHT: ConsentColors = { text: '#6f6a61', muted: '#6f6a61', accent: '#448df5' }
const DARK: ConsentColors = { text: 'rgba(255,255,255,0.7)', muted: 'rgba(255,255,255,0.6)', accent: '#a7d3f9' }

export type ConsentBlockProps = {
  brand: Brand
  value: ConsentState
  onChange: (next: ConsentState) => void
  dark?: boolean
  colors?: Partial<ConsentColors>
}

// One active, never pre-ticked, optional box. The broad sentence shows by
// default; a text link swaps to this brand alone. Switching clears the tick, so
// a person can only consent to the sentence they are looking at. DECISIONS.md
// says why each of these is so.
//
// Inline styles only: Tailwind does not scan node_modules, so utility classes in
// a package would silently not exist on the sites that install it. The values
// reproduce the classes altidforsikring.dk used (text-xs, text-[11px],
// leading-relaxed, gap-1, gap-2.5, mt-4, mb-3, underline-offset-2).
export function ConsentBlock({ brand, value, onChange, dark = false, colors }: ConsentBlockProps) {
  const c = { ...(dark ? DARK : LIGHT), ...colors }
  const s = consentSentences(brand)
  const boxId = useId()
  const withdrawId = useId()
  const sentence = value.scope === 'all' ? s.all : s.own
  const linkLabel = value.scope === 'all' ? s.narrowLink : s.broadLink

  const wrap: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 16, marginBottom: 12, textAlign: 'left' }
  const row: CSSProperties = { display: 'flex', gap: 10, alignItems: 'flex-start' }
  const box: CSSProperties = { width: 17, height: 17, marginTop: 2, flexShrink: 0, accentColor: c.accent, cursor: 'pointer' }
  const label: CSSProperties = { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.45, color: c.text, cursor: 'pointer' }
  const second: CSSProperties = { fontSize: 11, fontWeight: 400, lineHeight: 1.625, color: c.muted, opacity: 0.85, margin: '0 0 0 27px' }
  const link: CSSProperties = {
    color: c.muted,
    background: 'transparent',
    border: 0,
    padding: 0,
    font: 'inherit',
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: 2,
  }

  return (
    <div style={wrap}>
      <div style={row}>
        <input
          id={boxId}
          type="checkbox"
          checked={value.checked}
          onChange={(e) => onChange({ ...value, checked: e.target.checked })}
          aria-describedby={withdrawId}
          style={box}
        />
        {/* htmlFor rather than wrapping: keeps the tick target and the reading
            target the same rectangle without nesting interactive elements. */}
        <label htmlFor={boxId} style={label}>
          {sentence}
        </label>
      </div>
      {/* Smaller and lighter than the sentence, so the eye reads one sentence,
          not a block of terms. */}
      <p id={withdrawId} style={second}>
        {s.withdraw}
        <span aria-hidden="true" style={{ margin: '0 8px' }}>·</span>
        <button
          type="button"
          onClick={() => onChange({ checked: false, scope: value.scope === 'all' ? 'own' : 'all' })}
          style={link}
        >
          {linkLabel}
        </button>
      </p>
    </div>
  )
}
```

`src/react/index.ts`:

```ts
export { ConsentBlock, type ConsentBlockProps, type ConsentColors } from './ConsentBlock.js'
```

- [ ] **Step 5: Run everything**

Run: `npm test && npm run typecheck`
Expected: `Tests  22 passed (22)`, no typecheck output.

- [ ] **Step 6: Prove `mad` never entered the package**

Run: `grep -rni "\bmad\b" src/ | grep -viE "'mad'|mad: 'Mad'|Altid Mad|brands.ts"`
Expected: no output. (`'mad'` as a brand key and "Altid Mad" as a brand name are fine; `mad` as a flag name is not.)

- [ ] **Step 7: Commit**

```bash
git add src/state.ts src/events.ts src/index.ts src/react/ConsentBlock.tsx src/react/index.ts test/state.test.ts test/consent-block.test.tsx
git commit -F - <<'EOF'
Add the consent checkbox as one component for every site

The rules that were re-argued per site now live in one component: never
pre-ticked, broad sentence by default, one visible click to narrow, and
switching scope clears the tick. The site holds the state, since it
needs it at submit, and reads the two flags with consentFlags().

Inline styles only. Tailwind does not scan node_modules, so utility
classes here would silently not exist on the sites that install it.
The values reproduce the classes altidforsikring.dk used, so adoption
looks the same.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 4: Prove it installs as a git dependency

The whole distribution model rests on npm building the package from a git tag with no registry. This task proves it before any site depends on it. It commits nothing unless a fix is needed.

**Files:** none, unless a check fails.

**Interfaces:**
- Consumes: everything from Tasks 1–3.
- Produces: confidence that `github:Altid-Hjem-Aps/altid-consent#<ref>` installs and loads under plain Node ESM.

- [ ] **Step 1: Build and inspect the output**

Run:

```bash
npm run build
head -1 dist/react/ConsentBlock.js
grep -rlE "from ['\"]react" dist --include=*.js | grep -v '/react/' || echo "text entry is React-free"
```

Expected: the first line is the `use client` directive (quote style may differ), then `text entry is React-free`. If the directive is missing, Next.js would treat the component as a server component and fail at runtime.

- [ ] **Step 2: Install it the way a site will, from git**

`npm install` from `git+file://` clones the committed state, installs devDependencies, runs `prepare`, and keeps only `dist` — the same path as a GitHub tag. Everything must be committed first.

Run:

```bash
REPO=$(git rev-parse --show-toplevel)
git status --short   # must print nothing
C=$(mktemp -d) && cd "$C" && npm init -y >/dev/null \
  && npm install --no-fund --no-audit react@19.2.4 react-dom@19.2.4 "git+file://$REPO#v1" \
  && ls node_modules/altid-consent \
  && node --input-type=module -e "import('altid-consent').then(m => console.log(m.consentVersion('forsikring')))" \
  && node --input-type=module -e "import('altid-consent/react').then(m => console.log(typeof m.ConsentBlock))"
```

Expected: `ls` shows only `dist` and `package.json`, then `2026-09-24.1-forsikring`, then `function`.

- [ ] **Step 3: If anything failed, fix, re-run Steps 1–2, and commit the fix**

Commit only if a file changed, with a message saying which check failed and why.

---

### Task 5: Documentation, spec corrections, pull request

**Files:**
- Modify: `README.md`, `docs/design.md`
- Create: `DECISIONS.md`

**Interfaces:**
- Consumes: the public API from Tasks 1–3, exactly as named there.
- Produces: a PR from `v1` into `main`.

- [ ] **Step 1: Replace `README.md` entirely**

````markdown
# altid-consent

Marketing consent for every Altid landing page, decided once at Altid Hjem level.

A site says which brand it is. The sentences, the family of brands, the rules and
the version live here. When consent changes, it changes here, and every site
picks it up with a version bump.

- **Why it works this way:** [DECISIONS.md](DECISIONS.md)
- **What every version said, word for word:** [CHANGELOG.md](CHANGELOG.md)
- **The design behind it:** [docs/design.md](docs/design.md)

## Install

```bash
npm install "github:Altid-Hjem-Aps/altid-consent#v1.0.0"
```

Installed by git tag, not from a registry: no tokens, no `.npmrc`. npm builds the
package on install. React 19 is a peer dependency.

## Use it

```tsx
import { INITIAL_CONSENT, consentFlags, consentVersion } from 'altid-consent'
import { ConsentBlock } from 'altid-consent/react'

const [consentState, setConsentState] = useState(INITIAL_CONSENT)

<ConsentBlock brand="mad" value={consentState} onChange={setConsentState} />

// at submit
const { own, group } = consentFlags(consentState)
const version = consentVersion('mad')
```

`brand` is one of `forsikring`, `energi`, `mobil`, `mad`. Your form holds the
state because it needs it at submit. `dark` switches to the dark-background
colours; `colors={{ accent: '#dcd799' }}` overrides what differs on your site
(that one is Altid Mad's mint).

The component uses inline styles only. Tailwind does not scan `node_modules`, so
utility classes in a package would silently not exist on your site.

`altid-consent` has no React in it, so server code and mails can import the
sentences from it directly.

## Store it

The package never touches your database and never knows a column name. Map the
flags in your own code:

```ts
marketing_consent_own:   own,
marketing_consent_group: group,
consent_version:         consentVersion('mad'),
```

`own` is your brand. `group` is Altid Hjem and the rest of the family. Store
`consentVersion(brand)` with every consent and never write a version by hand: it
is the template version plus your brand, e.g. `2026-09-24.1-mad`, so every row
proves which wording was accepted and which landing page it came from.

## Adopting on an existing site

| Delete | Replace with |
| --- | --- |
| your consent checkbox component | `<ConsentBlock>` |
| its `useState`s (checked, scope) | one `useState(INITIAL_CONSENT)` |
| hand-written consent sentences and `CONSENT_VERSION` in `lib/copy.ts` | re-exports of `consentSentences(brand)` and `consentVersion(brand)` |

Keep your constant names if other files import them: re-export the package's
values under the old names and nothing else in your site has to change. Keep
your column names too; renaming is optional and never a condition of adopting.

**How to know it worked:** run your existing test suite. The only assertions
that may change are ones that hard-code a version string. If anything else needs
editing beyond import paths, the adoption is wrong — that is the signal, not an
obstacle to work around.

**What stays yours:** the signup route, `db.ts`, the confirmation mail and its
headings, the consent token, the preference centre, your column names.

## Starting a new site (Energi, Mobil)

Nothing to delete. Add the flags next to your signup data, for example:

```sql
alter table public.signup
  add column marketing_consent_own   boolean,
  add column marketing_consent_group boolean,
  add column consent_version         text,
  add column consent_at              timestamptz;
```

Then use the component as above.

## Upgrading

A new consent version arrives as a new tag. Point your dependency at it, run your
tests, deploy. Showing new text needs a deploy anyway, so that is the whole job.
An update bot can open that PR for you: Renovate supports dependencies pinned to
a git tag; check whether Dependabot does before relying on it.

## Changing consent

Only through a pull request here, approved by Altid Hjem (`CODEOWNERS`). For any
change to a sentence or the family list:

1. Bump `CONSENT_TEMPLATE_VERSION` in `src/version.ts`.
2. Record the exact new text in `CHANGELOG.md`.
3. Record the new fingerprint in `test/version.test.ts` — the failing test prints it.
4. After merge, tag the release (`vX.Y.Z`) so sites can point at it.

Adding a brand to the family is a new consent scope: people who consented under
an earlier version did not consent to the new brand, and their stored version
proves it.

Keep this repository public. The organisation is on GitHub Free, where branch
protection and required code-owner review exist only on public repositories;
making it private would silently drop the rule that consent goes through Altid
Hjem.

## If you rename your columns later

- Never a bare `ALTER TABLE … RENAME COLUMN`: the deployed code keeps using the
  old name for as long as the deploy takes, and every write in that window is a
  lost consent. Add the new column, backfill, deploy code writing both, stop
  writing the old, drop it.
- An RPC parameter named after the old column gets a new function signature
  alongside the old one, not an in-place edit.
- Confirmation links already in inboxes survive: the token encodes the flags by
  position, not by name.
- Form values do not: a preference page already open in a browser still posts
  the old name after your server has moved on. Accept both for a while.

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
```
````

- [ ] **Step 2: Create `DECISIONS.md`**

```markdown
# Decisions

Why consent works the way it does on every Altid landing page. To deviate, argue
with the reason, not with a blank page — and take it to Altid Hjem, not to one
brand.

## The box is never pre-ticked

Whichever sentence is showing. A pre-ticked box is not consent (CJEU, Planet49),
and "pre-ticked, but only for the narrow scope" is still pre-ticked.

## Refusing is exactly as easy as accepting

Leave the box unticked; nothing else is asked. Consent is never a condition for
joining a waitlist (GDPR art. 7(4), koblingsforbud).

## The broad sentence is the default; narrowing costs one visible click

One sentence covering the family reads as an invitation. The earlier layouts —
two near-identical boxes, then a lead plus two labelled boxes — read as a wall
of terms, and people stopped before the button. Anyone who wants less sees the
link right under the box.

## Switching scope clears the tick

A person can only consent to the sentence they are looking at. Without this, a
tick given to one sentence would silently carry over to another.

## The per-flag sentences are whole sentences

A site's confirmation mail quotes the `own` or `group` sentence as the consent
itself — clicking the link in that mail IS the act of consenting. A fragment
like "Om Altid Forsikring" would not stand on its own there. Together, `own` and
`group` cover exactly what the broad sentence covers; a test enforces it.

## The sender is named in the sentence

"fra Altid Hjem". The legal entity and CVR live in each site's footer and
privacy policy; a legal suffix in a family-facing sentence made it read like a
contract. Every brand is still named in full, which is what the spam guidance
requires.

## Versions derive from the template

Nobody writes a version by hand. Change the wording or the family and the
version moves, so the stored proof of what each person accepted moves with it.
A test refuses a text change that does not bump the version.

## The package never touches a database

It returns `{ own, group }`; each site maps that onto its own columns. A config
string naming a column can disagree with the database without the compiler
noticing, and on these tables a failed write is a lost consent that cannot be
reconstructed.
```

- [ ] **Step 3: Correct `docs/design.md` where v1 differs**

Replace the status line

```
Status: design, awaiting approval. No package code yet.
```

with

```
Status: approved. v1 implemented per docs/superpowers/plans/2026-09-24-altid-consent-v1.md, which corrects this document in the three places marked below.
```

Replace the entry-points bullet

```
- **Two entry points.** `altid-consent` for the browser component and sentences;
  `altid-consent/server` for the token and the confirmation-mail body. The token
  code handles a secret and must never land in a client bundle.
```

with

```
- **Two entry points.** `altid-consent` for the text, versions, state and event
  names — no React, safe to import from server code and mails — and
  `altid-consent/react` for the component. A server entry for the token comes
  when the token moves in (below). *(Corrected in v1.)*
```

Replace the table under "### What moves in"

```
| From each site | Today | In the package |
| --- | --- | --- |
| `lib/consent-token.ts` | byte-identical on all three | lifts unchanged |
| the consent block in `WaitlistForm` | three variants | one component |
| consent sentences in `lib/copy.ts` | three variants | generated per brand |
| consent body of `emails/consent-confirm.ts` | 10 lines differ | generated per brand |
```

with

```
| From each site | Today | In v1 |
| --- | --- | --- |
| the consent block in `WaitlistForm` | three variants | one component |
| consent sentences in `lib/copy.ts` | three variants | generated per brand |
| `lib/consent-token.ts` | byte-identical on all three | not yet |
| consent body of `emails/consent-confirm.ts` | 10 lines differ | not yet |

*(Corrected in v1.)* The token cannot lift unchanged, as this document first
claimed: it is named `mad` throughout — `ConsentSet = { mad, group }`, and the
confirm form posts `value="mad"`. Lifting it would carry `mad` into the one place
built to be free of it, or force every site to rename first. It moves in once a
site speaks `own`/`group` end to end. The confirmation mail already gets its
consent sentences from the package through each site's `lib/copy.ts`; only its
headings stay site-owned for now.
```

Replace the snippet and sentence under "### What a site writes"

````
```tsx
<ConsentBlock brand="forsikring" />
```

That is the entire configuration.
````

with

````
```tsx
const [consentState, setConsentState] = useState(INITIAL_CONSENT)
<ConsentBlock brand="forsikring" value={consentState} onChange={setConsentState} />
// at submit: consentFlags(consentState) → { own, group }
```

The brand is the entire configuration. *(Corrected in v1: the site holds the
state, because it needs it at submit.)*
````

Run: `grep -c "Corrected in v1" docs/design.md`
Expected: `3`.

- [ ] **Step 4: Final checks and commit**

Run: `npm test && npm run typecheck && npm run build`
Expected: `Tests  22 passed (22)`, a clean typecheck, a clean build.

```bash
git add README.md DECISIONS.md docs/design.md
git commit -F - <<'EOF'
Document adoption, the decisions behind consent, and three spec corrections

README.md is written for someone with a working site and no context:
what to delete, the three lines that replace it, how to store the flags
and version, how to know adoption worked, and what stays theirs. Plus
the path for new sites and the rules for renaming columns later.

DECISIONS.md carries each rule with its reason, so the next brand reads
an answer instead of reopening the discussion.

docs/design.md is corrected where the code proved it wrong: the consent
token is named mad throughout and cannot lift unchanged, so it and the
mail body stay in the sites for v1, which also means the entry points
are text and react rather than client and server.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

- [ ] **Step 5: Push the branch and open the pull request**

```bash
git push -u origin v1
gh pr create --base main --head v1 \
  --title "altid-consent v1: one consent block for every Altid landing page" \
  --body-file - <<'EOF'
## For humans

The consent checkbox, its sentences and its version now live in one package
that every Altid landing page installs. A site says which brand it is and holds
the state; the wording, the family of brands and the rules come from here.

**Needs a decision (Altid Hjem):** approve this PR as the owner of consent.

**Blocked on:** `CODEOWNERS` and branch protection on `main` must exist before
this merges, so that this is the last change to consent nobody was required to
approve.

## What is in v1

- Sentences generated per brand from one family list. The first template
  reproduces altidforsikring.dk's live text character for character (tested).
- `consentVersion(brand)`: the stored version is derived, never hand-written. A
  fingerprint test refuses a text change without a version bump.
- `ConsentBlock`: never pre-ticked, broad by default, one click to narrow,
  switching clears the tick. Inline styles only.
- README (adoption guide), DECISIONS.md, CHANGELOG.md with the exact text of
  every version.

## Where v1 differs from docs/design.md

The design said the consent token "lifts unchanged". It is named `mad`
throughout, so it and the mail body stay in the sites for v1. The corrections
are marked in docs/design.md.

## After merge

Tag `v1.0.0` on the merge commit. altidforsikring.dk's adoption PR pins to it.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
```

- [ ] **Step 6: Stop.** Merging is Altid Hjem's decision, and only after `CODEOWNERS` and branch protection exist. After the merge, whoever merged tags it:

```bash
git checkout main && git pull && git tag v1.0.0 && git push origin v1.0.0
```

---

# Part B — altidforsikring.dk adopts

All Part B commands run in `/Users/kristofferhimmelstrup/Documents/repos/altid-forsikring-site` on branch `consent/unifiedconsent`, starting from `main` (`523382b`). Baseline before Task 6: `npx vitest run` → `Tests  270 passed (270)`; `npx eslint components/WaitlistForm.tsx lib/copy.ts` → `3 problems (2 errors, 1 warning)`, all pre-existing.

### Task 6: Fix the stale group-only mail heading (separate from adoption)

A bug, not part of adoption, so it gets its own commit: the proof that adoption changes nothing must not be muddied by a fix that changes something. `confirmHeading` still names the pre-PR-#18 set for group-only consent — "Altid Hjem, Altid Forsikring og Altid Mobil" — while the consent it quotes is "Altid Hjem og resten af familien: Energi, Mobil og Mad". Altid Forsikring is not in the group scope, and Energi and Mad are missing.

**Files:**
- Modify: `emails/consent-confirm.ts` (the `if (pending.group) return …` line in `confirmHeading`)
- Test: `test/consent-confirm-mail.test.ts` (new)

**Interfaces:**
- Consumes: `confirmHeading(pending: ConsentSet): string` from `emails/consent-confirm.ts`; `ConsentSet = { mad: boolean; group: boolean }` from `lib/consent-token.ts`.
- Produces: nothing new.

- [ ] **Step 1: Write the failing test**

`test/consent-confirm-mail.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { confirmHeading } from '@/emails/consent-confirm'

// The group consent is "Altid Hjem og resten af familien: Energi, Mobil og Mad".
// The heading still named the pre-#18 set: Altid Forsikring (not in the group
// scope) and Altid Mobil, without Energi or Mad.
describe('confirmHeading', () => {
  it('names the group scope the way the consent sentence does', () => {
    expect(confirmHeading({ mad: false, group: true })).toBe('Vil du høre nyt fra Altid Hjem og resten af familien?')
  })

  it('leaves the other two headings unchanged', () => {
    expect(confirmHeading({ mad: true, group: true })).toBe('Vil du høre nyt fra Altid?')
    expect(confirmHeading({ mad: true, group: false })).toBe('Vil du høre nyt om Altid Forsikring?')
  })
})
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run test/consent-confirm-mail.test.ts`
Expected: FAIL — expected `'Vil du høre nyt fra Altid Hjem og resten af familien?'`, received `'Vil du høre nyt fra Altid Hjem, Altid Forsikring og Altid Mobil?'`.

- [ ] **Step 3: Fix the line**

In `emails/consent-confirm.ts`, replace

```ts
  if (pending.group) return 'Vil du høre nyt fra Altid Hjem, Altid Forsikring og Altid Mobil?'
```

with

```ts
  if (pending.group) return 'Vil du høre nyt fra Altid Hjem og resten af familien?'
```

- [ ] **Step 4: Run the suite**

Run: `npx vitest run`
Expected: `Tests  272 passed (272)`.

- [ ] **Step 5: Commit**

```bash
git add emails/consent-confirm.ts test/consent-confirm-mail.test.ts
git commit -F - <<'EOF'
Fix the group-only confirmation heading, which still named the old brands

For group-only consent the mail heading said "Altid Hjem, Altid
Forsikring og Altid Mobil", the set PR #18 removed from the consent
sentence. The consent the same mail quotes is Altid Hjem and the rest
of the family: Energi, Mobil and Mad. Forsikring is not in that scope,
and Energi and Mad were missing.

Kept apart from the altid-consent adoption on purpose, so that change
can be shown to alter nothing.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 7: Install the package and take the sentences from it

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)
- Modify: `lib/copy.ts` (the consent block, lines 7–70 on `523382b`)
- Modify: `test/waitlist-form.test.tsx` (the version test, lines 317–319 on `523382b`, plus one import)

**Interfaces:**
- Consumes: `consentSentences`, `consentVersion` from `altid-consent` (Tasks 1–2).
- Produces: unchanged constant names in `lib/copy.ts` — `CONSENT_VERSION`, `SIGNUP_LAUNCH_NOTICE`, `SIGNUP_CONSENT_ALL`, `SIGNUP_CONSENT_MAD`, `SIGNUP_CONSENT_GROUP`, `SIGNUP_CONSENT_WITHDRAW`, `SIGNUP_CONSENT_NARROW_LINK`, `SIGNUP_CONSENT_BROAD_LINK`, and the existing `PREF_CONSENT_MAD` / `PREF_CONSENT_GROUP` aliases — so no importer changes.

- [ ] **Step 1: Install from the branch**

Task 9 re-pins to the `v1.0.0` tag once it exists.

Run: `npm install --no-fund --no-audit "github:Altid-Hjem-Aps/altid-consent#v1"`
Expected: `package.json` gains `"altid-consent": "github:Altid-Hjem-Aps/altid-consent#v1"`.

- [ ] **Step 2: Replace the consent block in `lib/copy.ts`**

Add as the first line of the file:

```ts
import { consentSentences, consentVersion } from 'altid-consent'
```

Then replace everything from the line `// Marketing-consent copy for the signup checkbox. Verbatim from the legal` down to and including `export const SIGNUP_CONSENT_BROAD_LINK = 'Hele familien igen? Skift her'` with:

```ts
// Marketing consent. The wording, the family of brands and the version are
// decided at Altid Hjem level and live in the altid-consent package — its
// DECISIONS.md says why the box works the way it does, and its CHANGELOG.md
// holds the exact text of every version. Change them there, never here.
//
// Forsikring-specific, so still here:
// - Altid Forsikring has no CVR yet; it is a brand run by Altid Hjem ApS (CVR
//   45637476), which is also the sender. WHEN it gets its own CVR, revisit a
//   data-sharing agreement and whether Altid Forsikring ApS becomes the sender.
// - The waitlist signup itself is the specific markedsføringslov §10 consent to
//   the ONE launch mail described in SIGNUP_LAUNCH_NOTICE (2026-07-14 legal
//   fact-check). That mail may carry only launch/access info: no offers, other
//   brands, or referral push.
// - The names below say MAD because this site's API and database call the
//   own-brand flag marketing_consent_mad. It means Altid Forsikring. The package
//   calls it `own`; renaming it here is deliberately not done.
const FORSIKRING = consentSentences('forsikring')

export const CONSENT_VERSION = consentVersion('forsikring')
export const SIGNUP_LAUNCH_NOTICE =
  'Gratis. Du får én mail fra os, når Altid Forsikring er klar til jer.'
export const SIGNUP_CONSENT_ALL = FORSIKRING.all
export const SIGNUP_CONSENT_MAD = FORSIKRING.own
export const SIGNUP_CONSENT_GROUP = FORSIKRING.group
export const SIGNUP_CONSENT_WITHDRAW = FORSIKRING.withdraw
export const SIGNUP_CONSENT_NARROW_LINK = FORSIKRING.narrowLink
export const SIGNUP_CONSENT_BROAD_LINK = FORSIKRING.broadLink
```

Check nothing was lost: `grep -cE "^export const (CONSENT_VERSION|SIGNUP_LAUNCH_NOTICE|SIGNUP_CONSENT_(ALL|MAD|GROUP|WITHDRAW|NARROW_LINK|BROAD_LINK)) " lib/copy.ts` → `8`.

- [ ] **Step 3: Run the suite and see the one expected failure**

Run: `npx vitest run`
Expected: exactly one failure, in `test/waitlist-form.test.tsx`: "versions the new wording…", expected `'2026-09-24.1-forsikring'` to be `'2026-09-23.3-af'`. Every other test passes. If any other test fails, the sentences are not identical — stop and compare with the package's `test/sentences.test.ts`.

- [ ] **Step 4: Change the one permitted assertion**

This is the only edit to an existing assertion in the adoption, and it is expected: the version format changes by design. The package's CHANGELOG records that `2026-09-23.3-af` and `2026-09-24.1-forsikring` identify identical text.

In `test/waitlist-form.test.tsx`, add to the imports:

```ts
import { consentVersion } from 'altid-consent'
```

and replace

```ts
  it('versions the new wording, since consent_version records the text accepted', () => {
    expect(CONSENT_VERSION).toBe('2026-09-23.3-af')
  })
```

with

```ts
  // The version is now derived by altid-consent, never written by hand. Its
  // first template reproduces 2026-09-23.3-af exactly (see its CHANGELOG.md).
  it('stores the package-derived version, suffixed with this brand', () => {
    expect(CONSENT_VERSION).toBe(consentVersion('forsikring'))
    expect(CONSENT_VERSION).toMatch(/-forsikring$/)
  })
```

- [ ] **Step 5: Run everything**

Run: `npx vitest run && npx tsc --noEmit && npx eslint lib/copy.ts test/waitlist-form.test.tsx`
Expected: `Tests  272 passed (272)`, clean typecheck, no eslint findings in these two files.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/copy.ts test/waitlist-form.test.tsx
git commit -F - <<'EOF'
Take the consent sentences and version from altid-consent

The wording is now decided at Altid Hjem level and generated by the
shared package. Every constant keeps its name, so no importer changes;
the package's first template reproduces this site's text character for
character, so nothing a visitor reads changes either.

One assertion changed, deliberately: the version is now derived as
<template>-forsikring instead of written by hand. The package's
CHANGELOG records that 2026-09-23.3-af and 2026-09-24.1-forsikring
identify the same text.

The Forsikring-specific notes (no CVR yet, the §10 launch-mail scope,
why the flag is still called mad) stay here; the rest of the history
moved to the package.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 8: Replace the form's checkbox with `ConsentBlock`

**Files:**
- Modify: `components/WaitlistForm.tsx`

**Interfaces:**
- Consumes: `INITIAL_CONSENT`, `consentFlags` from `altid-consent`; `ConsentBlock` from `altid-consent/react` (Task 3).
- Produces: nothing new. The request body is unchanged: `consent: { version, mad, group }`.

- [ ] **Step 1: Imports**

Replace

```ts
import { useState, useEffect, useId } from 'react'
```

with

```ts
import { useState, useEffect } from 'react'
```

(`useId` was used only by `ConsentBox`.)

Replace

```ts
import { DUPLICATE_SIGNUP_HEADING, SIGNUP_CONSENT_ALL, SIGNUP_CONSENT_MAD, SIGNUP_LAUNCH_NOTICE, SIGNUP_CONSENT_WITHDRAW, SIGNUP_CONSENT_NARROW_LINK, SIGNUP_CONSENT_BROAD_LINK, CONSENT_VERSION } from '@/lib/copy'
```

with

```ts
import { DUPLICATE_SIGNUP_HEADING, SIGNUP_LAUNCH_NOTICE, CONSENT_VERSION } from '@/lib/copy'
import { INITIAL_CONSENT, consentFlags } from 'altid-consent'
import { ConsentBlock } from 'altid-consent/react'
```

- [ ] **Step 2: Delete `ConsentBox`**

Delete everything from the comment line `// ONE active, non-pre-checked, OPTIONAL marketing-consent checkbox. Signing up` down to and including the closing `}` of `function ConsentBox`, which is the last line before `interface Props {`. Keep the blank line before `interface Props {`.

- [ ] **Step 3: State**

Replace

```ts
  // Marketing consent (Forbrugerombudsmanden): starts UNCHECKED and is fully
  // optional — consent may never be a condition for joining the waitlist (GDPR
  // art. 7(4), koblingsforbud). `scope` picks which sentence the single box
  // shows: 'all' (hele Altid, the default) or 'brand' (Altid Forsikring only).
  const [consentChecked, setConsentChecked] = useState(false)
  const [consentScope, setConsentScope] = useState<'all' | 'brand'>('all')
```

with

```ts
  // Marketing consent (Forbrugerombudsmanden): starts UNCHECKED and is fully
  // optional — consent may never be a condition for joining the waitlist (GDPR
  // art. 7(4), koblingsforbud). The box and its rules come from altid-consent;
  // this form only holds the state it needs at submit.
  const [consentState, setConsentState] = useState(INITIAL_CONSENT)
```

- [ ] **Step 4: Request body**

Replace

```ts
          // Documented consent (wording version + the two flags derived from
          // the single box) so the exact permission each person gave is
          // provable. The backend must persist these and gate marketing sends
          // on them. Ticked+all -> both flags; ticked+brand -> mad only;
          // unticked -> neither.
          consent: {
            version: CONSENT_VERSION,
            mad: consentChecked,
            group: consentChecked && consentScope === 'all',
          },
```

with

```ts
          // Documented consent: the wording version plus the two flags, so the
          // exact permission each person gave is provable. The package says
          // own/group; this site's API and database still call the own-brand
          // flag (Altid Forsikring) `mad`, so this is the one place the two
          // names meet.
          consent: {
            version: CONSENT_VERSION,
            mad: consentFlags(consentState).own,
            group: consentFlags(consentState).group,
          },
```

- [ ] **Step 5: The two call sites**

Replace

```tsx
<ConsentBox dark checked={consentChecked} scope={consentScope} onChecked={setConsentChecked} onScope={setConsentScope} />
```

with

```tsx
<ConsentBlock brand="forsikring" dark value={consentState} onChange={setConsentState} />
```

and replace

```tsx
<ConsentBox dark={false} checked={consentChecked} scope={consentScope} onChecked={setConsentChecked} onScope={setConsentScope} />
```

with

```tsx
<ConsentBlock brand="forsikring" value={consentState} onChange={setConsentState} />
```

Check nothing references the old names: `grep -nE "ConsentBox|consentChecked|consentScope|useId" components/WaitlistForm.tsx` → no output.

- [ ] **Step 6: Run everything, with no test edits in this task**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: `Tests  272 passed (272)`, clean typecheck, `✓ Compiled successfully`. Do not edit any test to get here; a failure means `ConsentBlock` behaves differently from `ConsentBox`, which is a bug in the package or in this task.

This is also where the spec's "`own` lands in the column this site uses" is proven. The mapping sits in the request body rather than `db.ts`, and three existing tests already pin that body for every case: `test/waitlist-form.test.tsx` asserts `{ mad: false, group: false }` unticked, `{ mad: true, group: true }` on the broad sentence, and `{ mad: true, group: false }` on the narrow one. No new test is needed.

Run: `npx eslint components/WaitlistForm.tsx`
Expected: `3 problems (2 errors, 1 warning)`, the same pre-existing findings as the baseline (their line numbers move up because `ConsentBox` is gone).

- [ ] **Step 7: Compare it with production by eye**

The package replaced Tailwind classes with inline styles, and tests cannot see that. Start `npm run dev`, open `http://localhost:3000` next to `https://altidforsikring.dk`, type a name into the hero form on both, and compare at desktop width and at 375px:

- the sentence is 12px, the second line 11px and lighter, with the link underlined
- the checkbox accent is blue on the light hero form
- then scroll to the dark form lower on the page: sentence and link in translucent white, checkbox accent light blue

Any visible difference is a bug in `ConsentBlock`'s styles: fix it in the package (Part A), not here. Stop the dev server afterwards.

- [ ] **Step 8: Commit**

```bash
git add components/WaitlistForm.tsx
git commit -F - <<'EOF'
Use the shared ConsentBlock instead of this form's own checkbox

The checkbox, its rules and its sentences now come from altid-consent.
The form keeps only the state it needs at submit and maps the package's
own/group flags onto this site's request body, where the own-brand flag
is still called mad. The request body is unchanged.

All 272 tests pass with no test edited in this change, which is the
evidence that the shared component behaves exactly like the one it
replaces. Checked against production by eye at desktop and 375px, since
tests cannot see the move from Tailwind classes to inline styles.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 9: Pin to the release tag and open the PR

**Precondition:** the Part A PR is merged into `main` of altid-consent and tagged `v1.0.0`. Check: `git ls-remote --tags https://github.com/Altid-Hjem-Aps/altid-consent.git v1.0.0` prints one line.

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)

**Interfaces:**
- Consumes: the `v1.0.0` tag.
- Produces: the adoption PR.

- [ ] **Step 1: Re-pin to the tag**

Run: `npm install --no-fund --no-audit "github:Altid-Hjem-Aps/altid-consent#v1.0.0"`
Expected: `package.json` now says `"altid-consent": "github:Altid-Hjem-Aps/altid-consent#v1.0.0"`.

- [ ] **Step 2: Run everything**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: `Tests  272 passed (272)`, clean typecheck, successful build.

- [ ] **Step 3: Commit and push**

```bash
git add package.json package-lock.json
git commit -F - <<'EOF'
Pin altid-consent to its v1.0.0 release

Moves the dependency from the v1 branch to the tag Altid Hjem approved,
so this site only changes consent when that tag changes.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
git push -u origin consent/unifiedconsent
```

- [ ] **Step 4: Open the PR**

```bash
gh pr create --base main --head consent/unifiedconsent \
  --title "Consent: use the shared altid-consent package" \
  --body-file - <<'EOF'
## For humans

altidforsikring.dk now gets its consent checkbox, sentences and version from
altid-consent, the package Altid Hjem owns. Nothing a visitor sees changes.

**Needs a decision:** nothing.

**Blocked:** nothing.

## Details

- **No visible change.** The package's first template reproduces this site's
  text character for character, and 272 tests pass with no test edited in the
  component swap. Checked against production by eye at desktop and 375px.
- **One deliberate assertion change.** `CONSENT_VERSION` is now
  `2026-09-24.1-forsikring`, derived by the package, instead of the hand-written
  `2026-09-23.3-af`. The package's CHANGELOG records that both identify the same
  text.
- **One bug fix, in its own commit.** The confirmation mail's group-only heading
  still named "Altid Hjem, Altid Forsikring og Altid Mobil", the set PR #18
  removed. It now reads "Altid Hjem og resten af familien".
- **Not changed.** The database, the API, the consent token, the preference
  centre. The own-brand flag is still called `mad` here; the package calls it
  `own`, and the two meet in one line of `WaitlistForm.tsx`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
```

---

## Not in this plan

- `CODEOWNERS` and branch protection on altid-consent: an organisational action that needs Altid Hjem's owner names. It gates merging Part A (Task 5, Step 6).
- An update bot (Renovate) on each site: needs the Renovate GitHub App installed on the organisation.
- Adoption on altidhjem.dk and altidmad.dk: their teams, their schedule. altidhjem.dk also needs a decision first — Altid Hjem is the parent, not a member of the family, so what its own opt-down sentence should say is Hjem's to write.
- Moving the consent token and the confirmation-mail headings into the package: after a site speaks `own`/`group` end to end.
- Sending `CONSENT_EVENTS` from altidforsikring.dk: the names exist from v1; starting to track them is a separate analytics decision.
