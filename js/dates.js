// Date helpers shared across views. All dates are stored as 'YYYY-MM-DD' strings (local time).
const Dates = (() => {
  function pad(n) { return String(n).padStart(2, "0"); }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function keyFor(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function fromKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function addDays(key, n) {
    const d = fromKey(key);
    d.setDate(d.getDate() + n);
    return keyFor(d);
  }

  function daysBetween(aKey, bKey) {
    const a = fromKey(aKey), b = fromKey(bKey);
    return Math.round((b - a) / 86400000);
  }

  function isPast(key) {
    return key < todayKey();
  }

  function humanize(key) {
    if (!key) return "";
    const diff = daysBetween(todayKey(), key);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff === -1) return "Yesterday";
    const d = fromKey(key);
    const opts = { month: "short", day: "numeric" };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
    const label = d.toLocaleDateString(undefined, opts);
    if (diff < 0) return `${label} (${-diff}d overdue)`;
    if (diff < 7) return `${label} (in ${diff}d)`;
    return label;
  }

  function relativeShort(iso) {
    if (!iso) return "";
    const then = new Date(iso);
    const diffMs = Date.now() - then.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  }

  function weekday(key) {
    return fromKey(key).getDay(); // 0 = Sunday
  }

  function last7Keys() {
    const out = [];
    let k = todayKey();
    for (let i = 6; i >= 0; i--) out.push(addDays(k, -i));
    return out;
  }

  function last30Keys() {
    const out = [];
    let k = todayKey();
    for (let i = 29; i >= 0; i--) out.push(addDays(k, -i));
    return out;
  }

  function niceDateTime(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    });
  }

  return {
    todayKey, keyFor, fromKey, addDays, daysBetween, isPast,
    humanize, relativeShort, weekday, last7Keys, last30Keys, niceDateTime
  };
})();
