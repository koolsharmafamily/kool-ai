import { useEffect, useRef, useState } from 'react'
import { MODELS, getModel, providerColor } from '../lib/models'
import { ChevronDownIcon, CheckIcon } from './icons'

export default function ModelSelector({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = getModel(value)

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-surface-700 bg-surface-850 px-3 py-1.5 text-sm text-slate-200 hover:bg-surface-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${providerColor(current.provider)}`} />
        {current.label}
        <ChevronDownIcon className={`transition-transform ${open ? 'rotate-180' : ''}`} width={14} height={14} />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-72 overflow-hidden rounded-xl border border-surface-700 bg-surface-850 shadow-xl animate-fadeIn">
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onChange(m.id)
                setOpen(false)
              }}
              className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-surface-800"
            >
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${providerColor(m.provider)}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-slate-100">{m.label}</span>
                <span className="block truncate text-xs text-slate-500">{m.description}</span>
              </span>
              {m.id === value && <CheckIcon className="mt-1 shrink-0 text-accent-400" width={14} height={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
