// Global search across every collection, plus the tiny local "Ask" assistant
// that does keyword matching instead of calling a real model (no backend here).
const Search = (() => {
  function textOf(name, item) {
    switch (name) {
      case "tasks": return [item.title, item.notes].join(" ");
      case "routines": return [item.title, item.notes].join(" ");
      case "projects": return [item.name, item.notes].join(" ");
      case "contentItems": return [item.title, item.notes, item.url].join(" ");
      case "people": return [item.name, item.relationship, item.notes, (item.tags||[]).join(" ")].join(" ");
      case "libraryItems": return [item.title, item.body, item.source, (item.tags||[]).join(" ")].join(" ");
      case "domains": return [item.name, item.registrar, item.notes].join(" ");
      case "financialAccounts": return [item.name, item.type].join(" ");
      case "financialTransactions": return [item.description, item.category].join(" ");
      default: return "";
    }
  }

  function titleOf(name, item) {
    return item.title || item.name || item.description || item.body?.slice(0, 60) || "(untitled)";
  }

  const LABELS = {
    tasks: "Task", routines: "Routine", projects: "Project",
    contentItems: "Content", people: "Person", libraryItems: "Library", domains: "Domain",
    financialAccounts: "Account", financialTransactions: "Transaction",
  };

  function all(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const data = Store.get();
    const results = [];
    for (const name of Object.keys(LABELS)) {
      for (const item of data[name]) {
        const hay = textOf(name, item).toLowerCase();
        if (hay.includes(q)) {
          results.push({ collection: name, label: LABELS[name], id: item.id, title: titleOf(name, item), snippet: textOf(name, item).slice(0, 120) });
        }
      }
    }
    return results;
  }

  function ask(query) {
    const results = all(query);
    if (!results.length) {
      return `I couldn't find anything about "${query}" in your tasks, routines, projects, content, people, library, or domains. Try different words, or capture it so future-you can find it.`;
    }
    const top = results.slice(0, 6);
    const lines = top.map((r) => `- [${r.label}] ${r.title}`);
    return `Here's what I found about "${query}":\n${lines.join("\n")}${results.length > top.length ? `\n...and ${results.length - top.length} more.` : ""}`;
  }

  return { all, ask, LABELS };
})();
