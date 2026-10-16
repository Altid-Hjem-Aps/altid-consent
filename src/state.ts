import type { Brand } from './brands.js'

export type ConsentScope = 'all' | 'own'

export type ConsentState = { checked: boolean; scope: ConsentScope }

/** Unticked, broad sentence showing. The box is NEVER pre-ticked. */
export const INITIAL_CONSENT: ConsentState = { checked: false, scope: 'all' }

/**
 * The two flags a site stores. The package never names a column: each site
 * maps these onto its own.
 *
 * `brand` is required: altidhjem.dk (`hjem`) has one combined box, so a tick
 * always means both flags, whatever the scope in the state says. Family brands
 * read the scope.
 */
export function consentFlags(state: ConsentState, brand: Brand): { own: boolean; group: boolean } {
  if (brand === 'hjem') return { own: state.checked, group: state.checked }
  return { own: state.checked, group: state.checked && state.scope === 'all' }
}
