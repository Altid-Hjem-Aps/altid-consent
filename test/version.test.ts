import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { FAMILY } from '../src/brands.js'
import { CONSENT_SENDERS } from '../src/senders.js'
import { consentSentences } from '../src/sentences.js'
import { CONSENT_TEMPLATE_VERSION, consentVersion } from '../src/version.js'

// sha256 of every sentence for every brand, per template version. This is what
// makes a shared package safe for legally binding text: change a sentence or
// the family without bumping CONSENT_TEMPLATE_VERSION and this fails.
//
// To make a deliberate change: bump the version, add its exact text to
// CHANGELOG.md, then add the new fingerprint here (the failure prints it).
// Never edit or remove an existing entry.
//
// From 2026-10-16.2 the fingerprint also covers the hjem sentences and the
// senders list. The 2026-09-24.1 entry was taken over the four family brands
// only and is kept as recorded; it is no longer recomputed, only the current
// version is checked.
const RECORDED: Record<string, string> = {
  '2026-09-24.1': 'dc1e8d91465fd571ae7d219741af411e70eb177b0d3514724556ac89770a871a',
  '2026-10-16.2': '008eaa93202538e1796764e14b0a3e67dcfae38a2829a15436d309eea22a0b90',
}

function fingerprint(): string {
  const everything = [...FAMILY.map((b) => [b, consentSentences(b)]), ['hjem', consentSentences('hjem')], CONSENT_SENDERS]
  return createHash('sha256').update(JSON.stringify(everything)).digest('hex')
}

describe('template version', () => {
  it('matches the recorded fingerprint of the current text', () => {
    const actual = fingerprint()
    const recorded = RECORDED[CONSENT_TEMPLATE_VERSION]

    if (recorded === undefined) {
      throw new Error(
        `CONSENT_TEMPLATE_VERSION '${CONSENT_TEMPLATE_VERSION}' is not recorded. ` +
          `Record the text in CHANGELOG.md, then add this NEW line to RECORDED in test/version.test.ts ` +
          `(never edit an existing entry): '${CONSENT_TEMPLATE_VERSION}': '${actual}',`,
      )
    }

    expect(
      recorded,
      `The consent text changed but CONSENT_TEMPLATE_VERSION did not. Bump CONSENT_TEMPLATE_VERSION in ` +
        `src/version.ts, record the new text in CHANGELOG.md, then add a NEW entry to RECORDED in ` +
        `test/version.test.ts for the new version — never edit or overwrite this existing entry.`,
    ).toBe(actual)
  })

  it('keeps CONSENT_TEMPLATE_VERSION as the newest recorded entry, so the record stays append-only', () => {
    expect(Object.keys(RECORDED).at(-1)).toBe(CONSENT_TEMPLATE_VERSION)
  })

  it('suffixes the brand, so every stored row names its landing page', () => {
    expect(consentVersion('forsikring')).toBe(`${CONSENT_TEMPLATE_VERSION}-forsikring`)
    expect(consentVersion('mad')).toBe(`${CONSENT_TEMPLATE_VERSION}-mad`)
    expect(consentVersion('hjem')).toBe(`${CONSENT_TEMPLATE_VERSION}-hjem`)
  })

  // The sites' own pre-package versions (2026-10-16.1-af, -mad, -hjem) are
  // already stored in their databases. A template version of 2026-10-16.1 would
  // make the package's mad version collide with the site's, while altidmad.dk's
  // narrow and group wording differ: one stored string, two texts. So the
  // template must never be 2026-10-16.1. CHANGELOG.md has the full story.
  it('never derives a version equal to a pre-package site version', () => {
    for (const brand of [...FAMILY, 'hjem' as const]) {
      for (const sitesVersion of ['2026-10-16.1-af', '2026-10-16.1-mad', '2026-10-16.1-hjem']) {
        expect(consentVersion(brand)).not.toBe(sitesVersion)
      }
    }
  })
})
