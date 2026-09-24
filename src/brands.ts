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
