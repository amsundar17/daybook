// Local data layer. Everything lives in one JSON blob in localStorage first
// (so the app works offline and export/import is a single file), and is
// mirrored to Supabase/Postgres in the background when configured in Settings
// -- see SupabaseSync for the sync half of this.
const Store = (() => {
  const KEY = "lifeos:data";
  const VERSION = 2;
  const COLLECTIONS = ["tasks", "routines", "projects", "contentItems", "people", "libraryItems", "domains", "financialAccounts", "financialTransactions"];

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function emptyData() {
    return {
      meta: { version: VERSION },
      settings: {
        name: "",
        theme: "system",
        notificationsEnabled: false,
        onboarded: false,
        supabaseUrl: "",
        supabaseAnonKey: "",
        googleClientId: "",
      },
      healthProfile: {
        units: "metric", // "metric" | "imperial" -- display/input only, storage stays metric
        heightCm: null,
        weightKg: null,
        age: null,
        sex: "male",
        activityLevel: "moderate",
        goal: "maintain",
        proteinPerKg: 1.8,
        fatPercent: 0.25,
        weightLog: [],
      },
      tasks: [],
      routines: [],
      projects: [],
      contentItems: [],
      people: [],
      libraryItems: [],
      domains: [],
      financialAccounts: [],
      financialTransactions: [],
    };
  }

  function seedData() {
    const d = emptyData();
    const today = Dates.todayKey();
    d.tasks = [
      { id: uid(), title: "Reply to client kickoff email", notes: "", dueDate: today, priority: 1, done: false, projectId: null, createdAt: new Date().toISOString(), completedAt: null },
      { id: uid(), title: "Pay domain renewal invoice", notes: "", dueDate: Dates.addDays(today, -2), priority: 2, done: false, projectId: null, createdAt: new Date().toISOString(), completedAt: null },
      { id: uid(), title: "Plan next week's content", notes: "", dueDate: Dates.addDays(today, 1), priority: 3, done: false, projectId: null, createdAt: new Date().toISOString(), completedAt: null },
    ];
    d.routines = [
      { id: uid(), title: "Morning pages", notes: "10 minutes, no editing", frequency: "daily", daysOfWeek: [0,1,2,3,4,5,6], log: {}, bestStreak: 0, createdAt: new Date().toISOString(), archived: false },
      { id: uid(), title: "Workout", notes: "", frequency: "weekly", daysOfWeek: [1,3,5], log: {}, bestStreak: 0, createdAt: new Date().toISOString(), archived: false },
    ];
    d.projects = [
      { id: uid(), name: "Website redesign", type: "project", status: "active", dueDate: Dates.addDays(today, 21), monthlyAmount: null, notes: "", createdAt: new Date().toISOString() },
      { id: uid(), name: "Acme Corp retainer", type: "retainer", status: "active", dueDate: null, monthlyAmount: 1500, notes: "Monthly maintenance + support", createdAt: new Date().toISOString() },
    ];
    d.contentItems = [
      { id: uid(), title: "How I organize my week", stage: "idea", type: "video", url: "", notes: "", createdAt: new Date().toISOString(), publishedAt: null },
    ];
    d.people = [
      { id: uid(), name: "Sam Rivera", relationship: "Friend", notes: "Met at the conference, into woodworking", lastContactedAt: new Date().toISOString(), followUpDate: Dates.addDays(today, 14), tags: ["friend"] },
    ];
    d.libraryItems = [
      { id: uid(), type: "quote", title: "", body: "Discipline equals freedom.", source: "Jocko Willink", tags: ["motivation"], createdAt: new Date().toISOString(), resurfaceCount: 0 },
    ];
    d.domains = [
      { id: uid(), name: "example.com", registrar: "Namecheap", renewalDate: Dates.addDays(today, 45), cost: 12, linkedProjectId: null, notes: "" },
    ];
    d.financialAccounts = [
      { id: uid(), name: "Everyday checking", type: "checking", balance: 3200, createdAt: new Date().toISOString() },
      { id: uid(), name: "Business credit card", type: "credit", balance: -540, createdAt: new Date().toISOString() },
    ];
    d.healthProfile = {
      ...d.healthProfile,
      heightCm: 178,
      weightKg: 80,
      age: 32,
      sex: "male",
      activityLevel: "moderate",
      goal: "maintain",
      weightLog: [{ date: today, weightKg: 80 }],
    };
    d.financialTransactions = [
      { id: uid(), date: today, description: "Client retainer payment", amount: 1500, category: "income", accountId: d.financialAccounts[0].id, source: "manual", createdAt: new Date().toISOString() },
      { id: uid(), date: Dates.addDays(today, -1), description: "Domain renewal", amount: -12, category: "software", accountId: d.financialAccounts[1].id, source: "manual", createdAt: new Date().toISOString() },
    ];
    return d;
  }

  let data = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seedData();
      const parsed = JSON.parse(raw);
      return { ...emptyData(), ...parsed };
    } catch (e) {
      console.error("Failed to load data, starting fresh", e);
      return emptyData();
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(data));
    document.dispatchEvent(new CustomEvent("lifeos:change"));
  }

  function get() { return data; }

  function collection(name) { return data[name]; }

  function add(name, item) {
    const record = { id: uid(), createdAt: new Date().toISOString(), ...item };
    data[name].push(record);
    save();
    SupabaseSync.upsert(name, record);
    return record;
  }

  function update(name, id, patch) {
    const idx = data[name].findIndex((x) => x.id === id);
    if (idx === -1) return null;
    data[name][idx] = { ...data[name][idx], ...patch };
    save();
    SupabaseSync.upsert(name, data[name][idx]);
    return data[name][idx];
  }

  function remove(name, id) {
    data[name] = data[name].filter((x) => x.id !== id);
    save();
    SupabaseSync.remove(name, id);
  }

  // Merge rows pulled from Supabase into local data without re-pushing them
  // back up (that would just echo every remote row right back at itself).
  function mergeFromRemote(remote) {
    if (!remote) return;
    for (const name of COLLECTIONS) {
      if (!remote[name]) continue;
      const byId = new Map(data[name].map((x) => [x.id, x]));
      for (const row of remote[name]) byId.set(row.id, { ...byId.get(row.id), ...row });
      data[name] = [...byId.values()];
    }
    localStorage.setItem(KEY, JSON.stringify(data));
    document.dispatchEvent(new CustomEvent("lifeos:change"));
  }

  function findById(name, id) {
    return data[name].find((x) => x.id === id) || null;
  }

  function updateSettings(patch) {
    data.settings = { ...data.settings, ...patch };
    save();
  }

  function updateHealthProfile(patch) {
    data.healthProfile = { ...data.healthProfile, ...patch };
    save();
  }

  function logWeight(dateKey, weightKg) {
    const log = data.healthProfile.weightLog.filter((e) => e.date !== dateKey);
    log.push({ date: dateKey, weightKg });
    log.sort((a, b) => a.date.localeCompare(b.date));
    updateHealthProfile({ weightLog: log, weightKg });
  }

  function exportJSON() {
    return JSON.stringify(data, null, 2);
  }

  function importJSON(json) {
    const parsed = JSON.parse(json);
    data = { ...emptyData(), ...parsed };
    save();
  }

  function resetAll() {
    data = emptyData();
    save();
  }

  function resetToSeed() {
    data = seedData();
    save();
  }

  // ---- Routine streak logic ----
  function routineIsDueOn(routine, dateKey) {
    if (routine.archived) return false;
    if (routine.frequency === "daily") return true;
    const dow = Dates.weekday(dateKey);
    return (routine.daysOfWeek || []).includes(dow);
  }

  function toggleRoutineDone(routineId, dateKey) {
    const r = findById("routines", routineId);
    if (!r) return;
    const log = { ...r.log };
    if (log[dateKey]) delete log[dateKey];
    else log[dateKey] = true;
    const streak = computeCurrentStreak(r.frequency, r.daysOfWeek, log);
    const bestStreak = Math.max(r.bestStreak || 0, streak);
    update("routines", routineId, { log, bestStreak });
  }

  function computeCurrentStreak(frequency, daysOfWeek, log) {
    let streak = 0;
    let cursor = Dates.todayKey();
    // if today is due but not done yet, start checking from yesterday so an
    // unfinished-but-not-missed today doesn't zero the streak.
    const dueToday = frequency === "daily" || (daysOfWeek || []).includes(Dates.weekday(cursor));
    if (dueToday && !log[cursor]) {
      cursor = Dates.addDays(cursor, -1);
    }
    for (let i = 0; i < 3650; i++) {
      const isDue = frequency === "daily" || (daysOfWeek || []).includes(Dates.weekday(cursor));
      if (!isDue) { cursor = Dates.addDays(cursor, -1); continue; }
      if (log[cursor]) { streak++; cursor = Dates.addDays(cursor, -1); continue; }
      break;
    }
    return streak;
  }

  function routineCurrentStreak(routine) {
    return computeCurrentStreak(routine.frequency, routine.daysOfWeek, routine.log);
  }

  return {
    uid, get, collection, add, update, remove, findById, mergeFromRemote, COLLECTIONS,
    updateSettings, updateHealthProfile, logWeight, exportJSON, importJSON, resetAll, resetToSeed,
    routineIsDueOn, toggleRoutineDone, routineCurrentStreak,
  };
})();
