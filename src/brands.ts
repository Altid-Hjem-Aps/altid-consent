// The Altid family, in the order every sentence lists it. Altid Hjem is not a
// member: it is the parent and the sender, named in every sentence as "fra
// Altid Hjem". Adding a brand here changes what "hele familien" covers, which
// is a new consent scope: bump CONSENT_TEMPLATE_VERSION (src/version.ts).
export const FAMILY = ['forsikring', 'energi', 'mobil', 'mad'] as const

export type FamilyBrand = (typeof FAMILY)[number]

/**
 * A landing page. The four family brands, plus `hjem` (altidhjem.dk): the
 * parent, which keeps ONE combined box and so has no narrow scope.
 */
export type Brand = FamilyBrand | 'hjem'

export const BRAND_NAMES: Record<FamilyBrand, string> = {
  forsikring: 'Forsikring',
  energi: 'Energi',
  mobil: 'Mobil',
  mad: 'Mad',
}

/** What each family brand mails about, as the broad sentence says it. */
export const BRAND_TOPICS: Record<FamilyBrand, string> = {
  forsikring: 'forsikring',
  energi: 'el',
  mobil: 'mobil',
  mad: 'madvarer',
}

export function isFamilyBrand(brand: Brand): brand is FamilyBrand {
  return brand !== 'hjem'
}

/** Danish list: "A", "A og B", "A, B og C". */
export function listJoin(items: readonly string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} og ${items[items.length - 1]}`
}
