// sector-themes.json
var sector_themes_default = [
  {
    id: "health",
    name: "\u533B\u836F\u533B\u7597",
    pattern: "\u533B\u836F|\u533B\u7597|\u751F\u7269\u533B|\u5065\u5EB7|\u521B\u65B0\u836F"
  },
  {
    id: "chip",
    name: "\u534A\u5BFC\u4F53 / \u82AF\u7247",
    pattern: "\u534A\u5BFC\u4F53|\u82AF\u7247|\u96C6\u6210\u7535\u8DEF"
  },
  {
    id: "energy",
    name: "\u65B0\u80FD\u6E90",
    pattern: "\u65B0\u80FD\u6E90|\u5149\u4F0F|\u50A8\u80FD|\u98CE\u7535|\u9502\u7535"
  },
  {
    id: "bank",
    name: "\u94F6\u884C",
    pattern: "(?<![\u519C\u5DE5\u745E])\u94F6\u884C"
  },
  {
    id: "consumer",
    name: "\u6D88\u8D39",
    pattern: "\u6D88\u8D39"
  },
  {
    id: "food",
    name: "\u98DF\u54C1\u996E\u6599 / \u767D\u9152",
    pattern: "\u98DF\u54C1|\u996E\u6599|\u767D\u9152"
  },
  {
    id: "ai",
    name: "\u4EBA\u5DE5\u667A\u80FD / \u673A\u5668\u4EBA",
    pattern: "\u4EBA\u5DE5\u667A\u80FD|\u673A\u5668\u4EBA"
  },
  {
    id: "software",
    name: "\u8BA1\u7B97\u673A / \u8F6F\u4EF6",
    pattern: "\u8BA1\u7B97\u673A|\u8F6F\u4EF6|\u4E91\u8BA1\u7B97|\u5927\u6570\u636E"
  },
  {
    id: "communication",
    name: "\u901A\u4FE1",
    pattern: "\u901A\u4FE1|5G"
  },
  {
    id: "defense",
    name: "\u519B\u5DE5 / \u56FD\u9632",
    pattern: "\u519B\u5DE5|\u56FD\u9632|\u822A\u7A7A\u822A\u5929"
  },
  {
    id: "agriculture",
    name: "\u519C\u4E1A",
    pattern: "\u519C\u4E1A|\u755C\u7267|\u517B\u6B96"
  },
  {
    id: "finance",
    name: "\u8BC1\u5238 / \u4FDD\u9669",
    pattern: "\u8BC1\u5238(?:\u516C\u53F8|\u884C\u4E1A|\u4FDD\u9669|\u9F99\u5934|ETF|\u4E3B\u9898|30)|\u5238\u5546|\u4FDD\u9669|\u975E\u94F6"
  },
  {
    id: "property",
    name: "\u623F\u5730\u4EA7",
    pattern: "\u623F\u5730\u4EA7|\u5730\u4EA7"
  },
  {
    id: "infrastructure",
    name: "\u57FA\u5EFA / \u5EFA\u6750",
    pattern: "\u57FA\u5EFA|\u57FA\u7840\u5EFA\u8BBE|\u5EFA\u7B51|\u5EFA\u6750"
  },
  {
    id: "metals",
    name: "\u6709\u8272\u91D1\u5C5E",
    pattern: "\u6709\u8272|\u7A00\u571F|\u7A00\u6709\u91D1\u5C5E|\u9EC4\u91D1\u80A1"
  },
  {
    id: "coal",
    name: "\u7164\u70AD",
    pattern: "\u7164\u70AD"
  }
];

