// compare-selection.mjs
var MAX_COMPARE = 4;
function validSelection(codes, hasCode) {
  if (!Array.isArray(codes)) return [];
  return [...new Set(codes.filter((c) => typeof c === "string" && /^\d{6}$/.test(c) && hasCode(c)))].slice(0, MAX_COMPARE);
}
function readComparisonLink(params, hasCode) {
  const codes = validSelection((params.get("codes") || params.get("code") || "").split(",").slice(0, 50), hasCode);
  const value = Number(params.get("days"));
  return { codes, days: [7, 15, 30, 180, 365].includes(value) ? value : 30 };
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

// compare-core.mjs
var sectors = [
  ["\u534A\u5BFC\u4F53 / \u82AF\u7247", "\u534A\u5BFC\u4F53|\u82AF\u7247"],
  ["\u533B\u836F", "\u533B\u836F|\u5236\u836F|\u751F\u7269\u79D1\u6280|\u751F\u7269\u533B"],
  ["\u533B\u7597", "\u533B\u7597|\u521B\u65B0\u836F"],
  ["\u4E2D\u836F", "\u4E2D\u836F"],
  ["\u65B0\u80FD\u6E90", "\u65B0\u80FD\u6E90|\u5149\u4F0F|\u98CE\u7535|\u50A8\u80FD|\u9502\u7535"],
  ["\u65B0\u80FD\u6E90\u6C7D\u8F66", "\u65B0\u80FD\u6E90\u8F66|\u65B0\u80FD\u6E90\u6C7D\u8F66|\u7535\u52A8\u8F66|\u667A\u80FD\u6C7D\u8F66"],
  ["\u5149\u4F0F", "\u5149\u4F0F"],
  ["\u94F6\u884C", "\u94F6\u884C"],
  ["\u8BC1\u5238", "\u8BC1\u5238|\u5238\u5546"],
  ["\u91D1\u878D", "\u91D1\u878D|\u4FDD\u9669"],
  ["\u767D\u9152", "\u767D\u9152"],
  ["\u6D88\u8D39", "\u6D88\u8D39|\u98DF\u54C1\u996E\u6599|\u98DF\u54C1|\u996E\u6599"],
  ["\u79D1\u6280", "\u79D1\u6280|\u4FE1\u606F\u6280\u672F|\u8BA1\u7B97\u673A|\u8F6F\u4EF6|\u7535\u5B50|\u4EBA\u5DE5\u667A\u80FD|\u901A\u4FE1"],
  ["\u4EBA\u5DE5\u667A\u80FD", "\u4EBA\u5DE5\u667A\u80FD|\u673A\u5668\u4EBA"],
  ["\u519B\u5DE5", "\u519B\u5DE5|\u56FD\u9632|\u822A\u7A7A\u822A\u5929"],
  ["\u6709\u8272\u91D1\u5C5E", "\u6709\u8272|\u7A00\u571F|\u91D1\u5C5E"],
  ["\u9EC4\u91D1", "\u9EC4\u91D1"],
  ["\u7164\u70AD", "\u7164\u70AD"],
  ["\u77F3\u6CB9 / \u6CB9\u6C14", "\u77F3\u6CB9|\u6CB9\u6C14"],
  ["\u623F\u5730\u4EA7", "\u623F\u5730\u4EA7|\u5730\u4EA7"],
  ["\u519C\u4E1A", "\u519C\u4E1A|\u519C\u7267|\u755C\u7267|\u517B\u6B96"],
  ["\u73AF\u4FDD", "\u73AF\u4FDD|\u73AF\u5883"],
  ["\u7535\u529B", "\u7535\u529B|\u516C\u7528\u4E8B\u4E1A"],
  ["\u57FA\u5EFA", "\u57FA\u5EFA|\u57FA\u7840\u8BBE\u65BD|\u5DE5\u7A0B\u673A\u68B0"],
  ["\u4F20\u5A92 / \u6E38\u620F", "\u4F20\u5A92|\u6E38\u620F|\u52A8\u6F2B"],
  ["\u6CAA\u6DF1300", "\u6CAA\u6DF1300"],
  ["\u4E2D\u8BC1500", "\u4E2D\u8BC1500"],
  ["\u4E2D\u8BC11000", "\u4E2D\u8BC11000"],
  ["\u79D1\u521B50", "\u79D1\u521B50|\u79D1\u521B\u677F50"],
  ["\u521B\u4E1A\u677F", "\u521B\u4E1A\u677F"],
  ["\u7EA2\u5229", "\u7EA2\u5229|\u80A1\u606F"],
  ["\u6E2F\u80A1", "\u6E2F\u80A1|\u6052\u751F"],
  ["\u7F8E\u80A1", "\u6807\u666E|\u7EB3\u65AF\u8FBE\u514B|\u7F8E\u56FD"],
  ["\u503A\u5238", "\u503A|\u7EAF\u503A"]
].map(([name, pattern]) => ({ name, pattern }));
var matchers = sectors.map((s) => ({ ...s, test: new RegExp(s.pattern, "i") }));
var tagsFor = (r) => {
  const name = r.name.replace(/^农银(?:汇理)?/, "").replace(/银行间/g, "");
  const bond = /债券|固收/.test(r.type);
  return matchers.filter((s) => (!bond || s.name === "\u503A\u5238") && s.test.test(name)).map((s) => s.name);
};
var shareClass = (r) => r.name.match(/(?:^|[^A-Z])([ACEIY])(?:类|份额)?(?:[（(][^）)]*[）)])?$/i)?.[1]?.toUpperCase() || "\u672A\u6807\u660E";
var productKind = (r) => /联接/.test(r.name) ? "ETF\u8054\u63A5" : /指数/.test(r.type + " " + r.name) ? "\u5176\u4ED6\u6307\u6570" : /债/.test(r.type) ? "\u503A\u5238" : /股票|混合/.test(r.type) ? "\u4E3B\u52A8\u6743\u76CA / \u6DF7\u5408" : "\u5176\u4ED6";
var indexKey = (p) => p?.tracking && !/暂无|无跟踪|不适用|^无$|--/.test(p.tracking) ? p.tracking.replace(/\s/g, "") : null;
var fixedFee = (p) => p && ["management", "custody", "service"].every((k) => Number.isFinite(p[k])) ? p.management + p.custody + p.service : null;
function matchSearch(rows, q) {
  q = q.trim().toLowerCase();
  if (!q) return [];
  const parts = q.split(/\s+/);
  return rows.filter((r) => parts.every((p) => (r.code + " " + r.name).toLowerCase().includes(p))).sort((a, b) => (a.code === q ? -1 : b.code === q ? 1 : 0) || a.code.localeCompare(b.code));
}
function peerRows(rows, anchor2, sector2, { kind = "all", share = "all", query = "" } = {}) {
  if (!anchor2 || !sector2) return [];
  return rows.filter((r) => r.code !== anchor2.code && tagsFor(r).includes(sector2) && (kind === "all" || productKind(r) === productKind(anchor2)) && (share === "all" || shareClass(r) === shareClass(anchor2)) && (!query || (r.name + " " + r.code).toLowerCase().includes(query.toLowerCase()))).sort((a, b) => a.code.localeCompare(b.code));
}
function compareSeries(rows, c, days2) {
  if (![7, 15, 30, 180, 365].includes(days2)) throw Error("\u6BD4\u8F83\u671F\u95F4\u65E0\u6548");
  const begin = c.max_calendar_days - days2, required = c.calendar_offsets.filter((x) => x >= begin), dateAt = (x) => new Date(Date.parse(c.history_start + "T00:00:00Z") + x * 864e5).toISOString().slice(0, 10);
  const pending = rows.map((r) => {
    const points = r.history.filter((p) => p[0] >= begin), present = new Set(points.map((p) => p[0]));
    let error = null;
    if (r.historyError) error = r.historyError;
    else if (days2 > c.max_calendar_days) error = "\u6240\u9009\u671F\u95F4\u5386\u53F2\u51C0\u503C\u5C1A\u672A\u8F7D\u5165";
    else if (points.length < 2) error = "\u671F\u95F4\u5185\u4E0D\u8DB3\u4E24\u4E2A\u51C0\u503C\u89C2\u5BDF\u70B9";
    else if (required.some((x) => !present.has(x))) error = "\u671F\u95F4\u5B58\u5728\u5E94\u62AB\u9732\u65E5\u7F3A\u5931\uFF0C\u6682\u4E0D\u6BD4\u8F83\u6536\u76CA";
    else if (points.some((p) => !Number.isFinite(p[1]) || p[1] <= 0) || points.slice(1).some((p) => p[3])) error = "\u5206\u7EA2\u3001\u62C6\u5206\u6216\u51C0\u503C\u53E3\u5F84\u5F85\u6838\u5B9E";
    return { code: r.code, points, error };
  });
  const good = pending.filter((p) => !p.error);
  let common = good.length ? good[0].points.map((p) => p[0]) : [];
  for (const r of good) common = common.filter((x) => r.points.some((p) => p[0] === x));
  const first = common[0], last = common.at(-1);
  const metrics = pending.map((r) => {
    if (r.error) return { code: r.code, error: r.error };
    if (common.length < 2) return { code: r.code, error: "\u5171\u540C\u51C0\u503C\u65E5\u671F\u4E0D\u8DB3\uFF0C\u6682\u4E0D\u6BD4\u8F83" };
    const points = r.points.filter((p) => p[0] >= first && p[0] <= last);
    let value = 1, peak = 1, drawdown = 0;
    const series = [[points[0][0], 1]];
    for (let i = 1; i < points.length; i++) {
      value *= (points[i][1] + (points[i][2] || 0)) / points[i - 1][1];
      peak = Math.max(peak, value);
      drawdown = Math.max(drawdown, 1 - value / peak);
      series.push([points[i][0], value]);
    }
    const values = series.map((p) => p[1]);
    return { code: r.code, change: value - 1, amplitude: Math.max(...values) / Math.min(...values) - 1, drawdown, series };
  });
  return { metrics, start: common.length >= 2 ? dateAt(first) : null, end: common.length >= 2 ? dateAt(last) : null, dateAt };
}

