import { describe, expect, it } from 'vitest'
import { BRAND_NAMES, FAMILY, listJoin } from '../src/brands.js'
import { CONSENT_SENDERS } from '../src/senders.js'
import { consentSentences } from '../src/sentences.js'

// Copied from the sites' lib/copy.ts on main, 2026-10-16 (altid-forsikring-site
// #23, altid-mad-site #61, landing-page #109). All three show these bytes.
const LIVE_BROAD =
  'Ja tak til nyheder og gode tilbud på mail om forsikring, el, mobil og madvarer fra Altid Hjem, Altid Forsikring, Altid Energi, Altid Mobil og Altid Mad.'
const LIVE_SENDERS = [
  'Altid Hjem ApS (CVR 45637476): Altid Hjem og Altid Forsikring',
  'Altid Mobil ApS (CVR 46169093): Altid Mobil',
  'Altid Energi ApS (CVR 44373580): Altid Energi',
  'Spari ApS (CVR 44307170): Altid Mad',
]

describe('consentSentences', () => {
  // Must reproduce altidforsikring.dk's live text exactly (its CONSENT_VERSION
  // 2026-10-16.1-af), so adopting the package changes nothing a visitor can read.
  it('reproduces the live Forsikring text character for character', () => {
    expect(consentSentences('forsikring')).toEqual({
      all: LIVE_BROAD,
      withdraw: 'Afmeld når som helst',
      sendersLink: 'Hvem står bag?',
      own: 'Ja tak til nyt og gode tilbud på mail om Altid Forsikring fra Altid Hjem.',
      group: 'Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: Energi, Mobil og Mad.',
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

  it('shows every brand the same broad sentence, equal to the one live on all three sites', () => {
    const broad = new Set([...FAMILY, 'hjem' as const].map((b) => consentSentences(b).all))
    expect([...broad]).toEqual([LIVE_BROAD])
  })

  it('lists the four sender companies as the sites do, in the same order', () => {
    expect([...CONSENT_SENDERS]).toEqual(LIVE_SENDERS)
    expect(consentSentences('hjem').sendersLink).toBe('Hvem står bag?')
  })

  // altidhjem.dk keeps ONE combined box (landing-page #109): the broad sentence
  // is all it has, so there is nothing narrow for it to quote.
  it('gives hjem the broad sentence only', () => {
    expect(consentSentences('hjem')).toEqual({
      all: LIVE_BROAD,
      withdraw: 'Afmeld når som helst',
      sendersLink: 'Hvem står bag?',
    })
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
