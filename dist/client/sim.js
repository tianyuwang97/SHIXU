// trade-dock.js
var observer;
function sizeTradeDock(bar) {
  observer?.disconnect();
  observer = new ResizeObserver(() => document.documentElement.style.setProperty("--trade-dock-height", bar.offsetHeight + "px"));
  observer.observe(bar);
}

// simulation/report-view.js
var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var money = (n) => Number(n).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
var pct = (n) => (n >= 0 ? "+" : "") + (n * 100).toFixed(2) + "%";
var signed = (n) => (n >= 0 ? "+" : "\u2212") + "\xA5" + money(Math.abs(n));
var tone = (n) => n > 0 ? "positive" : n < 0 ? "negative" : "neutral";
var chapterNames = ["\u4F60\u7684\u6218\u7EE9", "\u4F60\u7684\u51B3\u7B56\u753B\u50CF", "\u6536\u76CA\u7684\u5E55\u540E\u4E3B\u89D2", "\u5982\u679C\u8D70\u53E6\u4E00\u6761\u8DEF", "\u8FD9\u4E00\u5C40\u7684\u5173\u952E\u5E27", "\u6210\u5C31\u4E0E\u4E0B\u4E00\u6B21"];
function heading(n, title, subtitle) {
  return `<div class="chapter-heading"><span class="chapter-number">${String(n).padStart(2, "0")}</span><div><h2>${title}</h2><p>${subtitle}</p></div></div>`;
}
function reportChart(v, index) {
  const { run: r } = v, points = r.curve, chosen = points[Math.min(index, points.length - 1)], last = points.at(-1), values = points.flatMap((p) => [p.total / r.initial - 1, p.benchmark / r.initial - 1]);
  let lo = Math.min(0, ...values), hi = Math.max(0, ...values);
  const padding = Math.max((hi - lo) * 0.12, 5e-3);
  lo -= padding;
  hi += padding;
  const x = (i) => 6 + i * 988 / Math.max(1, points.length - 1), y = (n) => 214 - (n - lo) / (hi - lo) * 208, line = (key) => points.map((p, i) => `${x(i)},${y(p[key] / r.initial - 1)}`).join(" "), at = Math.min(index, points.length - 1), ret = chosen.total / r.initial - 1, bench = chosen.benchmark / r.initial - 1;
  const svg = `<svg viewBox="0 0 1000 220" preserveAspectRatio="none" role="img" aria-label="\u8D26\u6237\u548C\u6CAA\u6DF1300\u4EF7\u683C\u6536\u76CA\u66F2\u7EBF\uFF0C\u4ECE${esc(points[0].date)}\u5230${esc(last.date)}"><path d="M0 6H1000 M0 110H1000 M0 214H1000" stroke="#d9e6df" stroke-dasharray="4 5"/><path d="M0 ${y(0)}H1000" stroke="#a9bfb5" stroke-dasharray="3 4"/><polyline points="${line("benchmark")}" fill="none" stroke="#8296b0" stroke-width="2" stroke-dasharray="6 5"/><polyline points="${line("total")}" fill="none" stroke="#117661" stroke-width="3" stroke-linejoin="round"/><path d="M${x(at)} 0V220" stroke="#fa7845" stroke-width="1.5" stroke-dasharray="3 3"/></svg>`;
  return `<div class="review-chart-top"><div><span class="chart-key own"></span>\u4F60\u7684\u8D26\u6237 <b>${pct(last.total / r.initial - 1)}</b></div><div><span class="chart-key benchmark"></span>\u6CAA\u6DF1300\u4EF7\u683C <b>${pct(last.benchmark / r.initial - 1)}</b></div></div><div class="return-chart"><div class="return-axis"><span>${pct(hi)}</span><span>${pct((hi + lo) / 2)}</span><span>${pct(lo)}</span></div><div class="return-plot">${svg}</div></div><div class="return-dates"><span>${points[0].date}</span><span>${last.date}</span></div><label class="chart-scrubber">\u62D6\u52A8\u56DE\u770B\u6BCF\u4E00\u5929<input id="reportDay" type="range" min="0" max="${points.length - 1}" step="1" value="${at}" aria-label="\u56DE\u770B\u6F14\u7EC3\u65E5\u671F" ${points.length < 2 ? "disabled" : ""}></label><div class="day-readout" aria-live="polite"><span>${chosen.date}<small>09:00\u53EF\u89C1\u7684\u8D26\u6237</small></span><span>\u6536\u76CA\u7387<b class="${tone(ret)}">${pct(ret)}</b></span><span>\u76C8\u4E8F\u91D1\u989D<b>${signed(chosen.total - r.initial)}</b></span><span>\u540C\u671F\u57FA\u51C6<b>${pct(bench)}</b></span></div>`;
}
function reportMarkup(v, revealed = 1) {
  const { run: r, portfolio: p, report: a } = v, passed = p.return + 1e-10 >= r.target, top = a.contributors[0], bottom = a.contributors.at(-1), largest = Math.max(1, ...a.contributors.map((c) => Math.abs(c.profit))), earned = a.badges.filter((b) => b.earned).length;
  const status = r.completed ? passed ? "\u672C\u5C40\u76EE\u6807\u8FBE\u6210" : "\u672C\u5C40\u65C5\u7A0B\u5B8C\u6210" : "\u65C5\u7A0B\u8FDB\u884C\u4E2D \xB7 \u9636\u6BB5\u62A5\u544A";
  const hero = `<header class="persona-card"><div class="persona-copy"><div class="eyebrow">YOUR FIELD NOTES / \u7B2C ${r.elapsed} \u5929\u7684\u4F60</div><span class="report-status">${status}</span><h2>${esc(a.role.name)}</h2><p class="persona-line">${esc(a.role.line)}</p><div class="persona-tags"><span>${esc(r.openingRegime)}\u5F00\u5C40</span><span>${a.filledCount}\u7B14\u6210\u4EA4</span><span>${a.noteDays}\u5929\u4E3B\u52A8\u590D\u76D8</span></div><p class="persona-sample">${esc(a.sample)}</p></div><div class="persona-emblem" aria-label="\u672C\u5C40\u98CE\u683C\u4EE3\u53F7 ${a.code}"><span class="emblem-symbol" aria-hidden="true">${a.role.icon}</span><b>${a.code}</b><small>\u672C\u5C40\u884C\u4E3A\u753B\u50CF</small></div><div class="hero-result"><div><span>${r.completed ? "\u6700\u7EC8\u6536\u76CA\u7387" : "\u5F53\u524D\u6536\u76CA\u7387"}</span><strong>${pct(p.return)}</strong></div><div><span>\u8D26\u6237\u76C8\u4E8F \xB7 \u5DF2\u8BA1\u5B9E\u9645\u53D1\u751F\u8D39\u7528</span><b>${signed(a.profit)}</b><small>\xA5${money(r.initial)} \u2192 \xA5${money(p.total)}</small></div><div><span>\u6700\u5927\u56DE\u64A4</span><b>${(p.drawdown * 100).toFixed(2)}%</b><small>\u76EE\u6807 ${pct(r.target)} \xB7 \u5DF2\u63A8\u8FDB ${r.elapsed}/${r.duration || 30} \u5929</small></div></div></header>`;
  const c1 = `${heading(1, "\u5148\u770B\u7ED3\u679C\uFF0C\u518D\u56DE\u5230\u5F53\u65F6\u3002", "\u6536\u76CA\u7387\u3001\u91D1\u989D\u4E0E\u57FA\u51C6\u653E\u5728\u540C\u4E00\u6761\u65F6\u95F4\u7EBF\u4E0A\u3002")}<p class="report-lead">${esc(a.closing)}</p><div id="reportChart">${reportChart(v, r.curve.length - 1)}</div><div class="report-facts"><div><span>\u76F8\u5BF9\u6CAA\u6DF1300</span><b>${(p.excess >= 0 ? "+" : "") + (p.excess * 100).toFixed(2)} \u4E2A\u767E\u5206\u70B9</b></div><div><span>\u7D2F\u8BA1\u8D39\u7528</span><b>\xA5${money(p.fees)}</b></div><div><span>\u6536\u76CA\u76EE\u6807</span><b>${pct(r.target)}</b></div></div><p class="report-footnote">\u8D26\u6237\u6536\u76CA =\uFF08\u603B\u8D44\u4EA7 \u2212 \u521D\u59CB\u672C\u91D1\uFF09\xF7 \u521D\u59CB\u672C\u91D1\u3002\u5305\u542B\u73B0\u91D1\u3001\u57FA\u91D1\u5E02\u503C\u3001\u51BB\u7ED3\u7533\u8D2D\u6B3E\u53CA\u5F85\u5230\u8D26\u6B3E\uFF1B\u5DF2\u6263\u5B9E\u9645\u53D1\u751F\u7684\u6559\u5B66\u8D39\u7528\uFF0C\u672A\u5F3A\u5236\u6E05\u4ED3\u6216\u9884\u6263\u672A\u6765\u8D4E\u56DE\u8D39\u3002\u6CAA\u6DF1300\u4E3A\u4E0D\u542B\u80A1\u606F\u518D\u6295\u8D44\u7684\u4EF7\u683C\u57FA\u51C6\uFF0C\u4E0E\u57FA\u91D1\u53E3\u5F84\u5B58\u5728\u5DEE\u5F02\u3002\u56FE\u4E2D\u65E5\u671F\u4E3A\u6B21\u65E509:00\u7684\u53EF\u89C1\u8D26\u6237\u65F6\u70B9\u3002</p>`;
  const c2 = `${heading(2, "\u4F60\u7684\u98CE\u683C\uFF0C\u85CF\u5728\u8FD9\u4E9B\u9009\u62E9\u91CC\u3002", "\u56DB\u4E2A\u89C2\u5BDF\u7EF4\u5EA6\uFF0C\u4E0D\u7ED9\u4EBA\u8D34\u6C38\u4E45\u6807\u7B7E\u3002")}<div class="trait-grid">${a.dimensions.map((d, i) => `<article class="trait"><div class="trait-head"><span>0${i + 1} / ${d.name}</span><b>${esc(d.display)}</b></div><div class="trait-track" role="img" aria-label="${esc(d.display)}">${d.value === null ? '<span class="trait-no-data">\u7B49\u5F85\u66F4\u591A\u8BB0\u5F55</span>' : `<i style="left:${Math.max(0, Math.min(100, d.value * 100))}%"></i>`}</div><div class="trait-poles"><span>${d.left}</span><span>${d.right}</span></div><p>${d.reading}</p><details><summary>\u4E3A\u4EC0\u4E48\u8FD9\u6837\u5224\u65AD\uFF1F</summary><p>${d.evidence}</p></details></article>`).join("")}</div><div class="mirror-grid"><article><span>\u4F60\u53EF\u4EE5\u4FDD\u7559\u7684\u4E60\u60EF</span><h3>${esc(a.role.strength)}</h3></article><article><span>\u4E0B\u6B21\u503C\u5F97\u7559\u610F\u7684\u76F2\u70B9</span><h3>${esc(a.role.blindspot)}</h3></article></div><details class="report-method"><summary>\u98CE\u683C\u79F0\u53F7\u4E0E\u4EE3\u53F7\u7684\u8BA1\u7B97\u89C4\u5219</summary><p>\u8FD9\u662F\u672C\u6B21\u6F14\u7EC3\u7684\u6E38\u620F\u5316\u884C\u4E3A\u6807\u7B7E\uFF0C\u4E0D\u662FMBTI\u6216\u5FC3\u7406\u6D4B\u8BC4\uFF0C\u4E5F\u4E0D\u5224\u65AD\u957F\u671F\u6295\u8D44\u80FD\u529B\u3002C/P\uFF1A\u5E73\u5747\u57FA\u91D1\u4ED3\u4F4D\u4F4E\u4E8E/\u4E0D\u4F4E\u4E8E50%\uFF1BF/M\uFF1A\u6700\u5927\u5355\u57FA\u91D1\u5360\u6BD4\u5747\u503C\u4E0D\u4F4E\u4E8E/\u4F4E\u4E8E65%\uFF1BA/W\uFF1A\u6709\u5DF2\u6210\u4EA4\u51B3\u7B56\u7684\u65E5\u671F\u5360\u6BD4\u4E0D\u4F4E\u4E8E/\u4F4E\u4E8E30%\uFF1BR/O\uFF1A\u4E3B\u52A8\u7B14\u8BB0\u65E5\u671F\u5360\u6BD4\u4E0D\u4F4E\u4E8E/\u4F4E\u4E8E20%\u3002\u6CA1\u6709\u4E70\u5165\u65F6\u4E3AWAIT\u3002\u4EE3\u53F7\u5404\u7AEF\u90FD\u6CA1\u6709\u201C\u4F18\u79C0/\u5DEE\u52B2\u201D\u7684\u542B\u4E49\u3002</p></details>`;
  const c3 = `${heading(3, "\u662F\u8C01\uFF0C\u6539\u5199\u4E86\u4F60\u7684\u7ED3\u5C40\uFF1F", "\u628A\u6BCF\u53EA\u57FA\u91D1\u7684\u6301\u4ED3\u53D8\u5316\u3001\u5356\u51FA\u6536\u5165\u3001\u5206\u7EA2\u4E0E\u8D39\u7528\u653E\u56DE\u8D26\u672C\u3002")}${a.contributors.length ? `<div class="reveal-insight"><span>\u672C\u5C40\u6700\u5927\u51C0\u8D21\u732E</span><h3>${esc(top.name)}</h3><strong class="${tone(top.profit)}">${signed(top.profit)}</strong><p>${top.profit > 0 ? "\u5B83\u662F\u672C\u6B21\u51C0\u76C8\u4E8F\u8D21\u732E\u6700\u9AD8\u7684\u57FA\u91D1\u3002" : top.profit < 0 ? "\u6240\u6709\u5DF2\u4EA4\u6613\u57FA\u91D1\u5747\u4E3A\u8D1F\u8D21\u732E\uFF1B\u8FD9\u4E00\u53EA\u7684\u4E8F\u635F\u6700\u5C11\u3002" : "\u5B83\u7684\u51C0\u8D21\u732E\u63A5\u8FD1\u96F6\u3002"}${bottom !== top && bottom.profit < 0 ? ` \u6700\u5927\u8D1F\u8D21\u732E\u6765\u81EA${esc(bottom.name)}\uFF08${signed(bottom.profit)}\uFF09\u3002` : ""}</p></div><div class="attribution-list">${a.contributors.map((c) => `<div class="attribution-row"><div><b>${esc(c.name)}</b><small>${c.code} \xB7 ${c.units > 1e-6 ? "\u4ECD\u6709\u6301\u4ED3" : "\u5DF2\u9000\u51FA"}</small></div><div class="contribution-track"><i class="${tone(c.profit)}" style="width:${Math.max(1, Math.abs(c.profit) / largest * 100)}%"></i></div><strong class="${tone(c.profit)}">${signed(c.profit)}</strong><details><summary>\u67E5\u770B\u8D26\u672C</summary><p>\u4E70\u5165\u603B\u652F\u51FA \xA5${money(c.bought)}\uFF1B\u5356\u51FA\u51C0\u6536\u5165 \xA5${money(c.sold)}\uFF1B\u73B0\u91D1\u5206\u7EA2 \xA5${money(c.dividends)}\uFF1B\u671F\u672B\u6301\u4ED3\u5E02\u503C \xA5${money(c.value)}\uFF1B\u5DF2\u4ED8\u8D39\u7528 \xA5${money(c.fees)}\u3002</p></details></div>`).join("")}</div><p class="report-footnote">\u51C0\u8D21\u732E = \u5356\u51FA\u51C0\u6536\u5165 + \u73B0\u91D1\u5206\u7EA2 + \u5F53\u524D\u6301\u4ED3\u5E02\u503C \u2212 \u4E70\u5165\u652F\u51FA\u3002\u8D39\u7528\u5DF2\u5305\u542B\u5728\u4E70\u5165\u652F\u51FA\u4E0E\u5356\u51FA\u51C0\u6536\u5165\u5185\uFF0C\u4E0D\u91CD\u590D\u6263\u9664\u3002\u5168\u90E8\u57FA\u91D1\u8D21\u732E\u4E4B\u548C\u4E0E\u8D26\u6237\u76C8\u4E8F\u6838\u5BF9\uFF0C\u542B\u672A\u5B9E\u73B0\u6D6E\u76C8\u4E8F\uFF1B\u5B83\u4E0D\u662F\u5BF9\u57FA\u91D1\u672A\u6765\u597D\u574F\u7684\u8BC4\u4EF7\u3002</p>` : `<div class="report-empty"><span>\u25CC</span><h3>${a.reconciled ? "\u8FD9\u4E00\u6B21\uFF0C\u73B0\u91D1\u4E5F\u662F\u4E3B\u89D2\u3002" : "\u6536\u76CA\u62C6\u89E3\u6682\u672A\u5B8C\u6210\u6838\u5BF9"}</h3><p>${a.reconciled ? "\u6CA1\u6709\u6210\u4EA4\uFF0C\u5C31\u6CA1\u6709\u53EF\u5F52\u56E0\u7ED9\u57FA\u91D1\u7684\u76C8\u4E8F\u3002\u4F60\u7684\u7ED3\u679C\u4ECD\u7136\u662F\u4E00\u4EFD\u6709\u6548\u7684\u89C2\u5BDF\u8BB0\u5F55\u3002" : "\u8D26\u6237\u603B\u6536\u76CA\u4ECD\u7136\u53EF\u89C1\uFF1B\u6682\u4E0D\u5C55\u793A\u672A\u6838\u5BF9\u7684\u57FA\u91D1\u8D21\u732E\u3002"}</p></div>`}<div class="cost-receipt"><span>\u8FD9\u4E00\u5C40\uFF0C\u4F60\u4E3A\u4EA4\u6613\u4ED8\u51FA\u4E86</span><b>\xA5${money(p.fees)}</b><span>\u5360\u521D\u59CB\u672C\u91D1 ${(a.feeDrag * 100).toFixed(3)}% \xB7 ${a.filledCount}\u7B14\u6210\u4EA4</span></div>`;
  const alt = a.alternate;
  const c4 = `${heading(4, "\u5982\u679C\u7B2C\u4E00\u7B14\u4E4B\u540E\uFF0C\u4F60\u53EA\u662F\u7B49\u4E0B\u53BB\uFF1F", "\u8FD9\u662F\u53EF\u590D\u7B97\u7684\u5E73\u884C\u8DEF\u7EBF\uFF0C\u4E0D\u662F\u4E8B\u540E\u6311\u51FA\u7684\u6700\u4F73\u7B54\u6848\u3002")}${alt ? `<div class="parallel-paths"><article class="actual-path"><span>\u4F60\u771F\u6B63\u8D70\u8FC7\u7684\u8DEF\u7EBF</span><strong>${pct(p.return)}</strong><p>\u6700\u7EC8/\u5F53\u524D\u8D44\u4EA7 \xA5${money(p.total)}</p><small>${a.filledCount} \u7B14\u6210\u4EA4 \xB7 \u5DF2\u4ED8\u8D39\u7528 \xA5${money(p.fees)}</small></article><article><span>\u7B2C\u4E00\u7B14\u4E70\u5165\u540E\uFF0C\u4E0D\u518D\u4EA4\u6613</span><strong>${pct(alt.return)}</strong><p>\u540C\u4E00\u622A\u6B62\u65F6\u70B9 \xA5${money(alt.total)}</p><small>\u4FDD\u7559\u7B2C\u4E00\u7B14\u4EFD\u989D\u4E0E\u5269\u4F59\u73B0\u91D1\uFF0C\u5206\u7EA2\u73B0\u91D1\u5165\u8D26</small></article></div><div class="parallel-answer"><b>${Math.abs(alt.difference) < 0.01 ? "\u4E24\u6761\u8DEF\u7EBF\u76EE\u524D\u51E0\u4E4E\u91CD\u5408\u3002" : `\u4F60\u7684\u5B9E\u9645\u8DEF\u7EBF\u6BD4\u8FD9\u6761\u56FA\u5B9A\u8DEF\u7EBF${alt.difference > 0 ? "\u591A" : "\u5C11"}\u4E86 \xA5${money(Math.abs(alt.difference))}\u3002`}</b><p>\u57FA\u4E8E ${alt.date} \u7684\u7B2C\u4E00\u7B14\uFF1A${esc(alt.name)}\uFF0C\u4E70\u5165\u652F\u51FA \xA5${money(alt.amount)}\u3002\u6BD4\u8F83\u4F1A\u540C\u65F6\u5305\u542B\u4E4B\u540E\u7684\u6295\u5165\u89C4\u6A21\u3001\u57FA\u91D1\u9009\u62E9\u3001\u4E70\u5356\u65F6\u673A\u548C\u8D39\u7528\u5DEE\u5F02\uFF0C\u4E0D\u80FD\u53EA\u5F52\u56E0\u4E8E\u67D0\u4E00\u6B21\u64CD\u4F5C\u3002</p></div><details class="report-method"><summary>\u5E73\u884C\u8DEF\u7EBF\u600E\u4E48\u7B97\uFF1F</summary><p>\u521D\u59CB\u672C\u91D1\u51CF\u53BB\u7B2C\u4E00\u7B14\u4E70\u5165\u652F\u51FA\uFF0C\u4FDD\u7559\u7B2C\u4E00\u7B14\u5B9E\u9645\u83B7\u5F97\u7684\u4EFD\u989D\uFF0C\u6309\u622A\u6B62\u65F6\u70B9\u5DF2\u77E5\u51C0\u503C\u4F30\u503C\uFF0C\u52A0\u4E0A\u6B64\u540E\u8BE5\u4EFD\u989D\u5E94\u5F97\u7684\u73B0\u91D1\u5206\u7EA2\u3002\u4FDD\u7559\u7B2C\u4E00\u7B14\u7533\u8D2D\u8D39\uFF0C\u5FFD\u7565\u6240\u6709\u540E\u7EED\u8BA2\u5355\uFF1B\u4E24\u6761\u8DEF\u7EBF\u5747\u4E0D\u5F3A\u5236\u6E05\u4ED3\u3001\u4E0D\u9884\u6263\u672A\u6765\u8D4E\u56DE\u8D39\u3002\u53EA\u8BA1\u7B97\u5DF2\u7ECF\u8D70\u8FC7\u7684\u65E5\u5B50\uFF0C\u4E0D\u4F7F\u7528\u672A\u6765\u884C\u60C5\u3002</p></details>` : `<div class="report-empty"><span></span><h3>\u7B2C\u4E00\u7B14\u5C1A\u672A\u53D1\u751F\uFF0C\u5C94\u8DEF\u8FD8\u6CA1\u6709\u5C55\u5F00\u3002</h3><p>\u6709\u4E70\u5165\u6210\u4EA4\u540E\uFF0C\u8FD9\u91CC\u4F1A\u628A\u4F60\u7684\u5B9E\u9645\u8DEF\u7EBF\uFF0C\u4E0E\u201C\u53EA\u4FDD\u7559\u7B2C\u4E00\u7B14\u201D\u7684\u56FA\u5B9A\u8DEF\u7EBF\u653E\u5728\u4E00\u8D77\u3002\u65E0\u9700\u4E3A\u4E86\u751F\u6210\u62A5\u544A\u800C\u4EA4\u6613\u3002</p></div>`}<div class="cash-alternate"><span>\u53E6\u4E00\u6761\u5DF2\u77E5\u8DEF\u7EBF\uFF1A\u59CB\u7EC8\u6301\u6709\u73B0\u91D1</span><b>0.00% \xB7 \xA5${money(r.initial)}</b><small>\u6309\u672C\u6F14\u7EC3\u73B0\u91D1\u4E0D\u8BA1\u606F\u7684\u5047\u8BBE\u3002</small></div>`;
  const c5 = `${heading(5, "\u6709\u4E9B\u65E5\u5B50\uFF0C\u503C\u5F97\u518D\u770B\u4E00\u6B21\u3002", "\u5148\u8FD8\u539F\u53D1\u751F\u4E86\u4EC0\u4E48\uFF0C\u518D\u5224\u65AD\u81EA\u5DF1\u5F53\u65F6\u4E3A\u4EC0\u4E48\u8FD9\u6837\u505A\u3002")}<div class="story-timeline">${a.moments.map((m, i) => `<article><div class="moment-pin">${String(i + 1).padStart(2, "0")}</div><time>${m.date}</time><h3>${esc(m.title)}</h3><p>${esc(m.body)}</p>${m.quote ? `<blockquote>\u201C${esc(m.quote)}\u201D</blockquote>` : ""}</article>`).join("") || '<div class="report-empty"><h3>\u6545\u4E8B\u8FD8\u5728\u7B49\u5F85\u7B2C\u4E00\u6761\u8BB0\u5F55\u3002</h3><p>\u4E0D\u4EA4\u6613\u4E5F\u53EF\u4EE5\u5199\u4E0B\u4ECA\u5929\u4E3A\u4EC0\u4E48\u7EE7\u7EED\u7B49\u5F85\u3002</p></div>'}</div>`;
  const c6 = `${heading(6, "\u628A\u8FD9\u4E00\u5C40\uFF0C\u53D8\u6210\u4E0B\u4E00\u5C40\u7684\u8D77\u70B9\u3002", "\u6210\u5C31\u8BB0\u5F55\u4F60\u505A\u8FC7\u4EC0\u4E48\uFF0C\u7EC3\u4E60\u4EFB\u52A1\u5E2E\u52A9\u4F60\u68C0\u9A8C\u4E0B\u4E00\u6B21\u7684\u5224\u65AD\u3002")}<div class="badge-heading"><b>${earned} / ${a.badges.length} \u679A\u672C\u5C40\u6210\u5C31</b><span>\u4E0D\u662F\u73A9\u5BB6\u6392\u540D\uFF0C\u4E0D\u8BC4\u4EF7\u6536\u76CA\u80FD\u529B</span></div><div class="achievement-grid">${a.badges.map((b) => `<article class="achievement ${b.earned ? "earned" : ""}"><span aria-hidden="true">${b.icon}</span><h3>${b.name}</h3><b>${b.earned ? "\u5DF2\u8BB0\u5F55" : "\u5C1A\u672A\u8FBE\u6210"}</b><p>${esc(b.reason)}</p></article>`).join("")}</div><h3 class="mission-heading">\u9009\u4E00\u4E2A\u503C\u5F97\u5E26\u8D70\u7684\u5C0F\u5B9E\u9A8C</h3><div class="mission-grid">${a.missions.map((m, i) => `<article><span>QUEST 0${i + 1}</span><h3>${m.title}</h3><p>${m.body}</p><button data-report-mission="${i}">\u52A0\u5165\u6211\u7684\u590D\u76D8</button></article>`).join("")}</div><p class="report-footnote">\u4E00\u5C40${r.duration || 30}\u5929\u53EA\u80FD\u63CF\u8FF0\u4E00\u6B21\u7ECF\u5386\u3002\u79F0\u53F7\u3001\u6210\u5C31\u548C\u76EE\u6807\u90FD\u662F\u6E38\u620F\u89C4\u5219\uFF1B\u6CA1\u6709\u4EBA\u7FA4\u6392\u540D\u3001\u5FC3\u7406\u8BCA\u65AD\u6216\u5BF9\u672A\u6765\u6536\u76CA\u7684\u4FDD\u8BC1\u3002</p>`;
  const chapters = [c1, c2, c3, c4, c5, c6];
  return `<div class="review-screen" id="rehearsalReport"><div class="report-topline"><div><span class="eyebrow">THE REHEARSAL CHRONICLE</span><p>${r.start} \u2014 ${r.date} \xB7 ${r.completed ? "\u5B8C\u6574\u590D\u76D8" : "\u9636\u6BB5\u590D\u76D8"}</p></div><div class="report-actions"><button id="expandReport">\u5C55\u5F00\u5B8C\u6574\u62A5\u544A</button><button id="printReport">\u6253\u5370 / \u4FDD\u5B58PDF</button><button id="exportRun">\u5BFC\u51FA\u6570\u636E</button></div></div>${hero}<nav class="chapter-nav" aria-label="\u590D\u76D8\u7AE0\u8282">${chapterNames.map((name, i) => `<button data-chapter="${i + 1}" class="${i < revealed ? "revealed" : ""}"><span>0${i + 1}</span>${name}</button>`).join("")}</nav><p class="chapter-progress" aria-live="polite">\u5DF2\u5C55\u5F00 ${revealed} / 6 \u7AE0 \xB7 \u6BCF\u4E00\u6761\u7ED3\u8BBA\u90FD\u6709\u8BA1\u7B97\u4F9D\u636E</p>${chapters.map((content, i) => `<section class="report-chapter" id="reportChapter${i + 1}" ${i >= revealed ? "hidden" : ""}>${content}</section>`).join("")}<div class="next-chapter" ${revealed >= 6 ? "hidden" : ""}><span>\u63A5\u4E0B\u6765\uFF0C\u4F60\u4F1A\u770B\u5230</span><h3>${chapterNames[Math.min(revealed, 5)]}</h3><button id="nextReportChapter" class="primary">\u7EE7\u7EED\u7FFB\u5F00\u4E0B\u4E00\u7AE0 \u2192</button><p>\u5B8C\u6574\u5185\u5BB9\u5747\u53EF\u9605\u8BFB</p></div></div>`;
}