// sector-core.mjs
var themes = sector_themes_default;
var median = (values) => {
  if (!values.length) return null;
  const a = [...values].sort((x, y) => x - y), n = a.length;
  return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
};
var groupKey = (r) => JSON.stringify([r.tracking, r.structure]);
function indexGroups(data2, theme2) {
  const groups = /* @__PURE__ */ new Map();
  for (const r of data2.rows) {
    if (r.mode !== "index" || !r.tracking || !r.themes.includes(theme2)) continue;
    const key = groupKey(r);
    const g = groups.get(key) || { key, tracking: r.tracking, structure: r.structure, count: 0 };
    g.count++;
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.tracking.localeCompare(b.tracking, "zh"));
}
function summarize(data2, companies2, { theme: theme2, mode: mode2, days: days2, group }) {
  const rows = data2.rows.filter((r) => r.themes.includes(theme2) && r.mode === mode2 && (mode2 !== "index" || groupKey(r) === group));
  const result = companies2.map((c) => {
    const sample = rows.filter((r) => r.companyId === c.id), eligible = sample.filter((r) => !r.metrics?.[days2]?.error && Number.isFinite(r.metrics?.[days2]?.change) && Number.isFinite(r.metrics?.[days2]?.drawdown));
    return { id: c.id, name: c.name, short: c.short, total: sample.length, count: eligible.length, change: median(eligible.map((r) => r.metrics[days2].change)), drawdown: median(eligible.map((r) => r.metrics[days2].drawdown)), sample, eligible };
  });
  return result.sort((a, b) => a.change === null ? b.change === null ? 0 : 1 : b.change === null ? -1 : b.change - a.change);
}

// research-store.mjs
var STORAGE_KEY = "shixu-research-v1";
var markets = { cn: "A\u80A1", us: "\u7F8E\u80A1", hk: "\u6E2F\u80A1", fund: "\u57FA\u91D1" };
function cleanItem(v) {
  if (!v || !Object.hasOwn(markets, v.market) || !String(v.code || "").match(v.market === "fund" || v.market === "cn" ? /^\d{6}$/ : v.market === "hk" ? /^\d{5}$/ : /^[A-Z0-9.^-]{1,16}$/)) return null;
  return { market: v.market, code: String(v.code), name: String(v.name || v.code).slice(0, 100), industry: String(v.industry || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60), industryName: String(v.industryName || "").slice(0, 80), note: String(v.note || "").slice(0, 180) };
}
var itemKey = (i) => i.market + ":" + i.code;
var groupKey2 = (i) => i.market === "fund" ? "fund" : i.industry ? i.market + ":" + i.industry : "";
var limitFor = (g) => g === "fund" ? 4 : 5;
function cleanState(v) {
  const list = (a, max) => {
    const seen = /* @__PURE__ */ new Set();
    return (Array.isArray(a) ? a : []).map(cleanItem).filter((i) => i && !seen.has(itemKey(i)) && seen.add(itemKey(i))).slice(0, max);
  };
  const queues = {};
  for (const [key, g] of Object.entries(v?.queues || {}).slice(0, 60)) {
    if (!g || !Array.isArray(g.items)) continue;
    const items = list(g.items.filter((i) => {
      const c = cleanItem(i);
      return c && groupKey2(c) === key;
    }), limitFor(key));
    if (items.length) queues[key] = { items, days: (key === "fund" ? [7, 15, 30, 180, 365] : [30, 90, 180, 365]).includes(g.days) ? g.days : 30 };
  }
  return { version: 1, watch: list(v?.watch, 200), recent: list(v?.recent, 30), queues };
}
var memory = () => globalThis.__shixuResearchMemory || cleanState(null);
function readState() {
  if (globalThis.__shixuResearchSaved === false) return memory();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? cleanState(JSON.parse(raw)) : cleanState(null);
  } catch {
    return memory();
  }
}
function writeState(state, detail = {}) {
  const next = cleanState(state);
  globalThis.__shixuResearchMemory = next;
  let saved = true;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    saved = false;
  }
  globalThis.__shixuResearchSaved = saved;
  globalThis.document?.dispatchEvent(new CustomEvent("research:change", { detail }));
  return saved;
}
function setQueue(key, items, days2 = 30, source = "page") {
  const s = readState(), next = cleanState({ queues: { [key]: { items, days: days2 } } }).queues[key];
  if (JSON.stringify(s.queues[key]) === JSON.stringify(next)) return;
  if (next) s.queues[key] = next;
  else delete s.queues[key];
  writeState(s, { group: key, source });
}
function visit(item) {
  const i = cleanItem(item);
  if (!i) return;
  const s = readState(), old = s.recent.find((x) => itemKey(x) === itemKey(i));
  if (!i.industry && old?.industry) {
    i.industry = old.industry;
    i.industryName = old.industryName;
  }
  s.recent = [i, ...s.recent.filter((x) => itemKey(x) !== itemKey(i))].slice(0, 30);
  const watched = s.watch.find((x) => itemKey(x) === itemKey(i));
  if (watched && i.industry) {
    watched.industry = i.industry;
    watched.industryName = i.industryName;
  }
  writeState(s, { source: "visit" });
}
function researchButtons(item) {
  const i = cleanItem(item);
  if (!i) return "";
  const encoded = encodeURIComponent(JSON.stringify(i)), watched = readState().watch.some((x) => itemKey(x) === itemKey(i));
  return `<span class="research-actions"><button type="button" data-research-watch="${encoded}" aria-pressed="${watched}">${watched ? "\u2605 \u5DF2\u81EA\u9009" : "\u2606 \u81EA\u9009"}</button></span>`;
}

