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
