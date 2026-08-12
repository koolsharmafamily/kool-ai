const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const SendIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
  </svg>
)

export const StopIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
)

export const CopyIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

export const CheckIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const TrashIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M3 6h18" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

export const PlusIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const ChevronDownIcon = (props) => (
  <svg {...base} {...props}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const BotIcon = (props) => (
  <svg {...base} {...props}>
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M12 8V4M8 4h8" />
    <circle cx="8.5" cy="14" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="14" r="1.2" fill="currentColor" stroke="none" />
  </svg>
)

export const UserIcon = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
)

export const AlertIcon = (props) => (
  <svg {...base} {...props}>
    <path d="M12 9v4M12 17h.01" />
    <circle cx="12" cy="12" r="10" />
  </svg>
)
