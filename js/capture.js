// Rule-based quick capture: turns one line of free text into a filed item.
// This stands in for the "AI cleans it up and files it" step from the video --
// there is no model behind it, just prefix and keyword matching, and it says so.
const Capture = (() => {
  const PREFIXES = [
    { re: /^(task|todo|to-do)\s*:\s*/i, target: "tasks" },
    { re: /^(routine|habit)\s*:\s*/i, target: "routines" },
    { re: /^(project)\s*:\s*/i, target: "projects" },
    { re: /^(retainer)\s*:\s*/i, target: "retainer" },
    { re: /^(content|video|article)\s*:\s*/i, target: "contentItems" },
    { re: /^(person|contact|people)\s*:\s*/i, target: "people" },
    { re: /^(note)\s*:\s*/i, target: "note" },
    { re: /^(journal)\s*:\s*/i, target: "journal" },
    { re: /^(quote)\s*:\s*/i, target: "quote" },
    { re: /^(highlight)\s*:\s*/i, target: "highlight" },
    { re: /^(domain)\s*:\s*/i, target: "domains" },
  ];

  const WEEKDAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

  function extractDueDate(text) {
    let t = text;
    let dueDate = null;

    const today = Dates.todayKey();
    const patterns = [
      [/\btoday\b/i, () => today],
      [/\btomorrow\b/i, () => Dates.addDays(today, 1)],
      [/\bnext week\b/i, () => Dates.addDays(today, 7)],
    ];
    for (const [re, fn] of patterns) {
      if (re.test(t)) { dueDate = fn(); t = t.replace(re, "").trim(); return { text: t, dueDate }; }
    }

    for (let i = 0; i < WEEKDAYS.length; i++) {
      const re = new RegExp(`\\bnext ${WEEKDAYS[i]}\\b`, "i");
      if (re.test(t)) {
        const todayDow = Dates.weekday(today);
        let delta = (i - todayDow + 7) % 7;
        delta = delta === 0 ? 7 : delta + 7;
        dueDate = Dates.addDays(today, delta);
        t = t.replace(re, "").trim();
        return { text: t, dueDate };
      }
      const re2 = new RegExp(`\\b${WEEKDAYS[i]}\\b`, "i");
      if (re2.test(t)) {
        const todayDow = Dates.weekday(today);
        let delta = (i - todayDow + 7) % 7;
        delta = delta === 0 ? 7 : delta;
        dueDate = Dates.addDays(today, delta);
        t = t.replace(re2, "").trim();
        return { text: t, dueDate };
      }
    }

    return { text: t, dueDate };
  }

  function extractPriority(text) {
    let t = text;
    let priority = 2;
    if (/(^|\s)!!!(\s|$)/.test(t) || /\bp1\b/i.test(t) || /\bhigh priority\b/i.test(t)) {
      priority = 1; t = t.replace(/!!!/g, "").replace(/\bp1\b/gi, "").replace(/\bhigh priority\b/gi, "").trim();
    } else if (/\bp3\b/i.test(t) || /\blow priority\b/i.test(t)) {
      priority = 3; t = t.replace(/\bp3\b/gi, "").replace(/\blow priority\b/gi, "").trim();
    }
    return { text: t, priority };
  }

  // Returns { target, record } describing where it will be filed, without saving.
  function parse(raw) {
    let text = raw.trim();
    if (!text) return null;

    let target = "tasks";
    for (const p of PREFIXES) {
      if (p.re.test(text)) {
        target = p.target;
        text = text.replace(p.re, "").trim();
        break;
      }
    }

    const dueRes = extractDueDate(text);
    text = dueRes.text;
    const priRes = extractPriority(text);
    text = priRes.text;
    text = text.replace(/\s{2,}/g, " ").trim();

    switch (target) {
      case "tasks":
        return { target, label: "Task", record: { title: text, notes: "", dueDate: dueRes.dueDate, priority: priRes.priority, done: false, projectId: null } };
      case "routines":
        return { target, label: "Routine", record: { title: text, notes: "", frequency: "daily", daysOfWeek: [0,1,2,3,4,5,6], log: {}, bestStreak: 0, archived: false } };
      case "projects":
        return { target: "projects", label: "Project", record: { name: text, type: "project", status: "active", dueDate: dueRes.dueDate, monthlyAmount: null, notes: "" } };
      case "retainer":
        return { target: "projects", label: "Retainer", record: { name: text, type: "retainer", status: "active", dueDate: null, monthlyAmount: 0, notes: "" } };
      case "contentItems":
        return { target, label: "Content idea", record: { title: text, stage: "idea", type: "video", url: "", notes: "", publishedAt: null } };
      case "people":
        return { target, label: "Person", record: { name: text, relationship: "", notes: "", lastContactedAt: null, followUpDate: dueRes.dueDate, tags: [] } };
      case "note":
        return { target: "libraryItems", label: "Note", record: { type: "note", title: text.slice(0, 60), body: text, source: "", tags: [], resurfaceCount: 0 } };
      case "journal":
        return { target: "libraryItems", label: "Journal entry", record: { type: "journal", title: Dates.humanize(Dates.todayKey()), body: text, source: "", tags: [], resurfaceCount: 0 } };
      case "quote":
        return { target: "libraryItems", label: "Quote", record: { type: "quote", title: "", body: text, source: "", tags: [], resurfaceCount: 0 } };
      case "highlight":
        return { target: "libraryItems", label: "Highlight", record: { type: "highlight", title: text.slice(0, 60), body: text, source: "", tags: [], resurfaceCount: 0 } };
      case "domains":
        return { target, label: "Domain", record: { name: text, registrar: "", renewalDate: dueRes.dueDate, cost: 0, linkedProjectId: null, notes: "" } };
      default:
        return { target: "tasks", label: "Task", record: { title: text, notes: "", dueDate: dueRes.dueDate, priority: priRes.priority, done: false, projectId: null } };
    }
  }

  function fileIt(raw) {
    const parsed = parse(raw);
    if (!parsed) return null;
    const record = Store.add(parsed.target, parsed.record);
    return { ...parsed, record };
  }

  return { parse, fileIt };
})();
