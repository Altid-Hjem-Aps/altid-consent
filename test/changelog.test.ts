import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { BRAND_NAMES, FAMILY } from '../src/brands.js'
import { CONSENT_SENDERS } from '../src/senders.js'
import { consentSentences } from '../src/sentences.js'
import { CONSENT_TEMPLATE_VERSION } from '../src/version.js'

// CHANGELOG.md is the legal record of what each stored version said. This
// checks that record against the code on every run, instead of relying on it
// having been checked once by hand when the version was cut.
//
// The test environment is jsdom (vitest.config.ts), which shadows the global
// `URL` — and even an explicit `import { URL } from 'node:url'` — with an
// implementation that resolves a relative URL against `window.location`
// instead of the `base` argument, so `new URL('../CHANGELOG.md',
// import.meta.url)` silently produces `http://localhost:3000/CHANGELOG.md`.
// `fileURLToPath` takes the string as-is rather than doing that resolution,
// so it is unaffected; resolving the path with `node:path` gets the same
// result the URL construction was meant to.
function currentVersionSection(): string {
  const changelogPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'CHANGELOG.md')
  const changelog = readFileSync(changelogPath, 'utf8')
  const lines = changelog.split('\n')
  const startHeading = `## ${CONSENT_TEMPLATE_VERSION}`
  const start = lines.findIndex((line) => line === startHeading)
  if (start === -1) return ''

  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => line.startsWith('## '))
  const section = end === -1 ? rest : rest.slice(0, end)
  return section.join('\n')
}

describe('CHANGELOG.md', () => {
  it('has an entry for the current template version', () => {
    const section = currentVersionSection()
    expect(section, `CONSENT_TEMPLATE_VERSION '${CONSENT_TEMPLATE_VERSION}' has no CHANGELOG entry.`).not.toBe('')
  })

  it('records the exact current text for every brand', () => {
    const section = currentVersionSection()
    const broad = consentSentences(FAMILY[0]).all
    expect(section).toContain(broad)
    expect(section).toContain(consentSentences(FAMILY[0]).withdraw)
    expect(section).toContain(consentSentences(FAMILY[0]).broadLink)
    expect(section).toContain(consentSentences(FAMILY[0]).sendersLink)
    expect(consentSentences('hjem').all).toBe(broad)
    expect(section).toContain('### hjem')
    for (const line of CONSENT_SENDERS) expect(section, `sender: ${line}`).toContain(`- ${line}`)

    for (const brand of FAMILY) {
      const s = consentSentences(brand)
      expect(section, `${BRAND_NAMES[brand]}: own`).toContain(s.own)
      expect(section, `${BRAND_NAMES[brand]}: group`).toContain(s.group)
      expect(section, `${BRAND_NAMES[brand]}: narrowLink`).toContain(s.narrowLink)
    }
  })

  // The sites' own versions were already stored when the package was written.
  // The record must say, for each, whether it is the same text as the package's.
  it('records how the pre-package site versions relate to the package versions', () => {
    const section = currentVersionSection()
    for (const line of ['`2026-10-16.1-af`', '`2026-10-16.1-hjem`', '`2026-10-16.1-mad`']) {
      expect(section).toContain(line)
    }
  })
})