// simulation/sim.js
var $ = (id) => document.getElementById(id);
var esc2 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var money2 = (n) => Number(n).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
var pct2 = (n) => (n >= 0 ? "+" : "") + (n * 100).toFixed(2) + "%";
var levels = ["\u57FA\u7840", "\u8FDB\u9636", "\u6311\u6218"];
var phases = { watch: "\u89C2\u5BDF\u4E2D", pending: "\u9996\u6B21\u7A81\u7834", confirmed: "\u5DF2\u786E\u8BA4\u7A81\u7834", exited: "\u9000\u51FA\uFF0F\u590D\u6838", failed: "\u7A81\u7834\u672A\u786E\u8BA4", unknown: "\u6570\u636E\u5F85\u6838\u5B9E" };
var selectedDuration = 90;
var holdingWindow = "90";
var periodLabel = (d) => d === 365 ? "1\u5E74" : d + "\u5929";
var meta;
var view = null;
var selectedDate = "2024-09-02";
var selectedLevel = 1;
var capital = 1e5;
var preview = null;
var calendar = [];
var month = "2024-09";
var tab = "funds";
var search = "";
var kind = "";
var onlyMatch = true;
var sort = "change";
var pageSize = 24;
var busy = false;
var previewToken = 0;
var modal = $("modal");
var reportReveals = /* @__PURE__ */ new Map();
function toast(message, error = false) {
  const el = $("toast");
  el.textContent = message;
  el.className = error ? "error-toast" : "";
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.hidden = true, 4500);
}
async function api(path, body) {
  let response;
  try {
    response = await fetch("/api/sim/" + path, { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : void 0 });
  } catch {
    throw Error("\u65E0\u6CD5\u8FDE\u63A5\u6F14\u7EC3\u670D\u52A1\uFF0C\u64CD\u4F5C\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\u3002\u8BF7\u6062\u590D\u8FDE\u63A5\u5E76\u91CD\u65B0\u8F7D\u5165\u5B58\u6863\u540E\u7EE7\u7EED\u3002");
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw Error("\u670D\u52A1\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
  }
  if (!response.ok) throw Error(result.error || "\u8BF7\u6C42\u5931\u8D25");
  return result;
}
function showModal(html, wide = false) {
  $("modalContent").innerHTML = html;
  modal.classList.toggle("wide-dialog", wide);
  if (!modal.open) modal.showModal();
}
document.querySelector(".modal-close").onclick = () => modal.close();
function curve(points, color = "#b9e38a", height = 130, second = null) {
  if (!points?.length) return "";
  const vals = points.map((p) => p[1]), all = second ? vals.concat(second.map((p) => p[1])) : vals, lo = Math.min(...all), hi = Math.max(...all), span = hi - lo || Math.max(hi * 0.01, 1), x = (i) => 12 + i * 576 / Math.max(1, points.length - 1), y = (v) => height - 20 - (v - lo) * (height - 40) / span;
  const line = (arr) => arr.map((p, i) => `${x(i)},${y(p[1])}`).join(" ");
  return `<svg viewBox="0 0 600 ${height}" role="img" aria-label="\u5DF2\u62AB\u9732\u5386\u53F2\u8D70\u52BF\uFF0C${esc2(points[0][0])}\u81F3${esc2(points.at(-1)[0])}" preserveAspectRatio="none"><path d="M12 ${height - 20}H588" stroke="${color}" opacity=".15"/>${second ? `<polyline points="${line(second)}" fill="none" stroke="#94a5b8" stroke-width="2" stroke-dasharray="5 5"/>` : ""}<polyline points="${line(points)}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/><circle cx="${x(points.length - 1)}" cy="${y(vals.at(-1))}" r="4" fill="${color}"/></svg>`;
}
function eventCards(m) {
  return `<div class="section-title"><div><h2>\u5F53\u65F6\uFF0C\u4E16\u754C\u6B63\u5728\u53D1\u751F\u4EC0\u4E48</h2><p>\u622A\u81F3 ${m.date} 09:00\uFF08\u5317\u4EAC\u65F6\u95F4\uFF09\u53EF\u89C1\u7684\u7CBE\u9009\u4E8B\u4EF6 \xB7 \u673A\u5236\u89E3\u8BFB\u4E0D\u7B49\u4E8E\u8D70\u52BF\u9884\u6D4B</p></div></div><div class="events">${m.events.length ? m.events.map((e) => `<article class="event ${e.available === m.date ? "new-event" : ""}">${e.available === m.date ? '<span class="pill orange">\u4ECA\u65E5\u65B0\u516C\u5F00</span> ' : ""}<time>${e.published} \u516C\u5F00 \xB7 ${e.available} \u8D77\u53EF\u89C1</time> <span class="pill">${esc2(e.category)}</span><h3>${esc2(e.title)}</h3><p class="fact"><b>\u5DF2\u77E5\u4E8B\u5B9E</b> \xB7 ${esc2(e.fact)}</p><details><summary>\u5982\u4F55\u5F71\u54CD\u4E2D\u56FD\u5E02\u573A\uFF1F</summary><p><b>\u53EF\u80FD\u7684\u4F20\u5BFC\u8DEF\u5F84</b> \xB7 ${esc2(e.impact)}</p><p><b>\u5F53\u65F6\u4ECD\u672A\u77E5</b> \xB7 ${esc2(e.uncertainty)}</p></details><a href="${esc2(e.source)}" target="_blank" rel="noopener">\u67E5\u770B\u539F\u59CB\u6765\u6E90</a></article>`).join("") : '<div class="empty">\u6B64\u65E5\u671F\u4E4B\u524D\uFF0C\u7CBE\u9009\u4E8B\u4EF6\u5E93\u5C1A\u65E0\u6536\u5F55\u3002\u672A\u6536\u5F55\u4E0D\u4EE3\u8868\u5F53\u65F6\u6CA1\u6709\u91CD\u8981\u4E8B\u4EF6\u3002</div>'}</div><p class="data-note">\u4E8B\u4EF6\u5E93\u4E3A\u4EBA\u5DE5\u6838\u9A8C\u7684\u7CBE\u9009\u6863\u6848\uFF0C\u5E76\u975E\u5B8C\u6574\u65B0\u95FB\u6D41\u3002\u4EC5\u6309\u5DF2\u77E5\u516C\u5F00\u65E5\u671F\u5C55\u793A\uFF1B\u7F3A\u5C11\u7CBE\u786E\u53D1\u5E03\u65F6\u95F4\u7684\u56FD\u5185\u4E8B\u4EF6\u4FDD\u5B88\u5730\u4ECE\u6B21\u65E5\u5F00\u653E\u3002\u8F83\u65E9\u7684\u4E8B\u4EF6\u4F1A\u4FDD\u7559\u5176\u539F\u59CB\u65E5\u671F\uFF0C\u4E0D\u80FD\u89C6\u4E3A\u5F53\u65E5\u65B0\u6D88\u606F\u3002</p>`;
}
function marketCard(m, full = false) {
  return `<div class="market-panel panel"><div class="panel-head"><span class="eyebrow">MARKET SNAPSHOT / ${m.asof}</span><span class="pill lime">\u89C4\u5219\u5224\u65AD</span></div><h2>${esc2(m.label)}</h2><div class="market-badges"><span class="pill">\u60C5\u7EEA ${m.sentiment}</span><span class="pill">\u6CE2\u52A8 ${m.volatility}</span><span class="pill">${m.positive}/3 \u6307\u6570\u8FD120\u65E5\u4E0A\u6DA8</span></div><div class="index-grid">${m.indices.map((i) => `<div class="index-item">${i.name}<b>${pct2(i.r20)}</b><small>\u8FD120\u4E2A\u4EA4\u6613\u65E5</small></div>`).join("")}</div><div class="market-chart">${curve(m.indices[0].chart)}</div><p class="small muted">\u6CAA\u6DF1300 \xB7 \u6700\u8FD160\u4E2A\u5DF2\u62AB\u9732\u4EA4\u6613\u65E5 \xB7 \u622A\u6B62 ${m.asof}</p><details class="market-explain" ${full ? "open" : ""}><summary>\u4E3A\u4EC0\u4E48\u8FD9\u6837\u5224\u65AD\uFF1F</summary><p>${esc2(m.basis)}</p><p>\u6CAA\u6DF1300\u6536\u76D8 ${m.indices[0].close.toFixed(2)}\uFF1B20\u65E5\u5747\u7EBF ${m.indices[0].ma20.toFixed(2)}\uFF1B60\u65E5\u5747\u7EBF ${m.indices[0].ma60.toFixed(2)}\uFF1B20\u65E5\u6536\u76CA\u6CE2\u52A8\u6298\u7B97\u5E74\u5316 ${(m.indices[0].vol * 100).toFixed(1)}%\u3002</p><p>\u201C\u5F3A\u52BF\uFF0F\u504F\u5F31\u201D\u662F\u5F53\u65F6\u4EF7\u683C\u6307\u6807\u7684\u6807\u7B7E\uFF0C\u4E0D\u662F\u5BF9\u725B\u718A\u5E02\u7684\u4E8B\u540E\u5B9A\u6027\u3002\u60C5\u7EEA\u4E0D\u662F\u65B0\u95FB\u60C5\u611F\u8C03\u67E5\u3002\u6570\u636E\u6765\u6E90\uFF1A<a href="https://gu.qq.com/sh000300" target="_blank" rel="noopener">\u817E\u8BAF\u8BC1\u5238\u6307\u6570\u884C\u60C5</a></p></details></div>`;
}
function compositionPreview(f) {
  const c = f.composition;
  if (!c || c.status !== "available") return `<div class="composition empty-composition"><span class="composition-label">\u6301\u4ED3\u6784\u6210</span><p>${esc2(c?.message || "\u6B64\u65E5\u671F\u4E4B\u524D\u5C1A\u65E0\u5DF2\u6838\u9A8C\u7684\u6301\u4ED3\u62A5\u544A")}</p>${c?.period ? `<small>\u62A5\u544A\u671F ${c.period}</small>` : ""}</div>`;
  const items = c.funds.length ? c.funds : f.type.includes("\u503A\u5238") && c.bonds.length || !c.stocks.length ? c.bonds : c.stocks;
  const label = c.funds.length ? "\u6301\u6709\u7684\u57FA\u91D1" : items === c.bonds ? "\u4E3B\u8981\u503A\u5238" : "\u91CD\u4ED3\u80A1\u7968";
  return `<div class="composition"><div class="composition-heading"><span class="composition-label">${label}</span><span>${c.period}</span></div><ul>${items.slice(0, 3).map((h) => `<li><span title="${esc2(h.name)}">${esc2(h.name)}</span><b>${h.weight === null ? "\u672A\u62AB\u9732" : h.weight.toFixed(2) + "%"}</b></li>`).join("")}</ul><div class="composition-bottom"><span>\u5360\u57FA\u91D1\u51C0\u503C \xB7 \u5B9A\u671F\u62AB\u9732</span><button data-composition="${f.code}">\u67E5\u770B\u6784\u6210</button></div>${c.isLink ? '<p class="composition-hint">ETF\u8054\u63A5 \xB7 \u4E0D\u7A7F\u900F\u76EE\u6807ETF\u6301\u4ED3</p>' : ""}</div>`;
}
function showComposition(code) {
  const f = view.funds.find((f2) => f2.code === code), c = f.composition;
  const sections = [["\u6301\u6709\u7684\u57FA\u91D1", c.funds], ["\u524D\u5341\u5927\u76F4\u63A5\u80A1\u7968\u6301\u4ED3", c.stocks], ["\u524D\u4E94\u5927\u503A\u5238\u6301\u4ED3", c.bonds]];
  showModal(`<div class="eyebrow">PORTFOLIO / \u5F53\u65F6\u5DF2\u62AB\u9732\u7684\u6784\u6210</div><h2>${esc2(f.name)}</h2><p class="data-note">\u62A5\u544A\u671F\u672B ${c.period} \xB7 \u516C\u5E03 ${c.published}<br>\u4ECE ${c.available} \u8D77\u5728\u6F14\u7EC3\u4E2D\u53EF\u89C1\uFF1B\u5F53\u524D\u6F14\u7EC3\u65E5\u671F ${view.run.date}\u3002</p>${sections.filter(([, rows]) => rows.length).map(([title, rows]) => `<section class="composition-detail"><h3>${title}</h3><div class="holdings-table"><div class="holdings-row holdings-header"><span>\u540D\u79F0 / \u4EE3\u7801</span><span>\u5360\u57FA\u91D1\u51C0\u503C</span></div>${rows.map((h) => `<div class="holdings-row"><span>${esc2(h.name)}${h.code ? `<small>${esc2(h.code)}</small>` : ""}</span><b>${h.weight === null ? "\u672A\u62AB\u9732" : h.weight.toFixed(2) + "%"}</b></div>`).join("")}</div></section>`).join("")}<p class="data-note">\u4EE5\u4E0A\u662F\u62A5\u544A\u671F\u672B\u7684\u90E8\u5206\u6301\u4ED3\uFF0C\u4E0D\u662F\u5F53\u5929\u5B9E\u65F6\u6301\u4ED3\uFF0C\u4E5F\u4E0D\u662F\u5B8C\u6574\u8D44\u4EA7\u914D\u7F6E\uFF1B\u672A\u5217\u51FA\u90E8\u5206\u53EF\u80FD\u5305\u542B\u5176\u4ED6\u8BC1\u5238\u3001\u73B0\u91D1\u7B49\uFF0C\u4E0D\u80FD\u5168\u90E8\u5F53\u4F5C\u73B0\u91D1\u3002\u80A1\u7968\u3001\u503A\u5238\u548C\u57FA\u91D1\u5360\u6BD4\u5747\u4EE5\u57FA\u91D1\u8D44\u4EA7\u51C0\u503C\u4E3A\u5206\u6BCD\uFF0C\u4E0D\u5C06\u5404\u7EC4\u5F3A\u884C\u51D1\u6210100%\u3002${c.isLink ? "\u8054\u63A5\u57FA\u91D1\u4E3B\u8981\u901A\u8FC7\u76EE\u6807ETF\u6295\u8D44\uFF1B\u8FD9\u91CC\u4E0D\u628A\u76EE\u6807ETF\u7684\u80A1\u7968\u5F53\u4F5C\u672C\u57FA\u91D1\u76F4\u63A5\u6301\u4ED3\u3002" : ""}</p><div class="composition-sources"><a href="${esc2(c.source)}" target="_blank" rel="noopener">\u5B63\u5EA6\u62A5\u544A\u539F\u6587</a><a href="${esc2(c.holdingsSource)}" target="_blank" rel="noopener">\u80A1\u7968\u6301\u4ED3\u6765\u6E90</a><a href="${esc2(c.bondSource)}" target="_blank" rel="noopener">\u503A\u5238\u6301\u4ED3\u6765\u6E90</a></div>`);
}
function limitations() {
  return `<details class="data-note"><summary>\u6570\u636E\u8303\u56F4\u3001\u4EA4\u6613\u5047\u8BBE\u4E0E\u5B58\u6863\u8BF4\u660E</summary><p>\u53EF\u9009\u8D77\u70B9 ${meta.startMin}\u2014${meta.startMax}\uFF0C\u6BCF\u6B21\u53EF\u900930\u300190\u3001180\u6216365\u4E2A\u81EA\u7136\u65E5\u3002${meta.fundCount}\u53EA\u51C0\u503C\u5B8C\u6574\u7684\u5386\u53F2\u57FA\u91D1\u6837\u672C\uFF0C\u8986\u76D6\u80A1\u7968\u3001\u6307\u6570\u3001\u6DF7\u5408\u4E0E\u503A\u5238\uFF1B\u4E0D\u4EE3\u8868\u652F\u4ED8\u5B9D\u5F53\u65F6\u53EF\u8D2D\u4E70\u6E05\u5355\u3002${esc2(meta.limitations)}</p><p>${esc2(meta.assumptions)} \u4E0D\u6A21\u62DF\u7A0E\u8D39\u5DEE\u5F02\u3001\u6700\u4F4E\u6301\u6709\u671F\u3001\u5386\u53F2\u9650\u8D2D\u548C\u771F\u5B9E\u8BA2\u5355\u62D2\u7EDD\u3002\u51C0\u503C\u6765\u6E90\uFF1A<a href="https://fund.eastmoney.com/" target="_blank" rel="noopener">\u5929\u5929\u57FA\u91D1</a>\u3002\u6301\u4ED3\u6309\u5B63\u5EA6\u62A5\u544A\u62AB\u9732\u65E5\u671F\u5339\u914D\uFF0C\u7F3A\u5C11\u7CBE\u786E\u53D1\u5E03\u65F6\u95F4\u65F6\u4ECE\u6B21\u65E5\u53EF\u89C1\uFF1B\u5C55\u793A\u90E8\u5206\u91CD\u4ED3\u8BC1\u5238\uFF0C\u7F3A\u5931\u660E\u786E\u6807\u6CE8\uFF0C\u4E0D\u7528\u4ECA\u5929\u7684\u6301\u4ED3\u66FF\u4EE3\u3002</p><p>\u6BCF\u5929\u56FA\u5B9A\u5728\u5317\u4EAC\u65F6\u95F409:00\u51B3\u7B56\uFF0C\u4EC5\u5C55\u793A\u65E5\u671F\u65E9\u4E8E\u5F53\u5929\u7684\u51C0\u503C\uFF1B\u5386\u53F2\u62AB\u9732\u7CBE\u786E\u65F6\u523B\u672A\u590D\u539F\uFF0C\u91C7\u7528\u5883\u5185\u57FA\u91D1\u6B21\u65E5\u53EF\u89C1\u7684\u6559\u5B66\u5047\u8BBE\u3002\u5F53\u65E5\u4E0B\u5355\u5148\u51BB\u7ED3\u8D44\u91D1\u6216\u4EFD\u989D\uFF0C\u201C\u4E0B\u4E00\u5929\u201D\u540E\u624D\u80FD\u770B\u5230\u6210\u4EA4\u51C0\u503C\uFF1B\u5468\u672B\u53CA\u4F11\u5E02\u65E5\u987A\u5EF6\u3002\u76EE\u6807\u4E3A\u6E38\u620F\u521D\u59CB\u53C2\u6570\uFF0C\u672A\u7ECF\u5386\u53F2\u6210\u529F\u7387\u6821\u51C6\uFF0C\u4E0D\u662F\u6536\u76CA\u9884\u6D4B\u3002</p><p>\u8FDB\u5EA6\u4FDD\u5B58\u5728\u670D\u52A1\u7AEF\uFF0C\u5E76\u901A\u8FC7\u5F53\u524D\u6D4F\u89C8\u5668\u7684\u533F\u540D\u8EAB\u4EFD\u6062\u590D\uFF0C\u65E0\u9700\u767B\u5F55\u3002\u4E0D\u652F\u6301\u8DE8\u8BBE\u5907\u6062\u590D\uFF1B\u6E05\u9664\u7F51\u7AD9Cookie\u540E\u5C06\u5931\u53BB\u8BBF\u95EE\u539F\u5B58\u6863\u7684\u8EAB\u4EFD\u3002\u53EF\u5728\u590D\u76D8\u4E2D\u5BFC\u51FA\u8BB0\u5F55\u3002</p></details>`;
}
async function loadPreview() {
  meta.startMax = meta.startMaxByDuration?.[selectedDuration] || meta.startMax;
  if (selectedDate > meta.startMax) selectedDate = meta.startMax;
  const token = ++previewToken;
  try {
    const result = await Promise.all([api("preview?date=" + selectedDate + "&duration=" + selectedDuration), api("calendar?date=" + selectedDate + "&duration=" + selectedDuration)]);
    if (token !== previewToken) return;
    [preview, { days: calendar }] = result;
    month = selectedDate.slice(0, 7);
    renderSetup();
  } catch (e) {
    toast(e.message, true);
  }
}
function renderSetup() {
  view = null;
  document.querySelector(".end-day")?.remove();
  const first = month + "-01", weekday = ((/* @__PURE__ */ new Date(first + "T00:00:00Z")).getUTCDay() + 6) % 7, monthDays = new Date(+month.slice(0, 4), +month.slice(5, 7), 0).getDate(), map = new Map(calendar.map((d) => [d.date, d]));
  $("app").innerHTML = `<div class="page-intro enter"><div><div class="eyebrow">MANUAL REHEARSAL / \u624B\u52A8\u5386\u53F2\u6F14\u7EC3</div><h1>\u56DE\u5230\u90A3\u4E00\u5929\u3002<br>\u8FD9\u6B21\uFF0C\u7531\u4F60\u51B3\u5B9A\u3002</h1><p>\u5148\u7406\u89E3\u5F53\u65F6\u7684\u5E02\u573A\uFF0C\u518D\u7528\u7B5B\u9009\u7B56\u7565\u5BFB\u627E\u5019\u9009\u3002\u4E70\u5165\u3001\u7B49\u5F85\u3001\u9000\u51FA\uFF0C\u4E00\u5929\u4E00\u5929\u7EC3\u4E60\u81EA\u5DF1\u7684\u5224\u65AD\u3002</p></div><div class="step-track"><span class="current">01 \u9009\u62E9\u8D77\u70B9</span>\u2014<span>02 \u6BCF\u65E5\u51B3\u7B56</span>\u2014<span>03 \u590D\u76D8</span></div></div>
${meta.runs.find((r) => !r.completed) ? `<div class="market-strip"><p>\u4F60\u8FD8\u6709\u4E00\u573A\u672A\u7ED3\u675F\u7684\u6F14\u7EC3\uFF1A${meta.runs.find((r) => !r.completed).start} \u5F00\u59CB</p><button data-resume="${meta.runs.find((r) => !r.completed).id}">\u7EE7\u7EED\u4E0A\u6B21\u6F14\u7EC3</button></div>` : ""}
<div class="setup-grid"><section class="panel calendar-panel"><div class="panel-head"><h2>\u9009\u62E9\u4F60\u7684\u8D77\u70B9</h2><span class="pill blue">${selectedDuration}\u4E2A\u81EA\u7136\u65E5</span></div><div class="calendar-top"><button id="prevMonth" aria-label="\u4E0A\u4E2A\u6708" ${month <= meta.startMin.slice(0, 7) ? "disabled" : ""}>\u2039</button><label><span class="small">\u5386\u53F2\u65E5\u671F</span><input id="startDate" type="date" min="${meta.startMin}" max="${meta.startMax}" value="${selectedDate}"></label><button id="nextMonth" aria-label="\u4E0B\u4E2A\u6708" ${month >= meta.startMax.slice(0, 7) ? "disabled" : ""}>\u203A</button></div><div class="week">${["\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u65E5"].map((s) => `<span>${s}</span>`).join("")}</div><div class="calendar">${"<span></span>".repeat(weekday)}${Array.from({ length: monthDays }, (_, i) => {
    const date = month + "-" + String(i + 1).padStart(2, "0"), d = map.get(date);
    return `<button data-date="${date}" class="${d?.regime || ""} ${date === selectedDate ? "selected" : ""}" ${d ? "" : "disabled"} aria-label="${date} ${d?.label || "\u4E0D\u53EF\u7528"}" aria-pressed="${date === selectedDate}">${i + 1}${d?.events ? '<span class="event-mark">\u2022</span>' : ""}</button>`;
  }).join("")}</div><div class="legend">${[["strong", "\u5F3A\u52BF"], ["rising", "\u6E29\u548C"], ["range", "\u9707\u8361"], ["weak", "\u504F\u5F31"]].map(([a, b]) => `<span><i class="${a}"></i>${b}</span>`).join("")}</div><p class="calendar-note small muted">\u989C\u8272\u6839\u636E\u8BE5\u65E5\u671F\u4E4B\u524D\u7684\u6307\u6570\u6570\u636E\u5224\u65AD\u3002\u5706\u70B9\u8868\u793A\u5F53\u65E5\u8D77\u53EF\u89C1\u7684\u5DF2\u6536\u5F55\u4E8B\u4EF6\u3002\u5F00\u5C40\u540E\u53EF\u4EE5\u6309\u65E5\u3001\u5468\u621630\u5929\u5411\u524D\u3002</p></section>${marketCard(preview)}
<section class="panel challenge-panel"><div><div class="eyebrow">YOUR STARTING POINT</div><h2>\u8BBE\u5B9A\u8FD9\u6B21\u7EC3\u4E60</h2><label style="margin-top:16px">\u6F14\u7EC3\u671F\u9650<select id="durationSelect">${[30, 90, 180, 365].map((d) => `<option value="${d}" ${d === selectedDuration ? "selected" : ""}>${periodLabel(d)}</option>`).join("")}</select></label><label style="margin-top:16px">\u521D\u59CB\u865A\u62DF\u8D44\u91D1\uFF08\u5143\uFF09<input id="capital" type="number" min="1000" max="100000000" step="1000" value="${capital}"></label></div><div><p class="small muted" style="margin-bottom:10px">${preview.label} \xB7 \u76EE\u6807\u6309\u5F00\u5C40\u73AF\u5883\u9501\u5B9A</p><div class="level-grid">${levels.map((l, i) => `<button class="level ${i === selectedLevel ? "selected" : ""}" data-level="${i}" aria-pressed="${i === selectedLevel}">${l}<b>${pct2(preview.targets[i])}</b><small>${selectedDuration}\u5929\u8D26\u6237\u6536\u76CA\u76EE\u6807</small></button>`).join("")}</div></div><div class="launch-row"><p>\u51C0\u6536\u76CA\u6309\u5DF2\u53D1\u751F\u8D39\u7528\u6263\u9664\u540E\u7684\u8D26\u6237\u5E02\u503C\u8BA1\u7B97\u3002\u4FDD\u7559\u73B0\u91D1\u4E5F\u662F\u4E00\u79CD\u51B3\u5B9A\u3002<br>\u6559\u5B66\u8D39\u7387\u4E0E\u6210\u4EA4\u5047\u8BBE\u89C1\u4E0B\u65B9\u8BF4\u660E\uFF1B\u76EE\u6807\u4E0D\u4F1A\u968F\u4E4B\u540E\u7684\u884C\u60C5\u6539\u53D8\u3002</p><button id="startRun" class="primary">\u5F00\u542F${periodLabel(selectedDuration)}\u6F14\u7EC3 <span></span></button></div></section></div><section class="event-section">${eventCards(preview)}</section>${limitations()}`;
  $("startDate").onchange = (e) => {
    if (e.target.value >= meta.startMin && e.target.value <= meta.startMax) {
      selectedDate = e.target.value;
      loadPreview();
    } else toast("\u8BF7\u9009\u62E9\u53EF\u7528\u65E5\u671F", true);
  };
  for (const [id, n] of [["prevMonth", -1], ["nextMonth", 1]]) $(id).onclick = () => {
    const d = /* @__PURE__ */ new Date(month + "-15T00:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + n);
    selectedDate = d.toISOString().slice(0, 7) + "-01";
    if (selectedDate < meta.startMin) selectedDate = meta.startMin;
    loadPreview();
  };
  document.querySelectorAll("[data-date]").forEach((b) => b.onclick = () => {
    capital = Number($("capital").value);
    selectedDate = b.dataset.date;
    loadPreview();
  });
  document.querySelectorAll("[data-level]").forEach((b) => b.onclick = () => {
    capital = Number($("capital").value);
    selectedLevel = +b.dataset.level;
    renderSetup();
  });
  $("durationSelect").onchange = (e) => {
    capital = Number($("capital").value);
    selectedDuration = +e.target.value;
    loadPreview();
  };
  $("capital").oninput = (e) => capital = Number(e.target.value);
  $("startRun").onclick = startRun;
  bindResume();
}
async function startRun() {
  if (busy) return;
  busy = true;
  document.body.classList.add("busy");
  try {
    capital = Number($("capital").value);
    view = await api("start", { id: crypto.randomUUID(), date: selectedDate, capital, level: selectedLevel, duration: selectedDuration });
    history.replaceState(null, "", "/simulation.html?run=" + view.run.id);
    tab = "funds";
    renderRun();
    toast("\u6F14\u7EC3\u5DF2\u5F00\u59CB\u3002\u4ECA\u5929\u7684\u6210\u4EA4\u4EF7\u683C\u5C1A\u672A\u63ED\u6653\u3002");
  } catch (e) {
    toast(e.message, true);
  } finally {
    busy = false;
    document.body.classList.remove("busy");
  }
}
async function act(input) {
  if (busy) return false;
  busy = true;
  document.body.classList.add("busy");
  try {
    view = await api("action", { id: view.run.id, version: view.run.version, actionId: crypto.randomUUID(), ...input });
    if (view.run.completed) tab = "review";
    renderRun();
    return true;
  } catch (e) {
    toast(e.message, true);
    return false;
  } finally {
    busy = false;
    document.body.classList.remove("busy");
  }
}
function redemptionPanel(r, p) {
  const pending = [...r.receivables].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  if (!pending.length) return r.settlementDate ? `<section class="settlement-panel"><b>\u8D4E\u56DE\u6B3E\u5DF2\u5168\u90E8\u5230\u8D26</b><p>\u5230\u8D26\u8FDB\u5EA6\u622A\u81F3 ${r.settlementDate}\uFF1B\u672C\u5C40\u6210\u7EE9\u4ECD\u6309 ${r.date} \u7684\u4F30\u503C\u9501\u5B9A\u3002\u5230\u8D26\u53EA\u662F\u5F85\u6536\u6B3E\u8F6C\u4E3A\u73B0\u91D1\uFF0C\u4E0D\u589E\u52A0\u6536\u76CA\u3002</p></section>` : "";
  const next = pending.find((c) => c.date)?.date;
  return `<section class="settlement-panel" aria-label="\u8D4E\u56DE\u5230\u8D26\u8FDB\u5EA6"><div class="settlement-heading"><div><span class="eyebrow">REDEMPTION / \u5230\u8D26\u8FDB\u5EA6</span><h3>\xA5${money2(p.receivable)} \u5F85\u8F6C\u5165\u53EF\u7528\u73B0\u91D1</h3></div>${r.completed && next ? `<button id="settleFunds" class="dark-btn">\u63A8\u8FDB\u5230\u8D26\u81F3 ${next}</button>` : ""}</div><p>${r.completed ? `${r.duration || 30}\u5929\u4EA4\u6613\u5DF2\u7ED3\u675F\uFF0C\u4ECD\u53EF\u63A8\u8FDB\u8D4E\u56DE\u5230\u8D26\u3002\u6210\u7EE9\u4E0E\u6301\u4ED3\u4F30\u503C\u56FA\u5B9A\u5728 ${r.date}\uFF0C\u4E0D\u4F1A\u5EF6\u957F\u6311\u6218\u3002` : "\u6309\u5356\u51FA\u6210\u4EA4\u540E\u7684\u7B2C2\u4E2A\u4EA4\u6613\u65E5\u5230\u8D26\uFF0C\u5468\u672B\u548C\u8282\u5047\u65E5\u987A\u5EF6\u3002\u70B9\u51FB\u201C\u4E0B\u4E00\u5929\u201D\u63A8\u8FDB\u6F14\u7EC3\u65E5\u671F\uFF0C\u5230\u671F\u81EA\u52A8\u8F6C\u5165\u53EF\u7528\u73B0\u91D1\u3002"}</p><ul>${pending.map((c) => {
    const o = r.orders.find((o2) => o2.id === c.orderId);
    return `<li><span>${esc2(o?.name || "\u8D4E\u56DE\u6B3E")}<small>${o?.filled || "\u2014"} \u5356\u51FA\u6210\u4EA4</small></span><b>\xA5${money2(c.amount)}</b><span>${c.date ? `${c.date} 09:00 \u5230\u8D26` : "\u5230\u8D26\u65E5\u671F\u5F85\u6838\u5B9E"}</span></li>`;
  }).join("")}</ul></section>`;
}
function renderRun() {
  const { run: r, portfolio: p, market: m } = view;
  $("app").innerHTML = `<div class="run-heading enter"><div><div class="eyebrow">${r.completed ? "REHEARSAL COMPLETE" : "YOUR DECISIONS, ONE DAY AT A TIME"}</div><h1>${r.completed ? "\u672C\u6B21\u6F14\u7EC3\u5DF2\u7ED3\u675F" : r.date} <span class="pill ${view.isTrading ? "lime" : "blue"}">${r.completed ? (r.duration || 30) + "\u5929\u590D\u76D8" : view.isTrading ? "\u4EA4\u6613\u65E5 \xB7 09:00" : "\u4F11\u5E02\u65E5 \xB7 09:00"}</span></h1><div class="day-counter">${r.start} \u2192 ${r.end} \xB7 ${r.completed ? "\u5DF2\u5B8C\u6210" : `\u7B2C ${r.elapsed + 1} / ${r.duration || 30} \u5929`} \xB7 \u5317\u4EAC\u65F6\u95F4 \xB7 <span class="saved">\u8FDB\u5EA6\u5DF2\u4FDD\u5B58</span></div></div><button id="newRun" class="quiet">\u65B0\u5EFA\u6F14\u7EC3</button></div>
<div class="dashboard"><section class="panel account"><div class="panel-head"><span class="eyebrow">TOTAL ASSETS / \u603B\u8D44\u4EA7</span><span class="pill">\u865A\u62DF\u8D44\u91D1</span></div><div class="total">\xA5 ${money2(p.total)}</div><div class="account-stats"><div><strong>${pct2(p.return)}</strong><span>\u8D26\u6237\u6536\u76CA</span></div><div><strong>${pct2(p.benchmark)}</strong><span>\u540C\u671F\u6CAA\u6DF1300 \xB7 \u4EF7\u683C\u6536\u76CA</span></div><div><strong>${(p.drawdown * 100).toFixed(2)}%</strong><span>\u6700\u5927\u56DE\u64A4</span></div></div><div class="mini-balances"><div>\u53EF\u7528\u73B0\u91D1<b>\xA5 ${money2(p.cash)}</b></div><div>\u57FA\u91D1\u5E02\u503C<b>\xA5 ${money2(p.held)}</b></div><div>\u51BB\u7ED3 / \u5F85\u5230\u8D26<b>\xA5 ${money2(p.pending + p.receivable)}</b></div></div></section><section class="panel challenge-live"><div class="panel-head"><h3>${levels[r.level]}\u6311\u6218</h3><span class="pill">\u5F00\u5C40\uFF1A${r.openingRegime}</span></div><div class="target">${pct2(r.target)} <span class="small muted">\u76EE\u6807\u5DF2\u9501\u5B9A</span></div><p class="small muted">${r.target === 0 ? "\u672C\u5173\u7EC3\u4E60\u4FDD\u62A4\u672C\u91D1\uFF0C\u6301\u6709\u73B0\u91D1\u4E5F\u53EF\u4EE5\u8FBE\u6807\u3002" : `\u8DDD\u79BB\u76EE\u6807 ${pct2(Math.max(0, r.target - p.return))} \xB7 ${r.completed ? "\u5DF2\u7ED3\u7B97" : `\u8FD8\u5269 ${(r.duration || 30) - r.elapsed} \u5929`}`}</p><div class="progress-track"><i style="width:${r.elapsed / (r.duration || 30) * 100}%"></i></div><p class="small muted">${r.elapsed}/${r.duration || 30} \u5929 \xB7 \u7D2F\u8BA1\u5DF2\u4ED8\u8D39\u7528 \xA5${money2(p.fees)}</p><p class="small muted" style="margin-top:16px">${r.completed ? "\u5DF2\u6309\u622A\u6B62\u65E5\u53EF\u89C1\u51C0\u503C\u4F30\u503C\uFF1B\u672A\u5F3A\u5236\u5356\u51FA\u6301\u4ED3\u3002" : "\u6536\u76CA\u76EE\u6807\u662F\u7EC3\u4E60\u53C2\u6570\uFF0C\u4E0D\u662F\u9884\u6D4B\u3002\u907F\u514D\u4E3A\u4E86\u901A\u5173\u5F3A\u884C\u4EA4\u6613\u3002"}</p></section></div>
${redemptionPanel(r, p)}<div class="market-strip"><div><b>${m.label}</b> <span class="pill">${m.sentiment}</span><p>\u4FE1\u606F\u622A\u6B62 ${m.asof} \xB7 \u6CE2\u52A8${m.volatility}${m.events.find((e) => e.available === r.date) ? " \xB7 \u4ECA\u5929\u6709\u65B0\u4E8B\u4EF6\u5F00\u653E" : ""}</p></div><button id="marketDetails">\u67E5\u770B\u5E02\u573A\u6863\u6848</button></div>
${r.completed ? `<div class="report-banner"><div class="eyebrow">${r.duration || 30} DAYS / \u4F60\u7684\u51B3\u7B56\u8BB0\u5F55</div><h2>${p.return + 1e-10 >= r.target ? "\u672C\u6B21\u8FBE\u5230\u6536\u76CA\u76EE\u6807" : "\u672C\u6B21\u672A\u8FBE\u5230\u6536\u76CA\u76EE\u6807"}</h2><p>${r.orders.some((o) => o.status === "filled") ? "\u628A\u7ED3\u679C\u4E0E\u5F53\u65F6\u7684\u7406\u7531\u653E\u5728\u4E00\u8D77\u770B\uFF0C\u624D\u77E5\u9053\u4E0B\u4E00\u6B21\u8981\u6539\u4EC0\u4E48\u3002" : "\u672C\u6B21\u6CA1\u6709\u6210\u4EA4\uFF0C\u8BB0\u5F55\u4E3A\u73B0\u91D1\u9632\u5B88\u6F14\u7EC3\u3002"}</p></div>` : ""}
<div class="trading-layout"><section class="decision-workspace"><div class="tabs" role="tablist">${[["funds", "\u5019\u9009\u57FA\u91D1"], ["holdings", "\u6211\u7684\u6301\u4ED3"], ["orders", "\u4EA4\u6613\u8BA2\u5355"], ["review", "\u590D\u76D8\u65E5\u5FD7"]].map(([id, name]) => `<button role="tab" aria-selected="${tab === id}" class="${tab === id ? "active" : ""}" data-tab="${id}">${name}${id === "holdings" ? " \xB7 " + p.holdings.length : ""}${id === "orders" ? " \xB7 " + r.orders.filter((o) => o.status === "queued").length : ""}</button>`).join("")}</div><div id="workspace"></div></section><aside class="live-events" aria-label="\u5F53\u524D\u6F14\u7EC3\u65E5\u7684\u5E02\u573A\u4E8B\u4EF6"><div class="live-events-status"><span class="pill lime">\u968F\u6F14\u7EC3\u65E5\u671F\u66F4\u65B0</span><span>${m.events.filter((e) => e.available === r.date).length} \u6761\u4ECA\u65E5\u65B0\u516C\u5F00</span></div>${eventCards(m)}</aside></div>${limitations()}`;
  document.querySelector(".end-day")?.remove();
  if (!r.completed) {
    const bar = document.createElement("div");
    bar.className = "end-day";
    bar.innerHTML = `<div><div class="trade-dock-balances"><span>\u53EF\u7528\u73B0\u91D1<b>\xA5${money2(p.cash)}</b></span><button type="button" data-dock-tab="holdings">\u6301\u4ED3 \xB7 ${p.holdings.length}<b>\xA5${money2(p.held)}</b></button><button type="button" data-dock-tab="orders">\u5F85\u6210\u4EA4<b>${r.orders.filter((o) => o.status === "queued").length} \u7B14</b></button></div><p>${view.isTrading ? "\u4ECA\u5929\u7684\u51B3\u5B9A\uFF0C\u51C6\u5907\u597D\u4E86\u5417\uFF1F" : "\u4ECA\u5929\u4F11\u5E02\uFF0C\u4E5F\u53EF\u4EE5\u7EE7\u7EED\u7B49\u5F85\u3002"}<br><span>${r.orders.filter((o) => o.status === "queued").length} \u7B14\u5F85\u6210\u4EA4 \xB7 ${p.receivable ? money2(p.receivable) + "\u5143\u5F85\u5230\u8D26 \xB7 " + (r.receivables.map((c) => c.date).filter(Boolean).sort()[0] || "\u65E5\u671F\u5F85\u6838\u5B9E") : "\u8D44\u91D1\u4E0E\u51C0\u503C\u9010\u65E5\u7ED3\u7B97"}</span></p><label class="advance-pause"><input id="pauseAdvance" type="checkbox" checked>\u5230\u8D26\u3001\u5E02\u573A\u4E8B\u4EF6\u6216\u6301\u4ED3\u4FE1\u53F7\u53D8\u5316\u65F6\u6682\u505C</label></div><div class="advance-buttons"><button data-advance="1" class="primary">\u4E0B\u4E00\u5929 \u2192</button><button data-advance="7">\u4E0B\u4E00\u5468</button><button data-advance="30">\u63A8\u8FDB30\u5929</button></div>`;
    document.body.append(bar);
    sizeTradeDock(bar);
    bar.querySelectorAll("[data-dock-tab]").forEach((b) => b.onclick = () => {
      document.querySelector('[data-tab="' + b.dataset.dockTab + '"]')?.click();
      document.querySelector(".tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    bar.querySelectorAll("[data-advance]").forEach((button) => button.onclick = async () => {
      const journalCount = view.run.journal.length;
      if (await act({ type: "advance", days: +button.dataset.advance, pause: $("pauseAdvance").checked })) {
        const received = view.run.journal.slice(journalCount).filter((j) => j.type === "settle").reduce((sum, j) => sum + j.amount, 0), a = view.run.advanceSummary;
        toast(received > 0 ? "\u8D4E\u56DE\u6B3E \xA5" + money2(received) + " \u5DF2\u5230\u8D26" : `\u5DF2\u63A8\u8FDB ${a.advanced} \u5929 \xB7 ${a.reason}`);
      }
    });
  }
  if ($("settleFunds")) $("settleFunds").onclick = async () => {
    const before = view.portfolio.cash;
    if (await act({ type: "settle" })) toast("\u8D4E\u56DE\u6B3E \xA5" + money2(view.portfolio.cash - before) + " \u5DF2\u5230\u8D26\uFF1B\u672C\u5C40\u6210\u7EE9\u4FDD\u6301\u4E0D\u53D8\u3002");
  };
  $("newRun").onclick = async () => {
    meta = await api("bootstrap");
    history.replaceState(null, "", "/simulation.html");
    await loadPreview();
  };
  $("marketDetails").onclick = () => showModal(marketCard(m, true) + `<section class="event-section">${eventCards(m)}</section>`, true);
  document.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => {
    tab = b.dataset.tab;
    renderWorkspace();
    document.querySelectorAll("[data-tab]").forEach((x) => {
      x.classList.toggle("active", x.dataset.tab === tab);
      x.setAttribute("aria-selected", x.dataset.tab === tab);
    });
  });
  renderWorkspace();
}
function renderWorkspace() {
  const { run: r, portfolio: p } = view;
  document.querySelector(".trading-layout")?.classList.toggle("report-layout", tab === "review");
  if (tab === "funds") {
    $("workspace").innerHTML = `<section class="rule-bar"><div class="rule-controls"><b>\u7B5B\u9009\u7B56\u7565</b><label class="check-label"><input id="rule1" type="checkbox" ${r.rules.enabled.includes("rule1") ? "checked" : ""} ${r.completed ? "disabled" : ""}>\u89C4\u5219\u4E00 \xB7 \u6A2A\u76D8</label><label class="check-label"><input id="rule2" type="checkbox" ${r.rules.enabled.includes("rule2") ? "checked" : ""} ${r.completed ? "disabled" : ""}>\u89C4\u5219\u4E8C \xB7 \u7A81\u7834\u786E\u8BA4</label><span class="small muted">\u591A\u9009\u53D6\u4EA4\u96C6 \xB7 \u4E0D\u4F1A\u81EA\u52A8\u4E70\u5356</span></div><details><summary>\u8C03\u6574\u53C2\u6570\u4E0E\u4FE1\u53F7\u9636\u6BB5</summary><div class="rule-settings"><label>\u81EA\u7136\u65E5\u671F\u95F4<select id="ruleDays">${[7, 15, 30].map((v) => `<option ${r.rules.days === v ? "selected" : ""}>${v}</option>`).join("")}</select></label><label>\u632F\u5E45\u4E0A\u9650 %<input id="ruleAmp" type="number" value="${r.rules.amp}" min="0" max="1000"></label><label>\u6DA8\u8DCC\u6700\u4F4E %<input id="ruleMin" type="number" step="any" value="${r.rules.min ?? ""}" placeholder="\u4E0D\u9650"></label><label>\u6DA8\u8DCC\u6700\u9AD8 %<input id="ruleMax" type="number" step="any" value="${r.rules.max ?? ""}" placeholder="\u4E0D\u9650"></label><label>\u7A81\u7834\u9636\u6BB5<select id="ruleStage">${[["confirmed", "\u5DF2\u786E\u8BA4\u7A81\u7834"], ["newBuy", "\u672C\u6B21\u65B0\u786E\u8BA4"], ["pending", "\u9996\u6B21\u7A81\u7834\u5F85\u786E\u8BA4"], ["exited", "\u9000\u51FA\uFF0F\u590D\u6838"]].map(([v, t]) => `<option value="${v}" ${r.rules.stage === v ? "selected" : ""}>${t}</option>`).join("")}</select></label></div><p class="small muted" style="margin-top:12px">\u89C4\u5219\u4E00\u4F7F\u7528\u622A\u81F3\u6700\u8FD1\u5DF2\u62AB\u9732\u51C0\u503C\u65E5\u7684\u81EA\u7136\u65E5\u7A97\u53E3\u3002\u89C4\u5219\u4E8C\u56FA\u5B9A\u4F7F\u7528\u7A81\u7834\u524D15\u4E2A\u81EA\u7136\u65E5\u300110%\u632F\u5E45\u4E0E\xB15%\u6DA8\u8DCC\uFF0C\u9501\u5B9A\u533A\u95F4\u540E\u8FDE\u7EED\u4E24\u70B9\u786E\u8BA4\u3002\u53C2\u6570\u4FEE\u6539\u4F1A\u5199\u5165\u590D\u76D8\u65E5\u5FD7\u3002</p></details><button id="applyRules" class="quiet" style="margin-top:12px" ${r.completed ? "disabled" : ""}>\u5E94\u7528\u7B5B\u9009\u7B56\u7565</button></section><div class="filters"><label class="search">\u641C\u7D22\u57FA\u91D1<input id="fundSearch" placeholder="\u540D\u79F0\u6216\u4EE3\u7801" value="${esc2(search)}"></label><label>\u7C7B\u578B<select id="fundKind"><option value="">\u5168\u90E8\u7C7B\u578B</option>${["\u80A1\u7968", "\u6307\u6570", "\u6DF7\u5408", "\u503A\u5238"].map((t) => `<option ${kind === t ? "selected" : ""}>${t}</option>`).join("")}</select></label><label>\u7ED3\u679C<select id="fundResult"><option value="match" ${onlyMatch ? "selected" : ""}>\u7B26\u5408\u5DF2\u9009\u7B56\u7565</option><option value="all" ${!onlyMatch ? "selected" : ""}>\u5168\u90E8\u5386\u53F2\u57FA\u91D1</option></select></label><label>\u6392\u5E8F<select id="fundSort"><option value="change" ${sort === "change" ? "selected" : ""}>\u6DA8\u8DCC\u5E45\u4ECE\u9AD8\u5230\u4F4E</option><option value="amp" ${sort === "amp" ? "selected" : ""}>\u632F\u5E45\u4ECE\u5C0F\u5230\u5927</option></select></label></div><p id="fundCount" class="small muted" style="margin-bottom:14px"></p><div id="fundList" class="funds"></div><button id="loadMore" class="quiet wide" style="margin-top:16px">\u663E\u793A\u66F4\u591A\u57FA\u91D1</button>`;
    $("applyRules").onclick = () => act({ type: "rules", rules: { enabled: ["rule1", "rule2"].filter((id) => $(id).checked), days: +$("ruleDays").value, amp: +$("ruleAmp").value, min: $("ruleMin").value === "" ? null : +$("ruleMin").value, max: $("ruleMax").value === "" ? null : +$("ruleMax").value, stage: $("ruleStage").value } });
    $("fundSearch").oninput = (e) => {
      search = e.target.value;
      pageSize = 24;
      renderFunds();
    };
    $("fundKind").onchange = (e) => {
      kind = e.target.value;
      pageSize = 24;
      renderFunds();
    };
    $("fundResult").onchange = (e) => {
      onlyMatch = e.target.value === "match";
      pageSize = 24;
      renderFunds();
    };
    $("fundSort").onchange = (e) => {
      sort = e.target.value;
      renderFunds();
    };
    $("loadMore").onclick = () => {
      pageSize += 24;
      renderFunds();
    };
    renderFunds();
  } else if (tab === "holdings") {
    $("workspace").innerHTML = p.holdings.length ? `<div class="holdings-heading"><h2>\u6211\u7684\u6301\u4ED3</h2><span class="pill">\u8D70\u52BF\u56FE\u671F\u95F4</span><select id="holdingWindow" aria-label="\u6301\u4ED3\u8D70\u52BF\u56FE\u671F\u95F4">${[["30", "\u8FD11\u4E2A\u6708"], ["90", "\u8FD13\u4E2A\u6708"], ["180", "\u8FD16\u4E2A\u6708"], ["held", "\u6301\u6709\u4EE5\u6765"]].map(([v, t]) => `<option value="${v}" ${holdingWindow === v ? "selected" : ""}>${t}</option>`).join("")}</select></div><div class="holdings-cards">${p.holdings.map((h) => {
      const f = view.funds.find((f2) => f2.code === h.code), cutoff = holdingWindow === "held" ? h.firstHeld : new Date(Date.parse(r.date + "T00:00:00Z") - Number(holdingWindow) * 864e5).toISOString().slice(0, 10), points = (h.history || f?.chart || []).filter((p2) => p2[0] >= cutoff), change = points.length >= 2 ? points.at(-1)[1] / points[0][1] - 1 : null;
      return `<article class="holding-card"><header><div><h3>${esc2(h.name)}</h3><span class="small muted">${h.code}</span></div><button data-sell="${h.code}" ${!h.available || r.completed ? "disabled" : ""}>\u5356\u51FA</button></header><div class="holding-stats"><div><span>\u6301\u4ED3\u5E02\u503C</span><strong>\xA5${money2(h.value)}</strong><small>\u4E70\u5165\u6210\u672C \xA5${money2(h.cost)}</small></div><div><span>\u6301\u4ED3\u6D6E\u52A8\u76C8\u4E8F</span><strong class="${h.change >= 0 ? "positive" : "negative"}">${pct2(h.change)}</strong><small>${h.value - h.cost >= 0 ? "+" : "\u2212"}\xA5${money2(Math.abs(h.value - h.cost))}</small></div></div><div class="holding-trend"><div class="holding-trend-label"><span>${holdingWindow === "held" ? "\u6301\u6709\u4EE5\u6765" : "\u6700\u8FD1 " + holdingWindow + " \u4E2A\u81EA\u7136\u65E5"} \xB7 \u57FA\u91D1\u8D70\u52BF</span><b>${change === null ? "\u6570\u636E\u4E0D\u8DB3" : pct2(change)}</b></div>${points.length >= 2 ? curve(points, change >= 0 ? "#117661" : "#b05b46", 120) : '<p class="data-note">\u6B64\u671F\u95F4\u4E0D\u8DB3\u4E24\u4E2A\u5DF2\u62AB\u9732\u51C0\u503C\u70B9\uFF0C\u6682\u4E0D\u80FD\u7ED8\u5236\u8D8B\u52BF\u3002</p>'}<div class="holding-chart-dates"><span>${points[0]?.[0] || "\u2014"}</span><span>${points.at(-1)?.[0] || "\u2014"}</span></div></div><div class="holding-details"><div><span>\u4EFD\u989D / \u53EF\u5356</span><b>${h.units.toFixed(4)} / ${h.available.toFixed(4)}</b><small>\u5F85\u786E\u8BA4 ${h.locked.toFixed(4)} \xB7 \u5356\u51FA\u51BB\u7ED3 ${h.reserved.toFixed(4)}</small></div><div><span>\u53C2\u8003\u51C0\u503C</span><b>${h.nav.toFixed(4)}</b><small>\u62AB\u9732\u65E5\u671F ${h.navDate}</small></div></div></article>`;
    }).join("")}</div><p class="data-note">\u8D70\u52BF\u56FE\u4F7F\u7528\u4E0A\u65B9\u6240\u9009\u671F\u95F4\uFF0C\u6309\u73B0\u91D1\u5206\u7EA2\u8C03\u6574\uFF0C\u4EC5\u542B\u6F14\u7EC3\u5F53\u65E5\u4E4B\u524D\u5DF2\u62AB\u9732\u7684\u51C0\u503C\uFF1B\u533A\u95F4\u6DA8\u8DCC\u5E45\u4E0D\u7B49\u4E8E\u4F60\u7684\u6301\u4ED3\u6536\u76CA\u3002\u6301\u4ED3\u6D6E\u52A8\u76C8\u4E8F\u6309\u5269\u4F59\u4E70\u5165\u6210\u672C\u8BA1\u7B97\uFF0C\u672A\u52A0\u56DE\u5DF2\u5165\u8D26\u7684\u73B0\u91D1\u5206\u7EA2\uFF0C\u8D26\u6237\u603B\u6536\u76CA\u5305\u542B\u5206\u7EA2\u3002\u8D4E\u56DE\u6B3E\u6309\u9884\u8BA1\u65E5\u671F\u5230\u8D26\u3002</p>` : '<div class="empty">\u8FD8\u6CA1\u6709\u6301\u4ED3\u3002\u4F60\u53EF\u4EE5\u4ECE\u5019\u9009\u57FA\u91D1\u4E2D\u9009\u62E9\uFF0C\u4E5F\u53EF\u4EE5\u7EE7\u7EED\u6301\u6709\u73B0\u91D1\u3002</div>';
    if ($("holdingWindow")) $("holdingWindow").onchange = (e) => {
      holdingWindow = e.target.value;
      renderWorkspace();
    };
    document.querySelectorAll("[data-sell]").forEach((b) => b.onclick = () => trade(b.dataset.sell, "sell"));
  } else if (tab === "orders") {
    $("workspace").innerHTML = r.orders.length ? `<div class="table-wrap"><table><thead><tr><th>\u8BA2\u5355</th><th>\u72B6\u6001</th><th>\u91D1\u989D / \u4EFD\u989D</th><th>\u6210\u4EA4\u4FE1\u606F</th><th>\u64CD\u4F5C</th></tr></thead><tbody>${[...r.orders].reverse().map((o) => `<tr><td><b>${o.side === "buy" ? "\u4E70\u5165" : "\u5356\u51FA"} ${esc2(o.name)}</b><div class="small muted">\u63D0\u4EA4 ${o.submitted}</div></td><td><span class="pill">${{ queued: "\u5F85\u6210\u4EA4", filled: o.side === "buy" ? o.confirm > r.date ? "\u5F85\u786E\u8BA4" : "\u5DF2\u786E\u8BA4" : r.receivables.some((c) => c.orderId === o.id) ? "\u5F85\u5230\u8D26" : "\u5DF2\u5230\u8D26", cancelled: "\u5DF2\u64A4\u9500", rejected: "\u51C0\u503C\u7F3A\u5931\uFF0C\u5DF2\u64A4\u56DE" }[o.status]}</span></td><td>${o.side === "buy" ? "\xA5" + money2(o.amount) : o.units.toFixed(4) + "\u4EFD" + (o.status === "filled" ? '<div class="small muted">\u8D4E\u56DE\u51C0\u989D \xA5' + money2(o.amount) + "</div>" : "")}${o.fee !== void 0 ? `<div class="small muted">\u8D39\u7528 \xA5${money2(o.fee)}</div>` : ""}</td><td>${o.price ? `\u51C0\u503C ${o.price.toFixed(4)}<div class="small muted">${o.filled} \u6210\u4EA4 \xB7 ${o.side === "buy" ? o.confirm + " \u786E\u8BA4" : (o.settledAt || o.settle || "\u65E5\u671F\u5F85\u6838\u5B9E") + " \u5230\u8D26"}</div>` : `<span class="small muted">${o.execute} \u8BA1\u5212\u6210\u4EA4<br>\u6210\u4EA4\u51C0\u503C\u5C1A\u4E0D\u53EF\u89C1</span>`}</td><td>${o.status === "queued" && !r.completed ? `<button data-cancel="${o.id}">\u64A4\u9500</button>` : "\u2014"}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">\u8FD8\u6CA1\u6709\u8BA2\u5355\u3002\u4E0B\u4E00\u5929\u4E0D\u4F1A\u81EA\u52A8\u5E2E\u4F60\u4E70\u5165\u57FA\u91D1\u3002</div>';
    document.querySelectorAll("[data-cancel]").forEach((b) => b.onclick = () => act({ type: "cancel", orderId: b.dataset.cancel }));
  } else renderReview();
}
function renderFunds() {
  const rows = view.funds.filter((f) => (!onlyMatch || f.match) && (!search || (f.name + f.code).toLowerCase().includes(search.toLowerCase())) && (!kind || f.type.includes(kind))).sort((a, b) => sort === "amp" ? (a.amp ?? Infinity) - (b.amp ?? Infinity) : (b.change ?? -Infinity) - (a.change ?? -Infinity));
  $("fundCount").textContent = `${rows.length} \u53EA\u5019\u9009 / \u5386\u53F2\u6C60 ${view.funds.length} \u53EA \xB7 \u6307\u6807\u622A\u6B62 ${view.market.asof} \xB7 \u652F\u4ED8\u5B9D\u5F53\u65F6\u53EF\u4E70\u72B6\u6001\u672A\u590D\u539F`;
  $("fundList").innerHTML = rows.slice(0, pageSize).map((f) => `<article class="fund"><div class="fund-meta">${f.code} \xB7 ${esc2(f.type)}</div><h3>${esc2(f.name)}</h3>${compositionPreview(f)}<div class="fund-metrics"><div><span>\u9996\u5C3E\u6DA8\u8DCC\u5E45</span><b>${f.change === null ? "\u2014" : pct2(f.change)}</b></div><div><span>\u533A\u95F4\u632F\u5E45</span><b>${f.amp === null ? "\u2014" : (f.amp * 100).toFixed(2) + "%"}</b></div></div><div class="tags"><span class="pill ${f.rule1 ? "lime" : ""}">\u6A2A\u76D8 ${f.rule1 ? "\u7B26\u5408" : "\u672A\u6EE1\u8DB3"}</span><span class="pill ${f.rule2 ? "blue" : ""}">${phases[f.signal.phase]}</span></div>${curve(f.chart, "#397866", 100)}<details><summary>\u67E5\u770B\u7B5B\u9009\u4F9D\u636E</summary><p>\u5DF2\u62AB\u9732\u51C0\u503C ${f.nav?.toFixed(4) || "\u2014"} \xB7 ${f.navDate || "\u6682\u65E0"}\u3002${f.signal.rangeStart ? `\u539F\u533A\u95F4 ${f.signal.rangeStart}\u2014${f.signal.rangeEnd}\uFF1B\u9996\u7834 ${f.signal.firstBreakDate}${f.signal.confirmDate ? "\uFF1B\u786E\u8BA4 " + f.signal.confirmDate : ""}${f.signal.exitDate ? "\uFF1B\u9000\u51FA " + f.signal.exitDate : ""}\u3002` : ""}\u6301\u4ED3\u6309\u5F53\u65F6\u5DF2\u62AB\u9732\u7684\u62A5\u544A\u5C55\u793A\uFF0C\u70B9\u51FB\u201C\u67E5\u770B\u6784\u6210\u201D\u4E86\u89E3\u660E\u7EC6\u3002</p></details><div class="fund-foot"><span class="small muted">\u771F\u5B9E\u5386\u53F2\u51C0\u503C</span><button class="dark-btn" data-buy="${f.code}" ${view.run.completed || !f.nav ? "disabled" : ""}>\u4E70\u5165</button></div></article>`).join("") || '<div class="empty">\u6CA1\u6709\u5339\u914D\u7684\u57FA\u91D1\u3002\u53EF\u4EE5\u4FEE\u6539\u7B5B\u9009\u7B56\u7565\uFF0C\u6216\u67E5\u770B\u5168\u90E8\u5386\u53F2\u57FA\u91D1\u3002</div>';
  $("loadMore").hidden = rows.length <= pageSize;
  document.querySelectorAll("[data-buy]").forEach((b) => b.onclick = () => trade(b.dataset.buy, "buy"));
}
function trade(code, side) {
  const f = view.funds.find((f2) => f2.code === code), h = view.portfolio.holdings.find((h2) => h2.code === code), buy = side === "buy";
  showModal(`<div class="trade-layout"><section><div class="eyebrow">${buy ? "BUY" : "SELL"} / \u865A\u62DF\u8BA2\u5355</div><h2>${buy ? "\u4E70\u5165" : "\u5356\u51FA"} ${esc2(f.name)}</h2><div class="trade-price">\u5DF2\u62AB\u9732\u53C2\u8003\u51C0\u503C \xB7 ${f.navDate}<b>${f.nav.toFixed(4)}</b>\u8FD9\u4E0D\u662F\u6210\u4EA4\u4EF7\u683C\u3002\u8BA2\u5355\u6309\u6210\u4EA4\u65E5\u5C1A\u672A\u63ED\u6653\u7684\u51C0\u503C\u5904\u7406\u3002</div><form id="tradeForm" class="trade-form"><label>${buy ? "\u4E70\u5165\u91D1\u989D\uFF08\u542B\u7533\u8D2D\u8D39\uFF0C\u5143\uFF09" : "\u5356\u51FA\u4EFD\u989D"}<input id="tradeValue" type="number" step="any" min="${buy ? "100" : "0.0001"}" max="${buy ? view.portfolio.cash : h.available}" value="${buy ? Math.min(1e4, Math.floor(view.portfolio.cash * 100) / 100) : h.available}" required></label><div class="quick-amounts">${[0.25, 0.5, 1].map((n) => `<button type="button" data-fraction="${n}">${n * 100}%${buy ? "\u73B0\u91D1" : "\u53EF\u5356"}</button>`).join("")}</div><p class="small muted">${buy ? "\u53EF\u7528\u73B0\u91D1 \xA5" + money2(view.portfolio.cash) : "\u53EF\u5356\u4EFD\u989D " + h.available.toFixed(4)}</p><label>\u8FD9\u6B21\u51B3\u5B9A\u7684\u7406\u7531<textarea id="tradeReason" maxlength="1000" placeholder="\u4F8B\u5982\uFF1A\u89C4\u5219\u4E00\u4E0E\u89C4\u5219\u4E8C\u540C\u65F6\u6EE1\u8DB3\uFF0C\u5148\u7528\u4E00\u5C0F\u90E8\u5206\u4ED3\u4F4D\u89C2\u5BDF\u3002" required></textarea></label><div class="trade-summary">${buy ? "\u7533\u8D2D\u8D390.15%\uFF1BT+1\u4EA4\u6613\u65E5\u786E\u8BA4\u4EFD\u989D\u3002" : "\u5148\u8FDB\u5148\u51FA\uFF1B\u4E0D\u8DB37\u81EA\u7136\u65E5\u8D4E\u56DE\u8D391.5%\uFF0C\u5426\u52190.5%\uFF1BT+2\u4EA4\u6613\u65E5\u5230\u8D26\u3002"}<br>\u4EE5\u4E0A\u4E3A\u7EDF\u4E00\u6559\u5B66\u5047\u8BBE\uFF0C\u4E0D\u662F\u8BE5\u4EA7\u54C1\u7684\u771F\u5B9E\u5386\u53F2\u8D39\u7387\u3002</div><p id="tradeError" class="error" role="alert"></p><button class="primary wide" type="submit">\u63D0\u4EA4${buy ? "\u4E70\u5165" : "\u5356\u51FA"}\u8BA2\u5355</button></form></section><aside class="trade-events" aria-label="\u4EA4\u6613\u65F6\u53EF\u89C1\u7684\u5E02\u573A\u4E8B\u4EF6">${eventCards(view.market)}</aside></div>`, true);
  document.querySelectorAll("[data-fraction]").forEach((b) => b.onclick = () => {
    $("tradeValue").value = buy ? Math.floor(view.portfolio.cash * Number(b.dataset.fraction) * 100) / 100 : h.available * Number(b.dataset.fraction);
  });
  $("tradeForm").onsubmit = async (e) => {
    e.preventDefault();
    const value = Number($("tradeValue").value), reason = $("tradeReason").value;
    if (!reason.trim()) {
      $("tradeError").textContent = "\u8BF7\u5199\u4E0B\u8FD9\u6B21\u51B3\u5B9A\u7684\u7406\u7531\u3002";
      return;
    }
    const ok = await act({ type: side, code, [buy ? "amount" : "units"]: value, reason });
    if (ok) {
      modal.close();
      toast("\u8BA2\u5355\u5DF2\u63D0\u4EA4\uFF0C\u5C1A\u672A\u6210\u4EA4\u3002\u53EF\u5728\u4EA4\u6613\u8BA2\u5355\u4E2D\u64A4\u9500\u3002");
    }
  };
}
function renderReview() {
  const r = view.run, p = view.portfolio, revealed = reportReveals.get(r.id) || 1, draft = $("reviewNote")?.value || "";
  $("workspace").innerHTML = reportMarkup(view, revealed) + `<section class="review-notebook"><div class="section-title"><div><h2>\u7ED9\u672A\u6765\u7684\u81EA\u5DF1\uFF0C\u7559\u4E00\u6761\u7EBF\u7D22\u3002</h2><p>\u4E3B\u52A8\u7B14\u8BB0\u4F1A\u6210\u4E3A\u62A5\u544A\u91CC\u7684\u8BC1\u636E\u3002</p></div></div><form class="note-form" id="noteForm"><label>\u4ECA\u5929\u7684\u590D\u76D8<textarea id="reviewNote" maxlength="1000" placeholder="\u6211\u5F53\u65F6\u9884\u671F\u4EC0\u4E48\uFF1F\u5B9E\u9645\u53D1\u751F\u4EC0\u4E48\uFF1F\u4E0B\u4E00\u6B21\u53EA\u6539\u53D8\u54EA\u4E00\u4E2A\u6761\u4EF6\uFF1F" required></textarea></label><button class="dark-btn" type="submit">\u4FDD\u5B58\u590D\u76D8</button></form><details class="raw-journal"><summary>\u67E5\u770B\u5B8C\u6574\u4EA4\u6613\u4E0E\u51B3\u7B56\u65E5\u5FD7 \xB7 ${r.journal.length}\u6761</summary><div class="journal">${[...r.journal].reverse().map((j) => `<article class="journal-entry"><time>${j.date}</time> <span class="pill">${{ rules: "\u7B5B\u9009\u7B56\u7565", order: "\u4EA4\u6613\u51B3\u5B9A", fill: "\u6210\u4EA4", cancel: "\u64A4\u5355", settle: "\u5230\u8D26", dividend: "\u5206\u7EA2", note: "\u624B\u52A8\u590D\u76D8", day: "\u63A8\u8FDB\u4E00\u5929", rejected: "\u8BA2\u5355\u64A4\u56DE" }[j.type] || j.type}</span><p>${esc2(j.text)}</p>${j.reason ? `<p class="muted">\u5F53\u65F6\u7684\u7406\u7531\uFF1A${esc2(j.reason)}</p>` : ""}${j.price ? `<p class="small muted">\u6210\u4EA4\u51C0\u503C ${j.price.toFixed(4)} \xB7 ${j.units.toFixed(4)}\u4EFD \xB7 \u8D39\u7528 \xA5${money2(j.fee)}</p>` : ""}${j.amount ? `<p class="small muted">\xA5${money2(j.amount)}</p>` : ""}${j.rules ? `<details><summary>\u5F53\u65F6\u4F7F\u7528\u7684\u7B5B\u9009\u7B56\u7565</summary><p>${j.rules.enabled.map((id) => id === "rule1" ? "\u89C4\u5219\u4E00 \xB7 \u6A2A\u76D8" : "\u89C4\u5219\u4E8C \xB7 \u7A81\u7834").join(" \uFF0B ")}\uFF1B${j.rules.days}\u81EA\u7136\u65E5\uFF1B\u632F\u5E45\u2264${j.rules.amp}%\uFF1B\u6DA8\u8DCC${j.rules.min ?? "\u4E0D\u9650"}% \u81F3 ${j.rules.max ?? "\u4E0D\u9650"}%\uFF1B\u7A81\u7834\u9636\u6BB5 ${esc2(j.rules.stage)}</p></details>` : ""}</article>`).join("") || '<div class="empty">\u8FD8\u6CA1\u6709\u8BB0\u5F55\u3002\u53EF\u4EE5\u5148\u5199\u4E0B\u8FD9\u6B21\u7EC3\u4E60\u7684\u8BA1\u5212\u3002</div>'}</div></details></section>`;
  $("reviewNote").value = draft;
  function reveal(n, scroll = true) {
    reportReveals.set(r.id, Math.min(6, Math.max(revealed, n)));
    renderReview();
    if (scroll) $("reportChapter" + n)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  }
  $("expandReport").onclick = () => reveal(6, false);
  $("nextReportChapter")?.addEventListener("click", () => reveal(revealed + 1));
  document.querySelectorAll("[data-chapter]").forEach((b) => b.onclick = () => reveal(+b.dataset.chapter));
  $("reportDay").oninput = (e) => {
    const template = document.createElement("template");
    template.innerHTML = reportChart(view, +e.target.value);
    for (const selector of [".return-plot", ".day-readout"]) $("reportChart").querySelector(selector).innerHTML = template.content.querySelector(selector).innerHTML;
  };
  $("printReport").onclick = () => window.print();
  document.querySelectorAll("[data-report-mission]").forEach((b) => b.onclick = async () => {
    const mission = view.report.missions[+b.dataset.reportMission], reason = "\u4E0B\u4E00\u5C40\u7EC3\u4E60\uFF1A" + mission.title + "\u3002" + mission.body;
    if (r.journal.some((j) => j.type === "note" && j.text === reason)) {
      toast("\u8FD9\u6761\u7EC3\u4E60\u5DF2\u7ECF\u4FDD\u5B58\u5728\u590D\u76D8\u91CC");
      return;
    }
    if (await act({ type: "note", reason })) toast("\u5DF2\u52A0\u5165\u590D\u76D8\u7B14\u8BB0");
  });
  $("noteForm").onsubmit = async (e) => {
    e.preventDefault();
    const reason = $("reviewNote").value;
    if (await act({ type: "note", reason })) {
      if ($("reviewNote")) $("reviewNote").value = "";
      toast("\u590D\u76D8\u5DF2\u4FDD\u5B58");
    }
  };
  $("exportRun").onclick = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: (/* @__PURE__ */ new Date()).toISOString(), run: r, portfolio: p, report: view.report, assumptions: meta.assumptions, limitations: meta.limitations }, null, 2)], { type: "application/json" }), url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url;
    a.download = "\u65F6\u5E8F_\u6F14\u7EC3\u590D\u76D8_" + r.start + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  };
}
async function resume(id) {
  try {
    view = await api("state?id=" + encodeURIComponent(id));
    history.replaceState(null, "", "/simulation.html?run=" + id);
    tab = view.run.completed ? "review" : "funds";
    modal.close();
    renderRun();
  } catch (e) {
    toast(e.message, true);
  }
}
function bindResume() {
  document.querySelectorAll("[data-resume]").forEach((b) => b.onclick = () => resume(b.dataset.resume));
}
$("sessionsBtn").onclick = async () => {
  try {
    meta = await api("bootstrap");
    showModal(`<div class="eyebrow">YOUR REHEARSALS</div><h2>\u6211\u7684\u6F14\u7EC3</h2><p class="data-note">\u5F53\u524D\u6D4F\u89C8\u5668\u8EAB\u4EFD\u7684\u670D\u52A1\u7AEF\u5B58\u6863\u3002\u6536\u76CA\u6309\u5404\u6B21\u6F14\u7EC3\u622A\u6B62\u65F6\u70B9\u8BA1\u7B97\uFF0C\u5DF2\u542B\u5B9E\u9645\u53D1\u751F\u7684\u6559\u5B66\u8D39\u7528\u3002\u6E05\u9664Cookie\u6216\u6362\u8BBE\u5907\u540E\u65E0\u6CD5\u6062\u590D\uFF0C\u8BF7\u53CA\u65F6\u5BFC\u51FA\u3002</p><div class="sessions">${meta.runs.map((r) => `<button class="session-card result-session" data-resume="${r.id}"><span class="session-title"><b>${r.start} \u5F00\u59CB</b><small>${r.completed ? "\u5DF2\u7ED3\u675F" : "\u8FDB\u884C\u4E2D \xB7 \u7B2C" + (r.elapsed + 1) + "\u5929"} \xB7 \u521D\u59CB \xA5${money2(r.initial)}</small><small>\u76EE\u6807 ${pct2(r.target)} \xB7 \u4F30\u503C\u622A\u81F3 ${r.date}</small></span><span class="session-performance"><small>${r.completed ? "\u6700\u7EC8\u6536\u76CA\u7387" : "\u5F53\u524D\u6536\u76CA\u7387"}</small><strong class="${r.return > 0 ? "positive" : r.return < 0 ? "negative" : "neutral"}">${Number.isFinite(r.return) ? pct2(r.return) : "\u2014"}</strong><small>${Number.isFinite(r.profit) ? (r.profit >= 0 ? "+" : "\u2212") + "\xA5" + money2(Math.abs(r.profit)) : "\u76C8\u4E8F\u6682\u4E0D\u53EF\u7528"}</small></span><span class="session-cta">${r.completed ? "\u7FFB\u5F00\u6211\u7684\u62A5\u544A" : "\u7EE7\u7EED\u6F14\u7EC3"}</span></button>`).join("") || '<p class="muted">\u8FD8\u6CA1\u6709\u6F14\u7EC3\u5B58\u6863\u3002</p>'}</div>`, true);
    bindResume();
  } catch (e) {
    toast(e.message, true);
  }
};
async function boot() {
  try {
    meta = await api("bootstrap");
    const run = new URLSearchParams(location.search).get("run");
    if (run) await resume(run);
    else await loadPreview();
  } catch (e) {
    $("app").innerHTML = `<section class="panel"><h2>\u6682\u65F6\u65E0\u6CD5\u6253\u5F00\u6F14\u7EC3</h2><p class="error">${esc2(e.message)}</p><button id="retry" style="margin-top:20px">\u91CD\u65B0\u8F7D\u5165</button> <a href="/">\u8FD4\u56DE\u57FA\u91D1\u7B5B\u9009</a></section>`;
    $("retry").onclick = boot;
  }
}
boot();
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-composition]");
  if (b) showComposition(b.dataset.composition);
});
