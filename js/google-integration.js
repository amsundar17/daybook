// Google Calendar + Tasks + Gmail, all through one client-side OAuth
// connection (Google Identity Services token client). No backend: the access
// token lives only in this tab's sessionStorage and expires in ~1 hour, so
// re-clicking "Connect Google" occasionally is expected, not a bug.
const GoogleIntegration = (() => {
  const SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/tasks.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
  ].join(" ");
  const TOKEN_KEY = "lifeos:googleToken";
  let tokenClient = null;

  function clientId() {
    return Store.get().settings.googleClientId || "";
  }

  function getToken() {
    try {
      const raw = sessionStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const t = JSON.parse(raw);
      if (t.expiresAt < Date.now()) return null;
      return t.accessToken;
    } catch { return null; }
  }

  function isConnected() { return !!getToken(); }

  function ensureClient() {
    if (!window.google || !google.accounts || !google.accounts.oauth2) {
      throw new Error("Google's sign-in script hasn't loaded yet -- check your connection and try again.");
    }
    if (!clientId()) {
      throw new Error("Add a Google Client ID in Settings first.");
    }
    if (!tokenClient || tokenClient.__clientId !== clientId()) {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId(),
        scope: SCOPES,
        callback: () => {}, // overridden per-call below
      });
      tokenClient.__clientId = clientId();
    }
    return tokenClient;
  }

  function connect() {
    return new Promise((resolve, reject) => {
      let client;
      try { client = ensureClient(); } catch (e) { reject(e); return; }
      client.callback = (resp) => {
        if (resp.error) { reject(new Error(resp.error)); return; }
        sessionStorage.setItem(TOKEN_KEY, JSON.stringify({
          accessToken: resp.access_token,
          expiresAt: Date.now() + (resp.expires_in - 60) * 1000,
        }));
        resolve(true);
      };
      client.requestAccessToken({ prompt: isConnected() ? "" : "consent" });
    });
  }

  function disconnect() {
    const token = getToken();
    sessionStorage.removeItem(TOKEN_KEY);
    if (token && window.google) google.accounts.oauth2.revoke(token, () => {});
  }

  async function api(url) {
    const token = getToken();
    if (!token) throw new Error("Not connected to Google.");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Google API ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async function fetchCalendarEventsToday() {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const params = new URLSearchParams({
      timeMin: start.toISOString(), timeMax: end.toISOString(),
      singleEvents: "true", orderBy: "startTime", maxResults: "20",
    });
    const data = await api(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`);
    return (data.items || []).map((e) => ({
      id: e.id,
      title: e.summary || "(no title)",
      start: e.start?.dateTime || e.start?.date,
      allDay: !e.start?.dateTime,
      location: e.location || "",
      link: e.htmlLink,
    }));
  }

  async function fetchGoogleTasks() {
    const lists = await api("https://tasks.googleapis.com/tasks/v1/users/@me/lists");
    const out = [];
    for (const list of (lists.items || []).slice(0, 5)) {
      const data = await api(`https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks?showCompleted=false&maxResults=25`);
      for (const t of data.items || []) {
        if (t.status === "completed") continue;
        out.push({ id: t.id, title: t.title, due: t.due ? t.due.slice(0, 10) : null, notes: t.notes || "", listTitle: list.title });
      }
    }
    return out;
  }

  function headerValue(headers, name) {
    const h = (headers || []).find((h) => h.name.toLowerCase() === name.toLowerCase());
    return h ? h.value : "";
  }

  async function fetchGmailTodoMessages({ maxResults = 10, fullBody = false } = {}) {
    const list = await api(`https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent("label:TODO")}&maxResults=${maxResults}`);
    const out = [];
    for (const m of list.messages || []) {
      const format = fullBody ? "full" : "metadata";
      const metaParams = fullBody ? "" : "&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date";
      const msg = await api(`https://www.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=${format}${metaParams}`);
      const headers = msg.payload?.headers;
      out.push({
        id: msg.id,
        subject: headerValue(headers, "Subject") || "(no subject)",
        from: headerValue(headers, "From") || "",
        date: headerValue(headers, "Date") || "",
        snippet: msg.snippet || "",
        body: fullBody ? extractPlainBody(msg.payload) : "",
      });
    }
    return out;
  }

  function extractPlainBody(payload) {
    if (!payload) return "";
    if (payload.mimeType === "text/plain" && payload.body?.data) return decodeBase64Url(payload.body.data);
    for (const part of payload.parts || []) {
      const found = extractPlainBody(part);
      if (found) return found;
    }
    if (payload.body?.data) return decodeBase64Url(payload.body.data);
    return "";
  }

  function decodeBase64Url(data) {
    try {
      const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
      return decodeURIComponent(escape(atob(b64)));
    } catch { return ""; }
  }

  return {
    isConnected, connect, disconnect,
    fetchCalendarEventsToday, fetchGoogleTasks, fetchGmailTodoMessages,
  };
})();
