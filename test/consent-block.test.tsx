import { useState, type ComponentProps } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ConsentBlock } from '../src/react/ConsentBlock.js'
import { CONSENT_SENDERS } from '../src/senders.js'
import { consentSentences } from '../src/sentences.js'
import { INITIAL_CONSENT, consentFlags, type ConsentState } from '../src/state.js'
import type { Brand } from '../src/brands.js'

// Sites own the state because they need it at submit, so the tests drive the
// component the same way a site does.
function Harness({
  brand,
  onState,
  ...rest
}: { brand: Brand; onState?: (s: ConsentState) => void } & Partial<Pick<ComponentProps<typeof ConsentBlock>, 'dark' | 'colors' | 'spacing'>>) {
  const [value, setValue] = useState(INITIAL_CONSENT)
  return (
    <ConsentBlock
      brand={brand}
      {...rest}
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

  // The sites show this list under "Hvem står bag?" next to the broad sentence.
  describe('senders list', () => {
    const toggle = () => screen.getByRole('button', { name: F.sendersLink })

    it('is closed by default and opens and closes on the link, leaving the box unticked', () => {
      const seen: ConsentState[] = []
      render(<Harness brand="forsikring" onState={(s) => seen.push(s)} />)
      expect(toggle()).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('list')).toBeNull()

      fireEvent.click(toggle())
      expect(toggle()).toHaveAttribute('aria-expanded', 'true')
      const list = screen.getByRole('list')
      expect(toggle()).toHaveAttribute('aria-controls', list.id)
      expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([...CONSENT_SENDERS])
      expect(screen.getByRole('checkbox')).not.toBeChecked()

      fireEvent.click(toggle())
      expect(toggle()).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('list')).toBeNull()
      expect(screen.getByRole('checkbox')).not.toBeChecked()
      expect(seen).toEqual([])
    })

    it('keeps an existing tick when opened', () => {
      render(<Harness brand="forsikring" />)
      fireEvent.click(screen.getByRole('checkbox'))
      fireEvent.click(toggle())
      expect(screen.getByRole('checkbox')).toBeChecked()
    })

    it('shows only next to the broad sentence', () => {
      render(<Harness brand="forsikring" />)
      fireEvent.click(toggle())
      fireEvent.click(screen.getByRole('button', { name: F.narrowLink }))
      expect(screen.queryByRole('button', { name: F.sendersLink })).toBeNull()
      expect(screen.queryByRole('list')).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: F.broadLink }))
      expect(toggle()).toBeInTheDocument()
    })

    it('is a plain button that cannot submit a surrounding form, outside the label', () => {
      render(<Harness brand="forsikring" />)
      expect(toggle()).toHaveAttribute('type', 'button')
      expect(toggle().closest('label')).toBeNull()
    })

    it('is bordered and unbulleted without any Tailwind reset', () => {
      render(<Harness brand="forsikring" />)
      fireEvent.click(toggle())
      const list = screen.getByRole('list')
      expect(list.style.listStyle).toBe('none')
      expect(list.style.border).toContain('1px solid')
      expect(list.style.padding).toBe('8px 12px')
      expect(list.style.borderRadius).toBe('8px')
    })
  })

  describe('hjem: one combined box', () => {
    const H = consentSentences('hjem')

    it('shows the broad sentence, the withdraw line and the senders link, with no narrow link', () => {
      render(<Harness brand="hjem" />)
      expect(screen.getByText(H.all)).toBeVisible()
      expect(screen.getByRole('checkbox')).not.toBeChecked()
      expect(screen.getByRole('button', { name: H.sendersLink })).toBeInTheDocument()
      expect(screen.getAllByRole('button')).toHaveLength(1)
      expect(screen.queryByText(/Skift her/)).toBeNull()
      const id = screen.getByRole('checkbox').getAttribute('aria-describedby')
      expect(document.getElementById(id!)).toHaveTextContent(H.withdraw)
    })

    it('ticking sets both flags', () => {
      const seen: ConsentState[] = []
      render(<Harness brand="hjem" onState={(s) => seen.push(s)} />)
      fireEvent.click(screen.getByRole('checkbox'))
      expect(consentFlags(seen[seen.length - 1])).toEqual({ own: true, group: true })
      fireEvent.click(screen.getByRole('checkbox'))
      expect(consentFlags(seen[seen.length - 1])).toEqual({ own: false, group: false })
    })

    it('opens the senders list', () => {
      render(<Harness brand="hjem" />)
      fireEvent.click(screen.getByRole('button', { name: H.sendersLink }))
      expect(screen.getAllByRole('listitem')).toHaveLength(CONSENT_SENDERS.length)
    })
  })

  // Sites override colours instead of re-implementing the block. These are the
  // values the live sites use today (WaitlistForm ConsentBox / ConsentCheckbox).
  describe('colors cover every site', () => {
    const sendersLabel = consentSentences('forsikring').sendersLink
    const cases = [
      { name: 'forsikring light', brand: 'forsikring', dark: false, colors: undefined, text: '#6f6a61', muted: '#6f6a61', accent: '#448df5', border: 'rgba(0, 0, 0, 0.1)' },
      { name: 'forsikring dark', brand: 'forsikring', dark: true, colors: undefined, text: 'rgba(255, 255, 255, 0.7)', muted: 'rgba(255, 255, 255, 0.6)', accent: '#a7d3f9', border: 'rgba(255, 255, 255, 0.2)' },
      { name: 'mad light', brand: 'mad', dark: false, colors: { accent: '#3E6924' }, text: '#6f6a61', muted: '#6f6a61', accent: '#3E6924', border: 'rgba(0, 0, 0, 0.1)' },
      { name: 'mad dark', brand: 'mad', dark: true, colors: { accent: '#DCD799' }, text: 'rgba(255, 255, 255, 0.7)', muted: 'rgba(255, 255, 255, 0.6)', accent: '#DCD799', border: 'rgba(255, 255, 255, 0.2)' },
      { name: 'hjem light', brand: 'hjem', dark: false, colors: { accent: '#163223' }, text: '#6f6a61', muted: '#6f6a61', accent: '#163223', border: 'rgba(0, 0, 0, 0.1)' },
      {
        name: 'hjem dark',
        brand: 'hjem',
        dark: true,
        colors: { text: 'rgba(255,255,255,0.62)', muted: 'rgba(255,255,255,0.62)', accent: '#90ff7c' },
        text: 'rgba(255, 255, 255, 0.62)',
        muted: 'rgba(255, 255, 255, 0.62)',
        accent: '#90ff7c',
        border: 'rgba(255, 255, 255, 0.2)',
      },
    ] as const

    it.each(cases)('$name', ({ brand, dark, colors, text, muted, accent, border }) => {
      render(<Harness brand={brand} dark={dark} colors={colors} />)
      const box = screen.getByRole('checkbox')
      expect(box).toHaveStyle({ accentColor: accent })
      expect(screen.getByText(/^Ja tak til nyheder/)).toHaveStyle({ color: text })
      const sendersButton = screen.getByRole('button', { name: sendersLabel })
      expect(sendersButton).toHaveStyle({ color: muted })
      fireEvent.click(sendersButton)
      const list = screen.getByRole('list')
      expect(list).toHaveStyle({ color: muted })
      expect(list).toHaveStyle({ borderColor: border })
    })
  })

  it('spaces the block 16px above and 12px below by default, and takes overrides', () => {
    const { container, rerender } = render(<Harness brand="forsikring" />)
    const wrap = container.firstElementChild as HTMLElement
    expect(wrap.style.marginTop).toBe('16px')
    expect(wrap.style.marginBottom).toBe('12px')
    rerender(<Harness brand="forsikring" spacing={{ marginTop: 0, marginBottom: 0 }} />)
    expect((container.firstElementChild as HTMLElement).style.marginTop).toBe('0px')
    expect((container.firstElementChild as HTMLElement).style.marginBottom).toBe('0px')
  })
})
