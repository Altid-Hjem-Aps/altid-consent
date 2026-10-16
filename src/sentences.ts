import { BRAND_NAMES, BRAND_TOPICS, FAMILY, listJoin, type Brand, type FamilyBrand } from './brands.js'

/** What every brand has: the broad sentence, the withdraw line, the senders link. */
export type CombinedSentences = {
  /** Every brand in the family named as a sender. The default view, and the only one on altidhjem.dk. */
  all: string
  withdraw: string
  /** Opens the senders list (CONSENT_SENDERS). Shown only next to `all`. */
  sendersLink: string
}

export type ConsentSentences = CombinedSentences & {
  /** This site's own brand only. Stored as the `own` flag. */
  own: string
  /** Altid Hjem and every brand except this one. Stored as the `group` flag. */
  group: string
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
// `hjem` has only the combined sentences: altidhjem.dk keeps one box that sets
// both flags, so there is no narrow sentence for it to quote.
//
// Key order matters: test/version.test.ts fingerprints these objects.
export function consentSentences(brand: FamilyBrand): ConsentSentences
export function consentSentences(brand: 'hjem'): CombinedSentences
export function consentSentences(brand: Brand): ConsentSentences | CombinedSentences
export function consentSentences(brand: Brand): ConsentSentences | CombinedSentences {
  const topics = listJoin(FAMILY.map((b) => BRAND_TOPICS[b]))
  const senders = listJoin(['Altid Hjem', ...FAMILY.map((b) => `Altid ${BRAND_NAMES[b]}`)])
  const all = `Ja tak til nyheder og gode tilbud på mail om ${topics} fra ${senders}.`
  const withdraw = 'Afmeld når som helst'
  const sendersLink = 'Hvem står bag?'

  if (brand === 'hjem') return { all, withdraw, sendersLink }

  const name = BRAND_NAMES[brand]
  const rest = FAMILY.filter((b) => b !== brand).map((b) => BRAND_NAMES[b])
  return {
    all,
    withdraw,
    sendersLink,
    own: `Ja tak til nyt og gode tilbud på mail om Altid ${name} fra Altid Hjem.`,
    group: `Ja tak til nyt og gode tilbud på mail fra Altid Hjem og resten af familien: ${listJoin(rest)}.`,
    narrowLink: `Kun ${name}? Skift her`,
    broadLink: 'Hele familien igen? Skift her',
  }
}