// company-data.mjs
var companies = [
  {
    id: "guangfa",
    name: "\u5E7F\u53D1\u57FA\u91D1",
    short: "\u5E7F\u53D1",
    headline: "\u591A\u7B56\u7565\u5E73\u53F0\uFF0C\u6210\u957F\u4E0E\u884C\u4E1A\u5DE5\u5177\u5E76\u884C",
    tags: ["\u4E3B\u52A8\u6743\u76CA", "\u6307\u6570 / ETF", "\u6D77\u5916\u6295\u8D44"],
    style: "\u516C\u53F8\u4EA7\u54C1\u8986\u76D6\u591A\u79CD\u98CE\u683C\u3002\u6210\u957F\u4E0E\u79D1\u6280\u65B9\u5411\u662F\u53EF\u89C2\u5BDF\u7684\u4E00\u90E8\u5206\uFF0C\u540C\u65F6\u4E5F\u6709\u503A\u5238\u3001\u6307\u6570\u548C\u6D77\u5916\u6295\u8D44\u4EA7\u54C1\uFF1B\u4E0D\u80FD\u628A\u5168\u516C\u53F8\u7B49\u540C\u4E8E\u67D0\u4E00\u4F4D\u6210\u957F\u578B\u7ECF\u7406\u3002",
    areas: [["\u6210\u957F\u4E0E\u79D1\u6280", "\u5B98\u7F51\u5C55\u793A\u65B0\u5174\u6210\u957F\u3001\u79D1\u6280\u4E0EAI\u76F8\u5173\u4E3B\u52A8\u4EA7\u54C1\uFF0C\u4E5F\u6709\u534A\u5BFC\u4F53\u6307\u6570\u5DE5\u5177\u3002"], ["\u591A\u8D44\u4EA7\u4EA7\u54C1\u7EBF", "\u516C\u53F8\u7B80\u4ECB\u5217\u660E\u4E3B\u52A8\u6743\u76CA\u3001\u503A\u5238\u3001\u6D77\u5916\u3001\u88AB\u52A8\u6295\u8D44\u3001FOF\u53CA\u91CF\u5316\u5BF9\u51B2\u7B49\u4E1A\u52A1\u3002"]],
    fact: "\u5B98\u65B9\u516C\u53F8\u7B80\u4ECB\u62AB\u9732\u4E86\u591A\u54C1\u7C7B\u5E03\u5C40\uFF1B\u5B98\u7F51\u4EA7\u54C1\u5C55\u793A\u540C\u65F6\u5305\u62EC\u6210\u957F\u3001\u79D1\u6280\u3001\u6D77\u5916\u80A1\u7968\u548C\u7EAF\u503A\u3002",
    take: "\u6BD4\u8F83\u5E7F\u53D1\u7684\u79D1\u6280\u4E3B\u52A8\u57FA\u91D1\u4E0E\u82AF\u7247\u6307\u6570\u57FA\u91D1\u65F6\uFF0C\u5148\u5206\u6E05\u201C\u7ECF\u7406\u9009\u80A1\u201D\u4E0E\u201C\u8DDF\u8E2A\u6307\u6570\u201D\u3002\u540C\u5C5E\u79D1\u6280\u65B9\u5411\uFF0C\u6301\u4ED3\u8FB9\u754C\u53EF\u80FD\u76F8\u5DEE\u5F88\u5927\u3002",
    checks: ["\u4E3B\u52A8\u57FA\u91D1\uFF1A\u7ECF\u7406\u4EFB\u671F\u5185\u7684\u6301\u4ED3\u96C6\u4E2D\u5EA6\u3001\u884C\u4E1A\u53D8\u5316\u4E0E\u56DE\u64A4\u3002", "\u6307\u6570\u57FA\u91D1\uFF1A\u5148\u6838\u5BF9\u6807\u7684\u6307\u6570\uFF0C\u518D\u6BD4\u8D39\u7528\u548C\u8DDF\u8E2A\u60C5\u51B5\u3002"],
    products: ["008903", "012629"],
    sources: [["\u516C\u53F8\u7B80\u4ECB\uFF08\u4EA7\u54C1\u7EBF\u8D44\u6599\u622A\u81F32025\u5E74\u5E95\uFF09", "https://www.gffunds.com.cn/gywm/gsjj/"], ["\u5B98\u65B9\u4EA7\u54C1\u5C55\u793A", "https://www.gffunds.com.cn/"]]
  },
  {
    id: "huaan",
    name: "\u534E\u5B89\u57FA\u91D1",
    short: "\u534E\u5B89",
    headline: "\u6307\u6570\u521B\u65B0\u3001\u9EC4\u91D1\u4E0E\u8DE8\u5883\u914D\u7F6E\u5DE5\u5177",
    tags: ["\u6307\u6570 / ETF", "\u9EC4\u91D1", "\u6D77\u5916\u6295\u8D44"],
    style: "\u4ECE\u516C\u5F00\u4EA7\u54C1\u6CBF\u9769\u770B\uFF0C\u6307\u6570\u5316\u6295\u8D44\u4E0E\u914D\u7F6E\u5DE5\u5177\u662F\u9C9C\u660E\u7EBF\u7D22\u3002\u6307\u6570\u4EA7\u54C1\u901A\u5E38\u56F4\u7ED5\u660E\u786E\u6807\u7684\u8FD0\u4F5C\uFF1B\u65D7\u4E0B\u4E3B\u52A8\u4EA7\u54C1\u4ECD\u8981\u9010\u4E00\u4E86\u89E3\u7ECF\u7406\u98CE\u683C\u3002",
    areas: [["\u9EC4\u91D1\u5DE5\u5177", "\u5B98\u7F51\u5C06\u9EC4\u91D1ETF\u5217\u4E3A\u4EA7\u54C1\u521B\u65B0\u7684\u91CD\u8981\u7EC4\u6210\u90E8\u5206\u3002"], ["\u6307\u6570\u4E0E\u8DE8\u5883", "\u5B98\u65B9\u6CBF\u9769\u6DB5\u76D6\u5F00\u653E\u5F0F\u6307\u6570\u57FA\u91D1\u3001ETF\u8054\u63A5\u53CAQDII\u4EA7\u54C1\u3002"]],
    fact: "\u5B98\u65B9\u516C\u53F8\u6CBF\u9769\u8BB0\u5F55\u4E862002\u5E74\u5F00\u653E\u5F0F\u6307\u6570\u4EA7\u54C1\uFF0C\u4EE5\u53CA\u9EC4\u91D1ETF\u3001QDII\u7B49\u7C7B\u522B\u7684\u53D1\u5C55\u3002\u8FD9\u91CC\u91C7\u7528\u4EA7\u54C1\u6CBF\u9769\uFF0C\u4E0D\u91C7\u7528\u9875\u9762\u4E2D\u7684\u5386\u53F2\u4E1A\u7EE9\u6392\u540D\u3002",
    take: "\u9002\u5408\u4ECE\u201C\u60F3\u914D\u7F6E\u4EC0\u4E48\u8D44\u4EA7\u201D\u5F00\u59CB\u7814\u7A76\u3002\u9EC4\u91D1\u3001\u79D1\u521B\u82AF\u7247\u548C\u6D77\u5916\u6307\u6570\u7684\u6536\u76CA\u9A71\u52A8\u4E0D\u540C\uFF0C\u4E0D\u80FD\u56E0\u4E3A\u540C\u4E00\u516C\u53F8\u5C31\u8BA4\u4E3A\u98CE\u9669\u63A5\u8FD1\u3002",
    checks: ["\u9EC4\u91D1\u4EA7\u54C1\uFF1A\u770B\u9EC4\u91D1\u4EF7\u683C\u655E\u53E3\u4E0E\u8D39\u7528\u3002", "\u82AF\u7247\u6307\u6570\uFF1A\u6838\u5BF9\u79D1\u521B\u677F\u8303\u56F4\u3001\u6210\u4EFD\u80A1\u53CA\u96C6\u4E2D\u5EA6\uFF1B\u8DE8\u5883\u4EA7\u54C1\u53E6\u770B\u6C47\u7387\u548C\u989D\u5EA6\u3002"],
    products: ["000216", "017559"],
    sources: [["\u5173\u4E8E\u534E\u5B89\uFF1A\u4EA7\u54C1\u521B\u65B0\u4E0E\u516C\u53F8\u6CBF\u9769", "https://www.huaan.com.cn/overview.shtml"]]
  },
  {
    id: "huaxia",
    name: "\u534E\u590F\u57FA\u91D1",
    short: "\u534E\u590F",
    headline: "ETF\u914D\u7F6E\u5DE5\u5177\u4E0E\u517B\u8001\u4E1A\u52A1\u79EF\u7D2F",
    tags: ["\u6307\u6570 / ETF", "\u6D77\u5916\u6295\u8D44", "\u517B\u8001\u914D\u7F6E"],
    style: "ETF\u5E73\u53F0\u662F\u5176\u516C\u5F00\u8D44\u6599\u4E2D\u7684\u7A81\u51FA\u65B9\u5411\uFF0C\u8986\u76D6\u5BBD\u57FA\u3001\u884C\u4E1A\u4E3B\u9898\u3001\u7B56\u7565\u53CA\u4E0D\u540C\u5E02\u573A\u3002\u6B64\u7C7B\u4EA7\u54C1\u7684\u6838\u5FC3\u662F\u5B9E\u73B0\u7EA6\u5B9A\u7684\u6307\u6570\u655E\u53E3\uFF0C\u800C\u975E\u7ECF\u7406\u4E3B\u52A8\u6311\u9009\u4E0B\u4E00\u53EA\u725B\u80A1\u3002",
    areas: [["ETF\u4EA7\u54C1\u4F53\u7CFB", "\u5B98\u65B9\u4ECB\u7ECD\u5217\u660E\u5BBD\u57FA\u3001\u884C\u4E1A\u4E3B\u9898\u3001\u7B56\u7565\u53CA\u5546\u54C1\u7B49ETF\u7C7B\u522B\u3002"], ["\u517B\u8001\u914D\u7F6E", "\u5B98\u65B9\u53D1\u5C55\u5386\u7A0B\u8BB0\u5F55\u517B\u8001\u76EE\u6807\u57FA\u91D1\u7B49\u4E1A\u52A1\u5E03\u5C40\u3002"]],
    fact: "\u5B98\u65B9\u8D44\u6599\u8BB0\u5F55\u5176\u57282004\u5E74\u63A8\u51FA\u5883\u5185\u9996\u53EAETF\uFF1BETF\u4E13\u9898\u4ECB\u7ECD\u4E86A\u80A1\u3001\u6E2F\u80A1\u4E0E\u6D77\u5916\u5E02\u573A\u7684\u4EA7\u54C1\u5E03\u5C40\u3002",
    take: "\u7814\u7A76\u884C\u4E1A\u6216\u5BBD\u57FA\u914D\u7F6E\u65F6\uFF0C\u53EF\u4EE5\u628A\u534E\u590F\u4F5C\u4E3A\u4EA7\u54C1\u5DE5\u5177\u5E93\u4E4B\u4E00\u3002\u517B\u8001\u4EA7\u54C1\u5219\u8981\u53E6\u770B\u76EE\u6807\u65E5\u671F\u6216\u76EE\u6807\u98CE\u9669\uFF0C\u4EE5\u53CA\u80A1\u503A\u914D\u7F6E\u8DEF\u5F84\u3002",
    checks: ["ETF\u8054\u63A5\uFF1A\u533A\u5206\u8054\u63A5\u57FA\u91D1\u4E0E\u573A\u5185ETF\uFF0C\u6BD4\u8F83\u5404\u81EA\u8D39\u7528\u3002", "\u517B\u8001\u57FA\u91D1\uFF1A\u770B\u6743\u76CA\u4ED3\u4F4D\u3001\u6301\u6709\u671F\u548C\u4E0B\u6ED1\u66F2\u7EBF\uFF0C\u4E0D\u80FD\u5957\u7528ETF\u7684\u6BD4\u8F83\u65B9\u6CD5\u3002"],
    products: ["001051", "008887"],
    sources: [["\u5B98\u65B9ETF\u5E73\u53F0\u4ECB\u7ECD\uFF08\u9875\u9762\u6570\u636E\u622A\u81F32025\u5E74\u5E95\uFF09", "https://en.chinaamc.com/enetf/"], ["\u5B98\u65B9\u53D1\u5C55\u5386\u7A0B", "https://en.chinaamc.com/about-chinaamc/our-history-and-partners/"]]
  },
  {
    id: "efund",
    name: "\u6613\u65B9\u8FBE\u57FA\u91D1",
    short: "\u6613\u65B9\u8FBE",
    headline: "\u7814\u7A76\u5BFC\u5411\u7684\u7EFC\u5408\u6295\u8D44\u5E73\u53F0",
    tags: ["\u4E3B\u52A8\u6743\u76CA", "\u6307\u6570 / ETF", "\u56FA\u6536"],
    style: "\u5B98\u65B9\u5F3A\u8C03\u6DF1\u5EA6\u7814\u7A76\u4E0E\u957F\u671F\u4EF7\u503C\uFF0C\u540C\u65F6\u63D0\u4F9B\u591A\u7C7B\u8D44\u4EA7\u7BA1\u7406\u65B9\u6848\u3002\u7814\u7A76\u5BFC\u5411\u662F\u4E00\u79CD\u6295\u7814\u65B9\u6CD5\uFF0C\u4E0D\u610F\u5473\u7740\u65D7\u4E0B\u57FA\u91D1\u90FD\u5C5E\u4E8E\u4F4E\u4F30\u503C\u3001\u6D88\u8D39\u6216\u4F4E\u6CE2\u52A8\u98CE\u683C\u3002",
    areas: [["\u4E3B\u52A8\u6743\u76CA\u7814\u7A76", "\u5B98\u7F51\u4EE5\u7814\u7A76\u548C\u957F\u671F\u4EF7\u503C\u4F5C\u4E3A\u6295\u8D44\u7406\u5FF5\u7684\u6838\u5FC3\u8868\u8FF0\u3002"], ["\u6307\u6570\u4E0E\u56FA\u6536", "\u5B98\u65B9\u57FA\u91D1\u5C55\u793A\u533A\u540C\u65F6\u533A\u5206\u4E3B\u52A8\u80A1\u7968\u3001\u6307\u6570\u3001\u91CF\u5316\u53CA\u591A\u7C7B\u503A\u5238\u4EA7\u54C1\u3002"]],
    fact: "\u516C\u53F8\u5B9A\u4F4D\u4E3A\u7EFC\u5408\u6027\u8D44\u4EA7\u7BA1\u7406\u673A\u6784\uFF1B\u5B98\u65B9\u4EA7\u54C1\u5206\u7C7B\u6DB5\u76D6\u4E3B\u52A8\u6743\u76CA\u3001ETF\u53CA\u666E\u901A\u6307\u6570\u3001\u6307\u6570\u589E\u5F3A\u548C\u503A\u5238\u7B49\u3002",
    take: "\u9002\u5408\u5148\u9009\u7B56\u7565\uFF0C\u518D\u5728\u540C\u7C7B\u4E2D\u6BD4\u8F83\u3002\u4E3B\u52A8\u6DF7\u5408\u57FA\u91D1\u4E0E\u6CAA\u6DF1300\u8054\u63A5\u57FA\u91D1\uFF0C\u5373\u4F7F\u540C\u5C5E\u6613\u65B9\u8FBE\uFF0C\u4E5F\u4E0D\u80FD\u76F4\u63A5\u636E\u516C\u53F8\u7406\u5FF5\u63A8\u65AD\u5176\u98CE\u683C\u4E00\u81F4\u3002",
    checks: ["\u4E3B\u52A8\u4EA7\u54C1\uFF1A\u786E\u8BA4\u5F53\u524D\u7ECF\u7406\u3001\u6295\u8D44\u8303\u56F4\u53CA\u5B9E\u9645\u884C\u4E1A\u914D\u7F6E\u3002", "\u6307\u6570\u589E\u5F3A\uFF1A\u628A\u8DDF\u8E2A\u6307\u6570\u7684\u6536\u76CA\u4E0E\u4E3B\u52A8\u589E\u5F3A\u90E8\u5206\u5206\u5F00\u89C2\u5BDF\u3002"],
    products: ["005827", "110020"],
    sources: [["\u5B98\u65B9\u516C\u53F8\u4ECB\u7ECD\u4E0E\u7406\u5FF5", "https://www.efunds.com.cn/index.shtml"], ["\u5B98\u65B9\u57FA\u91D1\u4EA7\u54C1\u5206\u7C7B", "https://vip.efunds.com.cn/"]]
  },
  {
    id: "harvest",
    name: "\u5609\u5B9E\u57FA\u91D1",
    short: "\u5609\u5B9E",
    headline: "\u57FA\u672C\u9762\u7814\u7A76\u4E0E\u884C\u4E1A\u56E2\u961F\u5206\u5DE5",
    tags: ["\u4E3B\u52A8\u6743\u76CA", "\u6307\u6570 / ETF", "\u56FA\u6536", "\u6D77\u5916\u6295\u8D44"],
    style: "\u516C\u5F00\u6295\u7814\u4ECB\u7ECD\u5F3A\u8C03\u57FA\u672C\u9762\u4E0E\u6570\u91CF\u7814\u7A76\u7ED3\u5408\uFF0C\u5E76\u4EE5\u4E13\u4E1A\u56E2\u961F\u8986\u76D6\u4E0D\u540C\u7B56\u7565\u3002\u79D1\u6280\u3001\u533B\u836F\u3001\u6D88\u8D39\u548C\u5148\u8FDB\u5236\u9020\u7B49\u662F\u5176\u62AB\u9732\u7684\u7814\u7A76\u65B9\u5411\u3002",
    areas: [["\u884C\u4E1A\u57FA\u672C\u9762", "\u6743\u76CA\u7814\u7A76\u4ECB\u7ECD\u8986\u76D6\u79D1\u6280\u3001\u533B\u836F\u3001\u6D88\u8D39\u3001\u5148\u8FDB\u5236\u9020\u53CA\u5927\u5468\u671F\u3002"], ["\u591A\u7C7B\u6295\u8D44\u80FD\u529B", "\u5B98\u7F51\u540C\u65F6\u5217\u51FA\u80A1\u7968\u3001\u56FA\u6536\u3001ETF\u3001\u6D77\u5916\u6295\u8D44\u4E0E\u8D44\u4EA7\u914D\u7F6E\u3002"]],
    fact: "\u5B98\u65B9\u6295\u7814\u4F53\u7CFB\u9875\u9762\u63CF\u8FF0\u4E86\u7814\u7A76\u9A71\u52A8\u7684\u6295\u8D44\u65B9\u6CD5\uFF0C\u4EE5\u53CA\u884C\u4E1A\u7814\u7A76\u3001\u503A\u5238\u7B56\u7565\u548C\u591A\u7C7BETF\u7684\u7EC4\u7EC7\u5B89\u6392\u3002",
    take: "\u53EF\u4EE5\u628A\u884C\u4E1A\u7814\u7A76\u4F5C\u4E3A\u4E86\u89E3\u5609\u5B9E\u4E3B\u52A8\u57FA\u91D1\u7684\u5165\u53E3\uFF0C\u4F46\u6700\u7EC8\u8981\u6838\u5BF9\u57FA\u91D1\u7ECF\u7406\u662F\u5426\u6301\u7EED\u5728\u5176\u80FD\u529B\u8303\u56F4\u5185\u6295\u8D44\uFF0C\u4EE5\u53CA\u5B9E\u9645\u6301\u4ED3\u662F\u5426\u652F\u6301\u98CE\u683C\u63CF\u8FF0\u3002",
    checks: ["\u884C\u4E1A\u57FA\u91D1\uFF1A\u89C2\u5BDF\u6301\u4ED3\u662F\u5426\u4FDD\u6301\u7EA6\u5B9A\u9886\u57DF\u3002", "\u5168\u5E02\u573A\u4E3B\u52A8\u57FA\u91D1\uFF1A\u89C2\u5BDF\u884C\u4E1A\u8F6E\u52A8\u4E0E\u96C6\u4E2D\u5EA6\uFF0C\u800C\u4E0D\u662F\u4EC5\u770B\u4EA7\u54C1\u540D\u79F0\u3002"],
    products: ["070013", "160706"],
    sources: [["\u5B98\u65B9\u6295\u7814\u4F53\u7CFB\uFF08\u90E8\u5206\u9875\u9762\u5386\u53F2\u7EDF\u8BA1\u622A\u81F32020\u5E74\uFF1B\u6B64\u5904\u4E0D\u5F15\u7528\u6392\u540D\u548C\u89C4\u6A21\uFF09", "https://www.jsfund.cn/main/AboutHarvest/InvestmentResearch/InvestmentCapacity/index.shtml"]]
  },
  {
    id: "southern",
    name: "\u5357\u65B9\u57FA\u91D1",
    short: "\u5357\u65B9",
    headline: "\u80A1\u503A\u3001\u6307\u6570\u4E0E\u914D\u7F6E\u591A\u7EBF\u534F\u540C",
    tags: ["\u4E3B\u52A8\u6743\u76CA", "\u6307\u6570 / ETF", "\u56FA\u6536", "\u91CF\u5316", "\u6D77\u5916\u6295\u8D44"],
    style: "\u5B98\u65B9\u6295\u7814\u67B6\u6784\u533A\u5206\u4E3B\u52A8\u6743\u76CA\u3001\u88AB\u52A8\u6743\u76CA\u3001\u91CF\u5316\u3001\u6DF7\u5408\u8D44\u4EA7\u3001\u56FA\u6536\u53CA\u56FD\u9645\u6295\u8D44\u3002\u66F4\u9002\u5408\u770B\u6210\u591A\u7B56\u7565\u5E73\u53F0\uFF0C\u800C\u975E\u5355\u4E00\u6210\u957F\u6216\u4EF7\u503C\u6D41\u6D3E\u3002",
    areas: [["\u6307\u6570\u4E0E\u6743\u76CA", "\u8BBE\u6709\u4E3B\u52A8\u3001\u88AB\u52A8\u548C\u91CF\u5316\u6295\u8D44\u65B9\u5411\uFF0C\u7814\u7A76\u5C42\u6B21\u4ECE\u5B8F\u89C2\u5EF6\u4F38\u81F3\u516C\u53F8\u3002"], ["\u56FA\u6536\u4E0E\u8D44\u4EA7\u914D\u7F6E", "\u516C\u5F00\u67B6\u6784\u5305\u542B\u56FA\u5B9A\u6536\u76CA\u3001\u73B0\u91D1\u7C7B\u3001\u6DF7\u5408\u8D44\u4EA7\u4E0EFOF\u6295\u8D44\u3002"]],
    fact: "\u5B98\u7F51\u6295\u7814\u4F53\u7CFB\u660E\u786E\u5C55\u793A\u4E0A\u8FF0\u4E1A\u52A1\u5206\u5DE5\uFF0C\u5E76\u4EE5\u957F\u671F\u3001\u4EF7\u503C\u548C\u8D23\u4EFB\u6295\u8D44\u4F5C\u4E3A\u516C\u5F00\u7406\u5FF5\u3002",
    take: "\u540C\u4E00\u5E73\u53F0\u4E0B\uFF0C\u53EF\u4EE5\u7814\u7A76\u7EAF\u6307\u6570\u5DE5\u5177\uFF0C\u4E5F\u53EF\u4EE5\u7814\u7A76\u80A1\u503A\u7ED3\u5408\u4EA7\u54C1\u3002\u4E24\u8005\u9700\u8981\u5206\u522B\u5173\u6CE8\u8DDF\u8E2A\u60C5\u51B5\u548C\u8D44\u4EA7\u914D\u7F6E\u51B3\u7B56\u3002",
    checks: ["\u5BBD\u57FA\u6307\u6570\uFF1A\u5148\u6BD4\u8F83\u540C\u4E00\u6307\u6570\u3001\u540C\u4E00\u4EFD\u989D\u7C7B\u522B\u3002", "\u80A1\u503A\u6DF7\u5408\uFF1A\u770B\u80A1\u7968\u4E0E\u53EF\u8F6C\u503A\u4ED3\u4F4D\uFF0C\u503A\u5238\u540D\u79F0\u4E0D\u7B49\u4E8E\u7EAF\u503A\u3002"],
    products: ["160119", "202101"],
    sources: [["\u5B98\u65B9\u6295\u7814\u4F53\u7CFB\u4E0E\u6295\u8D44\u7406\u5FF5", "https://www.southernfund.com/"]]
  },
  {
    id: "tianhong",
    name: "\u5929\u5F18\u57FA\u91D1",
    short: "\u5929\u5F18",
    headline: "\u56FA\u6536\u98CE\u63A7\u4E0E\u57FA\u672C\u9762\u3001\u6570\u636E\u7814\u7A76",
    tags: ["\u56FA\u6536", "\u4E3B\u52A8\u6743\u76CA", "\u6307\u6570 / ETF"],
    style: "\u503A\u5238\u65B9\u6CD5\u5F3A\u8C03\u7968\u606F\u57FA\u7840\u3001\u8D44\u4EA7\u914D\u7F6E\u53CA\u4E45\u671F\u548C\u4FE1\u7528\u98CE\u9669\u7BA1\u7406\uFF1B\u80A1\u7968\u65B9\u6CD5\u5F3A\u8C03\u4F01\u4E1A\u7ADE\u4E89\u529B\u4E0E\u5408\u7406\u4F30\u503C\u3002\u6570\u636E\u7CFB\u7EDF\u7528\u4E8E\u652F\u6301\u7814\u7A76\u548C\u98CE\u63A7\u3002",
    areas: [["\u56FA\u5B9A\u6536\u76CA", "\u5B98\u7F51\u4ECB\u7ECD\u4FE1\u7528\u7814\u7A76\u3001\u52A8\u6001\u4E45\u671F\u548C\u6760\u6746\u7BA1\u7406\uFF0C\u4EE5\u53CA\u98CE\u9669\u6536\u76CA\u6743\u8861\u3002"], ["\u6743\u76CA\u4E0E\u6307\u6570\u5DE5\u5177", "\u80A1\u7968\u7814\u7A76\u5206\u4E3ATMT\u3001\u533B\u836F\u3001\u6D88\u8D39\u3001\u5236\u9020\u7B49\u5C0F\u7EC4\uFF1B\u65D7\u4E0B\u4E5F\u6709\u94F6\u884C\u7B49\u6307\u6570\u4EA7\u54C1\u3002"]],
    fact: "\u5B98\u65B9\u4ECB\u7ECD\u5206\u522B\u9610\u8FF0\u80A1\u7968\u548C\u503A\u5238\u6295\u8D44\u65B9\u6CD5\uFF0C\u5E76\u62AB\u9732\u667A\u80FD\u6295\u7814\u4E0E\u98CE\u9669\u76D1\u6D4B\u7CFB\u7EDF\u3002",
    take: "\u4E0D\u8981\u628A\u5BF9\u8D27\u5E01\u57FA\u91D1\u7684\u719F\u6089\u611F\u5957\u5728\u5929\u5F18\u7684\u80A1\u7968\u6216\u884C\u4E1A\u6307\u6570\u57FA\u91D1\u4E0A\u3002\u94F6\u884C\u6307\u6570\u4ECD\u7136\u4E3B\u8981\u53D7\u94F6\u884C\u677F\u5757\u53D8\u5316\u5F71\u54CD\u3002",
    checks: ["\u503A\u5238\u4EA7\u54C1\uFF1A\u6838\u5BF9\u4FE1\u7528\u7B49\u7EA7\u3001\u4E45\u671F\u3001\u6760\u6746\u548C\u662F\u5426\u542B\u6743\u76CA\u3002", "\u884C\u4E1A\u6307\u6570\uFF1A\u68C0\u67E5\u5355\u4E00\u884C\u4E1A\u98CE\u9669\u4E0E\u8DDF\u8E2A\u60C5\u51B5\u3002"],
    products: ["420002", "001594"],
    sources: [["\u5B98\u65B9\u516C\u53F8\u4ECB\u7ECD\u4E0E\u6295\u7814\u65B9\u6CD5", "https://www.thfund.com.cn/?q=about/company"]]
  },
  {
    id: "fullgoal",
    name: "\u5BCC\u56FD\u57FA\u91D1",
    short: "\u5BCC\u56FD",
    headline: "\u4E3B\u52A8\u3001\u56FA\u6536\u4E0E\u91CF\u5316\u5E76\u884C",
    tags: ["\u4E3B\u52A8\u6743\u76CA", "\u56FA\u6536", "\u91CF\u5316", "\u6307\u6570 / ETF"],
    style: "\u516C\u5F00\u8D44\u6599\u8986\u76D6\u4E3B\u52A8\u6743\u76CA\u3001\u56FA\u5B9A\u6536\u76CA\u548C\u91CF\u5316\u7B49\u591A\u79CD\u7B56\u7565\u3002\u4E3B\u89C2\u9009\u80A1\u4E0E\u6A21\u578B\u9A71\u52A8\u4EA7\u54C1\u5E76\u5B58\uFF0C\u9700\u8981\u6309\u57FA\u91D1\u7B56\u7565\u5206\u522B\u5224\u65AD\u3002",
    areas: [["\u91CF\u5316\u4E0E\u6307\u6570\u589E\u5F3A", "\u5B98\u7F51\u5217\u660E\u4E3B\u52A8\u91CF\u5316\u53CA\u6307\u6570\u4EA7\u54C1\u7C7B\u522B\u3002"], ["\u4E3B\u52A8\u6743\u76CA\u4E0E\u56FA\u6536", "\u4E1A\u52A1\u8303\u56F4\u540C\u65F6\u5305\u542B\u80A1\u7968\u3001\u503A\u5238\u3001\u6DF7\u5408\u7B49\u4EA7\u54C1\uFF0C\u673A\u6784\u7B56\u7565\u4E5F\u6DB5\u76D6\u6743\u76CA\u3001\u91CF\u5316\u548C\u56FA\u6536\u3002"]],
    fact: "\u516C\u53F8\u4ECB\u7ECD\u660E\u786E\u62AB\u9732\u5168\u54C1\u7C7B\u4EA7\u54C1\u8303\u56F4\u53CA\u6743\u76CA\u3001\u91CF\u5316\u3001\u56FA\u6536\u7B56\u7565\u5E03\u5C40\u3002",
    take: "\u6BD4\u8F83\u5BCC\u56FD\u7684\u4E3B\u52A8\u6DF7\u5408\u4E0E\u6307\u6570\u589E\u5F3A\u65F6\uFF0C\u5E94\u5206\u6E05\u201C\u7ECF\u7406\u81EA\u7531\u9009\u80A1\u201D\u4E0E\u201C\u56F4\u7ED5\u6307\u6570\u4E89\u53D6\u589E\u5F3A\u201D\u3002\u91CF\u5316\u662F\u4E00\u79CD\u65B9\u6CD5\uFF0C\u4E0D\u662F\u7A33\u5B9A\u76C8\u5229\u7684\u4FDD\u8BC1\u3002",
    checks: ["\u6307\u6570\u589E\u5F3A\uFF1A\u89C2\u5BDF\u76F8\u5BF9\u57FA\u51C6\u7684\u8D85\u989D\u6536\u76CA\u662F\u5426\u7A33\u5B9A\u3001\u504F\u79BB\u662F\u5426\u6269\u5927\u3002", "\u4E3B\u52A8\u4EA7\u54C1\uFF1A\u6838\u5BF9\u7ECF\u7406\u4EFB\u671F\u3001\u4ED3\u4F4D\u53D8\u5316\u548C\u7EC4\u5408\u96C6\u4E2D\u5EA6\u3002"],
    products: ["161005", "100038"],
    sources: [["\u5B98\u65B9\u516C\u53F8\u4ECB\u7ECD\u4E0E\u4EA7\u54C1\u8303\u56F4", "https://www.fullgoal.com.cn/main/AboutFuguo/CompanyProfile/index.html"]]
  }
];
function companyFor(name) {
  return companies.find((c) => c.name === name);
}

