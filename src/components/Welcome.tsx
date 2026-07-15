import { useEffect, useState } from 'react'

import { BUSINESS } from '../config'
import { lookupLastOrder, type Recognized } from '../lib/recognition'
import { Logo } from './Logo'

type Props = {
  onEnter: (phone: string, recognized: Recognized | null) => void
}

function getPhoneFromUrl(): string {
  if (typeof window === 'undefined') return ''
  try {
    const url = new URL(window.location.href)
    const p = url.searchParams.get('phone') || url.searchParams.get('whatsapp') || url.searchParams.get('tel') || ''
    return p.replace(/[^\d]/g, '').slice(0, 13)
  } catch {
    return ''
  }
}

export function Welcome({ onEnter }: Props) {
  const [phone, setPhone] = useState<string>(() => getPhoneFromUrl())
  const [recognized, setRecognized] = useState<Recognized | null>(null)
  const [checking, setChecking] = useState(false)
  const digits = phone.replace(/[^\d]/g, '')
  const ready = digits.length >= 10

  // Si la URL trae un teléfono, hace lookup automático al montar.
  useEffect(() => {
    if (digits.length >= 10) {
      void check()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function check() {
    if (digits.length < 10) {
      setRecognized(null)
      return
    }
    setChecking(true)
    const r = await lookupLastOrder(digits)
    setRecognized(r)
    setChecking(false)
  }

  function go() {
    if (!ready) return
    onEnter(digits, recognized)
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-7 pb-8 pt-10 text-center">
      <Logo size={132} className="mb-5" />

      <div className="font-display text-[40px] leading-[0.95] tracking-tight text-ink">
        CÁRNICOS GUSTAVO
      </div>
      <p className="mt-2 max-w-xs text-sm font-medium text-ink-soft">{BUSINESS.tagline}</p>

      {/* Teléfono como protagonista (CTA) */}
      <div className="mt-9 w-full max-w-sm text-left">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-faint">
          Tu WhatsApp
        </label>
        <div
          className={[
            'flex items-center gap-2 rounded-2xl border-2 bg-paper2 px-4 transition-colors',
            recognized ? 'border-green' : ready ? 'border-red' : 'border-line/15',
          ].join(' ')}
        >
          <span className="text-base font-bold text-ink-soft">🇲🇽</span>
          <input
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              setRecognized(null)
            }}
            onBlur={check}
            inputMode="tel"
            placeholder="55 0000 0000"
            autoFocus={digits.length === 0}
            className="w-full bg-transparent py-4 font-mono text-lg font-bold tracking-wide text-ink outline-none placeholder:text-ink-faint"
          />
          {checking && <span className="text-xs text-ink-faint">…</span>}
          {recognized && (
            <svg className="h-5 w-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {recognized && (
          <div className="cg-fade mt-3 rounded-xl border border-green/40 bg-green-wash px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
              Bienvenido de nuevo
            </div>
            <div className="mt-0.5 text-[17px] font-extrabold text-ink">
              {recognized.businessName || '¿Qué te llevas hoy?'} 👋
            </div>
          </div>
        )}

        {!recognized && digits.length >= 7 && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-soft">
            <span>✨</span>
            <span>¿Primera vez? Empieza con un pedido pequeño.</span>
          </div>
        )}

        <button
          type="button"
          onClick={go}
          disabled={!ready}
          className={[
            'cg-tap mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-extrabold text-white shadow-soft transition-opacity',
            recognized ? 'bg-green' : 'bg-red',
            ready ? 'opacity-100' : 'opacity-45',
          ].join(' ')}
        >
          {recognized ? 'Entrar a mi cuenta' : 'Empezar pedido'}
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>

        <p className="mt-3 text-center text-[11px] font-medium text-ink-faint">
          Manda tu número y te reconocemos. Tu pedido se envía al CEDIS por WhatsApp.
        </p>
      </div>
    </div>
  )
}
