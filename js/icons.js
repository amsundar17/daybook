// Small inline stroke-icon set so the nav looks consistent on iOS and Windows
// instead of relying on emoji rendering differently per platform.
const Icon = (() => {
  const PATHS = {
    today: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    capture: '<path d="M12 19v3M8 22h8"/><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/>',
    tasks: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/>',
    routines: '<path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 2v6l4-3"/><path d="m9 12 2 2 4-4"/>',
    projects: '<path d="M3 7a2 2 0 0 1 2-2h3l2 2h9a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    content: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 20h10M9 8h6M9 12h6M9 16h3"/>',
    people: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17.5" cy="8.5" r="2.6"/><path d="M15.7 12.4a4.7 4.7 0 0 1 5 5.6"/>',
    library: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H10v18H5.5A1.5 1.5 0 0 1 4 19.5Z"/><path d="M20 4.5A1.5 1.5 0 0 0 18.5 3H14v18h4.5a1.5 1.5 0 0 0 1.5-1.5Z"/>',
    domains: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
    finance: '<rect x="2.5" y="6" width="19" height="13" rx="2"/><path d="M2.5 10h19"/><circle cx="17" cy="14.5" r="1.4"/>',
    health: '<path d="M12 21s-7.5-4.7-10-9.3C.4 8.2 2.3 4.5 6 4c2-.3 3.7.6 6 3 2.3-2.4 4-3.3 6-3 3.7.5 5.6 4.2 4 7.7C19.5 16.3 12 21 12 21Z"/><path d="M7 11h2l1.2-2.5L11.8 13 13 10.5h4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    ask: '<path d="M8 12h.01M12 12h.01M16 12h.01"/><path d="M21 12a8.5 8.5 0 1 1-4-7.2L21 4l-1 4.5A8.4 8.4 0 0 1 21 12Z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.6 1Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12 4 4 10-10"/>',
    trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    flame: '<path d="M12 2s5 4.5 5 9.5A5 5 0 0 1 7 11.5C7 9 9 7 9 7s-1 3 1 4c0-3 2-4 2-4-.5 3 1 3.5 1 5.5A2 2 0 0 1 9 13c0-1 .5-2 .5-2"/>',
    download: '<path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 19h16"/>',
    upload: '<path d="M12 21V9m0 0 4 4m-4-4-4 4"/><path d="M4 3h16"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    link: '<path d="M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 1 1 0 10h-2M8 12h8"/>',
    dot: '<circle cx="12" cy="12" r="3"/>',
  };

  function svg(name, cls = "") {
    const d = PATHS[name] || PATHS.dot;
    return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  }

  return { svg };
})();