// compare.js
var $ = (id) => document.getElementById(id);
var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var colors = ["#176b58", "#7160b6", "#dc702a", "#327ca5"];
var pct = (x) => Number.isFinite(x) ? `${x >= 0 ? "+" : ""}${(x * 100).toFixed(2)}%` : "\u2014";
var rate = (x) => Number.isFinite(x) ? x.toFixed(2) + "% / \u5E74" : "\u672A\u53D6\u5F97";
var D;
var byCode;
var anchor = null;
var selected = [];
var sector = "";
var peerLimit = 9;
var searchLimit = 20;
var days = 30;
var profiles = {};
var seed = {};
var profileErrors = {};
var loading = /* @__PURE__ */ new Set();
var noticeTimer;
var histories = {};
var historyErrors = {};
var historyLoading = /* @__PURE__ */ new Set();
var holdingData = {};
var holdingErrors = {};
var holdingLoading = /* @__PURE__ */ new Set();
var researchFund = (r) => ({ market: "fund", code: r.code, name: r.name });
document.addEventListener("research:change", (e) => {
  if (e.detail?.source === "dock") restoreResearch();
});
document.addEventListener("research:external", restoreResearch);
function restoreResearch() {
  if (!byCode) return;
  const codes = (readState().queues.fund?.items || []).map((i) => i.code).filter((c) => byCode.has(c));
  if (JSON.stringify(codes) === JSON.stringify(selected)) return;
  if (codes.length) chooseAnchor(codes[0], codes, false);
  else {
    selected = [];
    anchor = null;
    $("workbench").hidden = true;
    refreshSearch();
  }
}
async function loadHoldings(code, force = false) {
  if (holdingLoading.has(code) || !force && holdingData[code]) return;
  holdingLoading.add(code);
  delete holdingErrors[code];
  renderComparison();
  try {
    const r = await fetch("/api/compare/holdings?code=" + code + (force ? "&refresh=1" : ""), { signal: AbortSignal.timeout(2e4) }), h = await r.json();
    if (!r.ok || h.code !== code || !["ok", "unavailable"].includes(h.status) || !Array.isArray(h.items)) throw Error();
    const old = holdingData[code] || byCode.get(code)?.holdings;
    if (old?.items?.length && (!h.items.length || h.date < old.date)) throw Error();
    holdingData[code] = h;
  } catch {
    holdingErrors[code] = "\u672C\u6B21\u6301\u4ED3\u83B7\u53D6\u5931\u8D25";
  } finally {
    holdingLoading.delete(code);
    if (selected.includes(code)) renderComparison();
  }
}
async function loadHistory(code) {
  if (histories[code] || historyLoading.has(code)) return;
  historyLoading.add(code);
  delete historyErrors[code];
  renderComparison();
  try {
    const response = await fetch("/api/compare/history?code=" + code + "&asof=" + D.context.asof, { signal: AbortSignal.timeout(65e3) }), data = await response.json();
    if (!response.ok || data.code !== code || data.context?.asof !== D.context.asof || data.context?.max_calendar_days !== 365 || !Array.isArray(data.history)) throw Error(data.error || "\u5386\u53F2\u51C0\u503C\u54CD\u5E94\u5F02\u5E38");
    histories[code] = data;
  } catch {
    historyErrors[code] = "\u5386\u53F2\u51C0\u503C\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\uFF08\u5E76\u975E\u5386\u53F2\u4E0D\u8DB3\uFF09";
  } finally {
    historyLoading.delete(code);
    if (selected.includes(code)) renderComparison();
  }
}
function ensureHistory() {
  if (days > 30) selected.forEach(loadHistory);
}
function comparisonResult(rows) {
  if (days <= 30) return compareSeries(rows, D.context, days);
  const context = selected.map((code) => histories[code]?.context).find(Boolean) || { ...D.context, max_calendar_days: 365, calendar_offsets: [] };
  return compareSeries(rows.map((r) => ({ ...r, history: histories[r.code]?.history || [], historyError: histories[r.code] ? null : historyErrors[r.code] || (historyLoading.has(r.code) ? "\u6B63\u5728\u8F7D\u5165\u4E00\u5E74\u5386\u53F2\u51C0\u503C\u2026" : "\u7B49\u5F85\u5386\u53F2\u51C0\u503C\u2026") })), context, days);
}
function notice(text) {
  $("compareNotice").textContent = text;
  $("compareNotice").hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => $("compareNotice").hidden = true, 3500);
}
function refreshSearch() {
  if (!D) return;
  const q = $("fundQuery").value, rows = matchSearch(D.rows, q);
  $("searchResults").innerHTML = !q.trim() ? "" : `<p class="search-count">\u627E\u5230 ${rows.length.toLocaleString()} \u4E2A\u57FA\u91D1\u4EFD\u989D\uFF0C\u9009\u62E9\u4E00\u53EA\u4F5C\u4E3A\u53C2\u7167\u3002</p><div class="search-result-list">${rows.slice(0, searchLimit).map((r) => `<div class="search-result"><button class="choose-anchor" data-anchor="${r.code}"><span>${esc(r.name)}<small>${r.code} \xB7 ${esc(r.type)}</small></span><span>\u4F5C\u4E3A\u53C2\u7167</span></button>${researchButtons(researchFund(r))}${anchor ? `<button data-add="${r.code}" ${selected.includes(r.code) ? "disabled" : ""}>${selected.includes(r.code) ? "\u5DF2\u52A0\u5165" : "\uFF0B \u52A0\u5165\u5BF9\u6BD4"}</button>` : ""}</div>`).join("")}</div>${rows.length > searchLimit ? '<button id="moreSearch" style="margin-top:12px">\u663E\u793A\u66F4\u591A\u7ED3\u679C</button>' : ""}${!rows.length ? '<p class="hint">\u8BD5\u8BD5\u516D\u4F4D\u4EE3\u7801\u6216\u66F4\u77ED\u7684\u5173\u952E\u8BCD\u3002\u5F53\u524D\u540D\u5355\u4E0D\u542B\u8D27\u5E01\u57FA\u91D1\u53CA\u573A\u5185ETF\u3002</p>' : ""}`;
}
async function loadProfile(code, force = false) {
  if (loading.has(code) || !force && profiles[code] && !profiles[code].fallback) return;
  loading.add(code);
  delete profileErrors[code];
  renderComparison();
  try {
    const response = await fetch("/api/compare/profile?code=" + code + (force ? "&refresh=1" : ""), { signal: AbortSignal.timeout(16e3), cache: force ? "reload" : "default" });
    const p = await response.json();
    if (!response.ok || p.code !== code || !p.company) throw Error(p.error || "\u8D44\u6599\u6682\u4E0D\u53EF\u7528");
    profiles[code] = p;
  } catch (e) {
    if (seed[code]) profiles[code] = { ...seed[code], fallback: true };
    profileErrors[code] = profiles[code] ? "\u6700\u65B0\u8D44\u6599\u83B7\u53D6\u5931\u8D25\uFF0C\u4EE5\u4E0B\u4FDD\u7559\u5DF2\u6838\u9A8C\u5FEB\u7167\u3002" : "\u516C\u53F8\u4E0E\u8D39\u7387\u8D44\u6599\u6682\u672A\u53D6\u5F97\u3002";
  } finally {
    loading.delete(code);
    if (selected.includes(code)) {
      renderPeers();
      renderComparison();
    }
  }
}
function chooseAnchor(code, initialCodes = [code], scroll = true) {
  anchor = byCode.get(code);
  visit(researchFund(anchor));
  selected = initialCodes;
  sector = tagsFor(anchor)[0] || "";
  peerLimit = 9;
  $("peerQuery").value = "";
  $("kind").value = "same";
  $("share").value = shareClass(anchor) === "\u672A\u6807\u660E" ? "all" : "same";
  $("workbench").hidden = false;
  $("sector").innerHTML = '<option value="">\u624B\u52A8\u9009\u62E9\u5BF9\u6BD4\u65B9\u5411</option>' + sectors.map((s) => `<option value="${esc(s.name)}">${esc(s.name)}</option>`).join("");
  $("sector").value = sector;
  $("anchorCard").innerHTML = `<div class="anchor-card"><div><span class="pill">\u53C2\u7167\u57FA\u91D1</span><h2>${esc(anchor.name)}</h2><p>${anchor.code} \xB7 ${esc(anchor.type)} \xB7 ${esc(shareClass(anchor))}\u4EFD\u989D</p>${researchButtons(researchFund(anchor))}</div><p>${tagsFor(anchor).length ? "\u540D\u79F0\u5305\u542B\u7684\u65B9\u5411\uFF1A" + esc(tagsFor(anchor).join(" / ")) : "\u540D\u79F0\u65E0\u6CD5\u786E\u5B9A\u677F\u5757\uFF0C\u8BF7\u4ECE\u4E0B\u65B9\u9009\u62E9\u5BF9\u6BD4\u65B9\u5411\u3002"}</p></div>`;
  refreshSearch();
  renderPeers();
  renderComparison();
  selected.forEach((c) => {
    loadProfile(c);
    loadHoldings(c);
  });
  ensureHistory();
  if (scroll) $("workbench").scrollIntoView({ behavior: "smooth", block: "start" });
}
function renderPeers() {
  if (!anchor) return;
  const rows = peerRows(D.rows, anchor, sector, { kind: $("kind").value, share: $("share").value, query: $("peerQuery").value.trim() });
  $("peerList").innerHTML = !sector ? '<div class="empty-compare">\u5148\u9009\u62E9\u5BF9\u6BD4\u65B9\u5411\u3002\u65E0\u6CD5\u4ECE\u540D\u79F0\u5224\u65AD\u7684\u57FA\u91D1\u4E0D\u4F1A\u88AB\u81EA\u52A8\u5F52\u5165\u67D0\u4E2A\u677F\u5757\u3002</div>' : `<div class="peer-heading"><p class="hint">${esc(sector)} \xB7 ${rows.length} \u4E2A\u540D\u79F0\u5339\u914D\u5019\u9009 \xB7 \u6309\u57FA\u91D1\u4EE3\u7801\u6392\u5217</p><a class="jump-compare" href="#comparison">\u67E5\u770B\u5DF2\u9009\u5BF9\u6BD4\uFF08${selected.length}/4\uFF09\u2193</a></div><div class="peers">${rows.slice(0, peerLimit).map((r) => {
    const p = profiles[r.code] || seed[r.code], added = selected.includes(r.code);
    return `<article class="peer"><small>${r.code}${p?.company ? " \xB7 " + esc(p.company) : ""}</small><h3>${esc(r.name)}</h3>${researchButtons(researchFund(r))}<div class="tags"><span class="pill">${esc(productKind(r))}</span><span class="pill blue">${esc(shareClass(r))}\u4EFD\u989D</span></div><p>${p?.tracking ? "\u8DDF\u8E2A\uFF1A" + esc(p.tracking) : esc(r.type)}</p><button data-add="${r.code}" ${added ? "disabled" : ""}>${added ? "\u5DF2\u52A0\u5165" : "\uFF0B \u52A0\u5165\u5BF9\u6BD4"}</button></article>`;
  }).join("")}</div>${!rows.length ? '<div class="empty-compare">\u6CA1\u6709\u7B26\u5408\u8FD9\u4E9B\u6761\u4EF6\u7684\u5019\u9009\u3002\u53EF\u653E\u5BBD\u4EA7\u54C1\u7ED3\u6784\u3001\u4EFD\u989D\u9650\u5236\u6216\u5207\u6362\u7EC6\u5206\u65B9\u5411\u3002</div>' : ""}`;
  $("morePeers").hidden = rows.length <= peerLimit;
}
var getP = (r) => profiles[r.code];
function companyMarkup(r) {
  const name = getP(r)?.company, c = companyFor(name);
  return profileValue(r, "company") + (c ? `<small><a href="/companies.html#${c.id}">\u4E86\u89E3\u516C\u53F8\u98CE\u683C\u4E0E\u7279\u8272</a></small>` : "");
}
function profileValue(r, k) {
  return getP(r)?.[k] ? esc(getP(r)[k]) : `<span class="muted">${loading.has(r.code) ? "\u8BFB\u53D6\u4E2D\u2026" : "\u672A\u53D6\u5F97"}</span>`;
}
function heldMarkup(r) {
  const h = holdingData[r.code] || r.holdings, busy = holdingLoading.has(r.code), error = holdingErrors[r.code] || h?.status === "error";
  const source = `<a href="https://fundf10.eastmoney.com/ccmx_${r.code}.html" target="_blank" rel="noopener">\u6301\u4ED3\u6765\u6E90</a>`;
  const action = busy ? "<small>\u6B63\u5728\u6838\u9A8C\u6700\u65B0\u5DF2\u62AB\u9732\u6301\u4ED3\u2026</small>" : `<br><button data-holdings-retry="${r.code}" style="margin-top:8px">${error ? "\u91CD\u8BD5\u6301\u4ED3" : "\u66F4\u65B0\u6301\u4ED3"}</button>`;
  const linkHint = /联接/.test(r.name) ? "<small>ETF\u8054\u63A5\u672A\u7A7F\u900F\u76EE\u6807ETF</small>" : "";
  if (!h?.items?.length) return `<span class="muted">${busy ? "\u6B63\u5728\u52A0\u8F7D\u5DF2\u62AB\u9732\u6301\u4ED3\u2026" : error ? "\u6301\u4ED3\u83B7\u53D6\u5931\u8D25\uFF0C\u5E76\u975E\u6CA1\u6709\u6301\u4ED3" : h?.status === "unavailable" ? "\u516C\u5F00\u6765\u6E90\u6682\u672A\u8FD4\u56DE\u76F4\u63A5\u80A1\u7968\u6301\u4ED3" : "\u6301\u4ED3\u5C1A\u672A\u52A0\u8F7D"}</span>${linkHint}<br>${source}${action}`;
  return `<ul class="hold-list">${h.items.slice(0, 3).map((p) => `<li><span>${esc(p.name)}</span><strong>${Number.isFinite(p.weight) ? p.weight.toFixed(2) + "%" : "\u672A\u62AB\u9732\u5360\u6BD4"}</strong></li>`).join("")}</ul><small>\u5360\u57FA\u91D1\u51C0\u503C \xB7 \u62A5\u544A\u671F ${esc(h.date || "\u672A\u77E5")}${error ? " \xB7 \u66F4\u65B0\u5931\u8D25\uFF0C\u4FDD\u7559\u5DF2\u53D6\u5F97\u6570\u636E" : ""}</small>${linkHint}${source}${action}`;
}
function chartMarkup(rows, result) {
  const good = result.metrics.filter((m) => !m.error);
  if (!good.length) {
    const pending = days > 30 && rows.some((r) => historyLoading.has(r.code)), failed = days > 30 && rows.some((r) => historyErrors[r.code]);
    return `<div class="empty-compare" role="status">${pending ? "\u6B63\u5728\u8F7D\u5165\u5386\u53F2\u51C0\u503C\uFF0C\u8BF7\u7A0D\u5019\u2026" : failed ? "\u5386\u53F2\u51C0\u503C\u52A0\u8F7D\u5931\u8D25\uFF0C\u6682\u65F6\u65E0\u6CD5\u7ED8\u56FE\uFF1B\u8FD9\u4E0D\u4EE3\u8868\u57FA\u91D1\u5386\u53F2\u4E0D\u8DB3\u3002\u8BF7\u70B9\u51FB\u4E0B\u65B9\u201C\u91CD\u8BD5\u5386\u53F2\u51C0\u503C\u201D\u3002" : "\u5F53\u524D\u6240\u9009\u57FA\u91D1\u6CA1\u6709\u8DB3\u591F\u7684\u53EF\u6BD4\u51C0\u503C\uFF0C\u6682\u4E0D\u7ED8\u5236\u8D70\u52BF\u56FE\uFF1B\u5177\u4F53\u539F\u56E0\u89C1\u4E0B\u65B9\u6536\u76CA\u884C\u3002"}</div>`;
  }
  const all = good.flatMap((m) => m.series.map((p) => p[1] - 1)), lo = Math.min(0, ...all), hi = Math.max(0, ...all), pad = Math.max((hi - lo) * 0.12, 3e-3), min = lo - pad, max = hi + pad;
  const width = Math.max(280, $("comparison").clientWidth - 48), right = width - 20;
  const first = Math.min(...good.flatMap((m) => m.series.map((p) => p[0]))), last = Math.max(...good.flatMap((m) => m.series.map((p) => p[0]))), x = (v) => 62 + (v - first) / Math.max(1, last - first) * (right - 62), y = (v) => 230 - (v - min) / (max - min) * 205;
  const grid = [min, (max + min) / 2, max].map((v) => `<line x1="62" x2="${right}" y1="${y(v)}" y2="${y(v)}" stroke="#dce5dd"/><text x="52" y="${y(v) + 4}" text-anchor="end" fill="#60766d" font-size="14">${(v * 100).toFixed(1)}%</text>`).join("");
  return `<section class="comparison-chart"><h3>\u4ECE\u540C\u4E00\u5929\u3001\u540C\u4E00\u4E2A\u8D77\u70B9\u770B\u8D70\u52BF</h3><p>${result.start} \u2014 ${result.end} \xB7 \u4EE5\u5171\u540C\u9996\u65E5\u4E3A0% \xB7 \u5206\u7EA2\u518D\u6295\u8D44\u53E3\u5F84</p><svg class="compare-svg" viewBox="0 0 ${width} 275" preserveAspectRatio="none" role="img" aria-label="${esc(rows.map((r) => r.name).join("\u3001"))}\u5171\u540C\u671F\u95F4\u6536\u76CA\u8D70\u52BF"><title>\u6A2A\u8F74\u4E3A\u5B9E\u9645\u51C0\u503C\u65E5\u671F\uFF0C\u7EB5\u8F74\u4E3A\u76F8\u5BF9\u5171\u540C\u9996\u65E5\u7684\u7D2F\u8BA1\u6536\u76CA\uFF1B\u7F3A\u5931\u6570\u636E\u4E0D\u8865\u70B9\u3002</title>${grid}<line x1="62" x2="${right}" y1="${y(0)}" y2="${y(0)}" stroke="#90a79b" stroke-dasharray="4 5"/>${good.map((m) => {
    const i = rows.findIndex((r) => r.code === m.code);
    return `<polyline points="${m.series.map((p) => `${x(p[0])},${y(p[1] - 1)}`).join(" ")}" stroke="${colors[i]}" stroke-width="3" stroke-linejoin="round" fill="none" vector-effect="non-scaling-stroke"><title>${esc(rows[i].name)}\uFF1A${pct(m.change)}</title></polyline>`;
  }).join("")}<text x="62" y="263" fill="#60766d" font-size="14">${result.start}</text><text x="${right}" y="263" text-anchor="end" fill="#60766d" font-size="14">${result.end}</text></svg><div class="chart-legend">${good.map((m) => {
    const i = rows.findIndex((r) => r.code === m.code);
    return `<span><i class="color-dot" style="background:${colors[i]}"></i>${esc(rows[i].name)} <b>${pct(m.change)}</b></span>`;
  }).join("")}</div>${good.length < rows.length ? "<p>\u90E8\u5206\u57FA\u91D1\u56E0\u6570\u636E\u4E0D\u8DB3\u672A\u7ED8\u5236\uFF1B\u539F\u56E0\u5217\u5728\u4E0B\u65B9\u6536\u76CA\u884C\u3002</p>" : ""}</section>`;
}
function renderComparison() {
  if (!D || !anchor) return;
  const rows = selected.map((c) => byCode.get(c)), result = comparisonResult(rows), metrics = new Map(result.metrics.map((m) => [m.code, m]));
  setQueue("fund", rows.map(researchFund), days);
  $("selection").innerHTML = `<div class="selection">${rows.map((r, i) => `<button ${i ? `data-remove="${r.code}"` : "disabled"}><i class="color-dot" style="background:${colors[i]}"></i><span>${esc(r.name)}${i ? " \xD7" : " \xB7 \u53C2\u7167"}</span></button>`).join("")}</div>`;
  const feeRows = rows.map((r) => ({ r, fee: fixedFee(getP(r)) })).filter((r) => r.fee !== null), companies2 = new Set(rows.map((r) => getP(r)?.company).filter(Boolean)), indices = rows.map((r) => indexKey(getP(r))), knownIndices = indices.filter(Boolean), sameIndex = rows.length > 1 && knownIndices.length === rows.length && new Set(knownIndices).size === 1;
  const summary = rows.length > 1 ? `<div class="comparison-summary"><div class="summary-item"><b>${companies2.size ? companies2.size + " \u5BB6\u5DF2\u6838\u9A8C\u57FA\u91D1\u516C\u53F8" : rows.some((r) => loading.has(r.code)) ? "\u6B63\u5728\u8BFB\u53D6\u57FA\u91D1\u516C\u53F8\u2026" : "\u57FA\u91D1\u516C\u53F8\u8D44\u6599\u5F85\u53D6\u5F97"}</b><p>${companies2.size === 1 && rows.every((r) => getP(r)) ? "\u76EE\u524D\u9009\u4E2D\u4EA7\u54C1\u5C5E\u4E8E\u540C\u4E00\u5BB6\u516C\u53F8\uFF0C\u53EF\u4EE5\u518D\u52A0\u5165\u5176\u4ED6\u516C\u53F8\u7684\u5019\u9009\u3002" : rows.some((r) => !getP(r)) ? "\u90E8\u5206\u516C\u53F8\u8D44\u6599\u4ECD\u5F85\u53D6\u5F97\u3002" : "\u53EF\u4EE5\u7ED3\u5408\u8D39\u7528\u3001\u6295\u8D44\u8303\u56F4\u4E0E\u6301\u4ED3\u5224\u65AD\u5DEE\u5F02\u3002"}</p></div><div class="summary-item"><b>${sameIndex ? "\u8DDF\u8E2A\u6807\u7684\u76F8\u540C" : new Set(knownIndices).size > 1 ? "\u8DDF\u8E2A\u6807\u7684\u4E0D\u540C" : "\u6838\u5BF9\u4EA7\u54C1\u6295\u8D44\u8303\u56F4"}</b><p>${sameIndex ? esc(knownIndices[0]) + "\uFF1B\u7ED3\u6784\u3001\u4EFD\u989D\u548C\u8D39\u7528\u4ECD\u53EF\u80FD\u4E0D\u540C\u3002" : "\u540C\u677F\u5757\u4E0D\u7B49\u4E8E\u540C\u4E00\u6307\u6570\uFF1B\u4E3B\u52A8\u57FA\u91D1\u4E5F\u53EF\u80FD\u8C03\u6574\u6301\u4ED3\u3002"}</p></div><div class="summary-item"><b>${feeRows.length > 1 ? Math.min(...feeRows.map((v) => v.fee)).toFixed(2) + "%\u2014" + Math.max(...feeRows.map((v) => v.fee)).toFixed(2) + "% / \u5E74" : "\u56FA\u5B9A\u5E74\u8D39\u7387\u5F85\u6BD4\u8F83"}</b><p>\u5DF2\u53D6\u5F97\u4EA7\u54C1\u7684\u516C\u5E03\u7BA1\u7406\u3001\u6258\u7BA1\u3001\u9500\u552E\u670D\u52A1\u8D39\u7387\u4E4B\u548C\uFF0C\u4E0D\u4EE3\u8868\u5168\u90E8\u8D39\u7528\u6216\u5B9E\u9645\u6263\u8D39\u91D1\u989D\u3002</p></div></div>` : '<div class="empty-compare">\u53C2\u7167\u57FA\u91D1\u5DF2\u52A0\u5165\u3002\u518D\u52A0\u5165\u81F3\u5C11\u4E00\u53EA\u5019\u9009\uFF0C\u5373\u53EF\u67E5\u770B\u516C\u53F8\u95F4\u5DEE\u5F02\u3002</div>';
  const fields = [
    ["\u57FA\u91D1\u7BA1\u7406\u516C\u53F8", companyMarkup],
    ["\u57FA\u91D1\u7ECF\u7406", (r) => profileValue(r, "manager")],
    ["\u4EA7\u54C1\u7ED3\u6784 / \u4EFD\u989D", (r) => `${esc(productKind(r))} \xB7 ${esc(shareClass(r))}\u4EFD\u989D<small>${esc(r.type)}</small>`],
    ["\u8DDF\u8E2A\u6807\u7684", (r) => profileValue(r, "tracking")],
    ["\u4E1A\u7EE9\u6BD4\u8F83\u57FA\u51C6", (r) => profileValue(r, "benchmark")],
    ["\u5171\u540C\u671F\u95F4\u6536\u76CA", (r) => {
      const m = metrics.get(r.code);
      return m.error ? `<span class="muted">${esc(m.error)}</span>${days > 30 && historyErrors[r.code] ? `<br><button data-history-retry="${r.code}">\u91CD\u8BD5\u5386\u53F2\u51C0\u503C</button>` : ""}` : `<strong class="metric-value">${pct(m.change)}</strong><small>${result.start} \u2014 ${result.end}</small>`;
    }],
    ["\u533A\u95F4\u6700\u5927\u56DE\u64A4", (r) => {
      const m = metrics.get(r.code);
      return m.error ? "\u2014" : `${(m.drawdown * 100).toFixed(2)}%<small>\u4EC5\u6B64\u6BD4\u8F83\u533A\u95F4\u5185\u7684\u5CF0\u503C\u5230\u8C37\u503C\u8DCC\u5E45</small>`;
    }],
    ["\u533A\u95F4\u632F\u5E45", (r) => {
      const m = metrics.get(r.code);
      return m.error ? "\u2014" : (m.amplitude * 100).toFixed(2) + "%";
    }],
    ["\u7BA1\u7406\u8D39\u7387", (r) => rate(getP(r)?.management)],
    ["\u6258\u7BA1\u8D39\u7387", (r) => rate(getP(r)?.custody)],
    ["\u9500\u552E\u670D\u52A1\u8D39\u7387", (r) => rate(getP(r)?.service)],
    ["\u516C\u5E03\u56FA\u5B9A\u5E74\u8D39\u7387\u5408\u8BA1", (r) => `${rate(fixedFee(getP(r)))}<small>ETF\u8054\u63A5\u7B49\u4EA7\u54C1\u7684\u8BA1\u8D39\u57FA\u6570\u53EF\u80FD\u4E0D\u540C\uFF0C\u8BE6\u89C1\u6CD5\u5F8B\u6587\u4EF6\u3002</small>`],
    ["\u7533\u8D2D / \u8D4E\u56DE\u8D39\u7528", (r) => `\u968F\u5E73\u53F0\u3001\u91D1\u989D\u3001\u6301\u6709\u5929\u6570\u53D8\u5316<small><a href="https://fundf10.eastmoney.com/jjfl_${r.code}.html" target="_blank" rel="noopener">\u67E5\u770B\u5B8C\u6574\u8D39\u7387\u8868</a></small>`],
    ["\u51C0\u8D44\u4EA7\u89C4\u6A21", (r) => profileValue(r, "size")],
    ["\u6210\u7ACB\u65E5\u671F / \u521D\u59CB\u89C4\u6A21", (r) => profileValue(r, "inception")],
    ["\u524D\u4E09\u5927\u76F4\u63A5\u80A1\u7968\u6301\u4ED3", heldMarkup],
    ["\u6295\u8D44\u76EE\u6807\u4E0E\u8303\u56F4", (r) => getP(r) ? `<details><summary>\u5C55\u5F00\u6863\u6848\u8282\u9009</summary><p>${esc(getP(r).objective || "\u6295\u8D44\u76EE\u6807\u672A\u53D6\u5F97")}</p><p>${esc(getP(r).scope || "\u6295\u8D44\u8303\u56F4\u672A\u53D6\u5F97")}</p><small>\u8282\u9009\u53EF\u80FD\u7701\u7565\u540E\u7EED\u5185\u5BB9\uFF0C\u8BF7\u4EE5\u5B8C\u6574\u6587\u4EF6\u4E3A\u51C6\u3002</small><a href="https://fundf10.eastmoney.com/jbgk_${r.code}.html" target="_blank" rel="noopener">\u67E5\u770B\u5B8C\u6574\u6863\u6848</a></details>` : "\u672A\u53D6\u5F97"],
    ["\u8D44\u6599\u6765\u6E90 / \u68C0\u67E5\u65F6\u95F4", (r) => {
      const p = getP(r);
      return `<a href="https://fundf10.eastmoney.com/jbgk_${r.code}.html" target="_blank" rel="noopener">\u5929\u5929\u57FA\u91D1\u516C\u5F00\u6863\u6848</a><small>${p ? esc(p.checkedAt.replace("T", " ").slice(0, 16)) + " UTC" : "\u5C1A\u672A\u53D6\u5F97"}</small>${profileErrors[r.code] ? `<small class="error">${esc(profileErrors[r.code])}</small>` : ""}${loading.has(r.code) ? "<small>\u6B63\u5728\u6838\u9A8C\u6700\u65B0\u8D44\u6599\u2026</small>" : `<button data-retry="${r.code}" style="margin-top:8px">\u91CD\u65B0\u6838\u9A8C</button>`}`;
    }]
  ];
  $("comparison").innerHTML = summary + (days > 30 ? `<p class="hint" role="status">${days === 180 ? "\u6700\u8FD1\u534A\u5E74 \xB7 180" : "\u6700\u8FD1\u4E00\u5E74 \xB7 365"}\u81EA\u7136\u65E5 \xB7 \u622A\u6B62 ${D.context.asof}${rows.some((r) => historyLoading.has(r.code)) ? " \xB7 \u6B63\u5728\u8F7D\u5165\u5386\u53F2\u51C0\u503C\u2026" : ""} \xB7 \u6570\u636E\u4E0D\u8DB3\u7684\u57FA\u91D1\u4E0D\u53C2\u4E0E\u6536\u76CA\u6BD4\u8F83\u3002</p>` : "") + chartMarkup(rows, result) + `<div class="compare-table-wrap"><table class="compare-table" style="min-width:${165 + rows.length * 250}px"><thead><tr><th scope="col">\u5BF9\u6BD4\u9879\u76EE</th>${rows.map((r, i) => `<th scope="col"><i class="color-dot" style="background:${colors[i]}"></i> ${esc(r.name)}<small>${r.code}</small></th>`).join("")}</tr></thead><tbody>${fields.map(([label, cell]) => `<tr><th scope="row">${label}</th>${rows.map((r) => `<td>${cell(r)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.query) {
    $("fundQuery").value = b.dataset.query;
    searchLimit = 20;
    refreshSearch();
  }
  if (b.dataset.anchor) chooseAnchor(b.dataset.anchor);
  if (b.id === "moreSearch") {
    searchLimit += 20;
    refreshSearch();
  }
  if (b.dataset.add) {
    const code = b.dataset.add;
    if (selected.includes(code)) return;
    if (selected.length >= 4) return notice("\u6700\u591A\u540C\u65F6\u6BD4\u8F834\u53EA\uFF0C\u8BF7\u5148\u79FB\u9664\u4E00\u53EA\u3002");
    selected.push(code);
    visit(researchFund(byCode.get(code)));
    refreshSearch();
    renderPeers();
    renderComparison();
    loadProfile(code);
    loadHoldings(code);
    ensureHistory();
    notice("\u5DF2\u52A0\u5165\u4E0B\u65B9\u5BF9\u6BD4\u8868");
  }
  if (b.dataset.remove) {
    selected = selected.filter((c) => c !== b.dataset.remove);
    refreshSearch();
    renderPeers();
    renderComparison();
  }
  if (b.dataset.holdingsRetry) loadHoldings(b.dataset.holdingsRetry, true);
  if (b.dataset.retry) loadProfile(b.dataset.retry, true);
  if (b.dataset.historyRetry) loadHistory(b.dataset.historyRetry);
});
$("searchForm").onsubmit = (e) => {
  e.preventDefault();
  searchLimit = 20;
  refreshSearch();
};
var searchTimer;
$("fundQuery").oninput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchLimit = 20;
    refreshSearch();
  }, 180);
};
for (const id of ["sector", "kind", "share"]) $(id).onchange = () => {
  sector = $("sector").value;
  peerLimit = 9;
  renderPeers();
};
$("peerQuery").oninput = () => {
  peerLimit = 9;
  renderPeers();
};
$("morePeers").onclick = () => {
  peerLimit += 9;
  renderPeers();
};
$("period").onchange = () => {
  days = Number($("period").value);
  renderComparison();
  ensureHistory();
};
async function boot() {
  try {
    const r = await fetch("/compare-data.json");
    if (!r.ok) throw Error();
    D = await r.json();
    byCode = new Map(D.rows.map((r2) => [r2.code, r2]));
    try {
      const p = await fetch("/compare-profiles.json");
      if (p.ok) seed = await p.json();
    } catch {
    }
    $("fundQuery").disabled = false;
    $("searchButton").disabled = false;
    $("dataStatus").textContent = `${D.rows.length.toLocaleString()} \u4E2A\u573A\u5916\u57FA\u91D1\u4EFD\u989D \xB7 \u6B63\u5F0F\u51C0\u503C\u622A\u6B62 ${D.context.asof} \xB7 \u5F53\u524D\u8D44\u6599\u5BF9\u6BD4\uFF0C\u4E0D\u7528\u4E8E\u5386\u53F2\u6F14\u7EC3\u5224\u5B9A`;
    const params = new URL(location.href).searchParams, initial = readComparisonLink(params, (c) => byCode.has(c));
    if (!initial.codes.length && !params.has("q")) {
      const saved = readState().queues.fund;
      if (saved) {
        initial.codes = saved.items.map((i) => i.code).filter((c) => byCode.has(c));
        initial.days = saved.days;
      }
    }
    days = initial.days;
    $("period").value = String(days);
    if (initial.codes.length) {
      chooseAnchor(initial.codes[0], initial.codes, false);
      $("fundQuery").value = initial.codes[0];
      $(location.hash === "#share-guide" ? "share-guide" : initial.codes.length > 1 ? "selection" : "workbench").scrollIntoView({ block: "start" });
    } else if (params.get("q")) $("fundQuery").value = params.get("q").slice(0, 80);
    refreshSearch();
  } catch {
    $("dataStatus").innerHTML = '\u57FA\u91D1\u6570\u636E\u6682\u672A\u8F7D\u5165\u3002<button id="retryData">\u91CD\u8BD5</button>';
    $("retryData").onclick = boot;
  }
}
boot();
var resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!D || !anchor) return;
    const rows = selected.map((c) => byCode.get(c)), chart = document.querySelector(".comparison-chart");
    if (chart) chart.outerHTML = chartMarkup(rows, comparisonResult(rows));
  }, 150);
});
