// portfolio-core.mjs
var MARKETS = { fund: { name: "\u57FA\u91D1", currency: "CNY", unit: "\u4EBA\u6C11\u5E01" }, cn: { name: "A\u80A1", currency: "CNY", unit: "\u4EBA\u6C11\u5E01" }, us: { name: "\u7F8E\u80A1", currency: "USD", unit: "\u7F8E\u5143" }, hk: { name: "\u6E2F\u80A1", currency: "HKD", unit: "\u6E2F\u5E01" } };
var finite = (n) => typeof n === "number" && Number.isFinite(n);
var sum = (a) => a.reduce((n, v) => n + v, 0);
var round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
var emptyBook = () => ({ date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), cash: 0, horizon: "", reserve: null, singleLimit: null, sectorLimit: null, rows: [] });
function validCode(m, c) {
  return (m === "fund" || m === "cn" ? /^\d{6}$/ : m === "hk" ? /^\d{5}$/ : /^[A-Z0-9.^-]{1,16}$/).test(c);
}
function familyKey(r, m) {
  return m === "fund" && r.known ? r.name.replace(/(?:[A-Z])(?:类|份额)?(?:[（(][^）)]*[）)])?$/, "") : r.code;
}
function validateBook(book2, market2) {
  const errors = [];
  if (!Object.hasOwn(MARKETS, market2)) return ["\u5E02\u573A\u65E0\u6548"];
  if (!book2 || !Array.isArray(book2.rows)) return ["\u6301\u4ED3\u683C\u5F0F\u65E0\u6548"];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(book2.date || "") || !Number.isFinite(Date.parse(book2.date + "T00:00:00Z")) || (/* @__PURE__ */ new Date(book2.date + "T00:00:00Z")).toISOString().slice(0, 10) !== book2.date) errors.push("\u8BF7\u586B\u5199\u6709\u6548\u7684\u6301\u4ED3\u4F30\u503C\u65E5\u671F");
  if (!finite(book2.cash) || book2.cash < 0 || book2.cash > 1e12) errors.push("\u53EF\u7528\u73B0\u91D1\u5E94\u4E3A0\u5230\u4E00\u4E07\u4EBF\u4E4B\u95F4\u7684\u91D1\u989D");
  if (book2.rows.length > 50) errors.push("\u6BCF\u4E2A\u5E02\u573A\u6700\u591A\u4FDD\u5B5850\u53EA\u6301\u4ED3");
  if (!["", "1", "6", "12", "36"].includes(String(book2.horizon))) errors.push("\u6301\u6709\u8BA1\u5212\u65E0\u6548");
  for (const key of ["singleLimit", "sectorLimit"]) if (book2[key] !== null && (!finite(book2[key]) || book2[key] <= 0 || book2[key] > 100)) errors.push("\u4ED3\u4F4D\u4E0A\u9650\u5E94\u5927\u4E8E0\u4E14\u4E0D\u8D85\u8FC7100%");
  if (book2.reserve !== null && (!finite(book2.reserve) || book2.reserve < 0 || book2.reserve > 1e12)) errors.push("\u73B0\u91D1\u4FDD\u7559\u91D1\u989D\u65E0\u6548");
  const seen = /* @__PURE__ */ new Set();
  for (const r of book2.rows) {
    if (!r || typeof r !== "object") {
      errors.push("\u6301\u4ED3\u683C\u5F0F\u65E0\u6548");
      continue;
    }
    if (!validCode(market2, r.code || "") || !String(r.name || "").trim() || String(r.name).length > 100) errors.push("\u8BF7\u6838\u5BF9\u6301\u4ED3\u4EE3\u7801\u548C\u540D\u79F0");
    if (seen.has(r.code)) errors.push("\u540C\u4E00\u4EE3\u7801\u8BF7\u5408\u5E76\u6210\u4E00\u6761\u6301\u4ED3");
    seen.add(r.code);
    if (!finite(r.value) || r.value <= 0 || r.value > 1e12) errors.push("\u6301\u4ED3\u5E02\u503C\u5FC5\u987B\u5927\u4E8E0\u4E14\u4E0D\u8D85\u8FC7\u4E00\u4E07\u4EBF");
    if (r.cost !== null && (!finite(r.cost) || r.cost <= 0 || r.cost > 1e12)) errors.push("\u6210\u672C\u7559\u7A7A\u6216\u586B\u5199\u5927\u4E8E0\u7684\u5269\u4F59\u6301\u4ED3\u6210\u672C");
    if (r.target !== null && (!finite(r.target) || r.target < 0 || r.target > 100)) errors.push("\u76EE\u6807\u4ED3\u4F4D\u5E94\u4E3A0\u5230100%");
    if (typeof r.sector !== "string" || r.sector.length > 60) errors.push("\u677F\u5757\u540D\u79F0\u4E0D\u80FD\u8D85\u8FC760\u5B57");
  }
  return [...new Set(errors)];
}
function groups(rows, key) {
  const result = /* @__PURE__ */ new Map();
  rows.forEach((r, i) => {
    const k = key(r);
    if (!k) return;
    if (!result.has(k)) result.set(k, []);
    result.get(k).push(i);
  });
  return result;
}
function analyzePortfolio(book2, market2) {
  const errors = validateBook(book2, market2);
  if (errors.length) return { errors };
  const rows = book2.rows, held = sum(rows.map((r) => r.value)), total = held + book2.cash, knownCost = rows.filter((r) => r.cost !== null), cost = sum(knownCost.map((r) => r.cost)), profit = sum(knownCost.map((r) => r.value - r.cost));
  const products = groups(rows, (r) => familyKey(r, market2)), sectors2 = groups(rows, (r) => r.sector.trim());
  const distribution = [...sectors2].map(([name, ids]) => ({ name, value: sum(ids.map((i) => rows[i].value)), count: ids.length })).sort((a, b) => b.value - a.value);
  const unknownValue = sum(rows.filter((r) => !r.sector.trim()).map((r) => r.value));
  const issues = [], blocks = [], reasons = rows.map(() => /* @__PURE__ */ new Set()), remaining = rows.map((r) => r.value);
  if (!rows.length) blocks.push("\u5148\u5F55\u5165\u81F3\u5C11\u4E00\u53EA\u6301\u4ED3");
  if (!book2.horizon) blocks.push("\u8865\u5145\u8BA1\u5212\u6301\u6709\u65F6\u95F4\uFF0C\u518D\u751F\u6210\u91D1\u989D\u65B9\u6848");
  const targets = rows.filter((r) => r.target !== null);
  const fullTargets = rows.length > 0 && targets.length === rows.length;
  if (targets.length && !fullTargets) blocks.push("\u5DF2\u586B\u5199\u90E8\u5206\u76EE\u6807\u4ED3\u4F4D\uFF1A\u8BF7\u4E3A\u6BCF\u53EA\u586B\u5199\u76EE\u6807\uFF0C\u6216\u5168\u90E8\u6E05\u7A7A\u540E\u6309\u4ED3\u4F4D\u4E0A\u9650\u5206\u6790");
  if (!targets.length && book2.reserve === null && book2.singleLimit === null && book2.sectorLimit === null) blocks.push("\u586B\u5199\u73B0\u91D1\u4FDD\u7559\u91D1\u989D\u6216\u4ED3\u4F4D\u4E0A\u9650\uFF0C\u624D\u80FD\u8BA1\u7B97\u8C03\u6574\u91D1\u989D");
  if (book2.date > (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)) blocks.push("\u4F30\u503C\u65E5\u671F\u5728\u672A\u6765\uFF0C\u8BF7\u6838\u5BF9");
  const age = Math.floor((Date.now() - Date.parse(book2.date + "T00:00:00Z")) / 864e5);
  if (age > 7) blocks.push("\u8FD9\u4EFD\u6301\u4ED3\u5DF2\u8D85\u8FC77\u4E2A\u81EA\u7136\u65E5\uFF0C\u8BF7\u66F4\u65B0\u5E02\u503C\u548C\u4F30\u503C\u65E5\u671F\u540E\u751F\u6210\u91D1\u989D\u65B9\u6848");
  if (book2.reserve !== null && book2.reserve > total + 0.01) blocks.push("\u73B0\u91D1\u4FDD\u7559\u91D1\u989D\u8D85\u8FC7\u672C\u8D26\u6237\u603B\u8D44\u4EA7\uFF0C\u9700\u8981\u8865\u5145\u8D44\u91D1\u6216\u4FEE\u6539\u76EE\u6807");
  const cap = book2.singleLimit === null ? null : total * book2.singleLimit / 100, sectorCap = book2.sectorLimit === null ? null : total * book2.sectorLimit / 100;
  for (const [name, ids] of products) {
    const v = sum(ids.map((i) => rows[i].value));
    if (cap !== null && v > cap + 0.01) issues.push({ type: "single", title: name + " \u8D85\u8FC7\u5355\u4E00\u4EA7\u54C1\u4E0A\u9650", amount: round(v - cap), text: `\u5F53\u524D ${(total ? v / total * 100 : 0).toFixed(1)}%\uFF0C\u4F60\u8BBE\u5B9A ${book2.singleLimit}%${ids.length > 1 ? "\uFF1B\u540C\u540D\u57FA\u91D1\u4EFD\u989D\u5408\u5E76\u7EDF\u8BA1" : ""}` });
  }
  for (const d of distribution) if (sectorCap !== null && d.value > sectorCap + 0.01) issues.push({ type: "sector", title: d.name + " \u8D85\u8FC7\u677F\u5757\u4E0A\u9650", amount: round(d.value - sectorCap), text: `\u5F53\u524D ${(total ? d.value / total * 100 : 0).toFixed(1)}%\uFF0C\u4F60\u8BBE\u5B9A ${book2.sectorLimit}%` });
  if (book2.reserve !== null && book2.cash < book2.reserve - 0.01) issues.push({ type: "cash", title: "\u53EF\u7528\u73B0\u91D1\u4F4E\u4E8E\u4FDD\u7559\u91D1\u989D", amount: round(book2.reserve - book2.cash), text: "\u5356\u51FA\u6216\u8D4E\u56DE\u540E\u7684\u8D44\u91D1\uFF0C\u4ECD\u9700\u7B49\u5F85\u5B9E\u9645\u5230\u8D26" });
  if (unknownValue > 0) issues.push({ type: "unknown", title: "\u6709\u6301\u4ED3\u672A\u586B\u5199\u677F\u5757", amount: unknownValue, text: "\u677F\u5757\u96C6\u4E2D\u5EA6\u53EA\u7EDF\u8BA1\u5DF2\u786E\u8BA4\u5206\u7C7B\uFF0C\u4E0D\u80FD\u636E\u6B64\u5224\u65AD\u6574\u4E2A\u8D26\u6237\u5DF2\u5206\u6563" });
  if (unknownValue > 0 && sectorCap !== null) blocks.push("\u5148\u586B\u5199\u5168\u90E8\u6301\u4ED3\u7684\u4E3B\u677F\u5757\uFF0C\u624D\u80FD\u6309\u677F\u5757\u4E0A\u9650\u8BA1\u7B97\u5B8C\u6574\u65B9\u6848");
  if (String(book2.horizon) === "1" && held > 0) issues.push({ type: "horizon", title: "\u4E00\u4E2A\u6708\u5185\u8BA1\u5212\u7528\u94B1\u6216\u9000\u51FA", amount: null, text: "\u5148\u6838\u5B9E\u8D44\u91D1\u7528\u9014\u3001\u4EA7\u54C1\u98CE\u9669\u548C\u4EA4\u6613\u5230\u8D26\u65F6\u95F4\uFF1B\u5982\u679C\u662F\u521A\u6027\u652F\u51FA\uFF0C\u8BF7\u628A\u9700\u8981\u7684\u91D1\u989D\u586B\u5165\u73B0\u91D1\u4FDD\u7559\u8981\u6C42" });
  if (fullTargets) {
    const targetSum = sum(rows.map((r) => r.target));
    if (targetSum > 100 + 1e-8) blocks.push("\u76EE\u6807\u4ED3\u4F4D\u5408\u8BA1\u8D85\u8FC7100%");
    rows.forEach((r, i) => remaining[i] = total * r.target / 100);
    if (book2.reserve !== null && total - sum(remaining) < book2.reserve - 0.01) blocks.push("\u76EE\u6807\u4ED3\u4F4D\u7559\u4E0B\u7684\u73B0\u91D1\u4E0D\u8DB3\uFF0C\u8BF7\u964D\u4F4E\u76EE\u6807\u4ED3\u4F4D\u6216\u8C03\u6574\u73B0\u91D1\u8981\u6C42");
    for (const [name, ids] of products) if (cap !== null && sum(ids.map((i) => remaining[i])) > cap + 0.01) blocks.push(name + " \u7684\u76EE\u6807\u4E0E\u5355\u4E00\u4EA7\u54C1\u4E0A\u9650\u51B2\u7A81");
    for (const [name, ids] of sectors2) if (sectorCap !== null && sum(ids.map((i) => remaining[i])) > sectorCap + 0.01) blocks.push(name + " \u7684\u76EE\u6807\u4E0E\u677F\u5757\u4E0A\u9650\u51B2\u7A81");
    if (unknownValue && sectorCap !== null) blocks.push("\u586B\u5199\u5168\u90E8\u677F\u5757\u540E\uFF0C\u624D\u80FD\u6838\u5BF9\u76EE\u6807\u4ED3\u4F4D\u662F\u5426\u6EE1\u8DB3\u677F\u5757\u4E0A\u9650");
    rows.forEach((r, i) => {
      if (Math.abs(remaining[i] - r.value) > 0.01) reasons[i].add("\u8C03\u6574\u81F3\u4F60\u586B\u5199\u7684\u76EE\u6807\u4ED3\u4F4D " + r.target + "%");
    });
  } else if (!targets.length) {
    const reduce = (ids, amount, reason) => {
      const base = sum(ids.map((i) => remaining[i]));
      if (base <= 0) return;
      const ratio = Math.max(0, Math.min(1, amount / base));
      ids.forEach((i) => {
        const reduction = remaining[i] * ratio;
        if (reduction > 5e-3) {
          remaining[i] -= reduction;
          reasons[i].add(reason);
        }
      });
    };
    if (cap !== null) for (const [, ids] of products) {
      const value = sum(ids.map((i) => remaining[i]));
      if (value > cap) reduce(ids, value - cap, "\u56DE\u5230\u5355\u4E00\u4EA7\u54C1\u4E0A\u9650 " + book2.singleLimit + "%");
    }
    if (sectorCap !== null) for (const [name, ids] of sectors2) {
      const value = sum(ids.map((i) => remaining[i]));
      if (value > sectorCap) reduce(ids, value - sectorCap, name + " \u56DE\u5230\u677F\u5757\u4E0A\u9650 " + book2.sectorLimit + "%");
    }
    const cashAfterCaps = total - sum(remaining), need = Math.max(0, (book2.reserve ?? 0) - cashAfterCaps);
    if (need > 5e-3) reduce(rows.map((_, i) => i), need, "\u6309\u5269\u4F59\u5E02\u503C\u6BD4\u4F8B\u8865\u8DB3\u73B0\u91D1\u8981\u6C42");
  }
  const plan = rows.map((r, i) => {
    const targetValue = round(remaining[i]), delta = round(targetValue - r.value);
    return { ...r, weight: total ? r.value / total : 0, profit: r.cost !== null ? r.value - r.cost : null, return: r.cost !== null ? r.value / r.cost - 1 : null, targetValue, delta, reasons: [...reasons[i]], action: delta > 5e-3 ? "\u589E\u52A0" : delta < -5e-3 ? "\u51CF\u5C11" : "\u89C2\u5BDF" };
  });
  const buy = round(sum(plan.map((r) => Math.max(0, r.delta)))), sell = round(sum(plan.map((r) => Math.max(0, -r.delta)))), cashAfter = round(book2.cash + sell - buy);
  if (cashAfter < 0) blocks.push("\u76EE\u6807\u91D1\u989D\u53D6\u6574\u540E\u8D85\u51FA\u53EF\u7528\u8D44\u4EA7\uFF0C\u8BF7\u7565\u5FAE\u964D\u4F4E\u76EE\u6807\u4ED3\u4F4D");
  return { errors: [], total, held, cost, profit, profitRate: cost ? profit / cost : null, costCoverage: knownCost.length, issues, blocks: [...new Set(blocks)], plan, fullTargets, distribution, unknownValue, buy, sell, cashAfter, allowed: blocks.length === 0, stressLoss: held * 0.1, stressRate: total ? held * 0.1 / total : 0, productCount: products.size };
}
function holdingOverlap(rows, evidence2) {
  const pairs = [];
  for (let a = 0; a < rows.length; a++) for (let b = a + 1; b < rows.length; b++) {
    const x = evidence2[rows[a].code]?.holdings, y = evidence2[rows[b].code]?.holdings;
    if (x?.status !== "ok" || y?.status !== "ok") continue;
    const names = x.items.filter((p) => y.items.some((q) => q.code === p.code && q.name === p.name)).map((p) => p.name);
    if (names.length) pairs.push({ a: rows[a].name, b: rows[b].name, names, dateA: x.date, dateB: y.date, sameDate: x.date === y.date });
  }
  return pairs;
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
function compareSeries(rows, c, days) {
  if (![7, 15, 30, 180, 365].includes(days)) throw Error("\u6BD4\u8F83\u671F\u95F4\u65E0\u6548");
  const begin = c.max_calendar_days - days, required = c.calendar_offsets.filter((x) => x >= begin), dateAt = (x) => new Date(Date.parse(c.history_start + "T00:00:00Z") + x * 864e5).toISOString().slice(0, 10);
  const pending = rows.map((r) => {
    const points = r.history.filter((p) => p[0] >= begin), present = new Set(points.map((p) => p[0]));
    let error = null;
    if (r.historyError) error = r.historyError;
    else if (days > c.max_calendar_days) error = "\u6240\u9009\u671F\u95F4\u5386\u53F2\u51C0\u503C\u5C1A\u672A\u8F7D\u5165";
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

// stock-peers-core.mjs
var PERIODS = [30, 90, 180, 365];
var finite2 = (v) => typeof v === "number" && Number.isFinite(v);
var dateShift = (d, n) => new Date(Date.parse(d + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
function priceMetrics(stock, calendar, asof, days) {
  if (!PERIODS.includes(days)) throw Error("\u4E0D\u652F\u6301\u7684\u89C2\u5BDF\u671F\u95F4");
  const start = dateShift(asof, 1 - days), dates = calendar.filter((d) => d >= start && d <= asof), empty = (reason) => ({ known: false, reason, start: dates[0] || start, end: asof, points: [], change: null, drawdown: null });
  if (dates.length < 2 || dates.at(-1) !== asof) return empty("\u5171\u540C\u4EA4\u6613\u65E5\u5386\u4E0D\u8DB3");
  const points = (stock.points || []).filter((p) => p[0] >= dates[0] && p[0] <= asof);
  if (points.length !== dates.length || points.some((p, i) => p[0] !== dates[i] || !finite2(p[1]) || p[1] <= 0)) return empty("\u89C2\u5BDF\u671F\u884C\u60C5\u4E0D\u5B8C\u6574\u3001\u4E0A\u5E02\u4E0D\u8DB3\u6216\u5B58\u5728\u7F3A\u5931\u4EA4\u6613\u65E5");
  const first = points[0][1], normalized = points.map((p) => [p[0], p[1] / first]);
  let peak = 1, drawdown = 0;
  for (const [, v] of normalized) {
    peak = Math.max(peak, v);
    drawdown = Math.max(drawdown, 1 - v / peak);
  }
  return { known: true, start: dates[0], end: asof, points: normalized, change: normalized.at(-1)[1] - 1, drawdown };
}

// portfolio.js
var $ = (id) => document.getElementById(id);
var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var KEY = "shixu-holdings-v1";
var money = (n) => new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(n);
var pct = (n) => Number.isFinite(n) ? (n >= 0 ? "+" : "") + (n * 100).toFixed(2) + "%" : "\u2014";
var market = new URL(location.href).searchParams.get("market") || "fund";
if (!Object.hasOwn(MARKETS, market)) market = "fund";
var books = Object.fromEntries(Object.keys(MARKETS).map((m) => [m, emptyBook()]));
var catalogs = {};
var evidence = {};
var catalogPromises = {};
var groupPromises = {};
var catalog = [];
var editCode = "";
var reportVisible = false;
var generation = 0;
var busy = false;
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
  for (const m of Object.keys(books)) if (saved[m] && validateBook(saved[m], m).length === 0) books[m] = saved[m];
} catch {
}
var book = () => books[market];
var num = (id) => $(id).value.trim() === "" ? null : Number($(id).value);
var note = (id, text) => {
  $(id).textContent = text;
  $(id).hidden = !text;
};
function save() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "{}");
    for (const m of Object.keys(books)) if (!validateBook(books[m], m).length) stored[m] = books[m];
    localStorage.setItem(KEY, JSON.stringify(stored));
    $("saveStatus").textContent = validateBook(book(), market).length ? "\u8F93\u5165\u5F85\u4FEE\u6B63 \xB7 \u672C\u6B21\u4FEE\u6539\u5C1A\u672A\u4FDD\u5B58" : "\u5DF2\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668";
  } catch {
    $("saveStatus").textContent = "\u6D4F\u89C8\u5668\u672A\u5141\u8BB8\u4FDD\u5B58 \xB7 \u5173\u95ED\u672C\u9875\u540E\u4F1A\u4E22\u5931";
  }
}
function settings() {
  const b = book();
  b.date = $("bookDate").value;
  b.cash = num("cash");
  for (const id of ["reserve", "singleLimit", "sectorLimit"]) b[id] = num(id);
  b.horizon = $("horizon").value;
  save();
  if (reportVisible) renderReport();
}
for (const id of ["bookDate", "cash", "horizon", "reserve", "singleLimit", "sectorLimit"]) $(id).addEventListener("change", settings);
async function getJSON(url, timeout = 18e3) {
  const r = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  if (!r.ok) throw Error("\u8D44\u6599\u6682\u672A\u53D6\u5F97");
  return r.json();
}
function loadCatalog(m) {
  if (catalogPromises[m]) return catalogPromises[m];
  catalogPromises[m] = (async () => {
    if (m === "fund") {
      const d2 = await getJSON("/portfolio-funds.json");
      return d2.rows.map((r) => ({ ...r, sector: tagsFor(r)[0] || "", classification: "\u57FA\u91D1\u540D\u79F0\u7EBF\u7D22\uFF0C\u6DFB\u52A0\u524D\u8BF7\u6838\u5BF9", known: true }));
    }
    const root = { cn: "stock-peer-data", us: "us-peer-data", hk: "hk-peer-data" }[m], d = await getJSON("/" + root + "/index.json"), map = new Map(d.industries.map((i) => [i.id, i]));
    return d.stocks.map((r) => ({ ...r, sector: map.get(r.industry)?.name || "", classification: "\u516C\u5F00\u884C\u4E1A\u5206\u7C7B \xB7 " + d.asof, known: true, root }));
  })().catch((e) => {
    delete catalogPromises[m];
    throw e;
  });
  return catalogPromises[m];
}
async function switchMarket(m) {
  generation++;
  busy = false;
  market = m;
  reportVisible = false;
  resetAdd();
  note("accountError", "");
  $("searchResults").hidden = true;
  const b = book(), meta = MARKETS[m];
  $("bookDate").value = b.date;
  for (const id of ["cash", "reserve", "singleLimit", "sectorLimit", "horizon"]) $(id).value = b[id] ?? "";
  $("bookNote").textContent = meta.name + "\u72EC\u7ACB\u8D26\u6237 \xB7 \u91D1\u989D\u7EDF\u4E00\u4F7F\u7528" + meta.unit + "\uFF08" + meta.currency + "\uFF09 \xB7 \u4E0D\u4E0E\u5176\u4ED6\u5E02\u573A\u5408\u5E76";
  document.querySelectorAll("[data-unit]").forEach((n) => n.textContent = "\xB7 " + meta.unit);
  document.querySelectorAll("[data-market]").forEach((n) => {
    n.setAttribute("aria-selected", String(n.dataset.market === m));
    n.tabIndex = n.dataset.market === m ? 0 : -1;
  });
  $("assetCode").placeholder = m === "us" ? "\u4F8B\u5982 NVDA" : m === "hk" ? "\u4F8B\u5982 00700" : "\u516D\u4F4D\u4EE3\u7801";
  $("compareLink").href = m === "fund" ? "/compare" : "/stock-peers?market=" + m;
  const url = new URL(location.href);
  url.searchParams.set("market", m);
  history.replaceState(null, "", url);
  document.dispatchEvent(new CustomEvent("demo:market", { detail: { market: m } }));
  $("diagnosis").innerHTML = '<div class="pf-empty"><span>03 / YOUR NEXT MOVE</span><h2>\u8BA9\u4E0B\u4E00\u6B65\u6709\u636E\u53EF\u4F9D\u3002</h2><p>\u5F55\u5165\u6301\u4ED3\uFF0C\u8BBE\u7F6E\u81EA\u5DF1\u7684\u8FB9\u754C\uFF0C\u518D\u751F\u6210\u5206\u6790\u3002</p></div>';
  $("evidenceStatus").textContent = "";
  $("refreshEvidence").disabled = !b.rows.length;
  renderPositions();
  catalog = [];
  $("catalogStatus").textContent = "\u6B63\u5728\u8BFB\u53D6" + meta.name + "\u540D\u5355\u2026";
  try {
    const rows = await loadCatalog(m);
    catalogs[m] = rows;
    if (market !== m) return;
    catalog = rows;
    $("catalogStatus").textContent = "\u53EF\u641C\u7D22 " + rows.length.toLocaleString() + " \u53EA\u5DF2\u6536\u5F55\u4EA7\u54C1\uFF1B\u540D\u5355\u5916\u53EF\u624B\u52A8\u586B\u5199\u3002";
  } catch {
    if (market === m) $("catalogStatus").textContent = "\u540D\u5355\u6682\u672A\u8F7D\u5165\uFF0C\u53EF\u4EE5\u624B\u52A8\u586B\u5199\u4EE3\u7801\u548C\u540D\u79F0\u3002";
  }
}
document.querySelectorAll("[data-market]").forEach((b) => b.onclick = () => switchMarket(b.dataset.market));
document.querySelector(".pf-markets").onkeydown = (e) => {
  const keys = ["fund", "cn", "us", "hk"];
  let i = keys.indexOf(market);
  if (e.key === "ArrowRight") i = (i + 1) % 4;
  else if (e.key === "ArrowLeft") i = (i + 3) % 4;
  else return;
  e.preventDefault();
  switchMarket(keys[i]);
  document.querySelector('[data-market="' + keys[i] + '"]').focus();
};
function choose(r) {
  $("assetCode").value = r.code;
  $("assetName").value = r.name;
  $("assetSector").value = r.sector || "";
  $("sectorHint").textContent = r.classification || "\u8BF7\u6838\u5BF9\u4E3B\u5206\u7C7B";
  $("securityQuery").value = r.name + " " + r.code;
  $("searchResults").hidden = true;
  $("assetValue").focus();
}
$("securityQuery").oninput = () => {
  const q = $("securityQuery").value.trim().toLowerCase();
  if (!q) {
    $("searchResults").hidden = true;
    return;
  }
  const hits = catalog.filter((r) => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.englishName?.toLowerCase().includes(q)).slice(0, 12);
  $("searchResults").innerHTML = hits.map((r) => `<button type="button" data-found="${esc(r.code)}"><b>${esc(r.name)}</b><span>${esc(r.code)} \xB7 ${esc(r.sector || "\u5206\u7C7B\u5F85\u786E\u8BA4")}</span></button>`).join("") || "<p>\u6CA1\u6709\u627E\u5230\uFF0C\u53EF\u5728\u4E0B\u65B9\u624B\u52A8\u586B\u5199\u3002</p>";
  $("searchResults").hidden = false;
};
$("searchResults").onclick = (e) => {
  const c = e.target.closest("[data-found]")?.dataset.found;
  if (c) choose(catalog.find((r) => r.code === c));
};
$("securityQuery").onkeydown = (e) => {
  if (e.key === "Escape") $("searchResults").hidden = true;
};
$("assetCode").onchange = () => {
  let c = $("assetCode").value.trim().toUpperCase();
  if (market === "hk" && /^\d{1,5}$/.test(c)) c = c.padStart(5, "0");
  const r = catalog.find((r2) => r2.code === c);
  if (r) choose(r);
};
function resetAdd() {
  editCode = "";
  $("addForm").reset();
  $("cancelEdit").hidden = true;
  $("addButton").textContent = "\u786E\u8BA4\u5E76\u52A0\u5165\u6301\u4ED3 \uFF0B";
  note("formError", "");
}
$("cancelEdit").onclick = resetAdd;
$("addForm").onsubmit = (e) => {
  e.preventDefault();
  settings();
  let code = $("assetCode").value.trim().toUpperCase();
  if (market === "hk" && /^\d{1,5}$/.test(code)) code = code.padStart(5, "0");
  const known = catalog.find((r2) => r2.code === code);
  const r = { code, name: known?.name || $("assetName").value.trim(), sector: $("assetSector").value.trim(), value: num("assetValue"), cost: num("assetCost"), target: num("assetTarget"), known: !!known, industry: known?.industry || "", type: known?.type || "" };
  const candidate = { ...book(), rows: [...book().rows.filter((r2) => r2.code !== editCode), r] }, errors = validateBook(candidate, market);
  if (errors.length) return note("formError", errors.join("\uFF1B"));
  books[market] = candidate;
  generation++;
  busy = false;
  save();
  resetAdd();
  renderPositions();
  $("refreshEvidence").disabled = false;
  if (reportVisible) renderReport();
};
function renderPositions() {
  const b = book();
  $("positionList").innerHTML = b.rows.length ? `<div class="pf-table-scroll"><table><thead><tr><th>\u6301\u4ED3 / \u4E3B\u677F\u5757</th><th>\u5E02\u503C</th><th>\u5269\u4F59\u6210\u672C</th><th>\u76EE\u6807\u4ED3\u4F4D</th><th>\u64CD\u4F5C</th></tr></thead><tbody>${b.rows.map((r) => `<tr><td><b>${esc(r.name)}</b><small>${esc(r.code)} \xB7 ${esc(r.sector || "\u677F\u5757\u5F85\u586B\u5199")}${r.known ? "" : " \xB7 \u624B\u52A8\u5F55\u5165"}</small></td><td>${money(r.value)}</td><td>${r.cost === null ? "\u672A\u586B\u5199" : money(r.cost)}</td><td>${r.target === null ? "\u672A\u8BBE\u7F6E" : r.target + "%"}</td><td><button data-edit="${esc(r.code)}">\u7F16\u8F91</button><button data-delete="${esc(r.code)}" aria-label="\u79FB\u9664${esc(r.name)}">\u79FB\u9664</button></td></tr>`).join("")}</tbody></table></div>` : '<div class="pf-entry-empty">\u8FD8\u6CA1\u6709\u6301\u4ED3\u3002\u5148\u52A0\u4E00\u53EA\u4F60\u5DF2\u7ECF\u6301\u6709\u7684\u4EA7\u54C1\u3002</div>';
}
$("positionList").onclick = (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.delete) {
    books[market].rows = book().rows.filter((r) => r.code !== b.dataset.delete);
    generation++;
    busy = false;
    $("refreshEvidence").disabled = !book().rows.length;
    save();
    renderPositions();
    if (reportVisible) renderReport();
    return;
  }
  if (b.dataset.edit) {
    const r = book().rows.find((r2) => r2.code === b.dataset.edit);
    editCode = r.code;
    for (const [id, key] of [["assetCode", "code"], ["assetName", "name"], ["assetSector", "sector"], ["assetValue", "value"], ["assetCost", "cost"], ["assetTarget", "target"]]) $(id).value = r[key] ?? "";
    $("addButton").textContent = "\u4FDD\u5B58\u8FD9\u53EA\u6301\u4ED3";
    $("cancelEdit").hidden = false;
    $("addForm").scrollIntoView({ behavior: "smooth", block: "center" });
    $("assetValue").focus({ preventScroll: true });
  }
};
function chart(points) {
  if (!points?.length) return "";
  const v = points.map((p) => p[1]), lo = Math.min(...v), hi = Math.max(...v), span = Math.max(1e-3, hi - lo);
  return `<svg class="pf-spark" viewBox="0 0 240 54" role="img" aria-label="\u5DF2\u62AB\u9732\u533A\u95F4\u76F8\u5BF9\u8D70\u52BF"><polyline fill="none" stroke="currentColor" stroke-width="2.5" points="${v.map((n, i) => (4 + i / Math.max(1, v.length - 1) * 232).toFixed(1) + "," + (48 - (n - lo) / span * 40).toFixed(1)).join(" ")}"/></svg>`;
}
function factMarkup(r) {
  const f = evidence[market]?.[r.code];
  if (!f) return '<p class="pf-muted">\u516C\u5F00\u8D44\u6599\u5C1A\u672A\u6838\u9A8C\u3002</p>';
  return `<div class="pf-facts">${f.error ? `<p class="pf-error">${esc(f.error)}</p>` : ""}${f.price?.known ? `<div><b>\u8FD130\u81EA\u7136\u65E5 ${pct(f.price.change)}</b><span>\u533A\u95F4\u6700\u5927\u56DE\u64A4 ${(f.price.drawdown * 100).toFixed(2)}%</span>${chart(f.price.points)}<small>${esc(f.price.start)} \u2014 ${esc(f.price.end)} \xB7 \u516C\u5F00\u8D70\u52BF\uFF0C\u4E0E\u4F60\u7684\u6301\u4ED3\u6536\u76CA\u4E0D\u540C</small></div>` : '<p class="pf-muted">' + esc(f.price?.reason || "\u8D70\u52BF\u6570\u636E\u672A\u53D6\u5F97") + "</p>"}${f.screen ? `<p>${esc(f.asof)} \u5FEB\u7167 \xB7 \u73B0\u6709\u7B5B\u9009\u89C4\u5219\uFF1A\u6A2A\u76D8 ${f.screen.range === true ? "\u7B26\u5408" : f.screen.range === false ? "\u4E0D\u7B26\u5408" : "\u5F85\u6838\u5B9E"} \xB7 \u7A81\u7834 ${f.screen.breakout === true ? "\u5DF2\u786E\u8BA4" : f.screen.breakout === false ? "\u672A\u786E\u8BA4" : "\u5F85\u6838\u5B9E"}\u3002\u672A\u786E\u8BA4\u7A81\u7834\u4E0D\u7B49\u4E8E\u5356\u51FA\u4FE1\u53F7\u3002</p>` : ""}${f.holdings?.items?.length ? `<p>\u62AB\u9732\u524D\u4E09\u5927\uFF1A${f.holdings.items.map((h) => esc(h.name) + (Number.isFinite(h.weight) ? " " + h.weight.toFixed(2) + "%" : "")).join(" / ")}</p><small>\u62A5\u544A\u671F ${esc(f.holdings.date)} \xB7 \u5360\u57FA\u91D1\u51C0\u503C \xB7 \u975E\u5B8C\u6574\u6216\u5B9E\u65F6\u6301\u4ED3${/联接/.test(r.name) ? " \xB7 \u672A\u7A7F\u900F\u76EE\u6807ETF" : ""}</small>` : market === "fund" ? '<p class="pf-muted">\u524D\u4E09\u5927\u76F4\u63A5\u80A1\u7968\u6301\u4ED3\u5C1A\u672A\u53D6\u5F97\uFF0C\u8BF7\u6838\u5BF9\u62AB\u9732\u3002</p>' : ""}<a href="${market === "fund" ? "/compare?code=" + r.code : "/stock-peers?" + new URLSearchParams({ market, code: r.code })}" target="_blank" rel="noopener">\u67E5\u770B\u5B8C\u6574\u5BF9\u6BD4\u4E0E\u6570\u636E\u6765\u6E90</a></div>`;
}
function renderReport() {
  const b = book(), a = analyzePortfolio(b, market);
  if (a.errors.length) {
    note("accountError", a.errors.join("\uFF1B"));
    $("diagnosis").innerHTML = '<div class="pf-empty">\u8F93\u5165\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5148\u4FEE\u6B63\u4E0A\u65B9\u9519\u8BEF\u540E\u91CD\u65B0\u5206\u6790\u3002</div>';
    return;
  }
  note("accountError", "");
  const unit = MARKETS[market].unit, coverage = a.costCoverage + "/" + b.rows.length + "\u53EA\u5DF2\u586B\u6210\u672C", e = evidence[market] || {}, overlap = market === "fund" ? holdingOverlap(b.rows, e) : [];
  $("diagnosis").innerHTML = `<div class="pf-report-heading"><span class="pf-eyebrow">03 / YOUR NEXT MOVE</span><h2>\u4F60\u7684${MARKETS[market].name}\u6301\u4ED3\u8BCA\u65AD</h2><p>${esc(b.date)} \u5F55\u5165\u5E02\u503C \xB7 ${unit}\u53E3\u5F84 \xB7 \u5360\u6BD4\u4EE5\u672C\u8D26\u6237\u603B\u8D44\u4EA7\u4E3A\u5206\u6BCD</p></div><div class="pf-metrics"><article><span>\u672C\u8D26\u6237\u603B\u8D44\u4EA7</span><strong>${money(a.total)}</strong><small>\u6301\u4ED3 ${money(a.held)} \uFF0B \u73B0\u91D1 ${money(b.cash)}</small></article><article><span>${a.costCoverage === b.rows.length ? "\u6301\u4ED3\u6D6E\u52A8\u76C8\u4E8F" : "\u5DF2\u586B\u6210\u672C\u90E8\u5206\u6D6E\u76C8\u4E8F"}</span><strong>${a.costCoverage ? pct(a.profitRate) : "\u2014"}</strong><small>${a.costCoverage ? money(a.profit) + " " + unit + " \xB7 " : ""}${coverage} \xB7 \u975E\u8D26\u6237\u603B\u6536\u76CA</small></article><article><span>\u5B9E\u9645\u4EA7\u54C1\u6570\u91CF</span><strong>${a.productCount} <i>\u7EC4</i></strong><small>${b.rows.length}\u6761\u6301\u4ED3${market === "fund" ? " \xB7 \u540C\u540D\u4EFD\u989D\u5408\u5E76\u68C0\u67E5\u96C6\u4E2D\u5EA6" : ""}</small></article></div>
 <div class="pf-analysis-grid"><section class="pf-panel"><h3>\u94B1\u5206\u5E03\u5728\u54EA\u91CC</h3>${[...a.distribution, ...a.unknownValue ? [{ name: "\u672A\u5206\u7C7B", value: a.unknownValue }] : [], { name: "\u53EF\u7528\u73B0\u91D1", value: b.cash }].map((d) => `<div class="pf-allocation"><div><span>${esc(d.name)}</span><b>${(a.total ? d.value / a.total * 100 : 0).toFixed(1)}%</b></div><i><em style="width:${a.total ? d.value / a.total * 100 : 0}%"></em></i><small>${money(d.value)} ${unit}</small></div>`).join("")}</section><section class="pf-panel"><h3>\u4F18\u5148\u5904\u7406\u4EC0\u4E48</h3>${a.issues.length ? a.issues.map((i, n) => `<article class="pf-issue"><span>0${n + 1}</span><div><b>${esc(i.title)}</b><p>${esc(i.text)}</p>${i.amount !== null ? `<small>${i.type === "unknown" ? "\u672A\u5206\u7C7B\u5E02\u503C" : "\u5BF9\u5E94\u5DEE\u989D"} ${money(i.amount)} ${unit}</small>` : ""}</div></article>`).join("") : '<div class="pf-calm"><b>\u5DF2\u586B\u5199\u7684\u8FB9\u754C\u5185\uFF0C\u6682\u65E0\u8D85\u9650</b><p>\u8FD9\u53EA\u8BF4\u660E\u5F55\u5165\u7684\u4ED3\u4F4D\u4E0E\u73B0\u91D1\u7B26\u5408\u4F60\u7684\u8BBE\u7F6E\uFF0C\u4E0D\u4EE3\u8868\u4EA7\u54C1\u4F4E\u98CE\u9669\u6216\u503C\u5F97\u52A0\u4ED3\u3002</p></div>'}</section></div>
 <section class="pf-plan ${a.allowed ? "" : "pf-plan-blocked"}"><div><span class="pf-eyebrow">A CONCRETE PLAN / \u91D1\u989D\u8349\u6848</span><h2>${a.allowed ? a.sell || a.buy ? "\u4E0B\u4E00\u6B65\uFF0C\u53EF\u4EE5\u8FD9\u6837\u8C03\u6574\u3002" : "\u5F53\u524D\u6CA1\u6709\u91D1\u989D\u8C03\u6574\u8981\u6C42\u3002" : "\u5148\u8865\u9F50\u8FD9\u4E9B\uFF0C\u91D1\u989D\u624D\u6709\u4F9D\u636E\u3002"}</h2></div>${a.blocks.length ? `<ul>${a.blocks.map((s) => `<li>${esc(s)}</li>`).join("")}</ul><a href="#preferences">\u8FD4\u56DE\u5B8C\u5584\u8BBE\u7F6E \u2191</a>` : `<div class="pf-plan-numbers"><div><span>\u8BA1\u5212\u51CF\u5C11</span><b>${money(a.sell)}</b></div><div><span>\u76EE\u6807\u589E\u52A0</span><b>${money(a.buy)}</b></div><div><span>\u8C03\u6574\u540E\u73B0\u91D1\uFF08\u672A\u6263\u8D39\uFF09</span><b>${money(a.cashAfter)}</b></div></div><p>${a.fullTargets ? "\u6309\u4F60\u4E3A\u6BCF\u53EA\u6301\u4ED3\u8BBE\u5B9A\u7684\u76EE\u6807\u8BA1\u7B97\uFF1B\u9700\u8981\u5356\u51FA\u63D0\u4F9B\u7684\u8D44\u91D1\uFF0C\u5FC5\u987B\u5B9E\u9645\u5230\u8D26\u540E\u624D\u80FD\u7528\u4E8E\u65B0\u589E\u3002" : "\u4F9D\u6B21\u8C03\u6574\u5355\u4E00\u4EA7\u54C1\u3001\u677F\u5757\u3001\u73B0\u91D1\u8981\u6C42\uFF0C\u91D1\u989D\u4E0D\u91CD\u590D\u7D2F\u8BA1\uFF1B\u540C\u7EC4\u5185\u6309\u5E02\u503C\u6BD4\u4F8B\u5206\u644A\u3002"} \u672A\u8BA1\u8D39\u7528\u4E0E\u7A0E\u8D39\uFF0C\u4E0D\u6309\u80A1\u6570\u4E0B\u5355${market === "fund" ? "\uFF1B\u8D4E\u56DE\u524D\u6838\u5BF9\u6301\u6709\u5929\u6570\u3001\u8D4E\u56DE\u8D39\u548C\u5230\u8D26\u65F6\u95F4" : "\uFF1B\u4EA4\u6613\u524D\u6838\u5BF9\u53EF\u5356\u6570\u91CF\u3001\u6700\u5C0F\u4EA4\u6613\u5355\u4F4D\u548C\u8D39\u7528"}\u3002</p>`}</section>
 <div class="pf-position-advice">${a.plan.map((r) => {
    const f = e[r.code], fall = f?.price?.known && f.price.change < 0;
    return `<article class="pf-panel"><header><div><span>${esc(r.code)} \xB7 \u5F53\u524D\u4ED3\u4F4D ${(r.weight * 100).toFixed(1)}%</span><h3>${esc(r.name)}</h3></div><b class="pf-action-tag">${a.allowed ? r.action === "\u89C2\u5BDF" ? "\u89C2\u5BDF / \u590D\u6838" : r.action + " " + money(Math.abs(r.delta)) : "\u5F85\u5B8C\u5584"}</b></header><p>${a.allowed ? r.reasons.length ? esc(r.reasons.join("\uFF1B")) + "\u3002\u8C03\u6574\u540E\u76EE\u6807\u5E02\u503C " + money(r.targetValue) + " " + unit + "\u3002" : "\u5F53\u524D\u586B\u5199\u7684\u4ED3\u4F4D\u89C4\u5219\u672A\u8981\u6C42\u8C03\u6574\uFF1B\u4FDD\u7559\u539F\u5224\u65AD\u5E76\u7EE7\u7EED\u590D\u6838\u3002" : "\u8865\u9F50\u4E0A\u65B9\u6761\u4EF6\u540E\u518D\u770B\u5177\u4F53\u8C03\u6574\u91D1\u989D\u3002"}</p><div class="pf-own-return">\u8FD9\u53EA\u6301\u4ED3\u6D6E\u76C8\u4E8F <b>${r.return === null ? "\u672A\u586B\u6210\u672C" : pct(r.return) + " / " + money(r.profit) + " " + unit}</b></div>${factMarkup(r)}<div class="pf-review-prompt"><b>\u590D\u6838\u6761\u4EF6</b><p>${fall ? "\u8FD130\u65E5\u516C\u5F00\u8D70\u52BF\u4E3A\u8D1F\uFF1A\u68C0\u67E5\u6700\u521D\u6301\u6709\u7406\u7531\u662F\u5426\u53D8\u5316\uFF0C\u4E0D\u80FD\u4EC5\u56E0\u4E8F\u635F\u81EA\u52A8\u8865\u4ED3\u6216\u6B62\u635F\u3002" : f?.screen?.breakout === true ? "\u5DF2\u5339\u914D\u7A81\u7834\u7B5B\u9009\uFF1A\u6838\u5BF9\u4FE1\u53F7\u65E5\u671F\u4E0E\u539F\u533A\u95F4\uFF0C\u518D\u7ED3\u5408\u6301\u6709\u7406\u7531\u548C\u4ED3\u4F4D\u8FB9\u754C\u51B3\u5B9A\u3002" : "\u5E02\u503C\u3001\u73B0\u91D1\u9700\u6C42\u6216\u6295\u8D44\u5224\u65AD\u53D8\u5316\u65F6\uFF0C\u66F4\u65B0\u8F93\u5165\u5E76\u91CD\u65B0\u8BA1\u7B97\u3002"}${!f || f.error ? " \u516C\u5F00\u8D44\u6599\u7F3A\u5931\uFF0C\u5148\u6838\u9A8C\u8D44\u6599\u3002" : ""}</p></div></article>`;
  }).join("")}</div>
 ${overlap.length ? `<section class="pf-panel"><h3>\u57FA\u91D1\u62AB\u9732\u7247\u6BB5\u91CC\uFF0C\u6709\u5171\u540C\u6301\u80A1</h3>${overlap.map((p) => `<p><b>${esc(p.a)} \xD7 ${esc(p.b)}</b><br>${p.names.map(esc).join("\u3001")}<small class="pf-muted">\u62A5\u544A\u671F ${esc(p.dateA)} / ${esc(p.dateB)}${p.sameDate ? "" : " \xB7 \u65E5\u671F\u4E0D\u540C\uFF0C\u53EA\u4F5C\u7EBF\u7D22"}</small></p>`).join("")}<p class="pf-muted">\u53EA\u6BD4\u8F83\u5DF2\u53D6\u5F97\u7684\u524D\u4E09\u5927\u76F4\u63A5\u6301\u80A1\uFF0C\u4E0D\u8BA1\u7B97\u5B8C\u6574\u91CD\u5408\u7387\uFF1B\u5148\u6838\u5BF9\u5B8C\u6574\u62A5\u544A\uFF0C\u518D\u51B3\u5B9A\u662F\u5426\u5408\u5E76\u76F8\u4F3C\u6301\u4ED3\u3002</p></section>` : ""}
 <section class="pf-stress"><div><h3>\u5982\u679C\u6240\u6709\u6301\u4ED3\u540C\u65F6\u4E0B\u8DCC10%\uFF1F</h3><p>\u7B80\u5355\u60C5\u666F\u6F14\u7B97\uFF1A\u73B0\u91D1\u4E0D\u53D8\u3001\u6301\u4ED3\u7B49\u5E45\u4E0B\u8DCC\uFF1B\u4E0D\u662F\u6982\u7387\u9884\u6D4B\uFF0C\u4E5F\u4E0D\u662F\u6700\u5927\u635F\u5931\u3002</p></div><strong>\u2212${money(a.stressLoss)}<small>\u7EA6\u5360\u8D26\u6237 ${(a.stressRate * 100).toFixed(2)}%</small></strong></section>`;
}
async function verify() {
  if (busy || !book().rows.length) return;
  const m = market, token = ++generation, rows = book().rows.map((r) => ({ ...r }));
  busy = true;
  evidence[m] ??= {};
  $("refreshEvidence").disabled = true;
  let completed = 0;
  const queue = [...rows];
  let fundData;
  if (m === "fund") {
    try {
      fundData = await getJSON("/compare-data.json", 25e3);
    } catch {
    }
  }
  async function worker() {
    while (queue.length) {
      if (token !== generation) return;
      const r = queue.shift(), f = {};
      try {
        if (m === "fund") {
          const source = fundData?.rows.find((x) => x.code === r.code);
          if (source) {
            const c = compareSeries([source], fundData.context, 30), v = c.metrics[0];
            f.price = v && !v.error ? { known: true, change: v.change, drawdown: v.drawdown, start: c.start, end: c.end, points: v.series } : { known: false, reason: v?.error || "\u8D70\u52BF\u4E0D\u8DB3" };
          } else f.price = { known: false, reason: "\u540D\u5355\u672A\u6536\u5F55\u6216\u51C0\u503C\u5FEB\u7167\u672A\u53D6\u5F97" };
          try {
            const h = await getJSON("/api/compare/holdings?code=" + r.code, 18e3);
            if (h.code !== r.code || !Array.isArray(h.items)) throw Error();
            f.holdings = h;
          } catch {
            f.error = "\u6301\u4ED3\u62AB\u9732\u6838\u9A8C\u5931\u8D25\uFF0C\u53EF\u91CD\u8BD5\u6216\u67E5\u770B\u516C\u5F00\u6765\u6E90\u3002";
          }
        } else {
          const cat = (catalogs[m] || await loadCatalog(m)).find((s) => s.code === r.code);
          if (!cat) throw Error("\u5F53\u524D\u80A1\u7968\u540D\u5355\u672A\u6536\u5F55\u6B64\u4EE3\u7801");
          const path = "/" + cat.root + "/" + encodeURIComponent(cat.industry) + ".json";
          groupPromises[path] ??= getJSON(path).catch((err) => {
            delete groupPromises[path];
            throw err;
          });
          const group = await groupPromises[path], stock = group.stocks.find((s) => s.code === r.code);
          if (!stock) throw Error("\u884C\u4E1A\u5FEB\u7167\u672A\u6536\u5F55\u6B64\u4EE3\u7801");
          f.price = priceMetrics(stock, group.calendar, group.asof, 30);
          f.screen = stock.screen;
          f.asof = group.asof;
        }
      } catch (err) {
        f.error = err.message || "\u8D44\u6599\u6682\u672A\u53D6\u5F97";
      }
      if (token !== generation) return;
      evidence[m][r.code] = f;
      completed++;
      $("evidenceStatus").textContent = "\u516C\u5F00\u8D44\u6599\u5DF2\u6838\u9A8C " + completed + "/" + rows.length + " \xB7 " + MARKETS[m].name;
      if (reportVisible) renderReport();
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  if (token === generation) {
    busy = false;
    $("refreshEvidence").disabled = false;
    $("evidenceStatus").textContent += rows.some((r) => evidence[m][r.code]?.error) ? " \xB7 \u90E8\u5206\u8D44\u6599\u5F85\u6838\u5B9E\uFF0C\u53EF\u91CD\u8BD5" : " \xB7 \u6570\u636E\u65E5\u671F\u89C1\u5404\u6301\u4ED3";
  }
}
$("analyze").onclick = () => {
  settings();
  const errors = validateBook(book(), market);
  if (errors.length) return note("accountError", errors.join("\uFF1B"));
  reportVisible = true;
  renderReport();
  $("diagnosis").scrollIntoView({ behavior: "smooth", block: "start" });
  verify();
};
$("refreshEvidence").onclick = () => {
  settings();
  if (validateBook(book(), market).length) return;
  reportVisible = true;
  renderReport();
  verify();
};
switchMarket(market);
