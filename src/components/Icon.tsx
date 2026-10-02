const paths: Record<string, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  today: <><rect x="3" y="4.5" width="18" height="16.5" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4M8.5 15l2.5 2.5 4.5-5" /></>,
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  more: <><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></>,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  flame: <path d="M12 21c4 0 7-2.7 7-6.6 0-3.6-2.6-5.6-4-8.9-1 2.1-2.2 3-3.4 3.4C11.3 6.6 10.1 4.2 8 3c.4 3.2-3 5.8-3 11.1C5 18.3 8 21 12 21z" />,
  rewind: <path d="M11 6 4 12l7 6zM20 6l-7 6 7 6z" />,
  play: <path d="M8 5.5v13l11-6.5z" />,
  book: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />,
  pen: <path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>,
  shield: <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" />,
  logout: <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  chevron: <path d="m15 5-7 7 7 7" />,
  chevronNext: <path d="m9 5 7 7-7 7" />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
};

export function Icon({ name, className = 'h-5 w-5', filled = false }: { name: keyof typeof paths | string; className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] ?? null}
    </svg>
  );
}
