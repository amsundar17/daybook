// Views: Today dashboard, Capture, Ask, Settings.
const ViewsCore = (() => {
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function priorityPill(p) {
    const labels = { 1: "High", 2: "Medium", 3: "Low" };
    return `<span class="pill p${p}">${labels[p] || "Medium"}</span>`;
  }

  function taskRow(t) {
    return `
    <div class="card">
      <div class="card-row">
        <button class="checkbox ${t.done ? "checked" : ""}" data-act="toggle-task" data-id="${t.id}">${Icon.svg("check")}</button>
        <div style="flex:1; min-width:0;">
          <div class="item-title ${t.done ? "done" : ""}">${esc(t.title)}</div>
          <div class="item-meta">
            ${priorityPill(t.priority)}
            ${t.dueDate ? `<span class="pill ${Dates.isPast(t.dueDate) && !t.done ? "overdue" : ""}">${Dates.humanize(t.dueDate)}</span>` : ""}
          </div>
        </div>
        <div class="item-actions">
          <button class="icon-btn" data-act="edit" data-collection="tasks" data-id="${t.id}">${Icon.svg("edit")}</button>
          <button class="icon-btn" data-act="delete" data-collection="tasks" data-id="${t.id}">${Icon.svg("trash")}</button>
        </div>
      </div>
    </div>`;
  }

  function routineTodayRow(r) {
    const key = Dates.todayKey();
    const done = !!r.log[key];
    const streak = Store.routineCurrentStreak(r);
    return `
    <div class="card">
      <div class="card-row">
        <button class="checkbox ${done ? "checked" : ""}" data-act="toggle-routine" data-id="${r.id}">${Icon.svg("check")}</button>
        <div style="flex:1; min-width:0;">
          <div class="item-title">${esc(r.title)}</div>
          <div class="item-meta">
            <span class="pill streak">${Icon.svg("flame", "")} ${streak} day streak</span>
          </div>
        </div>
      </div>
    </div>`;
  }

  function getSlippingItems() {
    const d = Store.get();
    const out = [];
    for (const t of d.tasks) {
      if (!t.done && t.dueDate && Dates.isPast(t.dueDate)) {
        out.push({ kind: "Task", title: t.title, detail: Dates.humanize(t.dueDate), collection: "tasks", id: t.id });
      }
    }
    for (const p of d.projects) {
      if (p.status === "active" && p.dueDate && Dates.isPast(p.dueDate)) {
        out.push({ kind: "Project", title: p.name, detail: Dates.humanize(p.dueDate), collection: "projects", id: p.id });
      }
    }
    for (const p of d.people) {
      if (p.followUpDate && Dates.isPast(p.followUpDate)) {
        out.push({ kind: "Follow up", title: p.name, detail: Dates.humanize(p.followUpDate), collection: "people", id: p.id });
      }
    }
    for (const dm of d.domains) {
      if (dm.renewalDate && Dates.daysBetween(Dates.todayKey(), dm.renewalDate) <= 30) {
        out.push({ kind: "Domain renewal", title: dm.name, detail: Dates.humanize(dm.renewalDate), collection: "domains", id: dm.id });
      }
    }
    for (const c of d.contentItems) {
      if (c.stage !== "published" && Dates.daysBetween(c.createdAt.slice(0,10), Dates.todayKey()) > 14) {
        out.push({ kind: "Stalled content", title: c.title, detail: `${c.stage} for a while`, collection: "content", id: c.id });
      }
    }
    return out;
  }

  function renderToday() {
    const d = Store.get();
    const hour = new Date().getHours();
    const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const name = d.settings.name ? `, ${esc(d.settings.name)}` : "";

    const openTasks = d.tasks.filter((t) => !t.done);
    const top3 = [...openTasks].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.dueDate && b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    }).slice(0, 3);

    const dueRoutines = d.routines.filter((r) => Store.routineIsDueOn(r, Dates.todayKey()));
    const slipping = getSlippingItems();

    const lib = d.libraryItems;
    const resurfaced = lib.length ? lib[Math.floor(Math.random() * lib.length) % lib.length] : null;

    return `
    <div class="greeting">${greet}${name}</div>
    <div class="greeting-sub">${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>

    <div class="section-title"><h2>Top 3 today</h2></div>
    ${top3.length ? top3.map(taskRow).join("") : `<div class="empty-state">Nothing urgent &mdash; capture a task to get started.</div>`}

    ${slipping.length ? `
    <div class="section-title"><h2>Slipping</h2></div>
    <div class="slipping">
      ${slipping.map((s) => `
        <div class="card">
          <div class="card-row">
            <div style="flex:1;">
              <div class="item-title">${esc(s.title)}</div>
              <div class="item-meta"><span class="pill overdue">${esc(s.kind)}</span><span>${esc(s.detail)}</span></div>
            </div>
          </div>
        </div>`).join("")}
    </div>` : ""}

    <div class="section-title"><h2>Calendar</h2></div>
    <div id="today-calendar">${renderGoogleGate("calendar events")}</div>

    <div class="section-title"><h2>From your inbox (TODO)</h2></div>
    <div id="today-gmail">${renderGoogleGate("TODO emails")}</div>

    <div class="section-title"><h2>Routines due today</h2></div>
    ${dueRoutines.length ? dueRoutines.map(routineTodayRow).join("") : `<div class="empty-state">No routines scheduled for today.</div>`}

    ${resurfaced ? `
    <div class="section-title"><h2>From your library</h2></div>
    <div class="card resurface-card">
      <div class="item-title">${esc(resurfaced.body).slice(0, 220)}</div>
      ${resurfaced.source ? `<div class="item-meta">&mdash; ${esc(resurfaced.source)}</div>` : ""}
    </div>` : ""}

    <div class="section-title"><h2>Daily quote</h2></div>
    ${renderDailyQuoteCard()}
    `;
  }

  function renderGoogleGate(what) {
    if (!GoogleIntegration.isConnected()) {
      return `<div class="empty-state">Connect Google in Settings to see ${esc(what)} here.</div>`;
    }
    return `<div class="empty-state">Loading&hellip;</div>`;
  }

  function renderDailyQuoteCard() {
    const cats = ["spirituality", "wisdom", "life-hacks"];
    const dayIdx = Math.floor(Date.now() / 86400000);
    const cat = cats[dayIdx % cats.length];
    const q = Quotes.quoteOfDay(cat);
    if (!q) return "";
    return `
    <div class="card resurface-card">
      <div class="item-meta" style="margin-bottom:4px;"><span class="pill">${esc(cat.replace("-", " "))}</span></div>
      <div class="item-title">${esc(q.body)}</div>
      <div class="item-meta">&mdash; ${esc(q.source)}</div>
    </div>`;
  }

  function renderCalendarEvents(events) {
    if (!events.length) return `<div class="empty-state">Nothing on your calendar today.</div>`;
    return events.map((e) => `
      <div class="card">
        <div class="card-row">
          <div style="flex:1; min-width:0;">
            <div class="item-title">${esc(e.title)}</div>
            <div class="item-meta">
              <span>${e.allDay ? "All day" : new Date(e.start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
              ${e.location ? `<span>${esc(e.location)}</span>` : ""}
            </div>
          </div>
        </div>
      </div>`).join("");
  }

  function renderGmailTodoList(messages) {
    if (!messages.length) return `<div class="empty-state">No emails under the TODO label.</div>`;
    return messages.map((m) => `
      <div class="card">
        <div class="card-row">
          <div style="flex:1; min-width:0;">
            <div class="item-title">${esc(m.subject)}</div>
            <div class="item-meta"><span>${esc(m.from)}</span></div>
            ${m.snippet ? `<div class="item-meta">${esc(m.snippet).slice(0, 140)}</div>` : ""}
          </div>
        </div>
      </div>`).join("");
  }

  function renderGoogleError(err) {
    return `<div class="empty-state">Couldn't load from Google: ${esc(err.message || err)}</div>`;
  }

  function renderCapture() {
    return `
    <div class="capture-box">
      <textarea id="capture-input" placeholder="Type or paste anything: a task, a note, a quote… e.g. &quot;task: call the plumber tomorrow&quot;" autofocus></textarea>
      <div class="capture-preview" id="capture-preview">Start typing to see where this will be filed.</div>
      <div class="modal-actions" style="margin-top:12px;">
        <button class="btn primary" id="capture-submit">File it</button>
      </div>
    </div>
    <div class="capture-hints">
      <div class="section-title"><h2>How capture works</h2></div>
      <p style="color:var(--text-muted); font-size:13.5px; margin-bottom:10px;">
        There's no AI behind this &mdash; it's a small set of rules that read your prefix and a few keywords, the same way a real capture inbox would file things before you clean them up later.
      </p>
      <ul style="color:var(--text-muted); font-size:13.5px;">
        <li><code>task:</code> / <code>todo:</code> &rarr; Tasks (add <code>tomorrow</code>, <code>friday</code>, <code>p1</code> for priority)</li>
        <li><code>routine:</code> &rarr; Routines</li>
        <li><code>project:</code> / <code>retainer:</code> &rarr; Projects</li>
        <li><code>content:</code> / <code>video:</code> / <code>article:</code> &rarr; Content pipeline</li>
        <li><code>person:</code> &rarr; People</li>
        <li><code>note:</code> / <code>journal:</code> / <code>quote:</code> / <code>highlight:</code> &rarr; Library</li>
        <li><code>domain:</code> &rarr; Domains</li>
        <li>No prefix &rarr; filed as a Task</li>
      </ul>
    </div>
    <div class="section-title"><h2>Recently captured</h2></div>
    <div class="recent-capture-list" id="recent-capture-list"></div>
    `;
  }

  function renderRecentCaptures() {
    const d = Store.get();
    const all = [];
    const push = (arr, label, coll) => arr.forEach((x) => all.push({ label, coll, id: x.id, title: x.title || x.name || x.body, createdAt: x.createdAt }));
    push(d.tasks, "Task", "tasks");
    push(d.routines, "Routine", "routines");
    push(d.projects.map(p => ({...p, title: p.name})), "Project", "projects");
    push(d.contentItems, "Content", "content");
    push(d.people, "Person", "people");
    push(d.libraryItems, "Library", "library");
    push(d.domains, "Domain", "domains");
    all.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    const recent = all.slice(0, 8);
    if (!recent.length) return `<div class="empty-state">Nothing captured yet.</div>`;
    return recent.map((r) => `
      <div class="card">
        <div class="card-row">
          <span class="pill">${esc(r.label)}</span>
          <div style="flex:1; min-width:0;">${esc(String(r.title).slice(0, 90))}</div>
          <div class="item-meta">${Dates.relativeShort(r.createdAt)}</div>
        </div>
      </div>`).join("");
  }

  function renderAskLog(log) {
    return log.map((m) => `<div class="chat-msg ${m.role}">${esc(m.text)}</div>`).join("");
  }

  function renderAsk() {
    return `
    <div class="chat-log" id="chat-log"></div>
    <div class="chat-note">This asks your own data with keyword search &mdash; it's not a hosted model, so nothing leaves your device.</div>
    <div class="chat-input-bar">
      <input id="chat-input" type="text" placeholder="Ask about your tasks, projects, people…" autocomplete="off" />
      <button class="icon-btn" id="chat-send">${Icon.svg("check")}</button>
    </div>
    `;
  }

  function renderSettings() {
    const s = Store.get().settings;
    return `
    <div class="section-title"><h2>Profile</h2></div>
    <div class="card">
      <div class="field">
        <label>Your name</label>
        <input id="settings-name" type="text" value="${esc(s.name)}" placeholder="e.g. Alex" />
      </div>
    </div>

    <div class="section-title"><h2>Appearance</h2></div>
    <div class="card">
      <div class="settings-row">
        <div>
          <div class="label">Theme</div>
          <div class="desc">System follows your iPhone or Windows setting.</div>
        </div>
        <div class="seg-group" id="theme-seg">
          <button data-theme-choice="system" class="${s.theme === "system" ? "active" : ""}">System</button>
          <button data-theme-choice="light" class="${s.theme === "light" ? "active" : ""}">Light</button>
          <button data-theme-choice="dark" class="${s.theme === "dark" ? "active" : ""}">Dark</button>
        </div>
      </div>
    </div>

    <div class="section-title"><h2>Notifications</h2></div>
    <div class="card">
      <div class="settings-row">
        <div>
          <div class="label">Local reminders</div>
          <div class="desc">Uses your browser's Notification API while the app is open. iOS only allows this for a PWA added to your Home Screen (iOS 16.4+), and Windows works in any browser.</div>
        </div>
        <button class="switch ${s.notificationsEnabled ? "on" : ""}" id="notif-toggle"></button>
      </div>
    </div>

    <div class="section-title"><h2>Google account</h2></div>
    <div class="card">
      <p style="font-size:13.5px; color:var(--text-muted); margin-bottom:12px;">
        Powers Calendar events and Gmail TODO emails on Today, and Google Tasks. This is a separate connection from any Google/Gmail access you use elsewhere &mdash; it needs its own OAuth Client ID.
      </p>
      <div class="field">
        <label>Google OAuth Client ID</label>
        <input id="settings-google-client-id" type="text" value="${esc(s.googleClientId)}" placeholder="xxxx.apps.googleusercontent.com" />
      </div>
      <details style="font-size:12.5px; color:var(--text-muted); margin-bottom:12px;">
        <summary style="cursor:pointer; font-weight:600;">How to get a Client ID (one-time, ~5 min)</summary>
        <ol style="padding-left:18px; margin-top:8px; display:grid; gap:4px;">
          <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">Google Cloud Console &rarr; Credentials</a> and create a project.</li>
          <li>Enable the <strong>Calendar API</strong>, <strong>Tasks API</strong>, and <strong>Gmail API</strong> (APIs &amp; Services &rarr; Library).</li>
          <li>Configure the OAuth consent screen as <strong>External</strong> and add your own Google account under Test users (this keeps it free and private, no Google review needed).</li>
          <li>Create an <strong>OAuth client ID</strong> of type <strong>Web application</strong>. Add this app's URL (e.g. your GitHub Pages URL, and <code>http://localhost:8791</code> for local testing) under Authorized JavaScript origins.</li>
          <li>Copy the Client ID here.</li>
        </ol>
      </details>
      <div style="display:flex; gap:8px; align-items:center;">
        <button class="btn ${GoogleIntegration.isConnected() ? "secondary" : "primary"}" id="google-connect-btn">${GoogleIntegration.isConnected() ? "Reconnect Google" : "Connect Google"}</button>
        ${GoogleIntegration.isConnected() ? `<span class="pill streak">Connected</span><button class="btn secondary" id="google-disconnect-btn">Disconnect</button>` : ""}
      </div>
    </div>

    <div class="section-title"><h2>Postgres sync (Supabase)</h2></div>
    <div class="card">
      <p style="font-size:13.5px; color:var(--text-muted); margin-bottom:12px;">
        Optional: mirrors everything to a real Postgres database so it syncs across your iPhone and PC. Data still works fully offline in localStorage either way.
      </p>
      <details style="font-size:12.5px; color:var(--text-muted); margin-bottom:12px;">
        <summary style="cursor:pointer; font-weight:600;">One-time setup</summary>
        <ol style="padding-left:18px; margin-top:8px; display:grid; gap:4px;">
          <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a>.</li>
          <li>Open the SQL Editor and run the <code>supabase-schema.sql</code> file included with this app, once.</li>
          <li>In Project Settings &rarr; API, copy the <strong>Project URL</strong> and <strong>anon public</strong> key below.</li>
        </ol>
        <p style="margin-top:6px;">Anyone with these two values can read/write your data &mdash; treat the anon key like a password, don't publish it.</p>
      </details>
      <div class="field">
        <label>Supabase project URL</label>
        <input id="settings-supabase-url" type="text" value="${esc(s.supabaseUrl)}" placeholder="https://xxxx.supabase.co" />
      </div>
      <div class="field">
        <label>Supabase anon public key</label>
        <input id="settings-supabase-key" type="text" value="${esc(s.supabaseAnonKey)}" placeholder="eyJ..." />
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn primary" id="supabase-save-btn">Save &amp; test connection</button>
        <button class="btn secondary" id="supabase-pull-btn">Pull from Postgres now</button>
      </div>
      <div id="supabase-status" class="item-meta" style="margin-top:8px;"></div>
    </div>

    <div class="section-title"><h2>Install this app</h2></div>
    <div class="card">
      <p style="font-size:13.5px; color:var(--text-muted); margin-bottom:8px;"><strong>iPhone:</strong> open this page in Safari &rarr; Share &rarr; Add to Home Screen.</p>
      <p style="font-size:13.5px; color:var(--text-muted);"><strong>Windows:</strong> open in Edge or Chrome &rarr; menu &rarr; Apps &rarr; Install this site as an app.</p>
    </div>

    <div class="section-title"><h2>Your data</h2></div>
    <div class="card">
      <p style="font-size:13.5px; color:var(--text-muted); margin-bottom:12px;">
        Stored locally on this device (localStorage) first, and mirrored to Postgres in the background if you've connected Supabase above. Export/import still works any time as a manual backup or to move data between devices without Supabase.
      </p>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn secondary" id="export-btn">${Icon.svg("download")} Export JSON</button>
        <button class="btn secondary" id="import-btn">${Icon.svg("upload")} Import JSON</button>
        <button class="btn danger" id="reset-btn">Erase all data</button>
      </div>
      <input type="file" id="import-file" accept="application/json" class="hidden" />
    </div>
    `;
  }

  return {
    esc, priorityPill, taskRow, routineTodayRow, getSlippingItems,
    renderToday, renderCapture, renderRecentCaptures, renderAsk, renderAskLog, renderSettings,
    renderCalendarEvents, renderGmailTodoList, renderGoogleError,
  };
})();
