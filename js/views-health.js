// Health tab: BMI, BMR/TDEE, and a macro calculator built on HealthCalc,
// plus a simple weight log. All math runs client-side from stored inputs --
// nothing here is medical advice, just the standard public formulas
// (Mifflin-St Jeor for BMR, WHO bands for BMI).
const ViewsHealth = (() => {
  const esc = ViewsCore.esc;
  const H = HealthCalc;

  function round(n, d = 0) {
    if (n == null || isNaN(n)) return null;
    const f = 10 ** d;
    return Math.round(n * f) / f;
  }

  function heightDisplayFields(p) {
    if (p.units === "imperial") {
      const { ft, inches } = p.heightCm ? H.cmToFtIn(p.heightCm) : { ft: "", inches: "" };
      return `
        <div class="field-row">
          <div class="field"><label>Height (ft)</label><input type="number" id="h-height-ft" value="${ft}" min="0" /></div>
          <div class="field"><label>Height (in)</label><input type="number" id="h-height-in" value="${inches}" min="0" max="11" /></div>
        </div>`;
    }
    return `<div class="field"><label>Height (cm)</label><input type="number" id="h-height-cm" value="${p.heightCm ?? ""}" min="0" /></div>`;
  }

  function weightDisplayFields(p) {
    if (p.units === "imperial") {
      const lb = p.weightKg ? round(H.kgToLb(p.weightKg), 1) : "";
      return `<div class="field"><label>Weight (lb)</label><input type="number" id="h-weight-lb" value="${lb}" min="0" step="0.1" /></div>`;
    }
    return `<div class="field"><label>Weight (kg)</label><input type="number" id="h-weight-kg" value="${p.weightKg ?? ""}" min="0" step="0.1" /></div>`;
  }

  function renderProfileForm(p) {
    return `
    <div class="card" id="health-profile-form">
      <div class="settings-row" style="padding-top:0;">
        <div class="label">Units</div>
        <div class="seg-group" id="health-units-seg">
          <button data-units="metric" class="${p.units !== "imperial" ? "active" : ""}">Metric</button>
          <button data-units="imperial" class="${p.units === "imperial" ? "active" : ""}">Imperial</button>
        </div>
      </div>
      <div class="field-row">
        ${heightDisplayFields(p)}
        ${weightDisplayFields(p)}
      </div>
      <div class="field-row">
        <div class="field"><label>Age</label><input type="number" id="h-age" value="${p.age ?? ""}" min="0" /></div>
        <div class="field"><label>Sex</label>
          <select id="h-sex">
            <option value="male" ${p.sex === "male" ? "selected" : ""}>Male</option>
            <option value="female" ${p.sex === "female" ? "selected" : ""}>Female</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Activity level</label>
        <select id="h-activity">
          ${H.ACTIVITY_LEVELS.map((a) => `<option value="${a.value}" ${p.activityLevel === a.value ? "selected" : ""}>${esc(a.label)}</option>`).join("")}
        </select>
      </div>
      <div class="settings-row">
        <div class="label">Goal</div>
        <div class="seg-group" id="health-goal-seg">
          ${H.GOALS.map((g) => `<button data-goal="${g.value}" class="${p.goal === g.value ? "active" : ""}">${esc(g.label)}</button>`).join("")}
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label>Protein target (g/kg bodyweight)</label><input type="number" id="h-protein" value="${p.proteinPerKg}" min="0.5" max="3" step="0.1" /></div>
        <div class="field"><label>Fat (% of calories)</label><input type="number" id="h-fat-pct" value="${Math.round(p.fatPercent * 100)}" min="10" max="60" /></div>
      </div>
    </div>`;
  }

  function bmiGauge(value) {
    if (value == null) return "";
    const clamped = Math.max(14, Math.min(40, value));
    const pct = ((clamped - 14) / (40 - 14)) * 100;
    return `
    <div style="margin-top:10px;">
      <div style="position:relative; height:10px; border-radius:999px; background:linear-gradient(90deg, #60a5fa 0%, #60a5fa 17%, var(--accent-2) 17%, var(--accent-2) 42%, var(--warn) 42%, var(--warn) 58%, var(--danger) 58%, var(--danger) 100%);">
        <div style="position:absolute; top:-4px; left:${pct}%; transform:translateX(-50%); width:2px; height:18px; background:var(--text);"></div>
      </div>
      <div class="item-meta" style="display:flex; justify-content:space-between; margin-top:4px;">
        <span>Under</span><span>Normal</span><span>Over</span><span>Obese</span>
      </div>
    </div>`;
  }

  function macroBar(m) {
    if (!m) return "";
    return `
    <div style="display:flex; height:14px; border-radius:999px; overflow:hidden; margin:10px 0;">
      <div style="width:${m.protein.pct * 100}%; background:var(--accent);" title="Protein"></div>
      <div style="width:${m.carb.pct * 100}%; background:var(--accent-2);" title="Carbs"></div>
      <div style="width:${m.fat.pct * 100}%; background:var(--warn);" title="Fat"></div>
    </div>`;
  }

  function macroCard(label, color, data) {
    if (!data) return "";
    return `
    <div class="card" style="flex:1; min-width:120px;">
      <div class="item-meta" style="margin-bottom:2px;"><span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${color}; margin-right:5px;"></span>${label}</div>
      <div class="item-title" style="font-size:19px;">${round(data.grams)}g</div>
      <div class="item-meta">${round(data.cal)} kcal &middot; ${round(data.pct * 100)}%</div>
    </div>`;
  }

  // Computes everything from a profile-shaped object and renders the results panel.
  function renderResults(p) {
    const bmiVal = H.bmi(p.weightKg, p.heightCm);
    const cat = H.bmiCategory(bmiVal);
    const bmrVal = H.bmr(p.weightKg, p.heightCm, p.age, p.sex);
    const tdeeVal = H.tdee(bmrVal, p.activityLevel);
    const targetCal = H.goalCalories(tdeeVal, p.goal);
    const m = H.macros(targetCal, p.weightKg, p.proteinPerKg, p.fatPercent);

    if (bmiVal == null || bmrVal == null) {
      return `<div class="empty-state">Fill in your height, weight, and age above to see your BMI and macros.</div>`;
    }

    return `
    <div class="card">
      <div class="item-meta">BMI</div>
      <div style="display:flex; align-items:baseline; gap:10px;">
        <div class="item-title" style="font-size:26px;">${round(bmiVal, 1)}</div>
        <span class="pill ${cat.cls}">${cat.label}</span>
      </div>
      ${bmiGauge(bmiVal)}
    </div>

    <div class="card" style="display:flex; gap:18px; flex-wrap:wrap;">
      <div><div class="item-meta">BMR</div><div class="item-title" style="font-size:19px;">${round(bmrVal)} kcal</div></div>
      <div><div class="item-meta">TDEE (maintenance)</div><div class="item-title" style="font-size:19px;">${round(tdeeVal)} kcal</div></div>
      <div><div class="item-meta">Target (${esc((H.GOALS.find(g => g.value === p.goal) || {}).label || "")})</div><div class="item-title" style="font-size:19px; color:var(--accent);">${round(targetCal)} kcal</div></div>
    </div>

    <div class="card">
      <div class="item-meta" style="margin-bottom:2px;">Daily macros at ${round(targetCal)} kcal</div>
      ${macroBar(m)}
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        ${macroCard("Protein", "var(--accent)", m.protein)}
        ${macroCard("Carbs", "var(--accent-2)", m.carb)}
        ${macroCard("Fat", "var(--warn)", m.fat)}
      </div>
    </div>
    `;
  }

  function renderWeightLog(p) {
    const log = [...(p.weightLog || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
    const unit = p.units === "imperial" ? "lb" : "kg";
    const toDisplay = (kg) => (p.units === "imperial" ? round(H.kgToLb(kg), 1) : round(kg, 1));
    return `
    <div class="card">
      <div class="field-row" style="align-items:flex-end;">
        <div class="field" style="margin-bottom:0;">
          <label>Log today's weight (${unit})</label>
          <input type="number" id="h-log-weight" step="0.1" placeholder="${toDisplay(p.weightKg) ?? ""}" />
        </div>
        <button class="btn primary" id="h-log-submit" style="height:41px;">Log</button>
      </div>
    </div>
    ${log.length ? log.map((e, i) => {
      const prev = log[i + 1];
      const delta = prev ? e.weightKg - prev.weightKg : null;
      return `
      <div class="card">
        <div class="card-row">
          <div style="flex:1;">${Dates.humanize(e.date)}</div>
          <div class="item-title">${toDisplay(e.weightKg)} ${unit}</div>
          ${delta != null ? `<span class="pill ${delta > 0 ? "p2" : delta < 0 ? "p3" : ""}">${delta > 0 ? "+" : ""}${toDisplay(delta)}</span>` : ""}
        </div>
      </div>`;
    }).join("") : `<div class="empty-state">No weight logged yet.</div>`}
    `;
  }

  function renderHealth() {
    const p = Store.get().healthProfile;
    return `
    <div class="section-title"><h2>Your profile</h2></div>
    ${renderProfileForm(p)}
    <div class="section-title"><h2>Results</h2></div>
    <div id="health-results">${renderResults(p)}</div>
    <div class="section-title"><h2>Weight log</h2></div>
    <div id="health-weight-log">${renderWeightLog(p)}</div>
    <p style="font-size:12px; color:var(--text-muted); margin-top:14px;">
      Estimates from standard public formulas (Mifflin-St Jeor, WHO BMI bands) &mdash; not medical advice. Talk to a doctor or dietitian for personalized guidance.
    </p>
    `;
  }

  return { renderHealth, renderResults, renderWeightLog, round };
})();
