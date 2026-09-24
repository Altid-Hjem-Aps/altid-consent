// Analytics event names, identical on every landing page, so consent can be
// compared across sites later without reconciling three vocabularies. The
// package sends nothing: each site passes these to its own tracker, with the
// properties { brand, scope }.
export const CONSENT_EVENTS = {
  given: 'Consent Given',
  scopeChanged: 'Consent Scope Changed',
} as const
