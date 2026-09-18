// Financial tab: accounts, transactions, and the Gmail-import review flow.
const ViewsFinancial = (() => {
  const esc = ViewsCore.esc;

  function money(n) {
    const sign = n < 0 ? "-" : "";
    return `${sign}$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function renderFinancial() {
    const d = Store.get();
    const accounts = d.financialAccounts;
    const txns = [...d.financialTransactions].sort((a, b) => b.date.localeCompare(a.date));
    const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);
    const monthKey = Dates.todayKey().slice(0, 7);
    const thisMonth = txns.filter((t) => t.date.startsWith(monthKey));
    const income = thisMonth.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expense = thisMonth.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);

    return `
    <div class="card" style="display:flex; gap:18px; flex-wrap:wrap;">
      <div><div class="item-meta">Total balance</div><div class="item-title" style="font-size:20px;">${money(totalBalance)}</div></div>
      <div><div class="item-meta">Income this month</div><div class="item-title" style="font-size:20px; color:var(--accent-2);">${money(income)}</div></div>
      <div><div class="item-meta">Spent this month</div><div class="item-title" style="font-size:20px; color:var(--danger);">${money(expense)}</div></div>
    </div>

    <div class="section-title">
      <h2>Accounts</h2>
      <button class="btn secondary" data-act="add-account">${Icon.svg("plus")} Account</button>
    </div>
    ${accounts.length ? accounts.map((a) => `
      <div class="card">
        <div class="card-row">
          <div style="flex:1;">
            <div class="item-title">${esc(a.name)}</div>
            <div class="item-meta"><span class="pill">${esc(a.type)}</span></div>
          </div>
          <div class="item-title" style="color:${a.balance < 0 ? "var(--danger)" : "var(--text)"};">${money(Number(a.balance))}</div>
          <div class="item-actions">
            <button class="icon-btn" data-act="edit" data-collection="financialAccounts" data-id="${a.id}">${Icon.svg("edit")}</button>
            <button class="icon-btn" data-act="delete" data-collection="financialAccounts" data-id="${a.id}">${Icon.svg("trash")}</button>
          </div>
        </div>
      </div>`).join("") : `<div class="empty-state">No accounts yet.</div>`}

    <div class="section-title">
      <h2>Transactions</h2>
      <div style="display:flex; gap:8px;">
        <button class="btn secondary" data-act="import-gmail-financial">${Icon.svg("download")} Import from Gmail</button>
        <button class="btn secondary" data-act="add-transaction">${Icon.svg("plus")} Transaction</button>
      </div>
    </div>
    ${txns.length ? txns.map((t) => {
      const acct = accounts.find((a) => a.id === t.accountId);
      return `
      <div class="card">
        <div class="card-row">
          <div style="flex:1; min-width:0;">
            <div class="item-title">${esc(t.description)}</div>
            <div class="item-meta">
              <span>${Dates.humanize(t.date)}</span>
              <span class="pill">${esc(t.category || "uncategorized")}</span>
              ${acct ? `<span class="pill">${esc(acct.name)}</span>` : ""}
              ${t.source === "gmail" ? `<span class="pill">from Gmail</span>` : ""}
            </div>
          </div>
          <div class="item-title" style="color:${t.amount < 0 ? "var(--danger)" : "var(--accent-2)"};">${money(Number(t.amount))}</div>
          <div class="item-actions">
            <button class="icon-btn" data-act="edit" data-collection="financialTransactions" data-id="${t.id}">${Icon.svg("edit")}</button>
            <button class="icon-btn" data-act="delete" data-collection="financialTransactions" data-id="${t.id}">${Icon.svg("trash")}</button>
          </div>
        </div>
      </div>`;
    }).join("") : `<div class="empty-state">No transactions yet.</div>`}
    `;
  }

  function renderImportReview(candidates) {
    return `
    <h3>Review Gmail import (${candidates.length})</h3>
    <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:12px;">
      Pulled from your TODO-labeled emails and guessed from the largest dollar amount found in each one. Nothing is saved until you check it and hit Add.
    </p>
    <div id="import-review-list" style="display:flex; flex-direction:column; gap:10px; max-height:50vh; overflow-y:auto;">
      ${candidates.map((c, i) => `
        <div class="card" data-candidate-idx="${i}">
          <div class="card-row">
            <input type="checkbox" class="import-check" ${c.hasAmount ? "checked" : ""} style="margin-top:4px;" />
            <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
              <input type="text" class="import-desc" value="${esc(c.description)}" style="border:1px solid var(--border); background:var(--bg-sunken); border-radius:8px; padding:6px 8px;" />
              <div style="display:flex; gap:6px;">
                <input type="number" step="0.01" class="import-amount" value="${c.amount}" placeholder="amount" style="flex:1; border:1px solid var(--border); background:var(--bg-sunken); border-radius:8px; padding:6px 8px;" />
                <input type="date" class="import-date" value="${c.date}" style="flex:1; border:1px solid var(--border); background:var(--bg-sunken); border-radius:8px; padding:6px 8px;" />
              </div>
              <div class="item-meta">${esc(c.snippet).slice(0, 140)}</div>
            </div>
          </div>
        </div>`).join("")}
    </div>
    <div class="modal-actions">
      <button type="button" class="btn secondary" id="import-cancel">Cancel</button>
      <button type="button" class="btn primary" id="import-confirm">Add selected</button>
    </div>
    `;
  }

  return { renderFinancial, renderImportReview, money };
})();
