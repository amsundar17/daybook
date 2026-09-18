(() => {
  const esc = ViewsCore.esc;

  const NAV = [
    { id: "today", label: "Today", icon: "today" },
    { id: "capture", label: "Capture", icon: "capture" },
    { id: "tasks", label: "Tasks", icon: "tasks" },
    { id: "routines", label: "Routines", icon: "routines" },
    { id: "projects", label: "Projects", icon: "projects" },
    { id: "content", label: "Content", icon: "content" },
    { id: "people", label: "People", icon: "people" },
    { id: "library", label: "Library", icon: "library" },
    { id: "domains", label: "Domains", icon: "domains" },
    { id: "financial", label: "Financial", icon: "finance" },
    { id: "health", label: "Health", icon: "health" },
    { id: "ask", label: "Ask", icon: "ask" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];
  const MOBILE_PRIMARY = ["today", "capture", "tasks", "routines"];

  const COLLECTION_MAP = {
    tasks: "tasks", routines: "routines", projects: "projects",
    content: "contentItems", people: "people", library: "libraryItems", domains: "domains",
    financialAccounts: "financialAccounts", financialTransactions: "financialTransactions",
  };

  const ADDABLE_ROUTES = ["tasks", "routines", "projects", "content", "people", "library", "domains"];

  // ---------- Form schemas for the generic add/edit modal ----------
  const FORM_SCHEMAS = {
    tasks: {
      title: "Task",
      fields: [
        { key: "title", label: "Title", type: "text", required: true },
        { key: "dueDate", label: "Due date", type: "date" },
        { key: "priority", label: "Priority", type: "select", options: [{ value: "1", label: "High" }, { value: "2", label: "Medium" }, { value: "3", label: "Low" }], default: "2" },
        { key: "projectId", label: "Project (optional)", type: "select", options: () => [{ value: "", label: "No project" }, ...Store.collection("projects").map((p) => ({ value: p.id, label: p.name }))] },
        { key: "notes", label: "Notes", type: "textarea" },
      ],
      defaults: () => ({ done: false }),
      toRecord: (v) => ({ title: v.title, dueDate: v.dueDate || null, priority: Number(v.priority) || 2, projectId: v.projectId || null, notes: v.notes || "" }),
    },
    routines: {
      title: "Routine",
      fields: [
        { key: "title", label: "Title", type: "text", required: true },
        { key: "frequency", label: "Frequency", type: "select", options: [{ value: "daily", label: "Every day" }, { value: "custom", label: "Custom days" }], default: "daily" },
        { key: "daysOfWeek", label: "Days (used when Custom)", type: "days" },
        { key: "notes", label: "Notes", type: "textarea" },
      ],
      defaults: () => ({ log: {}, bestStreak: 0, archived: false }),
      toRecord: (v) => ({ title: v.title, frequency: v.frequency, daysOfWeek: v.daysOfWeek, notes: v.notes || "" }),
    },
    projects: {
      title: "Project / Retainer",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "type", label: "Type", type: "select", options: [{ value: "project", label: "One-time project" }, { value: "retainer", label: "Ongoing retainer" }], default: "project" },
        { key: "status", label: "Status", type: "select", options: [{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }, { value: "done", label: "Done" }], default: "active" },
        { key: "dueDate", label: "Due date (projects only)", type: "date" },
        { key: "monthlyAmount", label: "Monthly amount (retainers only)", type: "number" },
        { key: "notes", label: "Notes", type: "textarea" },
      ],
      toRecord: (v) => ({ name: v.name, type: v.type, status: v.status, dueDate: v.dueDate || null, monthlyAmount: v.monthlyAmount ? Number(v.monthlyAmount) : null, notes: v.notes || "" }),
    },
    content: {
      title: "Content item",
      fields: [
        { key: "title", label: "Title", type: "text", required: true },
        { key: "type", label: "Type", type: "select", options: [{ value: "video", label: "Video" }, { value: "article", label: "Article" }], default: "video" },
        { key: "stage", label: "Stage", type: "select", options: [{ value: "idea", label: "Idea" }, { value: "drafting", label: "Drafting" }, { value: "scheduled", label: "Scheduled" }, { value: "published", label: "Published" }], default: "idea" },
        { key: "url", label: "URL", type: "text" },
        { key: "notes", label: "Notes", type: "textarea" },
      ],
      toRecord: (v) => ({ title: v.title, type: v.type, stage: v.stage, url: v.url || "", notes: v.notes || "" }),
    },
    people: {
      title: "Person",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "relationship", label: "Relationship", type: "text", placeholder: "Friend, client, family…" },
        { key: "tags", label: "Tags (comma separated)", type: "tags" },
        { key: "lastContactedDate", label: "Last contacted", type: "date" },
        { key: "followUpDate", label: "Follow up on", type: "date" },
        { key: "notes", label: "Notes", type: "textarea" },
      ],
      toRecord: (v) => ({
        name: v.name, relationship: v.relationship || "", tags: v.tags,
        lastContactedAt: v.lastContactedDate ? new Date(v.lastContactedDate + "T12:00:00").toISOString() : null,
        followUpDate: v.followUpDate || null, notes: v.notes || "",
      }),
    },
    library: {
      title: "Library item",
      fields: [
        { key: "type", label: "Type", type: "select", options: [{ value: "note", label: "Note" }, { value: "journal", label: "Journal entry" }, { value: "highlight", label: "Highlight" }, { value: "quote", label: "Quote" }], default: "note" },
        { key: "title", label: "Title (optional)", type: "text" },
        { key: "body", label: "Content", type: "textarea", required: true },
        { key: "source", label: "Source", type: "text" },
        { key: "tags", label: "Tags (comma separated)", type: "tags" },
      ],
      defaults: () => ({ resurfaceCount: 0 }),
      toRecord: (v) => ({ type: v.type, title: v.title || "", body: v.body, source: v.source || "", tags: v.tags }),
    },
    domains: {
      title: "Domain",
      fields: [
        { key: "name", label: "Domain name", type: "text", required: true, placeholder: "example.com" },
        { key: "registrar", label: "Registrar", type: "text" },
        { key: "renewalDate", label: "Renewal date", type: "date" },
        { key: "cost", label: "Annual cost", type: "number" },
        { key: "notes", label: "Notes", type: "textarea" },
      ],
      toRecord: (v) => ({ name: v.name, registrar: v.registrar || "", renewalDate: v.renewalDate || null, cost: v.cost ? Number(v.cost) : 0, notes: v.notes || "" }),
    },
    financialAccounts: {
      title: "Account",
      fields: [
        { key: "name", label: "Account name", type: "text", required: true },
        { key: "type", label: "Type", type: "select", options: [{ value: "checking", label: "Checking" }, { value: "savings", label: "Savings" }, { value: "credit", label: "Credit card" }, { value: "cash", label: "Cash" }, { value: "investment", label: "Investment" }], default: "checking" },
        { key: "balance", label: "Current balance", type: "number" },
      ],
      toRecord: (v) => ({ name: v.name, type: v.type, balance: Number(v.balance) || 0 }),
    },
    financialTransactions: {
      title: "Transaction",
      fields: [
        { key: "description", label: "Description", type: "text", required: true },
        { key: "amount", label: "Amount (negative = expense)", type: "number", required: true },
        { key: "date", label: "Date", type: "date" },
        { key: "category", label: "Category", type: "text", placeholder: "income, software, rent…" },
        { key: "accountId", label: "Account", type: "select", options: () => [{ value: "", label: "No account" }, ...Store.collection("financialAccounts").map((a) => ({ value: a.id, label: a.name }))] },
      ],
      defaults: () => ({ source: "manual" }),
      toRecord: (v) => ({ description: v.description, amount: Number(v.amount) || 0, date: v.date || Dates.todayKey(), category: v.category || "uncategorized", accountId: v.accountId || null }),
    },
  };

  // ---------- State ----------
  let currentRoute = localStorage.getItem("lifeos:lastRoute") || "today";
  let chatLog = [];

  // ---------- Rendering shell ----------
  function navItemHtml(item, extraCls = "") {
    return `<button class="nav-item ${extraCls} ${currentRoute === item.id ? "active" : ""}" data-route="${item.id}">
      ${Icon.svg(item.icon)}<span>${item.label}</span>
    </button>`;
  }

  function renderNav() {
    document.getElementById("nav-list").innerHTML = NAV.map((n) => navItemHtml(n)).join("");
    document.getElementById("bottom-nav").innerHTML =
      MOBILE_PRIMARY.map((id) => navItemHtml(NAV.find((n) => n.id === id))).join("") +
      `<button class="nav-item" data-act="open-drawer">${Icon.svg("menu")}<span>More</span></button>`;
    const rest = NAV.filter((n) => !MOBILE_PRIMARY.includes(n.id));
    document.getElementById("drawer-nav-list").innerHTML = rest.map((n) => navItemHtml(n)).join("");
  }

  function updateActiveNav() {
    document.querySelectorAll(".nav-item[data-route]").forEach((el) => {
      el.classList.toggle("active", el.dataset.route === currentRoute);
    });
  }

  function routeContent(route) {
    switch (route) {
      case "today": return { title: "Today", html: ViewsCore.renderToday() };
      case "capture": return { title: "Capture", html: ViewsCore.renderCapture() };
      case "tasks": return { title: "Tasks", html: ViewsWork.renderTasks() };
      case "routines": return { title: "Routines", html: ViewsLife.renderRoutines() };
      case "projects": return { title: "Projects", html: ViewsWork.renderProjects() };
      case "content": return { title: "Content", html: ViewsWork.renderContent() };
      case "people": return { title: "People", html: ViewsLife.renderPeople() };
      case "library": return { title: "Library", html: ViewsLife.renderLibrary() };
      case "domains": return { title: "Domains", html: ViewsLife.renderDomains() };
      case "financial": return { title: "Financial", html: ViewsFinancial.renderFinancial() };
      case "health": return { title: "Health", html: ViewsHealth.renderHealth() };
      case "ask": return { title: "Ask", html: ViewsCore.renderAsk() };
      case "settings": return { title: "Settings", html: ViewsCore.renderSettings() };
      default: return { title: "Today", html: ViewsCore.renderToday() };
    }
  }

  function goTo(route) {
    currentRoute = route;
    localStorage.setItem("lifeos:lastRoute", route);
    render();
    closeDrawer();
  }

  function render() {
    const { title, html } = routeContent(currentRoute);
    document.getElementById("topbar-title").textContent = title;
    const root = document.getElementById("view-root");
    root.innerHTML = html;
    updateActiveNav();
    renderFab();
    document.getElementById("topbar-add").classList.toggle("hidden", !ADDABLE_ROUTES.includes(currentRoute));
    if (currentRoute === "capture") wireCapture();
    if (currentRoute === "ask") wireAsk();
    if (currentRoute === "settings") wireSettings();
    if (currentRoute === "today") hydrateToday();
    if (currentRoute === "health") wireHealth();
  }

  // ---------- Today: Google Calendar + Gmail hydration ----------
  async function hydrateToday() {
    if (!GoogleIntegration.isConnected()) return;
    const calBox = document.getElementById("today-calendar");
    const gmailBox = document.getElementById("today-gmail");
    if (calBox) {
      try { calBox.innerHTML = ViewsCore.renderCalendarEvents(await GoogleIntegration.fetchCalendarEventsToday()); }
      catch (err) { calBox.innerHTML = ViewsCore.renderGoogleError(err); }
    }
    if (gmailBox) {
      try { gmailBox.innerHTML = ViewsCore.renderGmailTodoList(await GoogleIntegration.fetchGmailTodoMessages({ maxResults: 8 })); }
      catch (err) { gmailBox.innerHTML = ViewsCore.renderGoogleError(err); }
    }
  }

  // ---------- Financial: Gmail import review ----------
  async function importGmailFinancial() {
    try {
      if (!GoogleIntegration.isConnected()) await GoogleIntegration.connect();
      toast("Scanning TODO-labeled emails…");
      const messages = await GoogleIntegration.fetchGmailTodoMessages({ maxResults: 15, fullBody: true });
      if (!messages.length) { toast("No emails found under the TODO label"); return; }
      const candidates = FinanceExtract.extractCandidates(messages);
      openImportReviewModal(candidates);
    } catch (err) {
      toast(`Couldn't reach Gmail: ${err.message || err}`);
    }
  }

  function openImportReviewModal(candidates) {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = ViewsFinancial.renderImportReview(candidates);
    document.getElementById("modal-root").appendChild(modal);
    document.getElementById("modal-overlay").classList.remove("hidden");
    function close() {
      modal.remove();
      document.getElementById("modal-overlay").classList.add("hidden");
    }
    modal.querySelector("#import-cancel").addEventListener("click", close);
    modal.querySelector("#import-confirm").addEventListener("click", () => {
      const rows = modal.querySelectorAll("[data-candidate-idx]");
      let added = 0;
      rows.forEach((row, i) => {
        const checked = row.querySelector(".import-check").checked;
        if (!checked) return;
        const description = row.querySelector(".import-desc").value.trim();
        const amount = Number(row.querySelector(".import-amount").value);
        const date = row.querySelector(".import-date").value || Dates.todayKey();
        if (!description || !amount) return;
        Store.add("financialTransactions", {
          description, amount, date, category: "uncategorized", accountId: null,
          source: "gmail", gmailMessageId: candidates[i].messageId,
        });
        added++;
      });
      toast(added ? `Added ${added} transaction${added === 1 ? "" : "s"}` : "Nothing selected");
      close();
      render();
    });
  }

  function renderFab() {
    document.querySelectorAll(".fab").forEach((el) => el.remove());
    if (!ADDABLE_ROUTES.includes(currentRoute)) return;
    const fab = document.createElement("button");
    fab.className = "fab";
    fab.innerHTML = Icon.svg("plus");
    fab.addEventListener("click", () => openForm(currentRoute, null));
    document.body.appendChild(fab);
  }

  // ---------- Toast ----------
  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    document.getElementById("toast-root").appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }

  // ---------- Drawer ----------
  function openDrawer() {
    document.getElementById("drawer").classList.remove("hidden");
    document.getElementById("drawer-overlay").classList.remove("hidden");
  }
  function closeDrawer() {
    document.getElementById("drawer").classList.add("hidden");
    document.getElementById("drawer-overlay").classList.add("hidden");
  }

  // ---------- Search ----------
  function openSearch() {
    document.getElementById("search-overlay").classList.remove("hidden");
    document.getElementById("search-panel").classList.remove("hidden");
    const input = document.getElementById("search-input");
    input.value = "";
    document.getElementById("search-results").innerHTML = `<div class="search-empty">Start typing to search everything.</div>`;
    setTimeout(() => input.focus(), 30);
  }
  function closeSearch() {
    document.getElementById("search-overlay").classList.add("hidden");
    document.getElementById("search-panel").classList.add("hidden");
  }
  function runSearch(q) {
    const results = Search.all(q);
    const box = document.getElementById("search-results");
    if (!q.trim()) { box.innerHTML = `<div class="search-empty">Start typing to search everything.</div>`; return; }
    if (!results.length) { box.innerHTML = `<div class="search-empty">No matches for "${esc(q)}".</div>`; return; }
    box.innerHTML = results.map((r) => `
      <div class="search-result" data-search-goto="${r.collection}" data-search-id="${r.id}">
        <span class="tag">${esc(r.label)}</span>
        <span class="title">${esc(r.title)}</span>
      </div>`).join("");
  }
  const ROUTE_FOR_COLLECTION = { tasks: "tasks", routines: "routines", projects: "projects", contentItems: "content", people: "people", libraryItems: "library", domains: "domains", financialAccounts: "financial", financialTransactions: "financial" };

  // ---------- Generic modal form ----------
  function fieldHtml(field, value) {
    const id = `field-${field.key}`;
    const val = value ?? field.default ?? "";
    switch (field.type) {
      case "textarea":
        return `<div class="field"><label>${field.label}</label><textarea id="${id}" placeholder="${field.placeholder || ""}">${esc(val)}</textarea></div>`;
      case "select": {
        const opts = typeof field.options === "function" ? field.options() : field.options;
        return `<div class="field"><label>${field.label}</label><select id="${id}">${opts.map((o) => `<option value="${esc(o.value)}" ${String(val) === String(o.value) ? "selected" : ""}>${esc(o.label)}</option>`).join("")}</select></div>`;
      }
      case "date":
        return `<div class="field"><label>${field.label}</label><input type="date" id="${id}" value="${esc(val)}" /></div>`;
      case "number":
        return `<div class="field"><label>${field.label}</label><input type="number" id="${id}" value="${esc(val)}" /></div>`;
      case "tags":
        return `<div class="field"><label>${field.label}</label><input type="text" id="${id}" value="${esc((value || []).join(", "))}" placeholder="e.g. friend, college" /></div>`;
      case "days": {
        const days = value || [0,1,2,3,4,5,6];
        return `<div class="field"><label>${field.label}</label><div style="display:flex; gap:6px;">
          ${ViewsLife.DOW.map((d, i) => `<label style="display:flex; flex-direction:column; align-items:center; font-size:11px; gap:4px; color:var(--text-muted);">
            ${d}<input type="checkbox" data-day="${i}" ${days.includes(i) ? "checked" : ""} />
          </label>`).join("")}
        </div></div>`;
      }
      default:
        return `<div class="field"><label>${field.label}</label><input type="text" id="${id}" value="${esc(val)}" placeholder="${field.placeholder || ""}" /></div>`;
    }
  }

  function readField(field, existing) {
    if (field.type === "days") {
      const boxes = document.querySelectorAll(`input[data-day]`);
      const days = [];
      boxes.forEach((b) => { if (b.checked) days.push(Number(b.dataset.day)); });
      return days.length ? days : [0,1,2,3,4,5,6];
    }
    const el = document.getElementById(`field-${field.key}`);
    if (!el) return existing ? existing[field.key] : "";
    if (field.type === "tags") return el.value.split(",").map((s) => s.trim()).filter(Boolean);
    return el.value;
  }

  function existingFieldValue(schemaKey, field, existing) {
    if (!existing) return undefined;
    if (schemaKey === "people" && field.key === "lastContactedDate") {
      return existing.lastContactedAt ? existing.lastContactedAt.slice(0, 10) : "";
    }
    return existing[field.key];
  }

  function openForm(shortCollection, id) {
    const schema = FORM_SCHEMAS[shortCollection];
    const collectionKey = COLLECTION_MAP[shortCollection];
    const existing = id ? Store.findById(collectionKey, id) : null;

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <h3>${existing ? "Edit" : "New"} ${schema.title}</h3>
      <form id="entity-form">
        ${schema.fields.map((f) => fieldHtml(f, existingFieldValue(shortCollection, f, existing))).join("")}
        <div class="modal-actions">
          ${existing ? `<button type="button" class="btn danger" id="form-delete">Delete</button>` : ""}
          <button type="button" class="btn secondary" id="form-cancel">Cancel</button>
          <button type="submit" class="btn primary">Save</button>
        </div>
      </form>
    `;
    document.getElementById("modal-root").appendChild(modal);
    document.getElementById("modal-overlay").classList.remove("hidden");

    function close() {
      modal.remove();
      document.getElementById("modal-overlay").classList.add("hidden");
    }
    modal.querySelector("#form-cancel").addEventListener("click", close);
    if (existing) {
      modal.querySelector("#form-delete").addEventListener("click", () => {
        Store.remove(collectionKey, existing.id);
        toast(`${schema.title} deleted`);
        close();
        render();
      });
    }
    modal.querySelector("#entity-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const values = {};
      for (const f of schema.fields) values[f.key] = readField(f, existing);
      const required = schema.fields.find((f) => f.required && !String(values[f.key] || "").trim());
      if (required) { toast(`${required.label} is required`); return; }
      const record = schema.toRecord(values);
      if (existing) {
        Store.update(collectionKey, existing.id, record);
        toast(`${schema.title} updated`);
      } else {
        Store.add(collectionKey, { ...(schema.defaults ? schema.defaults() : {}), ...record });
        toast(`${schema.title} added`);
      }
      close();
      render();
    });
  }

  // ---------- Capture view wiring ----------
  function wireCapture() {
    const input = document.getElementById("capture-input");
    const preview = document.getElementById("capture-preview");
    document.getElementById("recent-capture-list").innerHTML = ViewsCore.renderRecentCaptures();
    input.addEventListener("input", () => {
      const parsed = Capture.parse(input.value);
      if (!parsed) { preview.textContent = "Start typing to see where this will be filed."; return; }
      preview.innerHTML = `Will file as <strong>${esc(parsed.label)}</strong>: "${esc(parsed.record.title || parsed.record.name || parsed.record.body || "")}"`;
    });
    const submit = () => {
      if (!input.value.trim()) return;
      const filed = Capture.fileIt(input.value);
      if (filed) {
        toast(`Filed as ${filed.label}`);
        input.value = "";
        preview.textContent = "Start typing to see where this will be filed.";
        document.getElementById("recent-capture-list").innerHTML = ViewsCore.renderRecentCaptures();
      }
    };
    document.getElementById("capture-submit").addEventListener("click", submit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
    });
    input.focus();
  }

  // ---------- Ask view wiring ----------
  function wireAsk() {
    const log = document.getElementById("chat-log");
    log.innerHTML = ViewsCore.renderAskLog(chatLog);
    log.scrollTop = log.scrollHeight;
    const input = document.getElementById("chat-input");
    const send = () => {
      const q = input.value.trim();
      if (!q) return;
      chatLog.push({ role: "user", text: q });
      chatLog.push({ role: "bot", text: Search.ask(q) });
      input.value = "";
      log.innerHTML = ViewsCore.renderAskLog(chatLog);
      log.scrollTop = log.scrollHeight;
    };
    document.getElementById("chat-send").addEventListener("click", send);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
  }

  // ---------- Settings wiring ----------
  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") document.documentElement.setAttribute("data-theme", theme);
    else document.documentElement.removeAttribute("data-theme");
  }

  function wireSettings() {
    const s = Store.get().settings;
    document.getElementById("settings-name").addEventListener("change", (e) => {
      Store.updateSettings({ name: e.target.value });
    });
    document.querySelectorAll("#theme-seg button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const theme = btn.dataset.themeChoice;
        Store.updateSettings({ theme });
        applyTheme(theme);
        render();
      });
    });
    document.getElementById("notif-toggle").addEventListener("click", async () => {
      const next = !Store.get().settings.notificationsEnabled;
      if (next && "Notification" in window) {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") { toast("Notifications were not allowed"); return; }
      }
      Store.updateSettings({ notificationsEnabled: next });
      render();
    });
    document.getElementById("export-btn").addEventListener("click", () => {
      const blob = new Blob([Store.exportJSON()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daybook-backup-${Dates.todayKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    document.getElementById("import-btn").addEventListener("click", () => document.getElementById("import-file").click());
    document.getElementById("import-file").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          Store.importJSON(reader.result);
          toast("Data imported");
          applyTheme(Store.get().settings.theme);
          render();
        } catch (err) {
          toast("That file couldn't be read as JSON");
        }
      };
      reader.readAsText(file);
    });
    document.getElementById("reset-btn").addEventListener("click", () => {
      if (confirm("Erase all Daybook data on this device? This can't be undone.")) {
        Store.resetAll();
        render();
      }
    });

    // Google
    document.getElementById("settings-google-client-id").addEventListener("change", (e) => {
      Store.updateSettings({ googleClientId: e.target.value.trim() });
    });
    document.getElementById("google-connect-btn").addEventListener("click", async () => {
      try {
        await GoogleIntegration.connect();
        toast("Connected to Google");
        render();
      } catch (err) {
        toast(err.message || "Couldn't connect to Google");
      }
    });
    const disconnectBtn = document.getElementById("google-disconnect-btn");
    if (disconnectBtn) disconnectBtn.addEventListener("click", () => {
      GoogleIntegration.disconnect();
      toast("Disconnected from Google");
      render();
    });

    // Supabase / Postgres
    const supaStatus = document.getElementById("supabase-status");
    document.getElementById("settings-supabase-url").addEventListener("change", (e) => {
      Store.updateSettings({ supabaseUrl: e.target.value.trim() });
    });
    document.getElementById("settings-supabase-key").addEventListener("change", (e) => {
      Store.updateSettings({ supabaseAnonKey: e.target.value.trim() });
    });
    document.getElementById("supabase-save-btn").addEventListener("click", async () => {
      const url = document.getElementById("settings-supabase-url").value.trim();
      const key = document.getElementById("settings-supabase-key").value.trim();
      if (!url || !key) { supaStatus.textContent = "Add both the URL and the anon key first."; return; }
      Store.updateSettings({ supabaseUrl: url, supabaseAnonKey: key });
      supaStatus.textContent = "Testing connection…";
      try {
        await SupabaseSync.testConnection(url, key);
        supaStatus.textContent = "Connected. New changes will now sync to Postgres.";
        toast("Supabase connected");
      } catch (err) {
        supaStatus.textContent = `Couldn't connect: ${err.message || err}. Did you run supabase-schema.sql?`;
      }
    });
    document.getElementById("supabase-pull-btn").addEventListener("click", async () => {
      supaStatus.textContent = "Pulling from Postgres…";
      try {
        const remote = await SupabaseSync.pullAll();
        if (!remote) { supaStatus.textContent = "Add and save your Supabase URL + key first."; return; }
        Store.mergeFromRemote(remote);
        supaStatus.textContent = "Pulled the latest data from Postgres.";
        toast("Synced from Postgres");
        render();
      } catch (err) {
        supaStatus.textContent = `Couldn't pull: ${err.message || err}`;
      }
    });
  }

  // ---------- Health view wiring ----------
  function readLiveHealthProfile() {
    const stored = Store.get().healthProfile;
    const units = document.querySelector("#health-units-seg button.active")?.dataset.units || stored.units;
    let heightCm, weightKg;
    if (units === "imperial") {
      const ft = Number(document.getElementById("h-height-ft")?.value) || 0;
      const inches = Number(document.getElementById("h-height-in")?.value) || 0;
      heightCm = (ft || inches) ? HealthCalc.ftInToCm(ft, inches) : null;
      const lb = Number(document.getElementById("h-weight-lb")?.value) || null;
      weightKg = lb ? HealthCalc.lbToKg(lb) : null;
    } else {
      heightCm = Number(document.getElementById("h-height-cm")?.value) || null;
      weightKg = Number(document.getElementById("h-weight-kg")?.value) || null;
    }
    const fatPctRaw = Number(document.getElementById("h-fat-pct")?.value);
    return {
      units,
      heightCm,
      weightKg,
      age: Number(document.getElementById("h-age")?.value) || null,
      sex: document.getElementById("h-sex")?.value || stored.sex,
      activityLevel: document.getElementById("h-activity")?.value || stored.activityLevel,
      goal: document.querySelector("#health-goal-seg button.active")?.dataset.goal || stored.goal,
      proteinPerKg: Number(document.getElementById("h-protein")?.value) || stored.proteinPerKg,
      fatPercent: fatPctRaw ? fatPctRaw / 100 : stored.fatPercent,
    };
  }

  function wireHealth() {
    const form = document.getElementById("health-profile-form");
    const resultsBox = document.getElementById("health-results");
    const recompute = () => { resultsBox.innerHTML = ViewsHealth.renderResults(readLiveHealthProfile()); };

    form.addEventListener("input", recompute);
    form.addEventListener("change", () => {
      const live = readLiveHealthProfile();
      Store.updateHealthProfile({
        units: live.units, heightCm: live.heightCm, weightKg: live.weightKg, age: live.age,
        sex: live.sex, activityLevel: live.activityLevel, proteinPerKg: live.proteinPerKg, fatPercent: live.fatPercent,
      });
    });

    document.querySelectorAll("#health-units-seg button").forEach((btn) => {
      btn.addEventListener("click", () => {
        Store.updateHealthProfile({ units: btn.dataset.units });
        render();
      });
    });

    document.querySelectorAll("#health-goal-seg button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#health-goal-seg button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        Store.updateHealthProfile({ goal: btn.dataset.goal });
        recompute();
      });
    });

    document.getElementById("h-log-submit").addEventListener("click", () => {
      const raw = Number(document.getElementById("h-log-weight").value);
      if (!raw) { toast("Enter a weight first"); return; }
      const units = Store.get().healthProfile.units;
      const kg = units === "imperial" ? HealthCalc.lbToKg(raw) : raw;
      Store.logWeight(Dates.todayKey(), kg);
      toast("Weight logged");
      render();
    });
  }

  // ---------- Global click delegation ----------
  document.addEventListener("click", (e) => {
    const navBtn = e.target.closest("[data-route]");
    if (navBtn) { goTo(navBtn.dataset.route); return; }

    const act = e.target.closest("[data-act]");
    if (act) {
      const a = act.dataset.act;
      if (a === "open-drawer") { openDrawer(); return; }
      if (a === "add-current") { openForm(currentRoute, null); return; }
      if (a === "toggle-task") {
        const t = Store.findById("tasks", act.dataset.id);
        Store.update("tasks", act.dataset.id, { done: !t.done, completedAt: !t.done ? new Date().toISOString() : null });
        render();
        return;
      }
      if (a === "toggle-routine") {
        Store.toggleRoutineDone(act.dataset.id, Dates.todayKey());
        render();
        return;
      }
      if (a === "archive-routine") {
        const r = Store.findById("routines", act.dataset.id);
        Store.update("routines", act.dataset.id, { archived: !r.archived });
        render();
        return;
      }
      if (a === "contacted-today") {
        Store.update("people", act.dataset.id, { lastContactedAt: new Date().toISOString() });
        toast("Marked as contacted today");
        render();
        return;
      }
      if (a === "content-stage") {
        Store.update("contentItems", act.dataset.id, { stage: act.dataset.stage, publishedAt: act.dataset.stage === "published" ? new Date().toISOString() : null });
        render();
        return;
      }
      if (a === "add-account") { openForm("financialAccounts", null); return; }
      if (a === "add-transaction") { openForm("financialTransactions", null); return; }
      if (a === "import-gmail-financial") { importGmailFinancial(); return; }
      if (a === "edit") { openForm(act.dataset.collection, act.dataset.id); return; }
      if (a === "delete") {
        if (confirm("Delete this item?")) { Store.remove(COLLECTION_MAP[act.dataset.collection], act.dataset.id); render(); }
        return;
      }
    }

    const searchResult = e.target.closest("[data-search-goto]");
    if (searchResult) {
      closeSearch();
      goTo(ROUTE_FOR_COLLECTION[searchResult.dataset.searchGoto] || "today");
      return;
    }

    if (e.target === document.getElementById("drawer-overlay") || e.target.id === "drawer-close") closeDrawer();
    if (e.target === document.getElementById("search-overlay") || e.target.id === "search-close") closeSearch();
    if (e.target === document.getElementById("modal-overlay")) {
      document.querySelectorAll(".modal").forEach((m) => m.remove());
      document.getElementById("modal-overlay").classList.add("hidden");
    }
  });

  document.getElementById("search-trigger").addEventListener("click", openSearch);
  document.getElementById("side-search-trigger").addEventListener("click", openSearch);
  document.getElementById("drawer-trigger").addEventListener("click", openDrawer);
  document.getElementById("search-input").addEventListener("input", (e) => runSearch(e.target.value));
  document.getElementById("theme-toggle-desktop").addEventListener("click", () => {
    const cur = Store.get().settings.theme;
    const next = cur === "dark" ? "light" : "dark";
    Store.updateSettings({ theme: next });
    applyTheme(next);
    if (currentRoute === "settings") render();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeSearch(); closeDrawer(); }
    if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); openSearch(); }
  });

  function paintStaticIcons() {
    document.getElementById("drawer-trigger").innerHTML = Icon.svg("menu");
    document.getElementById("topbar-add").innerHTML = Icon.svg("plus");
    document.getElementById("search-trigger").innerHTML = Icon.svg("search");
    document.getElementById("side-search-trigger").innerHTML = Icon.svg("search") + "<span style=\"margin-left:8px;\">Search</span>";
    document.getElementById("drawer-close").innerHTML = Icon.svg("close");
    document.getElementById("search-close").innerHTML = Icon.svg("close");
    document.getElementById("search-icon").innerHTML = Icon.svg("search");
    document.getElementById("theme-toggle-desktop").innerHTML = Icon.svg("settings") + "<span>Theme</span>";
  }

  // ---------- Init ----------
  function init() {
    applyTheme(Store.get().settings.theme);
    paintStaticIcons();
    renderNav();
    render();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  init();
})();
