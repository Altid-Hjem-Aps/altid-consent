'use client'

import { useId, type CSSProperties } from 'react'
import type { Brand } from '../brands.js'
import { consentSentences } from '../sentences.js'
import type { ConsentState } from '../state.js'

export type ConsentColors = { text: string; muted: string; accent: string }

// Defaults are altidforsikring.dk's, so it renders exactly as before adoption.
// Other sites override what differs — usually just `accent`.
const LIGHT: ConsentColors = { text: '#6f6a61', muted: '#6f6a61', accent: '#448df5' }
const DARK: ConsentColors = { text: 'rgba(255,255,255,0.7)', muted: 'rgba(255,255,255,0.6)', accent: '#a7d3f9' }

export type ConsentBlockProps = {
  brand: Brand
  value: ConsentState
  onChange: (next: ConsentState) => void
  dark?: boolean
  colors?: Partial<ConsentColors>
}

// One active, never pre-ticked, optional box. The broad sentence shows by
// default; a text link swaps to this brand alone. Switching clears the tick, so
// a person can only consent to the sentence they are looking at. DECISIONS.md
// says why each of these is so.
//
// Inline styles only: Tailwind does not scan node_modules, so utility classes in
// a package would silently not exist on the sites that install it. The values
// reproduce the classes altidforsikring.dk used (text-xs, text-[11px],
// leading-relaxed, gap-1, gap-2.5, mt-4, mb-3, underline-offset-2).
export function ConsentBlock({ brand, value, onChange, dark = false, colors }: ConsentBlockProps) {
  const c = { ...(dark ? DARK : LIGHT), ...colors }
  const s = consentSentences(brand)
  const boxId = useId()
  const withdrawId = useId()
  const sentence = value.scope === 'all' ? s.all : s.own
  const linkLabel = value.scope === 'all' ? s.narrowLink : s.broadLink

  const wrap: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 16, marginBottom: 12, textAlign: 'left' }
  const row: CSSProperties = { display: 'flex', gap: 10, alignItems: 'flex-start' }
  const box: CSSProperties = { width: 17, height: 17, marginTop: 2, flexShrink: 0, accentColor: c.accent, cursor: 'pointer' }
  const label: CSSProperties = { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.45, color: c.text, cursor: 'pointer' }
  const second: CSSProperties = { fontSize: 11, fontWeight: 400, lineHeight: 1.625, color: c.muted, opacity: 0.85, margin: '0 0 0 27px' }
  const link: CSSProperties = {
    color: c.muted,
    background: 'transparent',
    border: 0,
    padding: 0,
    font: 'inherit',
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: 2,
  }

  return (
    <div style={wrap}>
      <div style={row}>
        <input
          id={boxId}
          type="checkbox"
          checked={value.checked}
          onChange={(e) => onChange({ ...value, checked: e.target.checked })}
          aria-describedby={withdrawId}
          style={box}
        />
        {/* htmlFor rather than wrapping: keeps the tick target and the reading
            target the same rectangle without nesting interactive elements. */}
        <label htmlFor={boxId} style={label}>
          {sentence}
        </label>
      </div>
      {/* Smaller and lighter than the sentence, so the eye reads one sentence,
          not a block of terms. */}
      <p id={withdrawId} style={second}>
        {s.withdraw}
        <span aria-hidden="true" style={{ margin: '0 8px' }}>·</span>
        <button
          type="button"
          onClick={() => onChange({ checked: false, scope: value.scope === 'all' ? 'own' : 'all' })}
          style={link}
        >
          {linkLabel}
        </button>
      </p>
    </div>
  )
}