// compare-selection.mjs
var MAX_COMPARE = 4;
function validSelection(codes, hasCode) {
  if (!Array.isArray(codes)) return [];
  return [...new Set(codes.filter((c) => typeof c === "string" && /^\d{6}$/.test(c) && hasCode(c)))].slice(0, MAX_COMPARE);
}
function comparisonLink(codes, days2) {
  const clean = validSelection(codes, () => true), period = [7, 15, 30, 180, 365].includes(Number(days2)) ? Number(days2) : 30;
  return "/compare.html?" + new URLSearchParams({ codes: clean.join(","), days: String(period) }).toString() + "#selection";
}

// sector-board.js
var $ = (id) => document.getElementById(id);
var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var pct = (x) => Number.isFinite(x) ? `${x >= 0 ? "+" : ""}${(x * 100).toFixed(2)}%` : "\u2014";
var data;
var companies = [];
var theme = "health";
var mode = "active";
var days = 365;
var companyQuery = "";
var basket = [];
var fundByCode = /* @__PURE__ */ new Map();
var basketKey = "sector-comparison-selection-v1";
var researchFund = (r) => ({ market: "fund", code: r.code, name: r.name });
function restoreResearch() {
  if (!data) return;
  const items = readState().queues.fund?.items || [];
  for (const i of items) if (!fundByCode.has(i.code)) fundByCode.set(i.code, i);
  basket = items.map((i) => i.code);
  renderBasket();
}
document.addEventListener("research:change", (e) => {
  if (e.detail?.source === "dock") restoreResearch();
});
document.addEventListener("research:external", restoreResearch);
function renderBasket(message = "") {
  setQueue("fund", basket.map((c) => fundByCode.get(c)).filter(Boolean).map(researchFund), days);
  const tray = $("sectorCompareTray");
  tray.hidden = !basket.length;
  document.body.classList.toggle("has-sector-tray", !!basket.length);
  tray.innerHTML = `<div class="sector-tray-top"><strong>\u57FA\u91D1\u5BF9\u6BD4 \xB7 ${basket.length}/${MAX_COMPARE}</strong><span>\u9996\u53EA\u4E3A\u53C2\u7167 \xB7 \u6CBF\u7528\u5F53\u524D\u89C2\u5BDF\u671F\u95F4</span><button type="button" data-basket-clear>\u6E05\u7A7A</button></div><div class="sector-tray-funds">${basket.map((code) => `<button type="button" data-basket-remove="${code}" aria-label="\u79FB\u9664${esc(fundByCode.get(code).name)}">${esc(fundByCode.get(code).name)} \xD7</button>`).join("")}</div><div class="sector-tray-bottom"><p role="status">${esc(message || (basket.length < 2 ? "\u518D\u90091\u53EA\uFF0C\u5C31\u53EF\u4EE5\u5F00\u59CB\u5BF9\u6BD4\u3002" : "\u5DF2\u9009\u57FA\u91D1\u4F1A\u5728\u5207\u6362\u677F\u5757\u3001\u641C\u7D22\u516C\u53F8\u65F6\u4FDD\u7559\u3002"))}</p>${basket.length >= 2 ? `<a class="sector-tray-start" href="${comparisonLink(basket, days)}">\u5F00\u59CB\u5BF9\u6BD4</a>` : '<button class="sector-tray-start" disabled>\u5F00\u59CB\u5BF9\u6BD4</button>'}</div>`;
  document.querySelectorAll("[data-basket-add]").forEach((b) => {
    const added = basket.includes(b.dataset.basketAdd);
    b.textContent = added ? "\u5DF2\u9009 \xB7 \u79FB\u9664" : "\uFF0B \u52A0\u5165\u5BF9\u6BD4";
    b.setAttribute("aria-pressed", String(added));
  });
  try {
    sessionStorage.setItem(basketKey, JSON.stringify(basket));
  } catch {
  }
}
function toggleBasket(code) {
  if (!fundByCode.has(code)) return;
  if (basket.includes(code)) basket = basket.filter((c) => c !== code);
  else if (basket.length >= MAX_COMPARE) return renderBasket("\u6700\u591A\u540C\u65F6\u5BF9\u6BD44\u53EA\uFF0C\u8BF7\u5148\u79FB\u9664\u4E00\u53EA\u3002");
  else {
    basket.push(code);
    visit(researchFund(fundByCode.get(code)));
  }
  renderBasket();
}
function updateGroups() {
  updateThemes();
  const groups = indexGroups(data, theme);
  $("sectorIndex").innerHTML = groups.map((g) => `<option value="${esc(g.key)}">${esc(g.tracking)} \xB7 ${esc(g.structure)}\uFF08${g.count}\u53EA\uFF09</option>`).join("");
  $("sectorIndexLabel").hidden = mode !== "index";
}
function updateThemes() {
  $("sectorTheme").innerHTML = themes.map((t) => {
    const matched = data.rows.filter((r) => r.themes.includes(t.id));
    const active = matched.filter((r) => r.mode === "active").length, index = matched.filter((r) => r.mode === "index").length;
    return `<option value="${t.id}">${t.name} \xB7 \u4E3B\u52A8${active} / \u6307\u6570${index}</option>`;
  }).join("");
  $("sectorTheme").value = theme;
}
function getRows(t = theme) {
  return summarize(data, companies.filter((c) => c.name.includes(companyQuery)), { theme: t, mode, days, group: $("sectorIndex").value });
}
function render() {
  if (!data) return;
  const rows = getRows().filter((r) => r.total), good = rows.filter((r) => r.count), n = good.reduce((s, r) => s + r.count, 0), window = data.windows[days], unknown = data.rows.filter((r) => r.themes.includes(theme) && r.error).length;
  const active = data.rows.filter((r) => r.mode === "active").length, index = data.rows.filter((r) => r.mode === "index").length;
  $("sectorCoverage").textContent = `\u8986\u76D6\u5F53\u524D\u540D\u5355\u4E2D ${companies.length} \u5BB6\u5DF2\u6838\u5B9E\u7BA1\u7406\u4EBA \xB7 ${active} \u53EA\u4E3B\u52A8\u4E3B\u9898\u57FA\u91D1 / ${index} \u53EA\u6307\u6570\u57FA\u91D1\uFF08\u53BB\u91CD\u4EFD\u989D\uFF09 \xB7 \u540D\u79F0\u5339\u914D\uFF0C\u4E0D\u4EE3\u8868\u5168\u90E8\u884C\u4E1A\u6301\u4ED3`;
  $("sectorStatus").textContent = `${data.dailyAsOf && data.dailyAsOf !== data.asof ? "\u677F\u5757\u6570\u636E\u5C1A\u672A\u540C\u6B65\u81F3\u6700\u65B0\u65E5\u66F4 \xB7 " : ""}\u51C0\u503C\u622A\u6B62 ${data.asof} \xB7 \u5171\u540C\u671F\u95F4 ${window.start || "\u2014"} \u81F3 ${window.end || "\u2014"} \xB7 ${companyQuery ? "\u516C\u53F8\u641C\u7D22\u7ED3\u679C \xB7 " : ""}${good.length}\u5BB6\u516C\u53F8 / ${n}\u53EA\u6709\u6548\u6837\u672C${unknown ? " \xB7 " + unknown + "\u53EA\u6863\u6848\u672A\u6838\u5B9E\uFF0C\u672A\u5206\u7C7B\u8BA1\u5165" : ""}`;
  $("sectorMeaning").textContent = mode === "active" ? "\u6BD4\u8F83\u4E3B\u9898\u540D\u79F0\u5339\u914D\u7684\u4E3B\u52A8\u57FA\u91D1\u6837\u672C\uFF0C\u6309\u516C\u53F8\u6536\u76CA\u4E2D\u4F4D\u6570\u6392\u5E8F\uFF1B\u6301\u4ED3\u3001\u4ED3\u4F4D\u548C\u57FA\u51C6\u53EF\u80FD\u4E0D\u540C\uFF0C\u4E0D\u662F\u57FA\u91D1\u516C\u53F8\u7684\u884C\u4E1A\u9009\u80A1\u80FD\u529B\u8BC4\u5206\u3002" : "\u4EC5\u6BD4\u8F83\u540C\u4E00\u4E2A\u8DDF\u8E2A\u6307\u6570\u3001\u540C\u4E00\u4EA7\u54C1\u7ED3\u6784\u7684\u6837\u672C\uFF1B\u6536\u76CA\u5DEE\u5F02\u53EF\u80FD\u6765\u81EA\u8D39\u7528\u3001\u73B0\u91D1\u4ED3\u4F4D\u548C\u8DDF\u8E2A\u60C5\u51B5\uFF0C\u4E0D\u80FD\u636E\u6B64\u8BA4\u5B9A\u516C\u53F8\u7684\u884C\u4E1A\u9009\u80A1\u80FD\u529B\u3002";
  if (good.length === 1) $("sectorMeaning").textContent += " \u5F53\u524D\u4EC51\u5BB6\u516C\u53F8\u6709\u6709\u6548\u6837\u672C\uFF0C\u4E0D\u80FD\u636E\u6B64\u505A\u8DE8\u516C\u53F8\u6BD4\u8F83\u3002";
  $("sectorResults").innerHTML = rows.length ? `<p class="sector-scroll-hint">\u5F53\u524D\u6761\u4EF6\u4E0B ${rows.length} \u5BB6\u516C\u53F8\u6709\u5DF2\u6536\u5F55\u6837\u672C \xB7 \u53EF\u4E0A\u4E0B\u6EDA\u52A8\u67E5\u770B\u5168\u90E8\u516C\u53F8</p><div class="sector-ranks" tabindex="0" role="region" aria-label="\u5168\u90E8\u516C\u53F8\u6536\u76CA\u5BF9\u6BD4\uFF0C\u53EF\u4E0A\u4E0B\u6EDA\u52A8">${rows.map((r) => {
    const value = r.change, scale = Math.max(0.01, ...good.map((g) => Math.abs(g.change)));
    return `<article class="sector-rank"><div class="sector-rank-main"><div><a href="/compare.html?q=${encodeURIComponent(r.name.replace(/基金.*$/, ""))}">${esc(r.name)}</a><small>${r.count} / ${r.total} \u53EA\u6709\u6548\u6837\u672C${r.count === 1 ? " \xB7 \u5355\u6837\u672C" : ""}</small></div><div class="sector-value ${value < 0 ? "negative" : "positive"}"><strong>${pct(value)}</strong><small>\u6536\u76CA\u4E2D\u4F4D\u6570</small></div><div class="sector-dd"><b>${r.drawdown === null ? "\u2014" : (r.drawdown * 100).toFixed(2) + "%"}</b><small>\u6837\u672C\u6700\u5927\u56DE\u64A4\u4E2D\u4F4D\u6570</small></div></div>${value !== null ? `<div class="sector-bar" aria-hidden="true"><i class="${value < 0 ? "negative" : "positive"}" style="width:${Math.max(1, Math.abs(value) / scale * 100)}%"></i></div>` : '<p class="sector-unavailable">' + (r.total ? "\u6837\u672C\u5386\u53F2\u4E0D\u8DB3\u6216\u6570\u636E\u5F85\u6838\u5B9E" : "\u5F53\u524D\u6837\u672C\u6C60\u672A\u6536\u5F55\u8BE5\u7C7B\u57FA\u91D1") + "\uFF0C\u4E0D\u53C2\u4E0E\u6392\u5E8F\u3002</p>"}${r.total ? `<details><summary>\u67E5\u770B ${r.total} \u53EA\u6837\u672C\u4E0E\u7EDF\u8BA1\u8303\u56F4</summary><div class="sector-samples">${r.sample.map((f) => {
      const m = f.metrics[days];
      return `<div><div class="sector-sample-title"><a href="/compare.html?code=${f.code}">${esc(f.name)}</a>${researchButtons(researchFund(f))}<button type="button" data-basket-add="${f.code}" aria-label="\u9009\u62E9${esc(f.name)}\u8FDB\u884C\u5BF9\u6BD4" aria-pressed="false">\uFF0B \u52A0\u5165\u5BF9\u6BD4</button></div><span>${f.code} \xB7 ${esc(f.type)}</span><p>${m.error ? esc(m.error) : "\u6536\u76CA " + pct(m.change) + " \xB7 \u6700\u5927\u56DE\u64A4 " + (m.drawdown * 100).toFixed(2) + "%"}</p><details><summary>\u57FA\u51C6\u3001\u8303\u56F4\u4E0E\u6765\u6E90</summary><p>\u4E1A\u7EE9\u6BD4\u8F83\u57FA\u51C6\uFF1A${esc(f.benchmark || "\u672A\u53D6\u5F97")}</p><p>\u6295\u8D44\u8303\u56F4\u8282\u9009\uFF1A${esc(f.scope || "\u672A\u53D6\u5F97")}</p><a target="_blank" rel="noopener" href="${f.profileSource}">\u57FA\u91D1\u6863\u6848</a> \xB7 <a target="_blank" rel="noopener" href="${f.navSource}">\u51C0\u503C\u6765\u6E90</a></details></div>`;
    }).join("")}</div></details>` : ""}</article>`;
  }).join("")}</div>` : `<div class="sector-empty"><h3>\u5F53\u524D\u6761\u4EF6\u4E0B\u6CA1\u6709\u53EF\u6BD4\u8F83\u6837\u672C</h3><p>\u8FD9\u4E0D\u8868\u793A\u516C\u53F8\u4E0D\u64C5\u957F\u6B64\u9886\u57DF\u3002${mode === "active" && indexGroups(data, theme).length ? "\u8BE5\u677F\u5757\u6709\u6307\u6570\u57FA\u91D1\u6837\u672C\uFF0C\u53EF\u5C06\u6BD4\u8F83\u65B9\u5F0F\u5207\u6362\u4E3A\u201C\u540C\u6307\u6570\u57FA\u91D1\u201D\u3002" : "\u53EF\u5207\u6362\u677F\u5757\u3001\u6307\u6570\u5206\u7EC4\u6216\u7F29\u77ED\u89C2\u5BDF\u671F\u95F4\u3002"}\u672C\u9875\u4E0D\u628A\u7F3A\u5931\u6570\u636E\u5F53\u62100%\u6536\u76CA\u3002</p></div>`;
  $("sectorMatrix").hidden = mode !== "active";
  if (mode === "active") {
    $("sectorMatrixHead").innerHTML = '<th scope="col">\u516C\u53F8</th>' + themes.map((t) => `<th scope="col">${esc(t.name)}</th>`).join("");
    const matrix = new Map(themes.map((t) => [t.id, new Map(getRows(t.id).map((r) => [r.id, r]))]));
    $("sectorMatrixBody").innerHTML = companies.filter((c) => c.name.includes(companyQuery) && data.rows.some((r) => r.companyId === c.id && r.mode === "active")).map((c) => `<tr><th scope="row">${esc(c.short)}</th>${themes.map((t) => {
      const r = matrix.get(t.id).get(c.id);
      return `<td><button data-theme="${t.id}" class="${r.change === null ? "unavailable" : r.change < 0 ? "negative" : "positive"}" aria-label="${esc(c.name)} ${esc(t.name)} ${pct(r.change)}\uFF0C\u67E5\u770B\u677F\u5757\u5BF9\u6BD4">${pct(r.change)}<small>${r.count ? "n=" + r.count : "\u65E0\u6709\u6548\u6837\u672C"}</small></button></td>`;
    }).join("")}</tr>`).join("");
  }
  renderBasket();
}
async function boot() {
  try {
    const r = await fetch("/sector-data.json");
    if (!r.ok) throw Error();
    data = await r.json();
    if (data.schema !== 1 || !data.windows || !Array.isArray(data.rows) || !Array.isArray(data.companies)) throw Error();
    companies = data.companies;
    fundByCode = new Map(data.rows.filter((r2) => r2.mode === "active" || r2.mode === "index").map((r2) => [r2.code, r2]));
    const saved = readState().queues.fund;
    if (saved) {
      for (const i of saved.items) if (!fundByCode.has(i.code)) fundByCode.set(i.code, i);
      basket = saved.items.map((i) => i.code);
      days = [30, 180, 365].includes(saved.days) ? saved.days : 365;
      $("sectorPeriod").value = String(days);
    } else {
      try {
        basket = validSelection(JSON.parse(sessionStorage.getItem(basketKey) || "[]"), (c) => fundByCode.has(c));
      } catch {
        basket = [];
      }
    }
    $("sectorTheme").innerHTML = themes.map((t) => `<option value="${t.id}">${t.name}</option>`).join("");
    $("sectorTheme").value = theme;
    updateGroups();
    render();
    $("sectorControls").hidden = false;
  } catch {
    $("sectorStatus").innerHTML = '\u677F\u5757\u6536\u76CA\u6570\u636E\u6682\u672A\u8F7D\u5165\u3002<button id="retrySector">\u91CD\u8BD5</button>';
    $("retrySector").onclick = boot;
  }
}
$("sectorResults").addEventListener("click", (e) => {
  const b = e.target.closest("[data-basket-add]");
  if (b) toggleBasket(b.dataset.basketAdd);
});
$("sectorCompareTray").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.hasAttribute("data-basket-clear")) {
    basket = [];
    renderBasket();
  } else if (b.dataset.basketRemove) toggleBasket(b.dataset.basketRemove);
});
$("sectorCompany").oninput = () => {
  companyQuery = $("sectorCompany").value.trim();
  render();
};
$("sectorMode").onchange = () => {
  mode = $("sectorMode").value;
  updateGroups();
  render();
};
$("sectorTheme").onchange = () => {
  theme = $("sectorTheme").value;
  updateGroups();
  render();
};
$("sectorPeriod").onchange = () => {
  days = Number($("sectorPeriod").value);
  render();
};
$("sectorIndex").onchange = render;
$("sectorMatrixBody").onclick = (e) => {
  const b = e.target.closest("[data-theme]");
  if (b) {
    theme = b.dataset.theme;
    $("sectorTheme").value = theme;
    updateGroups();
    render();
    $("sectorResults").scrollIntoView({ behavior: "smooth", block: "start" });
  }
};
boot();
