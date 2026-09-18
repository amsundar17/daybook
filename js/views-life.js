// Views: Routines, People, Library, Domains.
const ViewsLife = (() => {
  const esc = ViewsCore.esc;
  const DOW = ["S", "M", "T", "W", "T", "F", "S"];

  function heatStrip(routine) {
    const keys = Dates.last30Keys();
    return `<div class="streak-strip">${keys.map((k) => `<span class="streak-dot ${routine.log[k] ? "on" : ""}" title="${k}"></span>`).join("")}</div>`;
  }

  function renderRoutines() {
    const d = Store.get();
    const active = d.routines.filter((r) => !r.archived);
    const archived = d.routines.filter((r) => r.archived);
    const row = (r) => {
      const doneToday = !!r.log[Dates.todayKey()];
      const streak = Store.routineCurrentStreak(r);
      const freqLabel = r.frequency === "daily" ? "Every day" : `${(r.daysOfWeek || []).map((i) => DOW[i]).join(" ")}`;
      return `
      <div class="card">
        <div class="card-row">
          <button class="checkbox ${doneToday ? "checked" : ""}" data-act="toggle-routine" data-id="${r.id}">${Icon.svg("check")}</button>
          <div style="flex:1; min-width:0;">
            <div class="item-title">${esc(r.title)}</div>
            <div class="item-meta">
              <span class="pill">${freqLabel}</span>
              <span class="pill streak">${streak} day streak</span>
              <span class="pill">best ${r.bestStreak || 0}</span>
            </div>
            ${heatStrip(r)}
          </div>
          <div class="item-actions">
            <button class="icon-btn" data-act="edit" data-collection="routines" data-id="${r.id}">${Icon.svg("edit")}</button>
            <button class="icon-btn" data-act="archive-routine" data-id="${r.id}">${Icon.svg(r.archived ? "check" : "trash")}</button>
          </div>
        </div>
      </div>`;
    };
    return `
    <div class="section-title"><h2>Active</h2></div>
    ${active.length ? active.map(row).join("") : `<div class="empty-state">No routines yet &mdash; add one you want to build a streak on.</div>`}
    ${archived.length ? `<div class="section-title"><h2>Archived</h2></div>${archived.map(row).join("")}` : ""}
    `;
  }

  function renderPeople() {
    const d = Store.get();
    const people = [...d.people].sort((a, b) => (a.followUpDate || "9999").localeCompare(b.followUpDate || "9999"));
    if (!people.length) return `<div class="empty-state">No people saved yet.</div>`;
    return people.map((p) => `
      <div class="card">
        <div class="card-row">
          <div style="flex:1; min-width:0;">
            <div class="item-title">${esc(p.name)}</div>
            <div class="item-meta">
              ${p.relationship ? `<span class="pill">${esc(p.relationship)}</span>` : ""}
              ${p.lastContactedAt ? `<span>Last contact: ${Dates.relativeShort(p.lastContactedAt)}</span>` : ""}
              ${p.followUpDate ? `<span class="pill ${Dates.isPast(p.followUpDate) ? "overdue" : ""}">Follow up ${Dates.humanize(p.followUpDate)}</span>` : ""}
            </div>
            ${p.notes ? `<div class="item-meta">${esc(p.notes)}</div>` : ""}
          </div>
          <div class="item-actions">
            <button class="icon-btn" data-act="contacted-today" data-id="${p.id}" title="Mark contacted today">${Icon.svg("check")}</button>
            <button class="icon-btn" data-act="edit" data-collection="people" data-id="${p.id}">${Icon.svg("edit")}</button>
            <button class="icon-btn" data-act="delete" data-collection="people" data-id="${p.id}">${Icon.svg("trash")}</button>
          </div>
        </div>
      </div>`).join("");
  }

  const LIB_TYPE_LABEL = { note: "Note", journal: "Journal", highlight: "Highlight", quote: "Quote" };

  function renderDailyQuotes() {
    const today = Quotes.allOfDay();
    return `
    <div class="section-title"><h2>Today's quotes</h2></div>
    <div style="display:grid; gap:10px; grid-template-columns:repeat(auto-fit, minmax(220px,1fr)); margin-bottom:8px;">
      ${today.map((q) => `
        <div class="card resurface-card">
          <div class="item-meta" style="margin-bottom:4px;"><span class="pill">${esc(q.category.replace("-", " "))}</span></div>
          <div class="item-title">${esc(q.body)}</div>
          <div class="item-meta">&mdash; ${esc(q.source)}</div>
        </div>`).join("")}
    </div>
    `;
  }

  function renderLibrary() {
    const d = Store.get();
    const items = [...d.libraryItems].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    const quotesHtml = renderDailyQuotes();
    const itemsHtml = !items.length ? `<div class="section-title"><h2>Your library</h2></div><div class="empty-state">Nothing in your library yet.</div>` : `<div class="section-title"><h2>Your library</h2></div>` + items.map((it) => `
      <div class="card">
        <div class="card-row">
          <div style="flex:1; min-width:0;">
            <div class="item-meta" style="margin-bottom:4px;"><span class="pill">${LIB_TYPE_LABEL[it.type] || "Note"}</span> ${it.tags?.length ? it.tags.map((t) => `<span class="pill">#${esc(t)}</span>`).join(" ") : ""}</div>
            ${it.title ? `<div class="item-title">${esc(it.title)}</div>` : ""}
            <div>${esc(it.body).slice(0, 400)}</div>
            ${it.source ? `<div class="item-meta">&mdash; ${esc(it.source)}</div>` : ""}
          </div>
          <div class="item-actions">
            <button class="icon-btn" data-act="edit" data-collection="library" data-id="${it.id}">${Icon.svg("edit")}</button>
            <button class="icon-btn" data-act="delete" data-collection="library" data-id="${it.id}">${Icon.svg("trash")}</button>
          </div>
        </div>
      </div>`).join("");
    return quotesHtml + itemsHtml;
  }

  function renderDomains() {
    const d = Store.get();
    const domains = [...d.domains].sort((a, b) => (a.renewalDate || "9999").localeCompare(b.renewalDate || "9999"));
    if (!domains.length) return `<div class="empty-state">No domains tracked yet.</div>`;
    return `
    <div style="overflow-x:auto;">
    <table class="table">
      <thead><tr><th>Domain</th><th>Registrar</th><th>Renews</th><th>Cost</th><th></th></tr></thead>
      <tbody>
        ${domains.map((dm) => `
          <tr>
            <td>${esc(dm.name)}</td>
            <td>${esc(dm.registrar || "—")}</td>
            <td>${dm.renewalDate ? `<span class="pill ${Dates.daysBetween(Dates.todayKey(), dm.renewalDate) <= 30 ? "overdue" : ""}">${Dates.humanize(dm.renewalDate)}</span>` : "—"}</td>
            <td>${dm.cost ? `$${dm.cost}/yr` : "—"}</td>
            <td>
              <div class="item-actions">
                <button class="icon-btn" data-act="edit" data-collection="domains" data-id="${dm.id}">${Icon.svg("edit")}</button>
                <button class="icon-btn" data-act="delete" data-collection="domains" data-id="${dm.id}">${Icon.svg("trash")}</button>
              </div>
            </td>
          </tr>`).join("")}
      </tbody>
    </table>
    </div>`;
  }

  return { renderRoutines, renderPeople, renderLibrary, renderDomains, DOW };
})();
