// stock-peers-core.mjs
var PERIODS = [30, 90, 180, 365];
var RANKS = { scale: [["revenue", "\u8425\u4E1A\u6536\u5165"], ["profit", "\u5F52\u6BCD\u51C0\u5229\u6DA6"], ["marketCap", "\u603B\u5E02\u503C"]], quality: [["roe", "\u52A0\u6743\u51C0\u8D44\u4EA7\u6536\u76CA\u7387"], ["grossMargin", "\u9500\u552E\u6BDB\u5229\u7387"], ["netMargin", "\u5F52\u6BCD\u51C0\u5229\u6DA6 / \u8425\u6536"], ["cashflow", "\u7ECF\u8425\u73B0\u91D1\u6D41\u51C0\u989D"]], growth: [["revenueGrowth", "\u8425\u6536\u540C\u6BD4\u589E\u957F"], ["profitGrowth", "\u5F52\u6BCD\u51C0\u5229\u6DA6\u540C\u6BD4\u589E\u957F"]], strength: [["change", "\u533A\u95F4\u6DA8\u8DCC\u5E45"], ["excess", "\u8D85\u8D8A\u540C\u884C\u53C2\u8003"], ["drawdown", "\u6700\u5927\u56DE\u64A4\uFF08\u8D8A\u5C0F\u8D8A\u9760\u524D\uFF09"], ["turnover", "\u6700\u65B0\u6362\u624B\u7387"]] };
var finite = (v) => typeof v === "number" && Number.isFinite(v);
var dateShift = (d, n) => new Date(Date.parse(d + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
function priceMetrics(stock, calendar, asof, days2) {
  if (!PERIODS.includes(days2)) throw Error("\u4E0D\u652F\u6301\u7684\u89C2\u5BDF\u671F\u95F4");
  const start = dateShift(asof, 1 - days2), dates = calendar.filter((d) => d >= start && d <= asof), empty = (reason) => ({ known: false, reason, start: dates[0] || start, end: asof, points: [], change: null, drawdown: null });
  if (dates.length < 2 || dates.at(-1) !== asof) return empty("\u5171\u540C\u4EA4\u6613\u65E5\u5386\u4E0D\u8DB3");
  const points = (stock.points || []).filter((p) => p[0] >= dates[0] && p[0] <= asof);
  if (points.length !== dates.length || points.some((p, i) => p[0] !== dates[i] || !finite(p[1]) || p[1] <= 0)) return empty("\u89C2\u5BDF\u671F\u884C\u60C5\u4E0D\u5B8C\u6574\u3001\u4E0A\u5E02\u4E0D\u8DB3\u6216\u5B58\u5728\u7F3A\u5931\u4EA4\u6613\u65E5");
  const first = points[0][1], normalized = points.map((p) => [p[0], p[1] / first]);
  let peak = 1, drawdown = 0;
  for (const [, v] of normalized) {
    peak = Math.max(peak, v);
    drawdown = Math.max(drawdown, 1 - v / peak);
  }
  return { known: true, start: dates[0], end: asof, points: normalized, change: normalized.at(-1)[1] - 1, drawdown };
}
function financialMetrics(stock, sector) {
  const f = stock.finance || {}, p = stock.previous || {}, bank = /银行|非银金融|^金融$/.test(sector || "");
  let growthCurrent = f, growthPrevious = p;
  if (stock.market === "HK") {
    const [a, b] = stock.annual || [], gap = a && b ? (Date.parse(a.period) - Date.parse(b.period)) / 864e5 : 0;
    growthCurrent = a || {};
    growthPrevious = a && b && a.currency === b.currency && gap >= 350 && gap <= 380 ? b : {};
  }
  const growth = (a, b) => finite(a) && finite(b) && a > 0 && b > 0 ? (a / b - 1) * 100 : null;
  const profitNote = !finite(growthPrevious.profit) ? "\u4E0A\u5E74\u540C\u671F\u6570\u636E\u7F3A\u5931" : growthPrevious.profit <= 0 ? finite(growthCurrent.profit) && growthCurrent.profit > 0 ? "\u626D\u4E8F\u4E3A\u76C8\uFF0C\u589E\u957F\u7387\u4E0D\u6392\u540D" : "\u4E0A\u5E74\u540C\u671F\u4E8F\u635F\u6216\u4E3A\u96F6\uFF0C\u589E\u957F\u7387\u4E0D\u6392\u540D" : finite(growthCurrent.profit) && growthCurrent.profit <= 0 ? "\u672C\u671F\u4E8F\u635F\u6216\u4E3A\u96F6\uFF0C\u589E\u957F\u7387\u4E0D\u6392\u540D" : growthPrevious.profit < 1e7 ? "\u4E0A\u5E74\u540C\u671F\u5229\u6DA6\u4E0D\u8DB31000\u4E07\u62A5\u8868\u8D27\u5E01\u5355\u4F4D\uFF0C\u7559\u610F\u4F4E\u57FA\u6570" : "";
  return {
    revenue: f.revenue ?? null,
    profit: f.profit ?? null,
    marketCap: stock.quote?.marketCap ?? null,
    turnover: stock.quote?.turnover ?? null,
    roe: finite(f.bps) && f.bps > 0 ? f.roe ?? null : null,
    grossMargin: bank ? null : f.grossMargin ?? null,
    netMargin: !bank && finite(f.profit) && finite(f.revenue) && f.revenue > 0 ? f.profit / f.revenue * 100 : null,
    cashflow: bank ? null : f.cashflow ?? null,
    revenueGrowth: growth(growthCurrent.revenue, growthPrevious.revenue),
    profitGrowth: growth(growthCurrent.profit, growthPrevious.profit),
    profitNote,
    bank
  };
}
function currencyRankRows(rows, metric2, currency) {
  return rankRows(rows.map((s) => ["revenue", "profit", "cashflow"].includes(metric2) && s.finance?.currency !== currency ? { ...s, currencyExcluded: true, metrics: { ...s.metrics, [metric2]: null } } : s), metric2);
}
function analyzeIndustry(data2, days2) {
  const rows = data2.stocks.map((s) => ({ ...s, metrics: financialMetrics(s, data2.sector), price: priceMetrics(s, data2.calendar, data2.asof, days2) }));
  const eligible = rows.filter((s) => s.price.known);
  let benchmark = null;
  if (eligible.length >= 2 && !data2.historyPending) {
    const points = eligible[0].price.points.map(([d], i) => [d, eligible.reduce((sum, s) => sum + s.price.points[i][1], 0) / eligible.length]);
    benchmark = { points, change: points.at(-1)[1] - 1, count: eligible.length, total: rows.length, start: points[0][0], end: points.at(-1)[0] };
  }
  for (const r of rows) Object.assign(r.metrics, { change: r.price.change, drawdown: r.price.drawdown, excess: r.price.known && benchmark ? r.price.change - benchmark.change : null });
  return { rows, benchmark };
}
function rankRows(rows, metric2) {
  if (!Object.values(RANKS).flat().some(([key]) => key === metric2)) throw Error("\u672A\u77E5\u6392\u5E8F\u6307\u6807");
  const sorted = [...rows].sort((a, b) => {
    const x = a.metrics[metric2], y = b.metrics[metric2];
    return finite(x) && finite(y) ? (metric2 === "drawdown" ? x - y : y - x) || a.code.localeCompare(b.code) : finite(x) ? -1 : finite(y) ? 1 : a.code.localeCompare(b.code);
  });
  let rank2 = 0, last;
  return sorted.map((r, i) => {
    const v = r.metrics[metric2];
    if (finite(v) && v !== last) rank2 = i + 1;
    last = v;
    return { ...r, rank: finite(v) ? rank2 : null };
  });
}
function validSelection(codes, rows) {
  const available = new Set(rows.map((r) => r.code));
  return [...new Set(codes)].filter((c) => /^(?:\d{5,6}|[A-Z][A-Z0-9.-]{0,9})$/.test(c) && available.has(c)).slice(0, 5);
}

// research-store.mjs
var STORAGE_KEY = "shixu-research-v1";
var markets = { cn: "A\u80A1", us: "\u7F8E\u80A1", hk: "\u6E2F\u80A1", fund: "\u57FA\u91D1" };
function cleanItem(v) {
  if (!v || !Object.hasOwn(markets, v.market) || !String(v.code || "").match(v.market === "fund" || v.market === "cn" ? /^\d{6}$/ : v.market === "hk" ? /^\d{5}$/ : /^[A-Z0-9.^-]{1,16}$/)) return null;
  return { market: v.market, code: String(v.code), name: String(v.name || v.code).slice(0, 100), industry: String(v.industry || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60), industryName: String(v.industryName || "").slice(0, 80), note: String(v.note || "").slice(0, 180) };
}
var itemKey = (i) => i.market + ":" + i.code;
var groupKey = (i) => i.market === "fund" ? "fund" : i.industry ? i.market + ":" + i.industry : "";
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
      return c && groupKey(c) === key;
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

// stock-peers.js
var $ = (id) => document.getElementById(id);
var esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var marketKey = new URL(location.href).searchParams.get("market");
var isUS = marketKey === "us";
var isHK = marketKey === "hk";
var isForeign = isUS || isHK;
var dataRoot = isHK ? "/hk-peer-data" : isUS ? "/us-peer-data" : "/stock-peer-data";
var normalizeCode = (c) => isHK && /^\d{1,5}(?:\.HK)?$/i.test(c) ? c.replace(/\.HK$/i, "").padStart(5, "0") : c;
var currencyName = (c) => ({ CNY: "\u4EBA\u6C11\u5E01", HKD: "\u6E2F\u5E01", USD: "\u7F8E\u5143", EUR: "\u6B27\u5143", GBP: "\u82F1\u9551" })[c] || c || "\u672A\u77E5\u5E01\u79CD";
var financeCurrency = /^[A-Z]{3}$/.test(new URL(location.href).searchParams.get("currency") || "") ? new URL(location.href).searchParams.get("currency") : "CNY";
var usMetricLabels = { revenue: "\u8425\u4E1A\u6536\u5165\uFF08TTM\uFF09", profit: "\u51C0\u5229\u6DA6\uFF08TTM\uFF09", roe: "\u51C0\u8D44\u4EA7\u6536\u76CA\u7387\uFF08TTM\uFF09", netMargin: "\u51C0\u5229\u6DA6 / \u8425\u6536\uFF08TTM\uFF09", cashflow: "\u7ECF\u8425\u73B0\u91D1\u6D41\uFF08TTM\uFF09", profitGrowth: "\u51C0\u5229\u6DA6\u540C\u6BD4\u589E\u957F" };
var needsLoad = (s) => isForeign ? !s.detailsLoaded : !s.points?.length;
$("market").value = isHK ? "hk" : isUS ? "us" : "cn";
$("market").onchange = () => location.href = "/stock-peers.html?market=" + $("market").value;
if (isUS) {
  document.title = "\u65F6\u5E8F \xB7 \u7F8E\u80A1\u540C\u884C\u5BF9\u6BD4";
  $("marketEyebrow").textContent = "US STOCKS / SIDE BY SIDE";
  $("candidateLink").href = "/?market=us#stock-picks";
  $("candidateLink").textContent = "\u7F8E\u80A1\u5019\u9009";
  $("marketBadge").textContent = "\u7F8E\u80A1\u89C2\u5BDF\u6C60 \xB7 \u7EC6\u5206\u884C\u4E1A";
  $("search").placeholder = "\u4F8B\u5982 \u82F1\u4F1F\u8FBE / NVDA";
}
if (isHK) {
  document.title = "\u65F6\u5E8F \xB7 \u6E2F\u80A1\u540C\u884C\u5BF9\u6BD4";
  $("marketEyebrow").textContent = "HONG KONG / SIDE BY SIDE";
  $("candidateLink").href = "/";
  $("candidateLink").textContent = "\u5E02\u573A\u9996\u9875";
  $("marketBadge").textContent = "\u6E2F\u80A1 \xB7 \u6E2F\u5E01\u666E\u901A\u80A1";
  $("search").placeholder = "\u4F8B\u5982 \u817E\u8BAF / 00700 / 0700.HK";
}
$("currencyControl").hidden = !isHK;
$("financeCurrency").value = financeCurrency;
$("financeCurrency").onchange = () => {
  financeCurrency = $("financeCurrency").value;
  if (data) {
    renderRank();
    updateURL();
  }
};
var colors = ["#197b65", "#7861b5", "#e07031", "#2b83b0", "#af537c"];
var percent = (n, ratio = true) => finite(n) ? `${n > 0 ? "+" : ""}${(n * (ratio ? 100 : 1)).toFixed(2)}%` : "\u2014";
var money = (n, currency) => finite(n) ? `${(n / 1e8).toLocaleString("zh-CN", { maximumFractionDigits: 2 })} \u4EBF${currencyName(currency || (isHK ? financeCurrency : isUS ? "USD" : "CNY"))}` : "\u2014";
var metricLabel = (k) => isHK && { marketCap: "\u5E02\u503C\uFF08\u6E2F\u5E01\uFF0C\u6765\u6E90\u53E3\u5F84\uFF09", revenueGrowth: "\u8425\u6536\u540C\u6BD4\uFF08\u6700\u8FD1\u8D22\u5E74\uFF09", profitGrowth: "\u51C0\u5229\u6DA6\u540C\u6BD4\uFF08\u6700\u8FD1\u8D22\u5E74\uFF09" }[k] || isForeign && usMetricLabels[k] || Object.values(RANKS).flat().find(([key]) => key === k)?.[1] || k;
var metricValue = (k, n, row) => !finite(n) ? "\u2014" : ["marketCap", "revenue", "profit", "cashflow"].includes(k) ? money(n, isHK ? k === "marketCap" ? "HKD" : row?.finance?.currency : void 0) : k === "excess" ? `${n > 0 ? "+" : ""}${(n * 100).toFixed(2)} \u4E2A\u767E\u5206\u70B9` : k === "drawdown" ? `${(n * 100).toFixed(2)}%` : percent(n, ["change"].includes(k));
var catalog;
var data;
var analysis;
var selected = [];
var rank = "scale";
var metric = isHK ? "marketCap" : "revenue";
var days = 30;
var generation = 0;
var retryAction;
var chartSeries = [];
var chartDates = [];
var cache = /* @__PURE__ */ new Map();
var queries = new URL(location.href).searchParams;
var researchMarket = isHK ? "hk" : isUS ? "us" : "cn";
var researchStock = (s) => ({ market: researchMarket, code: s.code, name: s.name, industry: data.id, industryName: data.name });
function restoreResearch() {
  if (!data) return;
  const codes = (readState().queues[researchMarket + ":" + data.id]?.items || []).map((i) => i.code), next = validSelection(codes, data.stocks);
  if (JSON.stringify(next) === JSON.stringify(selected)) return;
  selected = next;
  renderRank();
  renderComparison();
  updateURL();
  if (selected.length) loadHistories(selected);
}
document.addEventListener("research:change", (e) => {
  if (e.detail?.source === "dock" && data && e.detail.group === researchMarket + ":" + data.id) restoreResearch();
});
document.addEventListener("research:external", restoreResearch);
var historyAbort;
var historyBusy = false;
if (PERIODS.includes(Number(queries.get("days")))) days = Number(queries.get("days"));
$("days").value = String(days);
async function read(url) {
  const r = await fetch(url, { cache: "no-cache" });
  if (!r.ok) throw Error("\u6570\u636E\u6682\u65F6\u672A\u80FD\u52A0\u8F7D\uFF0C\u8BF7\u91CD\u8BD5\u3002");
  return r.json();
}
function updateURL() {
  const u = new URL(location.href);
  u.searchParams.delete("code");
  u.searchParams.set("industry", data.id);
  u.searchParams.set("days", days);
  if (isHK) u.searchParams.set("currency", financeCurrency);
  if (selected.length) u.searchParams.set("codes", selected.join(","));
  else u.searchParams.delete("codes");
  history.replaceState(null, "", u);
}
function showError(e, action) {
  $("loadError").hidden = false;
  $("errorText").textContent = e.message || "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u6570\u636E";
  retryAction = action;
  $("status").textContent = "\u6682\u65F6\u65E0\u6CD5\u663E\u793A\u672C\u6B21\u9009\u62E9\u7684\u6570\u636E\u3002";
}
function setMetricOptions() {
  const bank = /银行|非银金融|^金融$/.test(data?.sector || "");
  const options = RANKS[rank].filter(([k]) => !(bank && rank === "quality" && k !== "roe") && !(isForeign && k === "turnover"));
  if (!options.some(([k]) => k === metric)) metric = options[0][0];
  $("metric").innerHTML = options.map(([k, l]) => `<option value="${k}">${metricLabel(k)}</option>`).join("");
  $("metric").value = metric;
  document.querySelectorAll("[data-rank]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.rank === rank)));
}
function screenText(s) {
  const sc = s.screen;
  if (!sc) return '<span class="screen-badge">\u89C4\u5219\u5F85\u6838\u5B9E</span>';
  return `<span class="screen-badge ${sc.range === true ? "match" : ""}">R01 ${sc.range === true ? "\u7B26\u5408" : sc.range === false ? "\u4E0D\u7B26" : "\u5F85\u6838\u5B9E"}</span><span class="screen-badge ${sc.breakout === true ? "match" : ""}">R02 ${sc.breakout === true ? "\u786E\u8BA4" : sc.breakout === false ? "\u672A\u786E\u8BA4" : "\u5F85\u6838\u5B9E"}</span>`;
}
function quoteDate(s) {
  if (isUS) return esc(s.quote?.at || "\u6682\u672A\u53D6\u5F97");
  return s.quote?.at ? esc(s.quote.at.replace("T", " ").slice(0, 19)) + (isHK ? " \u9999\u6E2F\u65F6\u95F4" : " \u5317\u4EAC\u65F6\u95F4") : "\u6682\u672A\u53D6\u5F97";
}
function rankNote() {
  if (isHK) return { scale: `\u5E02\u503C\u7EDF\u4E00\u4E3A\u6E2F\u5E01\uFF1B\u8425\u6536\u3001\u5229\u6DA6\u91D1\u989D\u699C\u4EC5\u6BD4\u8F83${currencyName(financeCurrency)}\u62A5\u8868\uFF0C\u4E0D\u4F5C\u9690\u542B\u6C47\u7387\u6362\u7B97\u3002\u8D22\u52A1\u91C7\u7528\u6700\u65B0TTM\uFF0C\u5404\u516C\u53F8\u622A\u6B62\u65E5\u5355\u72EC\u663E\u793A\u3002`, quality: `\u7ECF\u8425\u73B0\u91D1\u6D41\u91D1\u989D\u699C\u4EC5\u6BD4\u8F83${currencyName(financeCurrency)}\u62A5\u8868\uFF1BROE\u548C\u5229\u6DA6\u7387\u662F\u6BD4\u7387\uFF0C\u53EF\u8DE8\u62A5\u8868\u5E01\u79CD\u67E5\u770B\u3002ROE\u6309TTM\u5229\u6DA6\u4E0E\u671F\u521D\u671F\u672B\u5E73\u5747\u80A1\u4E1C\u6743\u76CA\u8BA1\u7B97\uFF0C\u91D1\u878D\u4E1A\u4E0D\u5957\u7528\u6BDB\u5229\u7387\u548C\u73B0\u91D1\u6D41\u699C\u3002`, growth: "\u91C7\u7528\u6700\u8FD1\u4E24\u4E2A\u5B8C\u6574\u8D22\u5E74\u7684\u8425\u6536\u548C\u51C0\u5229\u6DA6\u540C\u6BD4\uFF1B\u8981\u6C42\u540C\u5E01\u79CD\u3001\u5E74\u5EA6\u957F\u5EA6\u53EF\u6BD4\u3002\u4E8F\u635F\u6216\u96F6\u5229\u6DA6\u57FA\u671F\u4E0D\u8BA1\u7B97\u589E\u957F\u7387\u3002\u8FD9\u91CC\u7684\u6210\u957F\u6307\u6807\u6765\u81EA\u5E74\u5EA6\u62A5\u8868\uFF0C\u4E0D\u4E0ETTM\u6DF7\u7B97\u3002", strength: `\u622A\u81F3 ${data.asof} \u7684\u6E2F\u5E01\u80A1\u606F\u4E0E\u62C6\u80A1\u8C03\u6574\u6536\u76D8\u5E8F\u5217\uFF0C\u6309\u9999\u6E2F\u4EA4\u6613\u65E5\u5386\u9A8C\u8BC1\u3002\u53C2\u8003\u7EC4\u5408\u4EC5\u5305\u542B\u5B8C\u6574\u884C\u60C5\u540C\u884C\u3002` }[rank];
  if (isUS) return { scale: "\u91D1\u989D\u7EDF\u4E00\u4E3A\u7F8E\u5143\u3002\u8425\u6536\u3001\u51C0\u5229\u6DA6\u91C7\u7528\u6700\u65B0TTM\uFF08\u6700\u8FD1\u5341\u4E8C\u4E2A\u6708\uFF09\uFF1B\u516C\u53F8\u8D22\u5E74\u4E0D\u540C\uFF0C\u622A\u6B62\u65E5\u9010\u9879\u663E\u793A\u3002\u5E02\u503C\u4E3A\u8D44\u6599\u6293\u53D6\u65F6\u5FEB\u7167\uFF0C\u975E\u5386\u53F2\u6536\u76D8\u5E02\u503C\u3002", quality: "ROE\u4E3ATTM\u51C0\u5229\u6DA6\u9664\u4EE5\u671F\u521D\u3001\u671F\u672B\u80A1\u4E1C\u6743\u76CA\u5747\u503C\uFF0C\u4EC5\u5728\u4E24\u671F\u6743\u76CA\u5747\u4E3A\u6B63\u4E14\u65E5\u671F\u5339\u914D\u65F6\u8BA1\u7B97\u3002\u91D1\u878D\u884C\u4E1A\u4E0D\u5957\u7528\u6BDB\u5229\u7387\u548C\u7ECF\u8425\u73B0\u91D1\u6D41\u699C\u3002", growth: "\u6BD4\u8F83\u76F8\u9694350\u2014380\u5929\u7684\u4E24\u4E2ATTM\u533A\u95F4\uFF1B\u6CA1\u6709\u53EF\u6BD4\u57FA\u671F\u3001\u4E8F\u635F\u6216\u96F6\u5229\u6DA6\u65F6\u4E0D\u8BA1\u7B97\u5229\u6DA6\u589E\u957F\u7387\u3002", strength: `\u622A\u81F3 ${data.asof} \u7684\u7F8E\u5143\u8C03\u6574\u6536\u76D8\u4EF7\uFF0C\u89C2\u5BDF\u671F\u4E0D\u542B\u76D8\u524D\u76D8\u540E\uFF1B\u53C2\u8003\u7EC4\u5408\u4EC5\u5305\u542B\u5B8C\u6574\u884C\u60C5\u7684\u89C2\u5BDF\u6C60\u540C\u884C\u3002` }[rank];
  const notes = { scale: `\u8D22\u62A5\u7EDF\u4E00\u4F7F\u7528 ${data.financialPeriod} \u62A5\u544A\u671F\uFF1B\u91D1\u989D\u4E3A\u4EBA\u6C11\u5E01\u3002\u603B\u5E02\u503C\u4F7F\u7528\u5404\u516C\u53F8\u6700\u65B0\u62A5\u4EF7\u5FEB\u7167\uFF0C\u65E5\u671F\u5355\u72EC\u6807\u660E\u3002`, quality: `\u7EDF\u4E00\u62A5\u544A\u671F ${data.financialPeriod}\uFF1B\u51C0\u8D44\u4EA7\u6536\u76CA\u7387\u4E3A\u62A5\u544A\u671F\u6570\u503C\uFF0C\u672A\u5E74\u5316\u3002\u8D1F\u51C0\u8D44\u4EA7\u4E0D\u53C2\u4E0E\u51C0\u8D44\u4EA7\u6536\u76CA\u7387\u6392\u540D\u3002${/银行|非银金融|^金融$/.test(data.sector) ? "\u91D1\u878D\u4E1A\u53EA\u63D0\u4F9B\u51C0\u8D44\u4EA7\u6536\u76CA\u7387\u699C\uFF0C\u5176\u4ED6\u901A\u7528\u884C\u4E1A\u6307\u6807\u4E0D\u5957\u7528\u3002" : "\u5404\u9879\u6307\u6807\u5206\u522B\u6392\u5E8F\uFF1B\u7ECF\u8425\u73B0\u91D1\u6D41\u91D1\u989D\u672C\u8EAB\u4E5F\u53D7\u516C\u53F8\u89C4\u6A21\u5F71\u54CD\u3002"}`, growth: `\u6BD4\u8F83 ${data.financialPeriod} \u4E0E ${data.previousPeriod} \u540C\u671F\u6570\u636E\uFF1B\u4E8F\u635F\u6216\u96F6\u5229\u6DA6\u4E0D\u76F4\u63A5\u8BA1\u7B97\u5229\u6DA6\u589E\u957F\u7387\uFF0C\u4F4E\u57FA\u6570\u5355\u72EC\u6807\u6CE8\u3002`, strength: `\u4F7F\u7528\u622A\u81F3 ${data.asof} \u7684\u524D\u590D\u6743\u6536\u76D8\u4EF7\uFF1B\u4E0E\u672C\u677F\u5757\u6570\u636E\u5B8C\u6574\u516C\u53F8\u7684\u7B49\u6743\u53C2\u8003\u7EC4\u5408\u6BD4\u8F83\u3002\u6700\u5927\u56DE\u64A4\u8D8A\u5C0F\u8D8A\u9760\u524D\uFF1B\u6700\u65B0\u6362\u624B\u7387\u662F\u62A5\u4EF7\u65F6\u70B9\u6570\u636E\uFF0C\u4E0D\u662F\u6574\u4E2A\u89C2\u5BDF\u671F\u7684\u6362\u624B\u7387\u3002` };
  return notes[rank];
}
function renderRank() {
  const sorted = isHK ? currencyRankRows(analysis.rows, metric, financeCurrency) : rankRows(analysis.rows, metric), valid = sorted.filter((s) => s.rank !== null).length;
  $("metricHeading").textContent = metricLabel(metric);
  $("rankNote").textContent = rankNote();
  $("coverage").textContent = `\u672C\u884C\u4E1A\u6536\u5F55 ${data.stocks.length} ${isForeign ? "\u53EA\u8BC1\u5238" : "\u5BB6\u516C\u53F8"} \xB7 \u5F53\u524D\u6307\u6807 ${valid} \u9879\u6709\u53EF\u6BD4\u6570\u636E`;
  $("ranking").innerHTML = sorted.map((s) => `<tr><td><input type="checkbox" data-select="${s.code}" aria-label="\u9009\u62E9${esc(s.name)}\u52A0\u5165\u5BF9\u6BD4" ${selected.includes(s.code) ? "checked" : ""}></td><td><div class="rank-company"><span class="rank-no">${s.rank ?? "\u2014"}</span><div><b>${esc(s.name)}</b>${researchButtons(researchStock(s))}<span class="subtle">${s.code}${!isForeign && /ST|退/.test(s.name) ? " \xB7 \u540D\u79F0\u542B\u98CE\u9669\u6807\u8BB0" : ""}</span></div></div></td><td><span class="metric-value">${metricValue(metric, s.metrics[metric], s)}</span><span class="subtle">${s.currencyExcluded ? esc(s.finance ? currencyName(s.finance.currency) + "\u62A5\u8868\uFF0C\u4E0D\u53C2\u4E0E\u5F53\u524D\u91D1\u989D\u699C" : s.financeNote || "\u62A5\u8868\u8D44\u6599\u672A\u53D6\u5F97") : isHK && ["revenueGrowth", "profitGrowth"].includes(metric) ? s.annual?.length >= 2 ? `${s.annual[1].period} \u2192 ${s.annual[0].period}` : "\u5E74\u5EA6\u57FA\u671F\u4E0D\u8DB3" : ["marketCap", "turnover"].includes(metric) ? quoteDate(s) : ["change", "excess", "drawdown"].includes(metric) ? s.price.known ? `${s.price.start}\u2014${s.price.end}` : esc(s.price.reason) : s.finance ? isForeign ? `TTM \u622A\u6B62 ${s.finance.period}` : `${s.finance.period} \xB7 \u516C\u544A ${s.finance.published}` : esc(s.financeNote || "\u540C\u62A5\u544A\u671F\u6570\u636E\u7F3A\u5931")}${metric === "profitGrowth" && s.metrics.profitNote ? "<br>" + esc(s.metrics.profitNote) : ""}</span></td><td>${screenText(s)}</td></tr>`).join("");
  $("ranking").querySelectorAll("[data-select]").forEach((el) => el.onchange = () => toggle(el.dataset.select, el.checked));
}
function toggle(code, checked) {
  if (checked && !selected.includes(code)) {
    if (selected.length >= 5) {
      $("trayMessage").textContent = "\u6700\u591A\u6BD4\u8F835\u5BB6\uFF0C\u8BF7\u5148\u79FB\u9664\u4E00\u5BB6\u3002";
      const cb = $("ranking").querySelector(`[data-select="${code}"]`);
      if (cb) cb.checked = false;
      return;
    }
    selected.push(code);
    const item = data.stocks.find((s) => s.code === code);
    if (item) visit(researchStock(item));
  } else if (!checked) selected = selected.filter((c) => c !== code);
  updateURL();
  renderRank();
  renderComparison();
  if (checked && !historyBusy && data.stocks.some((s) => s.code === code && needsLoad(s))) loadHistories([code]);
}
function renderChart(chosen) {
  const eligible = chosen.filter((s) => s.price.known);
  $("chartInspector").hidden = true;
  chartSeries = [];
  chartDates = [];
  if (chosen.length < 2) {
    $("chart").innerHTML = '<p class="chart-empty">\u4ECE\u4E0A\u65B9\u5217\u8868\u9009\u62E9 2\u20145 \u5BB6\u540C\u884C\uFF0C\u67E5\u770B\u540C\u8D77\u70B9\u8D70\u52BF\u4E0E\u7ECF\u8425\u6570\u636E\u3002</p>';
    return;
  }
  if (eligible.length < 2) {
    $("chart").innerHTML = '<p class="chart-empty">\u6240\u9009\u80A1\u7968\u4E2D\u4E0D\u8DB3\u4E24\u5BB6\u5177\u5907\u672C\u89C2\u5BDF\u671F\u7684\u5B8C\u6574\u884C\u60C5\u3002\u53EF\u4EE5\u7F29\u77ED\u671F\u95F4\uFF0C\u6216\u9009\u62E9\u5176\u4ED6\u540C\u884C\uFF1B\u8D22\u52A1\u6570\u636E\u4ECD\u53EF\u5728\u4E0B\u65B9\u6BD4\u8F83\u3002</p>';
    return;
  }
  chartSeries = eligible.map((s) => ({ name: s.name, color: colors[selected.indexOf(s.code)], points: s.price.points }));
  if (analysis.benchmark) chartSeries.push({ name: `\u540C\u884C\u7B49\u6743\u53C2\u8003\uFF08${analysis.benchmark.count}\u5BB6\uFF09`, color: "#71847a", points: analysis.benchmark.points, benchmark: true });
  chartDates = chartSeries[0].points.map((p) => p[0]);
  const values = chartSeries.flatMap((s) => s.points.map((p) => (p[1] - 1) * 100)), lo = Math.min(0, ...values), hi = Math.max(0, ...values), pad = Math.max((hi - lo) * 0.1, 1), low = lo - pad, high = hi + pad;
  const x = (i) => 65 + i / (chartDates.length - 1) * 805, y = (v) => 265 - (v - low) / (high - low) * 235;
  const grid = Array.from({ length: 5 }, (_, i) => {
    const v = low + (high - low) * i / 4;
    return `<line x1="65" x2="870" y1="${y(v)}" y2="${y(v)}" stroke="#e4ece5"/><text x="55" y="${y(v) + 4}" text-anchor="end">${v.toFixed(1)}%</text>`;
  }).join("");
  const labels = [0, Math.floor((chartDates.length - 1) / 2), chartDates.length - 1].map((i, n) => `<text x="${x(i)}" y="295" text-anchor="${n === 0 ? "start" : n === 2 ? "end" : "middle"}">${chartDates[i]}</text>`).join("");
  $("chart").innerHTML = `<svg viewBox="0 0 900 315" role="img" aria-label="\u6240\u9009\u80A1\u7968\u4E0E\u540C\u884C\u7B49\u6743\u53C2\u8003\u7684\u540C\u8D77\u70B9\u6DA8\u8DCC\u5E45"><title>\u7EDF\u4E00\u8D77\u70B9 ${chartDates[0]}\uFF0C\u622A\u6B62 ${data.asof}\uFF0C\u8D77\u70B9\u5747\u4E3A0%</title>${grid}<line x1="65" x2="870" y1="${y(0)}" y2="${y(0)}" stroke="#adc4b5" stroke-dasharray="4 4"/>${chartSeries.map((s) => `<polyline fill="none" stroke="${s.color}" stroke-width="${s.benchmark ? 2 : 2.6}" ${s.benchmark ? 'stroke-dasharray="6 5"' : ""} points="${s.points.map((p, i) => `${x(i).toFixed(1)},${y((p[1] - 1) * 100).toFixed(1)}`).join(" ")}"/>`).join("")}${labels}</svg>`;
  $("chartDay").max = chartDates.length - 1;
  $("chartDay").value = chartDates.length - 1;
  $("chartInspector").hidden = false;
  inspectChart();
}
function inspectChart() {
  const i = Math.max(0, Math.min(chartDates.length - 1, Number($("chartDay").value)));
  if (!chartDates.length) return;
  $("chartDate").textContent = chartDates[i];
  $("chartValues").innerHTML = chartSeries.map((s) => `<span><i class="dot" style="background:${s.color}"></i>${esc(s.name)} <b>${percent(s.points[i][1] - 1)}</b></span>`).join("");
}
function companyLinks(s) {
  if (isHK) return `<a href="https://emweb.securities.eastmoney.com/PC_HKF10/pages/home/index.html?code=${s.code}&type=web&color=w" target="_blank" rel="noopener noreferrer">\u516C\u53F8\u8D44\u6599</a> \xB7 <a href="https://finance.yahoo.com/quote/${s.symbol}/financials/" target="_blank" rel="noopener noreferrer">\u8D22\u52A1\u4E0E\u8D70\u52BF</a> \xB7 <a href="https://gu.qq.com/hk${s.code}" target="_blank" rel="noopener noreferrer">\u5E02\u503C\u6765\u6E90</a>`;
  if (isUS) return `<a href="https://www.nasdaq.com/market-activity/stocks/${encodeURIComponent(s.code.toLowerCase().replaceAll("-", "."))}" target="_blank" rel="noopener noreferrer">\u516C\u53F8\u4E0E\u5E02\u503C\u6765\u6E90</a> \xB7 <a href="https://finance.yahoo.com/quote/${encodeURIComponent(s.code)}/financials/" target="_blank" rel="noopener noreferrer">\u8D22\u52A1\u4E0E\u884C\u60C5\u6765\u6E90</a>`;
  return `<a href="https://emweb.securities.eastmoney.com/PC_HSF10/CompanySurvey/Index?type=web&code=${s.symbol}" target="_blank" rel="noopener noreferrer">\u516C\u53F8\u8D44\u6599</a> \xB7 <a href="https://data.eastmoney.com/bbsj/${s.code}.html" target="_blank" rel="noopener noreferrer">\u8D22\u52A1\u6765\u6E90</a> \xB7 <a href="https://finance.sina.com.cn/realstock/company/${s.symbol}/nc.shtml" target="_blank" rel="noopener noreferrer">\u884C\u60C5</a>`;
}
function renderComparison() {
  setQueue(researchMarket + ":" + data.id, selected.map((c) => data.stocks.find((s) => s.code === c)).filter(Boolean).map(researchStock), days);
  document.dispatchEvent(new CustomEvent("research:context", { detail: { group: researchMarket + ":" + data.id } }));
  const chosen = selected.map((c) => analysis.rows.find((s) => s.code === c)).filter(Boolean);
  $("selection").innerHTML = chosen.map((s, i) => `<button data-remove="${s.code}" aria-label="\u79FB\u9664${esc(s.name)}"><i class="dot" style="background:${colors[i]}"></i>${esc(s.name)} <span>${s.code} \xD7</span></button>`).join("");
  $("selection").querySelectorAll("[data-remove]").forEach((b2) => b2.onclick = () => toggle(b2.dataset.remove, false));
  $("tray").hidden = chosen.length === 0;
  $("trayCount").textContent = `\u5DF2\u9009 ${chosen.length} / 5 \u5BB6\u540C\u884C`;
  $("trayMessage").textContent = chosen.length < 2 ? "\u518D\u9009\u62E9\u4E00\u5BB6\u5373\u53EF\u6BD4\u8F83\u3002" : "\u540C\u4E00\u7EC6\u5206\u884C\u4E1A \xB7 \u53EF\u7EE7\u7EED\u589E\u51CF\u9009\u62E9";
  $("goCompare").setAttribute("aria-disabled", String(chosen.length < 2));
  $("clear").disabled = !chosen.length;
  const b = analysis.benchmark, missing = chosen.filter((s) => !s.price.known);
  $("comparisonNote").textContent = `\u6700\u8FD1${days}\u81EA\u7136\u65E5\uFF0C\u56FE\u4E2D\u80A1\u7968\u4F7F\u7528\u540C\u4E00\u4EA4\u6613\u65E5\u8D77\u70B9\u3002${b ? `\u865A\u7EBF\u4E3A\u672C\u884C\u4E1A ${b.count}/${b.total} \u5BB6\u884C\u60C5\u5B8C\u6574\u516C\u53F8\u7684\u671F\u521D\u7B49\u6743\u53C2\u8003\u7EC4\u5408\uFF0C\u975E\u5B98\u65B9\u884C\u4E1A\u6307\u6570\uFF1B${b.start} \u81F3 ${b.end}\uFF0C\u671F\u95F4\u4E0D\u8C03\u4ED3\u3002` : data.historyPending ? "\u884C\u4E1A\u884C\u60C5\u5C1A\u672A\u5168\u90E8\u5C1D\u8BD5\u8F7D\u5165\uFF0C\u6682\u4E0D\u8BA1\u7B97\u540C\u884C\u53C2\u8003\u7EBF\u6216\u8D85\u989D\u8868\u73B0\uFF1B\u53EF\u70B9\u51FB\u201C\u52A0\u8F7D\u672C\u884C\u4E1A\u8D70\u52BF\u201D\u3002" : "\u5B8C\u6574\u884C\u60C5\u516C\u53F8\u4E0D\u8DB3\u4E24\u5BB6\uFF0C\u6682\u4E0D\u751F\u6210\u540C\u884C\u53C2\u8003\u7EBF\u3002"}${missing.length ? " \u6240\u9009 " + missing.map((s) => s.name).join("\u3001") + " \u884C\u60C5\u4E0D\u5B8C\u6574\uFF0C\u6682\u4E0D\u7ED8\u56FE\u3002" : ""}`;
  renderChart(chosen);
  if (chosen.length < 2) {
    $("comparisonTable").innerHTML = "";
    return;
  }
  const metricRow = (label, key, note = "") => [label, (s) => `<span class="number">${metricValue(key, s.metrics[key], s)}</span>${note ? '<span class="subtle">' + note + "</span>" : ""}`];
  const rows = [
    ["\u4E3B\u8425\u4E1A\u52A1", (s) => `${esc(s.business || (isUS ? "\u4E2D\u6587\u7B80\u4ECB\u5F85\u8865\u5145" : "\u6682\u672A\u53D6\u5F97"))}${isForeign ? `<span class="subtle">${esc(s.englishName)}</span>${s.businessEnglish ? `<p>\u516C\u53F8\u8BF4\u660E\uFF08\u82F1\u6587\u8282\u9009\uFF09\uFF1A${esc(s.businessEnglish)}</p>` : ""}` : `<span class="subtle">\u4EA7\u54C1\uFF1A${esc(s.products || "\u6682\u672A\u53D6\u5F97")}</span>`}`],
    [isUS ? "\u884C\u4E1A" : "\u884C\u4E1A / \u4E0A\u5E02\u65E5\u671F", (s) => `${esc(data.sector)} / ${esc(data.name)}<span class="subtle">${s.listed || ""}</span>`],
    [isForeign ? "\u8D22\u52A1\u622A\u6B62\u65E5 / \u53E3\u5F84" : "\u7EDF\u4E00\u8D22\u62A5\u671F / \u516C\u544A\u65E5\u671F", (s) => s.finance ? isForeign ? `${isHK ? currencyName(s.finance.currency) + " \xB7 " : ""}TTM \u622A\u6B62 ${s.finance.period}<span class="subtle">\u6293\u53D6 ${s.checkedAt?.slice(0, 10) || data.profileAsOf}\uFF1B\u6765\u6E90\u672A\u63D0\u4F9B\u516C\u544A\u65E5\u671F</span>` : `${s.finance.period}<span class="subtle">\u516C\u544A ${s.finance.published}</span>` : esc(s.financeNote || "\u8D22\u52A1\u8D44\u6599\u5F85\u53D6\u5F97")],
    metricRow(isHK ? "\u5E02\u503C\uFF08\u6E2F\u5E01\uFF0C\u6765\u6E90\u53E3\u5F84\uFF09" : "\u603B\u5E02\u503C", "marketCap"),
    [isForeign ? "\u5E02\u503C\u8D44\u6599\u65E5\u671F" : "\u5E02\u503C / \u6362\u624B\u7387\u62A5\u4EF7\u65F6\u70B9", quoteDate],
    metricRow("\u8425\u4E1A\u6536\u5165", "revenue"),
    metricRow(isForeign ? "\u51C0\u5229\u6DA6\uFF08TTM\uFF09" : "\u5F52\u6BCD\u51C0\u5229\u6DA6", "profit"),
    metricRow(isForeign ? "\u51C0\u8D44\u4EA7\u6536\u76CA\u7387\uFF08TTM\uFF09" : "\u52A0\u6743\u51C0\u8D44\u4EA7\u6536\u76CA\u7387", "roe", isForeign ? "TTM\u51C0\u5229\u6DA6 / \u5E73\u5747\u80A1\u4E1C\u6743\u76CA" : "\u62A5\u544A\u671F\u503C\uFF0C\u672A\u5E74\u5316\uFF1B\u8D1F\u51C0\u8D44\u4EA7\u4E0D\u6392\u540D"),
    metricRow("\u9500\u552E\u6BDB\u5229\u7387", "grossMargin"),
    metricRow(isForeign ? "\u51C0\u5229\u6DA6 / \u8425\u6536\uFF08TTM\uFF09" : "\u5F52\u6BCD\u51C0\u5229\u6DA6 / \u8425\u6536", "netMargin"),
    metricRow("\u7ECF\u8425\u73B0\u91D1\u6D41\u51C0\u989D", "cashflow"),
    metricRow(isHK ? "\u8425\u6536\u540C\u6BD4\uFF08\u6700\u8FD1\u8D22\u5E74\uFF09" : "\u8425\u6536\u540C\u6BD4\u589E\u957F", "revenueGrowth"),
    [isHK ? "\u51C0\u5229\u6DA6\u540C\u6BD4\uFF08\u6700\u8FD1\u8D22\u5E74\uFF09" : "\u5229\u6DA6\u540C\u6BD4\u589E\u957F", (s) => `<span class="number">${metricValue("profitGrowth", s.metrics.profitGrowth, s)}</span><span class="subtle">${esc(s.metrics.profitNote)}</span>`],
    ["\u8FD1\u4E09\u5E74\u5E74\u5EA6\u6570\u636E", (s) => `<details><summary>\u5C55\u5F00\u5E74\u5EA6\u8425\u6536\u4E0E\u5229\u6DA6</summary>${s.annual.length ? s.annual.map((a, i) => `<p>${isForeign ? a?.period || "\u672A\u53D6\u5F97" : data.annualYears[i]} ${isForeign ? "\u8D22\u5E74\u622A\u6B62" : "\u5E74"}\uFF1A${a ? `\u8425\u6536 ${money(a.revenue, isHK ? a.currency : void 0)} / \u5229\u6DA6 ${money(a.profit, isHK ? a.currency : void 0)}${a.published ? "<br>\u516C\u544A " + a.published : ""}` : "\u6570\u636E\u7F3A\u5931"}</p>`).join("") : "<p>\u5E74\u5EA6\u8D44\u6599\u6682\u672A\u53D6\u5F97</p>"}</details>`],
    metricRow("\u533A\u95F4\u6DA8\u8DCC\u5E45", "change"),
    metricRow("\u8D85\u8D8A\u540C\u884C\u53C2\u8003", "excess"),
    metricRow("\u533A\u95F4\u6700\u5927\u56DE\u64A4", "drawdown"),
    ...isForeign ? [] : [metricRow("\u6700\u65B0\u6362\u624B\u7387", "turnover")],
    ["\u8D70\u52BF\u53EF\u6BD4\u6027", (s) => s.price.known ? `${s.price.start}\u2014${s.price.end}` : esc(s.price.reason)],
    ["\u6A2A\u76D8 / \u7A81\u7834", screenText],
    ["\u8D44\u6599\u6765\u6E90", companyLinks]
  ];
  $("comparisonTable").innerHTML = `<table class="compare-table" style="min-width:${155 + chosen.length * 225}px"><thead><tr><th>\u6BD4\u8F83\u9879\u76EE</th>${chosen.map((s, i) => `<th><i class="dot" style="background:${colors[i]}"></i> ${esc(s.name)}<span class="subtle">${s.code}</span></th>`).join("")}</tr></thead><tbody>${rows.map(([label, fn]) => `<tr><th scope="row">${label}</th>${chosen.map((s) => `<td>${fn(s)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
function render() {
  if (isHK) {
    const currencies = [.../* @__PURE__ */ new Set(["CNY", "HKD", "USD", financeCurrency, ...data.stocks.map((s) => s.finance?.currency).filter((c) => /^[A-Z]{3}$/.test(c || ""))])];
    $("financeCurrency").innerHTML = currencies.map((c) => `<option value="${c}">${currencyName(c)} ${c}</option>`).join("");
    $("financeCurrency").value = financeCurrency;
  }
  data.historyPending = data.stocks.some((s) => !s.points?.length && !s.historyAttempted);
  analysis = analyzeIndustry(data, days);
  setMetricOptions();
  $("content").hidden = false;
  $("loadError").hidden = true;
  $("industryTitle").textContent = `${data.name} \xB7 \u540C\u884C\u6392\u884C\u699C`;
  $("status").textContent = isHK ? `\u6E2F\u4EA4\u6240\u6E2F\u5E01\u666E\u901A\u80A1 ${catalog.total} \u53EA \xB7 \u884C\u60C5\u622A\u6B62 ${data.asof} \xB7 \u540D\u5355 ${data.universeAsOf} \xB7 ${catalog.industries.length - catalog.unclassified} \u4E2A\u5DF2\u5206\u7C7B\u884C\u4E1A / ${catalog.unclassified} \u53EA\u884C\u4E1A\u5F85\u6838\u5B9E` : isUS ? `\u7F8E\u80A1\u89C2\u5BDF\u6C60 ${catalog.total} \u53EA\u8BC1\u5238 / ${catalog.industries.length} \u4E2A\u884C\u4E1A\u7EC4 \xB7 \u975E\u5168\u7F8E\u80A1 \xB7 \u884C\u60C5\u622A\u6B62 ${data.asof} \xB7 \u8D44\u6599\u6838\u5BF9 ${data.profileAsOf}` : `\u6CAA\u6DF1A\u80A1\u5171 ${catalog.total} \u5BB6 / ${catalog.industries.length} \u4E2A\u884C\u4E1A\u7EC4 \xB7 \u884C\u60C5\u622A\u6B62 ${data.asof} \xB7 \u8D22\u62A5 ${data.financialPeriod} \xB7 \u884C\u4E1A\u8D44\u6599\u6838\u5BF9 ${data.profileAsOf}${data.dailyAsOf && data.asof < data.dailyAsOf ? " \xB7 \u540C\u884C\u884C\u60C5\u5FEB\u7167\u6EDE\u540E\uFF0C\u4FDD\u7559\u771F\u5B9E\u65E5\u671F" : ""}`;
  $("methodology").innerHTML = `<p>\u8303\u56F4\uFF1A\u622A\u81F3\u540D\u5355\u6838\u5BF9\u65E5\u7684\u5728\u5E02\u6CAA\u6DF1A\u80A1\uFF0C\u5E76\u8981\u6C42\u4E0A\u5E02\u65E5\u671F\u4E0D\u665A\u4E8E\u884C\u60C5\u622A\u6B62\u65E5\uFF1B\u4E0D\u542B\u5317\u4EA4\u6240\u3001B\u80A1\u548C\u9000\u5E02\u80A1\u7968\u3002\u4F7F\u7528${esc(data.classification)}\u3002\u4E0D\u540C\u5382\u5546\u5206\u7C7B\u53EF\u80FD\u4E0D\u540C\uFF1B\u201C\u672A\u5206\u7C7B\u201D\u7EC4\u4EC5\u4F9B\u67E5\u627E\uFF0C\u4E0D\u4EE3\u8868\u540C\u884C\u3002</p><p>\u8D22\u62A5\u7EDF\u4E00\u4E3A ${data.financialPeriod}\uFF0C\u53EA\u4F7F\u7528\u4E0D\u665A\u4E8E\u884C\u60C5\u622A\u6B62\u65E5\u5DF2\u516C\u544A\u7684\u6570\u636E\uFF1B\u540C\u6BD4\u57FA\u671F\u4E3A ${data.previousPeriod}\u3002\u4E09\u5E74\u5E74\u5EA6\u6570\u636E\u6765\u81EA\u5DF2\u5B8C\u6210\u62AB\u9732\u7684\u5E74\u5EA6\u3002\u5355\u4F4D\u4E3A\u4EBA\u6C11\u5E01\uFF1B\u7F3A\u5931\u6570\u636E\u7528\u201C\u2014\u201D\u8868\u793A\uFF0C\u4E0D\u5F53\u4F5C\u96F6\u53C2\u4E0E\u6392\u540D\u3002\u8D22\u62A5\u6570\u636E\u53EF\u80FD\u5305\u542B\u540E\u7EED\u66F4\u6B63\uFF0C\u672C\u9875\u7528\u4E8E\u5F53\u524D\u540C\u884C\u7814\u7A76\uFF0C\u4E0D\u7528\u4E8E\u8FD8\u539F\u5386\u53F2\u65F6\u70B9\u3002</p><p>\u884C\u60C5\u91C7\u7528${esc(data.priceBasis)}\uFF0C\u89C2\u5BDF\u671F\u95F4\u4F7F\u7528\u81EA\u7136\u65E5\uFF0C\u5468\u672B\u548C\u8282\u5047\u65E5\u4E0D\u8865\u70B9\u3002\u6BCF\u5BB6\u516C\u53F8\u987B\u5177\u5907\u5171\u540C\u4EA4\u6613\u65E5\u5386\u4E0A\u7684\u5B8C\u6574\u884C\u60C5\uFF1B\u65B0\u4E0A\u5E02\u3001\u505C\u724C\u6216\u7F3A\u5931\u8BB0\u5F55\u53EF\u80FD\u4E0D\u53C2\u4E0E\u8D70\u52BF\u6BD4\u8F83\u3002\u540C\u884C\u53C2\u8003\u91C7\u7528\u5B8C\u6574\u6837\u672C\u671F\u521D\u7B49\u6743\u6301\u6709\uFF0C\u6837\u672C\u5728\u89C2\u5BDF\u671F\u5185\u56FA\u5B9A\uFF0C\u975E\u5B98\u65B9\u884C\u4E1A\u6307\u6570\u3002\u540D\u6B21\u53EA\u5728\u672C\u9875\u5DF2\u6536\u5F55\u4E14\u6709\u53EF\u6BD4\u6570\u636E\u7684\u516C\u53F8\u4E2D\u8BA1\u7B97\uFF0C\u76F8\u540C\u6570\u503C\u5E76\u5217\u3002</p><p>\u5E02\u503C\u548C\u6700\u65B0\u6362\u624B\u7387\u6765\u81EA\u6709\u65F6\u95F4\u6233\u7684\u62A5\u4EF7\uFF0C\u53EF\u80FD\u662F\u76D8\u4E2D\u503C\uFF0C\u4E0D\u4E0E\u5386\u53F2\u6536\u76D8\u65E5\u671F\u6DF7\u6DC6\u3002\u51C0\u8D44\u4EA7\u6536\u76CA\u7387\u672A\u5E74\u5316\uFF1B\u201C\u5F52\u6BCD\u51C0\u5229\u6DA6 / \u8425\u6536\u201D\u6309\u8BE5\u660E\u786E\u53E3\u5F84\u8BA1\u7B97\uFF0C\u4E0D\u7B49\u4E8E\u4F01\u4E1A\u62AB\u9732\u7684\u6240\u6709\u51C0\u5229\u7387\u53E3\u5F84\u3002\u94F6\u884C\u4E0E\u975E\u94F6\u91D1\u878D\u4E0D\u5957\u7528\u6BDB\u5229\u7387\u3001\u901A\u7528\u51C0\u5229\u7387\u53CA\u7ECF\u8425\u73B0\u91D1\u6D41\u6392\u540D\u3002\u5229\u6DA6\u589E\u957F\u4EC5\u5728\u672C\u671F\u4E0E\u4E0A\u671F\u5747\u4E3A\u6B63\u65F6\u8BA1\u7B97\uFF0C\u4E0A\u671F\u5229\u6DA6\u4E0D\u8DB31000\u4E07\u5143\u63D0\u793A\u4F4E\u57FA\u6570\u3002</p><p>R01\u3001R02\u91C7\u7528\u9996\u9875\u76F8\u540C\u7684\u7B5B\u9009\u53E3\u5F84\uFF0C\u5B8C\u6574\u89C4\u5219\u767B\u5F55\u540E\u53EF\u89C1\uFF1B\u884C\u60C5\u6765\u6E90\u53CA\u590D\u6743\u5904\u7406\u53EF\u80FD\u9020\u6210\u4E0E\u9996\u9875\u7684\u7EC6\u5FAE\u5DEE\u5F02\uFF0C\u72EC\u7ACB\u4E8E\u5F53\u524D\u8D70\u52BF\u671F\u95F4\uFF1B\u4E0D\u53C2\u4E0E\u540C\u884C\u540D\u5355\u7B5B\u9009\u3002\u8FD9\u91CC\u5206\u522B\u6BD4\u8F83\u4E1A\u52A1\u89C4\u6A21\u3001\u7ECF\u8425\u8D28\u91CF\u3001\u6210\u957F\u4E0E\u884C\u60C5\uFF0C\u6CA1\u6709\u81EA\u52A8\u8BA4\u5B9A\u201C\u9F99\u5934\u201D\u6216\u7ED9\u51FA\u4E70\u5356\u6307\u4EE4\u3002</p><p>${data.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`).join(" \xB7 ")}</p>`;
  if (isUS) $("methodology").innerHTML = `<p>\u89C2\u5BDF\u6C60\u4E3ASPY\u80A1\u7968\u6301\u4ED3\u4E0E\u7EB3\u65AF\u8FBE\u514B100\u6210\u5206\u7684\u53BB\u91CD\u5408\u96C6\uFF0C\u5E76\u975E\u5168\u7F8E\u80A1\u3002\u6309\u7EB3\u65AF\u8FBE\u514B\u5B98\u65B9\u7EC6\u5206\u884C\u4E1A\u5206\u7EC4\uFF0C\u4E0D\u540C\u80A1\u7C7B\u4ECD\u53EF\u80FD\u5C5E\u4E8E\u540C\u4E00\u516C\u53F8\u3002\u672A\u5206\u7C7B\u8BC1\u5238\u4E0D\u81EA\u52A8\u89C6\u4E3A\u540C\u884C\u3002</p><p>\u8D22\u52A1\u91D1\u989D\u4EC5\u91C7\u7528\u6765\u6E90\u660E\u786E\u6807\u6CE8\u7684\u7F8E\u5143\u6570\u636E\u3002\u8425\u6536\u3001\u5229\u6DA6\u548C\u73B0\u91D1\u6D41\u4E3A\u6700\u65B0TTM\uFF0C\u5404\u5BB6\u516C\u53F8\u8D22\u5E74\u53CA\u622A\u6B62\u65E5\u4E0D\u540C\uFF1B\u540C\u6BD4\u4EC5\u4F7F\u7528\u76F8\u9694350\u2014380\u5929\u7684TTM\u57FA\u671F\u3002\u8D22\u62A5\u4EC5\u53CD\u6620\u8D44\u6599\u6293\u53D6\u65F6\u53EF\u89C1\u6570\u636E\uFF0C\u53EF\u80FD\u542B\u66F4\u6B63\uFF0C\u4E0D\u7528\u4E8E\u5386\u53F2\u65F6\u70B9\u56DE\u6D4B\uFF1B\u6765\u6E90\u672A\u63D0\u4F9B\u516C\u544A\u65E5\u671F\u3002\u975E\u7F8E\u5143\u62A5\u8868\u6216\u6570\u636E\u7F3A\u5931\u663E\u793A\u4E3A\u2014\uFF0C\u4E0D\u53C2\u4E0E\u6392\u540D\u3002</p><p>ROE\u4E3ATTM\u51C0\u5229\u6DA6\u9664\u4EE5\u671F\u521D\u671F\u672B\u80A1\u4E1C\u6743\u76CA\u5747\u503C\uFF0C\u4E24\u7AEF\u6743\u76CA\u987B\u4E3A\u6B63\u3002\u94F6\u884C\u4FDD\u9669\u7B49\u91D1\u878D\u884C\u4E1A\u4E0D\u5957\u7528\u6BDB\u5229\u7387\u548C\u901A\u7528\u73B0\u91D1\u6D41\u6392\u540D\u3002\u4E8F\u635F\u57FA\u671F\u4E0D\u8BA1\u7B97\u5229\u6DA6\u589E\u957F\u7387\u3002</p><p>\u80A1\u4EF7\u91C7\u7528Yahoo Finance\u80A1\u606F\u53CA\u62C6\u80A1\u8C03\u6574\u6536\u76D8\u5E8F\u5217\uFF0C\u7F8E\u5143\u8BA1\u4EF7\uFF0C\u4E0D\u542B\u4EBA\u6C11\u5E01\u6C47\u7387\u548C\u4EA4\u6613\u8D39\u300230\u300190\u3001180\u3001365\u5747\u4E3A\u81EA\u7136\u65E5\uFF1B\u4EE5\u7F8E\u56FD\u4EA4\u6613\u65E5\u5386\u9A8C\u8BC1\u5B8C\u6574\u6570\u636E\u3002\u53C2\u8003\u7EBF\u4E3A\u672C\u884C\u4E1A\u6709\u5B8C\u6574\u6570\u636E\u8BC1\u5238\u7684\u671F\u521D\u7B49\u6743\u7EC4\u5408\uFF0C\u975E\u5B98\u65B9\u6307\u6570\uFF0C\u4E5F\u975E\u516C\u53F8\u7B49\u6743\uFF1B\u540C\u516C\u53F8\u4E0D\u540C\u80A1\u7C7B\u53EF\u80FD\u91CD\u590D\u8BA1\u6743\u3002\u7F3A\u5931\u6216\u4E0A\u5E02\u4E0D\u8DB3\u7684\u8BC1\u5238\u4E0D\u8865\u9020\u5386\u53F2\u3002</p><p>R01\u3001R02\u6CBF\u7528\u9996\u9875\u540C\u4E00\u89C4\u5219\uFF0C\u5B8C\u6574\u8BF4\u660E\u767B\u5F55\u540E\u53EF\u89C1\u3002\u5E02\u503C\u6765\u81EA\u7EB3\u65AF\u8FBE\u514B\u5217\u8868\u5FEB\u7167\uFF0C\u4EC5\u80FD\u6838\u5BF9\u6293\u53D6\u65E5\u671F\uFF0C\u4E0D\u4EE3\u8868\u8D70\u52BF\u56FE\u622A\u6B62\u65E5\u5E02\u503C\u3002\u82F1\u6587\u516C\u53F8\u8BF4\u660E\u4E3A\u7EB3\u65AF\u8FBE\u514B\u516C\u5F00\u4ECB\u7ECD\u8282\u9009\u3002</p><p>${data.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`).join(" \xB7 ")}</p>`;
  if (isHK) $("methodology").innerHTML = `<p>\u6E2F\u4EA4\u6240${data.universeAsOf}\u5B98\u65B9\u540D\u5355\u4E2D\u7684\u6E2F\u5E01\u4E3B\u677F\u53CAGEM\u666E\u901A\u80A1\uFF0C\u6392\u9664ETF\u3001REIT\u3001\u6743\u8BC1\u3001\u725B\u718A\u8BC1\u3001\u4F18\u5148\u80A1\u548C\u4EBA\u6C11\u5E01\u4EA4\u6613\u67DC\u53F0\u3002\u5E76\u975E\u6240\u6709\u9999\u6E2F\u4E0A\u5E02\u4EA7\u54C1\uFF1B${data.unclassified}\u53EA\u884C\u4E1A\u8D44\u6599\u5C1A\u672A\u6838\u5B9E\uFF0C\u5206\u522B\u4FDD\u7559\u5728\u72EC\u7ACB\u5F85\u6838\u5B9E\u5206\u7EC4\uFF0C\u4E0D\u5F53\u4F5C\u540C\u4E1A\u3002\u884C\u4E1A\u53CA\u516C\u53F8\u4E1A\u52A1\u6765\u81EA\u4E1C\u65B9\u8D22\u5BCC\u8D44\u6599\uFF0C\u5E76\u4E0E\u5B98\u65B9\u8BC1\u5238\u4EE3\u7801\u53CAISIN\u4EA4\u53C9\u6838\u5BF9\u3002</p><p>\u8D70\u52BF\u6309\u9999\u6E2F\u4EA4\u6613\u65E5\u5386\uFF0C\u4F7F\u7528\u80A1\u606F\u4E0E\u62C6\u80A1\u8C03\u6574\u6536\u76D8\u5E8F\u5217\uFF0C\u4EE5\u6E2F\u5E01\u8BA1\u4EF7\u3002\u4EC5\u91C7\u7528\u5DF2\u6536\u76D8\u6570\u636E\uFF1B\u5468\u672B\u3001\u5047\u65E5\u4E0D\u8865\u70B9\u3002\u89C2\u5BDF\u671F\u95F4\u4E3A\u81EA\u7136\u65E5\uFF0C\u4E0A\u5E02\u4E0D\u8DB3\u6216\u7F3A\u5931\u4EA4\u6613\u65E5\u4E0D\u53C2\u4E0E\u5B8C\u6574\u533A\u95F4\u6BD4\u8F83\u3002\u540C\u884C\u53C2\u8003\u662F\u5DF2\u6536\u5F55\u5B8C\u6574\u6837\u672C\u671F\u521D\u7B49\u6743\u7EC4\u5408\uFF0C\u975E\u5B98\u65B9\u884C\u4E1A\u6307\u6570\u3002</p><p>\u8425\u6536\u3001\u5229\u6DA6\u3001\u7ECF\u8425\u73B0\u91D1\u6D41\u4E3A\u6700\u65B0TTM\uFF08\u6700\u8FD1\u5341\u4E8C\u4E2A\u6708\uFF09\uFF0C\u4FDD\u7559\u6765\u6E90\u660E\u786E\u6807\u6CE8\u7684\u62A5\u8868\u5E01\u79CD\uFF1B\u91D1\u989D\u699C\u901A\u8FC7\u4E0A\u65B9\u5E01\u79CD\u9009\u62E9\uFF0C\u53EA\u6BD4\u8F83\u540C\u5E01\u79CD\u91D1\u989D\u3002\u5E02\u503C\u4E3A\u884C\u60C5\u6E90\u63D0\u4F9B\u7684\u6E2F\u5E01\u53E3\u5F84\uFF0C\u4E0D\u6309\u62A5\u8868\u5E01\u79CD\u53D8\u52A8\u3002\u5BF9\u6BD4\u8868\u9010\u5217\u4FDD\u7559\u5404\u81EA\u5E01\u79CD\uFF0C\u4E0D\u9690\u542B\u6362\u6C47\u3002ROE\u3001\u5229\u6DA6\u7387\u3001\u540C\u6BD4\u662F\u6BD4\u7387\uFF1B\u91D1\u878D\u4E1A\u4E0D\u5957\u7528\u901A\u7528\u6BDB\u5229\u7387\u548C\u73B0\u91D1\u6D41\u6BD4\u8F83\u3002</p><p>\u6210\u957F\u699C\u4F7F\u7528\u6700\u8FD1\u4E24\u4E2A\u5B8C\u6574\u8D22\u5E74\u540C\u6BD4\uFF0C\u540C\u5E01\u79CD\u4E14\u5E74\u5EA6\u95F4\u9694350\u2014380\u5929\u624D\u8BA1\u7B97\uFF0C\u4E0D\u628A\u5E74\u62A5\u4E0ETTM\u6DF7\u7B97\u3002\u4E8F\u635F\u6216\u96F6\u5229\u6DA6\u57FA\u671F\u4E0D\u8BA1\u7B97\u5229\u6DA6\u589E\u957F\u7387\u3002ROE\u7528TTM\u51C0\u5229\u6DA6\u9664\u4EE5\u4E24\u7AEF\u6B63\u80A1\u4E1C\u6743\u76CA\u5747\u503C\uFF0C\u7F3A\u5931\u65F6\u4E0D\u63A8\u7B97\u3002\u8D22\u52A1\u6570\u636E\u53EF\u80FD\u542B\u540E\u7EED\u66F4\u6B63\uFF0C\u6765\u6E90\u4E0D\u63D0\u4F9B\u516C\u544A\u65F6\u523B\uFF0C\u672C\u9875\u7528\u4E8E\u5F53\u524D\u7814\u7A76\uFF0C\u4E0D\u7528\u4E8E\u5386\u53F2\u65F6\u70B9\u56DE\u6D4B\u3002</p><p>R01\u3001R02\u6CBF\u7528\u9996\u9875\u540C\u4E00\u89C4\u5219\uFF0C\u5B8C\u6574\u8BF4\u660E\u767B\u5F55\u540E\u53EF\u89C1\u3002${data.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a>`).join(" \xB7 ")}</p>`;
  renderRank();
  renderComparison();
  updateURL();
  historyProgress();
}
function historyProgress() {
  const complete = data.stocks.filter((s) => !needsLoad(s)).length, failed = data.stocks.filter((s) => needsLoad(s) && s.historyAttempted).length;
  $("historyProgress").textContent = ` ${isForeign ? "\u8D70\u52BF\u4E0E\u8D22\u52A1\u5DF2\u6838\u5BF9" : "\u884C\u60C5\u5DF2\u8F7D\u5165"} ${complete}/${data.stocks.length} \u5BB6${failed ? " \xB7 " + failed + "\u5BB6\u6682\u672A\u53D6\u5F97" : ""}${historyBusy ? " \xB7 \u6B63\u5728\u5206\u6279\u52A0\u8F7D\uFF0C\u671F\u95F4\u6392\u540D\u4EC5\u4F9B\u4E34\u65F6\u67E5\u770B" : ""}\u3002`;
  $("loadHistories").disabled = historyBusy;
  $("loadHistories").textContent = historyBusy ? "\u8D44\u6599\u52A0\u8F7D\u4E2D\u2026" : failed ? "\u91CD\u8BD5\u672A\u53D6\u5F97\u8D44\u6599" : complete === data.stocks.length ? "\u8D44\u6599\u5DF2\u6838\u5BF9" : isForeign ? "\u52A0\u8F7D\u884C\u4E1A\u8D70\u52BF\u4E0E\u8D22\u52A1" : "\u52A0\u8F7D\u672C\u884C\u4E1A\u8D70\u52BF";
  if (complete === data.stocks.length) $("loadHistories").disabled = true;
}
async function loadHistories(onlyCodes) {
  if (!data || historyBusy) return;
  const target = data, version = generation, queue = target.stocks.filter((s) => needsLoad(s) && (!onlyCodes || onlyCodes.includes(s.code)));
  if (!queue.length) return;
  historyBusy = true;
  historyAbort = new AbortController();
  const signal = historyAbort.signal;
  historyProgress();
  async function work() {
    while (queue.length && !signal.aborted) {
      const s = queue.shift();
      try {
        const r = await fetch(`${isHK ? "/api/peers/hk" : isUS ? "/api/peers/us" : "/api/peers/history"}?code=${encodeURIComponent(s.code)}&asof=${target.asof}`, { signal });
        const value = await r.json();
        if (!r.ok || value.code !== s.code || value.asof !== target.asof || !Array.isArray(value.points)) throw Error(value.error || "\u884C\u60C5\u8EAB\u4EFD\u5F02\u5E38");
        if (isForeign) {
          const saved = s.points;
          const previousFinance = { finance: s.finance, previous: s.previous, annual: s.annual, checkedAt: s.checkedAt };
          Object.assign(s, value);
          if (!value.points.length) s.points = saved;
          if (value.detailsErrors?.some((e) => e.startsWith("\u8D22\u52A1")) && previousFinance.finance) Object.assign(s, previousFinance);
          s.historyError = value.detailsErrors?.join("\uFF1B") || null;
        } else {
          s.points = value.points;
          s.historyError = null;
        }
        s.historySource = value.source;
        s.screen = value.screen || { range: null, breakout: null };
      } catch (e) {
        if (signal.aborted) return;
        s.historyError = e.message;
      }
      s.historyAttempted = true;
      if (version === generation) {
        render();
        historyProgress();
      }
    }
  }
  await Promise.all(isForeign ? [work()] : [work(), work()]);
  if (version === generation) {
    historyBusy = false;
    render();
    const waiting = selected.filter((code) => target.stocks.some((s) => s.code === code && needsLoad(s) && !s.historyAttempted));
    if (waiting.length) loadHistories(waiting);
  }
}
async function chooseIndustry(id, codes = null) {
  if (!catalog.industries.some((i) => i.id === id)) return;
  historyAbort?.abort();
  historyBusy = false;
  const request = ++generation;
  $("content").hidden = true;
  $("tray").hidden = true;
  $("loadError").hidden = true;
  $("industry").value = id;
  $("status").textContent = "\u6B63\u5728\u8BFB\u53D6\u8BE5\u884C\u4E1A\u7684\u516C\u53F8\u4E0E\u8D22\u52A1\u6570\u636E\u2026";
  data = null;
  try {
    let next = cache.get(id);
    if (!next) {
      next = await read(dataRoot + "/" + encodeURIComponent(id) + ".json");
      if (next.id !== id || next.asof !== catalog.asof || !Array.isArray(next.stocks)) throw Error("\u6570\u636E\u5FEB\u7167\u6B63\u5728\u66F4\u65B0\uFF0C\u8BF7\u91CD\u65B0\u52A0\u8F7D\u9875\u9762\u3002");
      cache.set(id, next);
    }
    if (request !== generation) return;
    data = next;
    const saved = readState().queues[researchMarket + ":" + id];
    selected = validSelection(codes ?? saved?.items.map((i) => i.code) ?? [], data.stocks);
    if (codes === null && saved) {
      days = saved.days;
      $("days").value = String(days);
    }
    if (codes?.length) {
      const item = data.stocks.find((s) => s.code === codes[0]);
      if (item) visit(researchStock(item));
    }
    render();
    if (data.stocks.length <= 30) loadHistories();
    else if (selected.length) loadHistories(selected);
  } catch (e) {
    if (request === generation) showError(e, () => chooseIndustry(id, codes));
  }
}
function search() {
  const q = $("search").value.trim().toLowerCase();
  if (!q || !catalog) {
    $("searchResults").hidden = true;
    return;
  }
  const results = catalog.stocks.filter((s) => s.code.toLowerCase().includes(normalizeCode(q).toLowerCase()) || s.symbol?.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.englishName?.toLowerCase().includes(q)).slice(0, 20);
  $("searchResults").innerHTML = results.length ? results.map((s) => `<button data-code="${s.code}">${esc(s.name)} \xB7 ${s.code}<small>${esc(catalog.industries.find((i) => i.id === s.industry)?.name || "\u672A\u5206\u7C7B")}</small></button>`).join("") : `<p>\u6CA1\u6709\u627E\u5230\u5DF2\u6536\u5F55\u7684${isHK ? "\u6E2F\u80A1" : isUS ? "\u7F8E\u80A1\u89C2\u5BDF\u6C60\u8BC1\u5238" : "\u6CAA\u6DF1A\u80A1"}\u3002</p>`;
  $("searchResults").hidden = false;
  $("searchResults").querySelectorAll("[data-code]").forEach((b) => b.onclick = () => {
    const stock = catalog.stocks.find((s) => s.code === b.dataset.code);
    $("search").value = stock.name + " " + stock.code;
    $("searchResults").hidden = true;
    chooseIndustry(stock.industry, [stock.code]);
  });
}
async function init() {
  try {
    catalog = await read(dataRoot + "/index.json");
    if (!catalog.stocks?.length || !catalog.industries?.length) throw Error("\u540C\u884C\u540D\u5355\u6682\u4E0D\u53EF\u7528");
    const industries = [...catalog.industries].sort((a, b) => (a.sector + a.name).localeCompare(b.sector + b.name, "zh-CN"));
    $("industry").innerHTML = industries.map((i) => `<option value="${esc(i.id)}">${esc(i.sector || "\u5176\u4ED6")} / ${esc(i.name)}\uFF08${i.count}\u5BB6\uFF09</option>`).join("");
    $("industry").disabled = false;
    const initial = (queries.get("codes") || queries.get("code") || "").split(",").filter(Boolean).map(normalizeCode), seed = catalog.stocks.find((s) => s.code === initial[0]);
    const requested = queries.get("industry"), defaultStock = catalog.stocks.find((s) => s.code === (isHK ? "00700" : isUS ? "NVDA" : "600519")) || catalog.stocks[0];
    const id = seed?.industry || (catalog.industries.some((i) => i.id === requested) ? requested : defaultStock.industry);
    await chooseIndustry(id, initial.length ? initial : null);
  } catch (e) {
    showError(e, init);
  }
}
$("search").oninput = search;
$("search").onkeydown = (e) => {
  if (e.key === "Escape") $("searchResults").hidden = true;
};
$("industry").onchange = () => {
  selected = [];
  chooseIndustry($("industry").value);
};
$("days").onchange = () => {
  days = Number($("days").value);
  if (data) render();
};
document.querySelectorAll("[data-rank]").forEach((b) => b.onclick = () => {
  rank = b.dataset.rank;
  if (data) {
    setMetricOptions();
    renderRank();
  }
});
$("metric").onchange = () => {
  metric = $("metric").value;
  renderRank();
};
$("clear").onclick = () => {
  selected = [];
  renderRank();
  renderComparison();
  updateURL();
};
$("chartDay").oninput = inspectChart;
$("goCompare").onclick = (e) => {
  if (selected.length < 2) {
    e.preventDefault();
    $("trayMessage").textContent = "\u8BF7\u518D\u9009\u62E9\u4E00\u5BB6\u540C\u884C\u3002";
  }
};
$("retry").onclick = () => retryAction?.();
init();
$("loadHistories").onclick = () => loadHistories();
