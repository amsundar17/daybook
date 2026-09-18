// Turns a Gmail message (subject/from/date/snippet/body) into a *suggested*
// financial transaction using regex heuristics -- there's no AI reading these
// emails, just a dollar-amount pattern and the sender name. Every suggestion
// is meant to be reviewed and edited before it's saved, never auto-filed.
const FinanceExtract = (() => {
  const AMOUNT_RE = /\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;

  function bestAmount(text) {
    const matches = [...text.matchAll(AMOUNT_RE)].map((m) => Number(m[1].replace(/,/g, "")));
    if (!matches.length) return null;
    return Math.max(...matches);
  }

  function vendorFrom(fromHeader) {
    const m = fromHeader.match(/^"?([^"<]+)"?\s*<?/);
    const name = m ? m[1].trim() : fromHeader;
    return name.replace(/\s{2,}/g, " ").slice(0, 60) || fromHeader;
  }

  function dateFrom(dateHeader) {
    const d = new Date(dateHeader);
    return isNaN(d) ? Dates.todayKey() : Dates.keyFor(d);
  }

  function extractCandidate(message) {
    const text = `${message.subject}\n${message.snippet}\n${message.body || ""}`;
    const amount = bestAmount(text);
    return {
      messageId: message.id,
      description: message.subject || vendorFrom(message.from),
      vendor: vendorFrom(message.from),
      amount: amount == null ? "" : -Math.abs(amount), // default to an expense; user can flip the sign
      date: dateFrom(message.date),
      snippet: message.snippet,
      hasAmount: amount != null,
    };
  }

  function extractCandidates(messages) {
    return messages.map(extractCandidate);
  }

  return { extractCandidate, extractCandidates };
})();
