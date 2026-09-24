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
