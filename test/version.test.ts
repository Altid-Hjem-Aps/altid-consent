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
  })
})
