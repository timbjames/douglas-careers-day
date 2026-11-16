/** Simple line icons drawn in the current text colour, to sit inside call-to-action buttons. */

const base = {
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function TicketIcon() {
  return (
    <svg {...base}>
      {/* Ticket with notched sides and a perforation line */}
      <path d="M4 9h24v4a3 3 0 0 0 0 6v4H4v-4a3 3 0 0 0 0-6z" />
      <path d="M20 9v14" strokeDasharray="2 3" />
    </svg>
  )
}

export function BugIcon() {
  return (
    <svg {...base}>
      {/* Beetle: body, head, legs and antennae */}
      <ellipse cx="16" cy="19" rx="6.5" ry="8" />
      <path d="M12.5 11.5a3.5 3.5 0 0 1 7 0" />
      <path d="M16 11v16" />
      <path d="M9.5 15 5 13M9.5 20H4.5M10 24.5 6 27M22.5 15l4.5-2M22.5 20h5M22 24.5l4 2.5" />
      <path d="M14 8.5 12 5M18 8.5 20 5" />
    </svg>
  )
}
