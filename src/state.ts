export type ConsentScope = 'all' | 'own'

export type ConsentState = { checked: boolean; scope: ConsentScope }

/** Unticked, broad sentence showing. The box is NEVER pre-ticked. */
export const INITIAL_CONSENT: ConsentState = { checked: false, scope: 'all' }

/**
 * The two flags a site stores. The package never names a column: each site
 * maps these onto its own.
 */
export function consentFlags(state: ConsentState): { own: boolean; group: boolean } {
  return { own: state.checked, group: state.checked && state.scope === 'all' }
}
