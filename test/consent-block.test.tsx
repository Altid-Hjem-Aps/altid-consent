import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ConsentBlock } from '../src/react/ConsentBlock.js'
import { consentSentences } from '../src/sentences.js'
import { INITIAL_CONSENT, consentFlags, type ConsentState } from '../src/state.js'
import type { Brand } from '../src/brands.js'

// Sites own the state because they need it at submit, so the tests drive the
// component the same way a site does.
function Harness({ brand, onState }: { brand: Brand; onState?: (s: ConsentState) => void }) {
  const [value, setValue] = useState(INITIAL_CONSENT)
  return (
    <ConsentBlock
      brand={brand}
      value={value}
      onChange={(next) => {
        setValue(next)
        onState?.(next)
      }}
    />
  )
}

const F = consentSentences('forsikring')

describe('ConsentBlock', () => {
  it('shows the broad sentence with the box never pre-ticked', () => {
    render(<Harness brand="forsikring" />)
    expect(screen.getByText(F.all)).toBeVisible()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('narrows to this brand and back via the text link', () => {
    render(<Harness brand="forsikring" />)
    fireEvent.click(screen.getByRole('button', { name: F.narrowLink }))
    expect(screen.getByText(F.own)).toBeVisible()
    expect(screen.queryByText(F.all)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: F.broadLink }))
    expect(screen.getByText(F.all)).toBeVisible()
  })

  it('clears an existing tick when the scope switches', () => {
    const seen: ConsentState[] = []
    render(<Harness brand="forsikring" onState={(s) => seen.push(s)} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('checkbox')).toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: F.narrowLink }))
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(consentFlags(seen[seen.length - 1])).toEqual({ own: false, group: false })
  })

  it('reports the flags a site stores', () => {
    const seen: ConsentState[] = []
    render(<Harness brand="forsikring" onState={(s) => seen.push(s)} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(consentFlags(seen[seen.length - 1])).toEqual({ own: true, group: true })
    fireEvent.click(screen.getByRole('button', { name: F.narrowLink }))
    fireEvent.click(screen.getByRole('checkbox'))
    expect(consentFlags(seen[seen.length - 1])).toEqual({ own: true, group: false })
  })

  it('describes the box with the withdraw line', () => {
    render(<Harness brand="forsikring" />)
    const id = screen.getByRole('checkbox').getAttribute('aria-describedby')
    expect(id).toBeTruthy()
    expect(document.getElementById(id!)).toHaveTextContent(F.withdraw)
  })

  it('never lets the scope link submit a surrounding form', () => {
    render(<Harness brand="forsikring" />)
    expect(screen.getByRole('button', { name: F.narrowLink })).toHaveAttribute('type', 'button')
  })

  it('speaks for whichever brand the site is', () => {
    render(<Harness brand="mad" />)
    expect(screen.getByRole('button', { name: 'Kun Mad? Skift her' })).toBeInTheDocument()
  })

  it('uses no class names, since Tailwind cannot see into node_modules', () => {
    const { container } = render(<Harness brand="forsikring" />)
    expect(container.querySelector('[class]')).toBeNull()
  })
})
