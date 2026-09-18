// Thin REST client for Supabase's auto-generated PostgREST API -- no SDK, just
// fetch(). A browser can't speak the Postgres wire protocol directly, so this
// (or a custom backend) is the only way a static app reaches real Postgres.
//
// This is local-first: Store always writes to localStorage immediately and
// renders from memory. If Supabase is configured, every write is also queued
// here and pushed in the background -- so the UI never blocks or errors out
// on a flaky connection, it just quietly stays in sync when it can.
const SupabaseSync = (() => {
  const TABLES = {
    tasks: "tasks", routines: "routines", projects: "projects",
    contentItems: "content_items", people: "people", libraryItems: "library_items",
    domains: "domains", financialAccounts: "financial_accounts", financialTransactions: "financial_transactions",
  };

  function config() {
    const s = Store.get().settings;
    if (!s.supabaseUrl || !s.supabaseAnonKey) return null;
    return { url: s.supabaseUrl.replace(/\/$/, ""), key: s.supabaseAnonKey };
  }

  function isConfigured() { return !!config(); }

  function headers(cfg) {
    return {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
    };
  }

  let queue = Promise.resolve();
  let lastError = null;
  const listeners = new Set();

  function onStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function notify(status) { listeners.forEach((fn) => fn(status)); }

  function enqueue(fn) {
    queue = queue.then(fn).catch((err) => {
      lastError = err;
      notify({ ok: false, error: String(err && err.message || err) });
    });
    return queue;
  }

  async function upsert(collection, record) {
    const cfg = config();
    if (!cfg) return;
    const table = TABLES[collection];
    if (!table) return;
    enqueue(async () => {
      const res = await fetch(`${cfg.url}/rest/v1/${table}`, {
        method: "POST",
        headers: headers(cfg),
        body: JSON.stringify([{ ...record, id: record.id }]),
      });
      if (!res.ok) throw new Error(`Supabase upsert ${table} failed: ${res.status} ${await res.text()}`);
      notify({ ok: true, table, op: "upsert" });
    });
  }

  async function remove(collection, id) {
    const cfg = config();
    if (!cfg) return;
    const table = TABLES[collection];
    if (!table) return;
    enqueue(async () => {
      const res = await fetch(`${cfg.url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: headers(cfg),
      });
      if (!res.ok) throw new Error(`Supabase delete ${table} failed: ${res.status} ${await res.text()}`);
      notify({ ok: true, table, op: "delete" });
    });
  }

  async function pullAll() {
    const cfg = config();
    if (!cfg) return null;
    const out = {};
    for (const [collection, table] of Object.entries(TABLES)) {
      const res = await fetch(`${cfg.url}/rest/v1/${table}?select=*&order=created_at.asc`, { headers: headers(cfg) });
      if (!res.ok) throw new Error(`Supabase read ${table} failed: ${res.status} ${await res.text()}`);
      out[collection] = (await res.json()).map(fromRow);
    }
    return out;
  }

  async function testConnection(url, key) {
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/tasks?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return true;
  }

  // Supabase/Postgres columns are snake_case; the app's records are camelCase.
  // These two just round-trip between the conventions plus JSON-encode array/object fields.
  const JSON_FIELDS = new Set(["daysOfWeek", "log", "tags"]);
  function toSnake(s) { return s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase()); }
  function toCamel(s) { return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase()); }

  function toRow(record) {
    const row = {};
    for (const [k, v] of Object.entries(record)) {
      row[toSnake(k)] = JSON_FIELDS.has(k) ? JSON.stringify(v ?? null) : v;
    }
    return row;
  }
  function fromRow(row) {
    const record = {};
    for (const [k, v] of Object.entries(row)) {
      const camel = toCamel(k);
      record[camel] = JSON_FIELDS.has(camel) && typeof v === "string" ? JSON.parse(v) : v;
    }
    return record;
  }

  return { isConfigured, upsert: (c, r) => upsert(c, toRow(r)), remove, pullAll, testConnection, onStatus, get lastError() { return lastError; } };
})();
