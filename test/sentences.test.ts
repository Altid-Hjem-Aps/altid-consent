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
    for (const other of FAMILY) {
      if (other === brand) continue
      expect(s.own).not.toContain(BRAND_NAMES[other])
    }
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
