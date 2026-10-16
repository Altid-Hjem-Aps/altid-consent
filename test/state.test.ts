import { describe, expect, it } from 'vitest'
import { INITIAL_CONSENT, consentFlags } from '../src/state.js'

describe('consentFlags', () => {
  it('starts unticked on the broad sentence', () => {
    expect(INITIAL_CONSENT).toEqual({ checked: false, scope: 'all' })
    expect(consentFlags(INITIAL_CONSENT, 'forsikring')).toEqual({ own: false, group: false })
  })

  it('broad sentence ticked: both flags', () => {
    expect(consentFlags({ checked: true, scope: 'all' }, 'forsikring')).toEqual({ own: true, group: true })
  })

  it('narrow sentence ticked: own only', () => {
    expect(consentFlags({ checked: true, scope: 'own' }, 'forsikring')).toEqual({ own: true, group: false })
  })

  it('unticked on the narrow sentence: nothing', () => {
    expect(consentFlags({ checked: false, scope: 'own' }, 'forsikring')).toEqual({ own: false, group: false })
  })

  it('hjem: one combined box, a tick is always both flags, whatever the scope', () => {
    expect(consentFlags({ checked: true, scope: 'all' }, 'hjem')).toEqual({ own: true, group: true })
    expect(consentFlags({ checked: true, scope: 'own' }, 'hjem')).toEqual({ own: true, group: true })
    expect(consentFlags({ checked: false, scope: 'all' }, 'hjem')).toEqual({ own: false, group: false })
    expect(consentFlags({ checked: false, scope: 'own' }, 'hjem')).toEqual({ own: false, group: false })
  })

  it('family brands read the scope', () => {
    expect(consentFlags({ checked: true, scope: 'own' }, 'mad')).toEqual({ own: true, group: false })
    expect(consentFlags({ checked: true, scope: 'all' }, 'forsikring')).toEqual({ own: true, group: true })
  })
})
