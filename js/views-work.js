// Views: Tasks, Projects, Content pipeline.
const ViewsWork = (() => {
  const esc = ViewsCore.esc;

  function renderTasks() {
    const d = Store.get();
    const open = d.tasks.filter((t) => !t.done).sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
    });
    const done = d.tasks.filter((t) => t.done);
    return `
    <div class="section-title"><h2>Open (${open.length})</h2></div>
    ${open.length ? open.map(ViewsCore.taskRow).join("") : `<div class="empty-state">No open tasks. Nice.</div>`}
    ${done.length ? `
    <div class="section-title"><h2>Done (${done.length})</h2></div>
    ${done.slice(0, 25).map(ViewsCore.taskRow).join("")}` : ""}
    `;
  }

  function projectProgress(project, tasks) {
    const linked = tasks.filter((t) => t.projectId === project.id);
    if (!linked.length) return null;
    const doneCt = linked.filter((t) => t.done).length;
    return { doneCt, total: linked.length, pct: Math.round((doneCt / linked.length) * 100) };
  }

  function renderProjects() {
    const d = Store.get();
    const projects = d.projects.filter((p) => p.type === "project");
    const retainers = d.projects.filter((p) => p.type === "retainer");
    const card = (p) => {
      const prog = projectProgress(p, d.tasks);
      return `
      <div class="card">
        <div class="card-row">
          <div style="flex:1; min-width:0;">
            <div class="item-title">${esc(p.name)}</div>
            <div class="item-meta">
              <span class="pill">${esc(p.status)}</span>
              ${p.type === "project" && p.dueDate ? `<span class="pill ${Dates.isPast(p.dueDate) && p.status !== "done" ? "overdue" : ""}">${Dates.humanize(p.dueDate)}</span>` : ""}
              ${p.type === "retainer" ? `<span class="pill">$${p.monthlyAmount || 0}/mo</span>` : ""}
              ${prog ? `<span class="pill">${prog.doneCt}/${prog.total} tasks</span>` : ""}
            </div>
            ${p.notes ? `<div class="item-meta">${esc(p.notes)}</div>` : ""}
          </div>
          <div class="item-actions">
            <button class="icon-btn" data-act="edit" data-collection="projects" data-id="${p.id}">${Icon.svg("edit")}</button>
            <button class="icon-btn" data-act="delete" data-collection="projects" data-id="${p.id}">${Icon.svg("trash")}</button>
          </div>
        </div>
      </div>`;
    };
    return `
    <div class="section-title"><h2>Projects</h2></div>
    ${projects.length ? projects.map(card).join("") : `<div class="empty-state">No one-time projects yet.</div>`}
    <div class="section-title"><h2>Retainers</h2></div>
    ${retainers.length ? retainers.map(card).join("") : `<div class="empty-state">No ongoing retainers yet.</div>`}
    `;
  }

  const CONTENT_STAGES = [
    { key: "idea", label: "Idea" },
    { key: "drafting", label: "Drafting" },
    { key: "scheduled", label: "Scheduled" },
    { key: "published", label: "Published" },
  ];

  function renderContent() {
    const d = Store.get();
    return `
    <div class="kanban">
      ${CONTENT_STAGES.map((stage) => {
        const items = d.contentItems.filter((c) => c.stage === stage.key);
        return `
        <div class="kanban-col">
          <h4>${stage.label} (${items.length})</h4>
          ${items.map((c) => {
            const idx = CONTENT_STAGES.findIndex((s) => s.key === c.stage);
            const prev = CONTENT_STAGES[idx - 1];
            const next = CONTENT_STAGES[idx + 1];
            return `
            <div class="card">
              <div class="item-title">${esc(c.title)}</div>
              <div class="item-meta"><span class="pill">${esc(c.type)}</span></div>
              ${c.url ? `<div class="item-meta"><a href="${esc(c.url)}" target="_blank" rel="noopener">${Icon.svg("link")} link</a></div>` : ""}
              <div class="kanban-stage-actions">
                ${prev ? `<button class="btn secondary" data-act="content-stage" data-id="${c.id}" data-stage="${prev.key}">&larr; ${prev.label}</button>` : "<span></span>"}
                ${next ? `<button class="btn secondary" data-act="content-stage" data-id="${c.id}" data-stage="${next.key}">${next.label} &rarr;</button>` : "<span></span>"}
              </div>
              <div class="item-actions" style="margin-top:8px; margin-left:0;">
                <button class="icon-btn" data-act="edit" data-collection="content" data-id="${c.id}">${Icon.svg("edit")}</button>
                <button class="icon-btn" data-act="delete" data-collection="content" data-id="${c.id}">${Icon.svg("trash")}</button>
              </div>
            </div>`;
          }).join("") || `<div class="empty-state" style="padding:16px;">Empty</div>`}
        </div>`;
      }).join("")}
    </div>
    `;
  }

  return { renderTasks, renderProjects, renderContent, CONTENT_STAGES };
})();
