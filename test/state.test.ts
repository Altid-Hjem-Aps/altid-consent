import { describe, expect, it } from 'vitest'
import { INITIAL_CONSENT, consentFlags } from '../src/state.js'

describe('consentFlags', () => {
  it('starts unticked on the broad sentence', () => {
    expect(INITIAL_CONSENT).toEqual({ checked: false, scope: 'all' })
    expect(consentFlags(INITIAL_CONSENT)).toEqual({ own: false, group: false })
  })

  it('broad sentence ticked: both flags', () => {
    expect(consentFlags({ checked: true, scope: 'all' })).toEqual({ own: true, group: true })
  })

  it('narrow sentence ticked: own only', () => {
    expect(consentFlags({ checked: true, scope: 'own' })).toEqual({ own: true, group: false })
  })

  it('unticked on the narrow sentence: nothing', () => {
    expect(consentFlags({ checked: false, scope: 'own' })).toEqual({ own: false, group: false })
  })
})
