// trade-dock.js
var observer;
function sizeTradeDock(bar) {
  observer?.disconnect();
  observer = new ResizeObserver(() => document.documentElement.style.setProperty("--trade-dock-height", bar.offsetHeight + "px"));
  observer.observe(bar);
}

// simulation/market-ui.js
var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var pct = (n) => (n >= 0 ? "+" : "") + (n * 100).toFixed(2) + "%";
function curve(points, color = "#b9e38a", height = 130, second = null) {
  if (!points?.length) return "";
  const vals = points.map((p) => p[1]), all = second ? vals.concat(second.map((p) => p[1])) : vals, lo = Math.min(...all), hi = Math.max(...all), span = hi - lo || Math.max(hi * 0.01, 1), x = (i) => 12 + i * 576 / Math.max(1, points.length - 1), y = (v) => height - 20 - (v - lo) * (height - 40) / span;
  const line = (arr) => arr.map((p, i) => `${x(i)},${y(p[1])}`).join(" ");
  return `<svg viewBox="0 0 600 ${height}" role="img" aria-label="\u5DF2\u62AB\u9732\u5386\u53F2\u8D70\u52BF\uFF0C${esc(points[0][0])}\u81F3${esc(points.at(-1)[0])}" preserveAspectRatio="none"><path d="M12 ${height - 20}H588" stroke="${color}" opacity=".15"/>${second ? `<polyline points="${line(second)}" fill="none" stroke="#94a5b8" stroke-width="2" stroke-dasharray="5 5"/>` : ""}<polyline points="${line(points)}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/><circle cx="${x(points.length - 1)}" cy="${y(vals.at(-1))}" r="4" fill="${color}"/></svg>`;
}
function eventCards(m) {
  return `<div class="section-title"><div><h2>\u5F53\u65F6\uFF0C\u4E16\u754C\u6B63\u5728\u53D1\u751F\u4EC0\u4E48</h2><p>\u622A\u81F3 ${m.date} 09:00\uFF08\u5317\u4EAC\u65F6\u95F4\uFF09\u53EF\u89C1\u7684\u7CBE\u9009\u4E8B\u4EF6 \xB7 \u673A\u5236\u89E3\u8BFB\u4E0D\u7B49\u4E8E\u8D70\u52BF\u9884\u6D4B</p></div></div><div class="events">${m.events.length ? m.events.map((e) => `<article class="event ${e.available === m.date ? "new-event" : ""}">${e.available === m.date ? '<span class="pill orange">\u4ECA\u65E5\u65B0\u516C\u5F00</span> ' : ""}<time>${e.published} \u516C\u5F00 \xB7 ${e.available} \u8D77\u53EF\u89C1</time> <span class="pill">${esc(e.category)}</span><h3>${esc(e.title)}</h3><p class="fact"><b>\u5DF2\u77E5\u4E8B\u5B9E</b> \xB7 ${esc(e.fact)}</p><details><summary>\u5982\u4F55\u5F71\u54CD\u4E2D\u56FD\u5E02\u573A\uFF1F</summary><p><b>\u53EF\u80FD\u7684\u4F20\u5BFC\u8DEF\u5F84</b> \xB7 ${esc(e.impact)}</p><p><b>\u5F53\u65F6\u4ECD\u672A\u77E5</b> \xB7 ${esc(e.uncertainty)}</p></details><a href="${esc(e.source)}" target="_blank" rel="noopener">\u67E5\u770B\u539F\u59CB\u6765\u6E90</a></article>`).join("") : '<div class="empty">\u6B64\u65E5\u671F\u4E4B\u524D\uFF0C\u7CBE\u9009\u4E8B\u4EF6\u5E93\u5C1A\u65E0\u6536\u5F55\u3002\u672A\u6536\u5F55\u4E0D\u4EE3\u8868\u5F53\u65F6\u6CA1\u6709\u91CD\u8981\u4E8B\u4EF6\u3002</div>'}</div><p class="data-note">\u4E8B\u4EF6\u5E93\u4E3A\u4EBA\u5DE5\u6838\u9A8C\u7684\u7CBE\u9009\u6863\u6848\uFF0C\u5E76\u975E\u5B8C\u6574\u65B0\u95FB\u6D41\u3002\u4EC5\u6309\u5DF2\u77E5\u516C\u5F00\u65E5\u671F\u5C55\u793A\uFF1B\u7F3A\u5C11\u7CBE\u786E\u53D1\u5E03\u65F6\u95F4\u7684\u56FD\u5185\u4E8B\u4EF6\u4FDD\u5B88\u5730\u4ECE\u6B21\u65E5\u5F00\u653E\u3002\u8F83\u65E9\u7684\u4E8B\u4EF6\u4F1A\u4FDD\u7559\u5176\u539F\u59CB\u65E5\u671F\uFF0C\u4E0D\u80FD\u89C6\u4E3A\u5F53\u65E5\u65B0\u6D88\u606F\u3002</p>`;
}
function marketCard(m, full = false) {
  return `<div class="market-panel panel"><div class="panel-head"><span class="eyebrow">MARKET SNAPSHOT / ${m.asof}</span><span class="pill lime">\u89C4\u5219\u5224\u65AD</span></div><h2>${esc(m.label)}</h2><div class="market-badges"><span class="pill">\u60C5\u7EEA ${m.sentiment}</span><span class="pill">\u6CE2\u52A8 ${m.volatility}</span><span class="pill">${m.positive}/3 \u6307\u6570\u8FD120\u65E5\u4E0A\u6DA8</span></div><div class="index-grid">${m.indices.map((i) => `<div class="index-item">${i.name}<b>${pct(i.r20)}</b><small>\u8FD120\u4E2A\u4EA4\u6613\u65E5</small></div>`).join("")}</div><div class="market-chart">${curve(m.indices[0].chart)}</div><p class="small muted">\u6CAA\u6DF1300 \xB7 \u6700\u8FD160\u4E2A\u5DF2\u62AB\u9732\u4EA4\u6613\u65E5 \xB7 \u622A\u6B62 ${m.asof}</p><details class="market-explain" ${full ? "open" : ""}><summary>\u4E3A\u4EC0\u4E48\u8FD9\u6837\u5224\u65AD\uFF1F</summary><p>${esc(m.basis)}</p><p>\u6CAA\u6DF1300\u6536\u76D8 ${m.indices[0].close.toFixed(2)}\uFF1B20\u65E5\u5747\u7EBF ${m.indices[0].ma20.toFixed(2)}\uFF1B60\u65E5\u5747\u7EBF ${m.indices[0].ma60.toFixed(2)}\uFF1B20\u65E5\u6536\u76CA\u6CE2\u52A8\u6298\u7B97\u5E74\u5316 ${(m.indices[0].vol * 100).toFixed(1)}%\u3002</p><p>\u201C\u5F3A\u52BF\uFF0F\u504F\u5F31\u201D\u662F\u5F53\u65F6\u4EF7\u683C\u6307\u6807\u7684\u6807\u7B7E\uFF0C\u4E0D\u662F\u5BF9\u725B\u718A\u5E02\u7684\u4E8B\u540E\u5B9A\u6027\u3002\u60C5\u7EEA\u4E0D\u662F\u65B0\u95FB\u60C5\u611F\u8C03\u67E5\u3002\u6570\u636E\u6765\u6E90\uFF1A<a href="https://gu.qq.com/sh000300" target="_blank" rel="noopener">\u817E\u8BAF\u8BC1\u5238\u6307\u6570\u884C\u60C5</a></p></details></div>`;
}

// simulation/report-view.js
var esc2 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var money = (n) => Number(n).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
var pct2 = (n) => (n >= 0 ? "+" : "") + (n * 100).toFixed(2) + "%";
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
  const svg = `<svg viewBox="0 0 1000 220" preserveAspectRatio="none" role="img" aria-label="\u8D26\u6237\u548C\u6CAA\u6DF1300\u4EF7\u683C\u6536\u76CA\u66F2\u7EBF\uFF0C\u4ECE${esc2(points[0].date)}\u5230${esc2(last.date)}"><path d="M0 6H1000 M0 110H1000 M0 214H1000" stroke="#d9e6df" stroke-dasharray="4 5"/><path d="M0 ${y(0)}H1000" stroke="#a9bfb5" stroke-dasharray="3 4"/><polyline points="${line("benchmark")}" fill="none" stroke="#8296b0" stroke-width="2" stroke-dasharray="6 5"/><polyline points="${line("total")}" fill="none" stroke="#117661" stroke-width="3" stroke-linejoin="round"/><path d="M${x(at)} 0V220" stroke="#fa7845" stroke-width="1.5" stroke-dasharray="3 3"/></svg>`;
  return `<div class="review-chart-top"><div><span class="chart-key own"></span>\u4F60\u7684\u8D26\u6237 <b>${pct2(last.total / r.initial - 1)}</b></div><div><span class="chart-key benchmark"></span>\u6CAA\u6DF1300\u4EF7\u683C <b>${pct2(last.benchmark / r.initial - 1)}</b></div></div><div class="return-chart"><div class="return-axis"><span>${pct2(hi)}</span><span>${pct2((hi + lo) / 2)}</span><span>${pct2(lo)}</span></div><div class="return-plot">${svg}</div></div><div class="return-dates"><span>${points[0].date}</span><span>${last.date}</span></div><label class="chart-scrubber">\u62D6\u52A8\u56DE\u770B\u6BCF\u4E00\u5929<input id="reportDay" type="range" min="0" max="${points.length - 1}" step="1" value="${at}" aria-label="\u56DE\u770B\u6F14\u7EC3\u65E5\u671F" ${points.length < 2 ? "disabled" : ""}></label><div class="day-readout" aria-live="polite"><span>${chosen.date}<small>09:00\u53EF\u89C1\u7684\u8D26\u6237</small></span><span>\u6536\u76CA\u7387<b class="${tone(ret)}">${pct2(ret)}</b></span><span>\u76C8\u4E8F\u91D1\u989D<b>${signed(chosen.total - r.initial)}</b></span><span>\u540C\u671F\u57FA\u51C6<b>${pct2(bench)}</b></span></div>`;
}
function reportMarkup(v, revealed = 1) {
  const { run: r, portfolio: p, report: a } = v, passed = p.return + 1e-10 >= r.target, top = a.contributors[0], bottom = a.contributors.at(-1), largest = Math.max(1, ...a.contributors.map((c) => Math.abs(c.profit))), earned = a.badges.filter((b) => b.earned).length;
  const status = r.completed ? passed ? "\u672C\u5C40\u76EE\u6807\u8FBE\u6210" : "\u672C\u5C40\u65C5\u7A0B\u5B8C\u6210" : "\u65C5\u7A0B\u8FDB\u884C\u4E2D \xB7 \u9636\u6BB5\u62A5\u544A";
  const hero = `<header class="persona-card"><div class="persona-copy"><div class="eyebrow">YOUR FIELD NOTES / \u7B2C ${r.elapsed} \u5929\u7684\u4F60</div><span class="report-status">${status}</span><h2>${esc2(a.role.name)}</h2><p class="persona-line">${esc2(a.role.line)}</p><div class="persona-tags"><span>${esc2(r.openingRegime)}\u5F00\u5C40</span><span>${a.filledCount}\u7B14\u6210\u4EA4</span><span>${a.noteDays}\u5929\u4E3B\u52A8\u590D\u76D8</span></div><p class="persona-sample">${esc2(a.sample)}</p></div><div class="persona-emblem" aria-label="\u672C\u5C40\u98CE\u683C\u4EE3\u53F7 ${a.code}"><span class="emblem-symbol" aria-hidden="true">${a.role.icon}</span><b>${a.code}</b><small>\u672C\u5C40\u884C\u4E3A\u753B\u50CF</small></div><div class="hero-result"><div><span>${r.completed ? "\u6700\u7EC8\u6536\u76CA\u7387" : "\u5F53\u524D\u6536\u76CA\u7387"}</span><strong>${pct2(p.return)}</strong></div><div><span>\u8D26\u6237\u76C8\u4E8F \xB7 \u5DF2\u8BA1\u5B9E\u9645\u53D1\u751F\u8D39\u7528</span><b>${signed(a.profit)}</b><small>\xA5${money(r.initial)} \u2192 \xA5${money(p.total)}</small></div><div><span>\u6700\u5927\u56DE\u64A4</span><b>${(p.drawdown * 100).toFixed(2)}%</b><small>\u76EE\u6807 ${pct2(r.target)} \xB7 \u5DF2\u63A8\u8FDB ${r.elapsed}/${r.duration || 30} \u5929</small></div></div></header>`;
  const c1 = `${heading(1, "\u5148\u770B\u7ED3\u679C\uFF0C\u518D\u56DE\u5230\u5F53\u65F6\u3002", "\u6536\u76CA\u7387\u3001\u91D1\u989D\u4E0E\u57FA\u51C6\u653E\u5728\u540C\u4E00\u6761\u65F6\u95F4\u7EBF\u4E0A\u3002")}<p class="report-lead">${esc2(a.closing)}</p><div id="reportChart">${reportChart(v, r.curve.length - 1)}</div><div class="report-facts"><div><span>\u76F8\u5BF9\u6CAA\u6DF1300</span><b>${(p.excess >= 0 ? "+" : "") + (p.excess * 100).toFixed(2)} \u4E2A\u767E\u5206\u70B9</b></div><div><span>\u7D2F\u8BA1\u8D39\u7528</span><b>\xA5${money(p.fees)}</b></div><div><span>\u6536\u76CA\u76EE\u6807</span><b>${pct2(r.target)}</b></div></div><p class="report-footnote">\u8D26\u6237\u6536\u76CA =\uFF08\u603B\u8D44\u4EA7 \u2212 \u521D\u59CB\u672C\u91D1\uFF09\xF7 \u521D\u59CB\u672C\u91D1\u3002\u5305\u542B\u73B0\u91D1\u3001\u57FA\u91D1\u5E02\u503C\u3001\u51BB\u7ED3\u7533\u8D2D\u6B3E\u53CA\u5F85\u5230\u8D26\u6B3E\uFF1B\u5DF2\u6263\u5B9E\u9645\u53D1\u751F\u7684\u6559\u5B66\u8D39\u7528\uFF0C\u672A\u5F3A\u5236\u6E05\u4ED3\u6216\u9884\u6263\u672A\u6765\u8D4E\u56DE\u8D39\u3002\u6CAA\u6DF1300\u4E3A\u4E0D\u542B\u80A1\u606F\u518D\u6295\u8D44\u7684\u4EF7\u683C\u57FA\u51C6\uFF0C\u4E0E\u57FA\u91D1\u53E3\u5F84\u5B58\u5728\u5DEE\u5F02\u3002\u56FE\u4E2D\u65E5\u671F\u4E3A\u6B21\u65E509:00\u7684\u53EF\u89C1\u8D26\u6237\u65F6\u70B9\u3002</p>`;
  const c2 = `${heading(2, "\u4F60\u7684\u98CE\u683C\uFF0C\u85CF\u5728\u8FD9\u4E9B\u9009\u62E9\u91CC\u3002", "\u56DB\u4E2A\u89C2\u5BDF\u7EF4\u5EA6\uFF0C\u4E0D\u7ED9\u4EBA\u8D34\u6C38\u4E45\u6807\u7B7E\u3002")}<div class="trait-grid">${a.dimensions.map((d, i) => `<article class="trait"><div class="trait-head"><span>0${i + 1} / ${d.name}</span><b>${esc2(d.display)}</b></div><div class="trait-track" role="img" aria-label="${esc2(d.display)}">${d.value === null ? '<span class="trait-no-data">\u7B49\u5F85\u66F4\u591A\u8BB0\u5F55</span>' : `<i style="left:${Math.max(0, Math.min(100, d.value * 100))}%"></i>`}</div><div class="trait-poles"><span>${d.left}</span><span>${d.right}</span></div><p>${d.reading}</p><details><summary>\u4E3A\u4EC0\u4E48\u8FD9\u6837\u5224\u65AD\uFF1F</summary><p>${d.evidence}</p></details></article>`).join("")}</div><div class="mirror-grid"><article><span>\u4F60\u53EF\u4EE5\u4FDD\u7559\u7684\u4E60\u60EF</span><h3>${esc2(a.role.strength)}</h3></article><article><span>\u4E0B\u6B21\u503C\u5F97\u7559\u610F\u7684\u76F2\u70B9</span><h3>${esc2(a.role.blindspot)}</h3></article></div><details class="report-method"><summary>\u98CE\u683C\u79F0\u53F7\u4E0E\u4EE3\u53F7\u7684\u8BA1\u7B97\u89C4\u5219</summary><p>\u8FD9\u662F\u672C\u6B21\u6F14\u7EC3\u7684\u6E38\u620F\u5316\u884C\u4E3A\u6807\u7B7E\uFF0C\u4E0D\u662FMBTI\u6216\u5FC3\u7406\u6D4B\u8BC4\uFF0C\u4E5F\u4E0D\u5224\u65AD\u957F\u671F\u6295\u8D44\u80FD\u529B\u3002C/P\uFF1A\u5E73\u5747\u57FA\u91D1\u4ED3\u4F4D\u4F4E\u4E8E/\u4E0D\u4F4E\u4E8E50%\uFF1BF/M\uFF1A\u6700\u5927\u5355\u57FA\u91D1\u5360\u6BD4\u5747\u503C\u4E0D\u4F4E\u4E8E/\u4F4E\u4E8E65%\uFF1BA/W\uFF1A\u6709\u5DF2\u6210\u4EA4\u51B3\u7B56\u7684\u65E5\u671F\u5360\u6BD4\u4E0D\u4F4E\u4E8E/\u4F4E\u4E8E30%\uFF1BR/O\uFF1A\u4E3B\u52A8\u7B14\u8BB0\u65E5\u671F\u5360\u6BD4\u4E0D\u4F4E\u4E8E/\u4F4E\u4E8E20%\u3002\u6CA1\u6709\u4E70\u5165\u65F6\u4E3AWAIT\u3002\u4EE3\u53F7\u5404\u7AEF\u90FD\u6CA1\u6709\u201C\u4F18\u79C0/\u5DEE\u52B2\u201D\u7684\u542B\u4E49\u3002</p></details>`;
  const c3 = `${heading(3, "\u662F\u8C01\uFF0C\u6539\u5199\u4E86\u4F60\u7684\u7ED3\u5C40\uFF1F", "\u628A\u6BCF\u53EA\u57FA\u91D1\u7684\u6301\u4ED3\u53D8\u5316\u3001\u5356\u51FA\u6536\u5165\u3001\u5206\u7EA2\u4E0E\u8D39\u7528\u653E\u56DE\u8D26\u672C\u3002")}${a.contributors.length ? `<div class="reveal-insight"><span>\u672C\u5C40\u6700\u5927\u51C0\u8D21\u732E</span><h3>${esc2(top.name)}</h3><strong class="${tone(top.profit)}">${signed(top.profit)}</strong><p>${top.profit > 0 ? "\u5B83\u662F\u672C\u6B21\u51C0\u76C8\u4E8F\u8D21\u732E\u6700\u9AD8\u7684\u57FA\u91D1\u3002" : top.profit < 0 ? "\u6240\u6709\u5DF2\u4EA4\u6613\u57FA\u91D1\u5747\u4E3A\u8D1F\u8D21\u732E\uFF1B\u8FD9\u4E00\u53EA\u7684\u4E8F\u635F\u6700\u5C11\u3002" : "\u5B83\u7684\u51C0\u8D21\u732E\u63A5\u8FD1\u96F6\u3002"}${bottom !== top && bottom.profit < 0 ? ` \u6700\u5927\u8D1F\u8D21\u732E\u6765\u81EA${esc2(bottom.name)}\uFF08${signed(bottom.profit)}\uFF09\u3002` : ""}</p></div><div class="attribution-list">${a.contributors.map((c) => `<div class="attribution-row"><div><b>${esc2(c.name)}</b><small>${c.code} \xB7 ${c.units > 1e-6 ? "\u4ECD\u6709\u6301\u4ED3" : "\u5DF2\u9000\u51FA"}</small></div><div class="contribution-track"><i class="${tone(c.profit)}" style="width:${Math.max(1, Math.abs(c.profit) / largest * 100)}%"></i></div><strong class="${tone(c.profit)}">${signed(c.profit)}</strong><details><summary>\u67E5\u770B\u8D26\u672C</summary><p>\u4E70\u5165\u603B\u652F\u51FA \xA5${money(c.bought)}\uFF1B\u5356\u51FA\u51C0\u6536\u5165 \xA5${money(c.sold)}\uFF1B\u73B0\u91D1\u5206\u7EA2 \xA5${money(c.dividends)}\uFF1B\u671F\u672B\u6301\u4ED3\u5E02\u503C \xA5${money(c.value)}\uFF1B\u5DF2\u4ED8\u8D39\u7528 \xA5${money(c.fees)}\u3002</p></details></div>`).join("")}</div><p class="report-footnote">\u51C0\u8D21\u732E = \u5356\u51FA\u51C0\u6536\u5165 + \u73B0\u91D1\u5206\u7EA2 + \u5F53\u524D\u6301\u4ED3\u5E02\u503C \u2212 \u4E70\u5165\u652F\u51FA\u3002\u8D39\u7528\u5DF2\u5305\u542B\u5728\u4E70\u5165\u652F\u51FA\u4E0E\u5356\u51FA\u51C0\u6536\u5165\u5185\uFF0C\u4E0D\u91CD\u590D\u6263\u9664\u3002\u5168\u90E8\u57FA\u91D1\u8D21\u732E\u4E4B\u548C\u4E0E\u8D26\u6237\u76C8\u4E8F\u6838\u5BF9\uFF0C\u542B\u672A\u5B9E\u73B0\u6D6E\u76C8\u4E8F\uFF1B\u5B83\u4E0D\u662F\u5BF9\u57FA\u91D1\u672A\u6765\u597D\u574F\u7684\u8BC4\u4EF7\u3002</p>` : `<div class="report-empty"><span>\u25CC</span><h3>${a.reconciled ? "\u8FD9\u4E00\u6B21\uFF0C\u73B0\u91D1\u4E5F\u662F\u4E3B\u89D2\u3002" : "\u6536\u76CA\u62C6\u89E3\u6682\u672A\u5B8C\u6210\u6838\u5BF9"}</h3><p>${a.reconciled ? "\u6CA1\u6709\u6210\u4EA4\uFF0C\u5C31\u6CA1\u6709\u53EF\u5F52\u56E0\u7ED9\u57FA\u91D1\u7684\u76C8\u4E8F\u3002\u4F60\u7684\u7ED3\u679C\u4ECD\u7136\u662F\u4E00\u4EFD\u6709\u6548\u7684\u89C2\u5BDF\u8BB0\u5F55\u3002" : "\u8D26\u6237\u603B\u6536\u76CA\u4ECD\u7136\u53EF\u89C1\uFF1B\u6682\u4E0D\u5C55\u793A\u672A\u6838\u5BF9\u7684\u57FA\u91D1\u8D21\u732E\u3002"}</p></div>`}<div class="cost-receipt"><span>\u8FD9\u4E00\u5C40\uFF0C\u4F60\u4E3A\u4EA4\u6613\u4ED8\u51FA\u4E86</span><b>\xA5${money(p.fees)}</b><span>\u5360\u521D\u59CB\u672C\u91D1 ${(a.feeDrag * 100).toFixed(3)}% \xB7 ${a.filledCount}\u7B14\u6210\u4EA4</span></div>`;
  const alt = a.alternate;
  const c4 = `${heading(4, "\u5982\u679C\u7B2C\u4E00\u7B14\u4E4B\u540E\uFF0C\u4F60\u53EA\u662F\u7B49\u4E0B\u53BB\uFF1F", "\u8FD9\u662F\u53EF\u590D\u7B97\u7684\u5E73\u884C\u8DEF\u7EBF\uFF0C\u4E0D\u662F\u4E8B\u540E\u6311\u51FA\u7684\u6700\u4F73\u7B54\u6848\u3002")}${alt ? `<div class="parallel-paths"><article class="actual-path"><span>\u4F60\u771F\u6B63\u8D70\u8FC7\u7684\u8DEF\u7EBF</span><strong>${pct2(p.return)}</strong><p>\u6700\u7EC8/\u5F53\u524D\u8D44\u4EA7 \xA5${money(p.total)}</p><small>${a.filledCount} \u7B14\u6210\u4EA4 \xB7 \u5DF2\u4ED8\u8D39\u7528 \xA5${money(p.fees)}</small></article><article><span>\u7B2C\u4E00\u7B14\u4E70\u5165\u540E\uFF0C\u4E0D\u518D\u4EA4\u6613</span><strong>${pct2(alt.return)}</strong><p>\u540C\u4E00\u622A\u6B62\u65F6\u70B9 \xA5${money(alt.total)}</p><small>\u4FDD\u7559\u7B2C\u4E00\u7B14\u4EFD\u989D\u4E0E\u5269\u4F59\u73B0\u91D1\uFF0C\u5206\u7EA2\u73B0\u91D1\u5165\u8D26</small></article></div><div class="parallel-answer"><b>${Math.abs(alt.difference) < 0.01 ? "\u4E24\u6761\u8DEF\u7EBF\u76EE\u524D\u51E0\u4E4E\u91CD\u5408\u3002" : `\u4F60\u7684\u5B9E\u9645\u8DEF\u7EBF\u6BD4\u8FD9\u6761\u56FA\u5B9A\u8DEF\u7EBF${alt.difference > 0 ? "\u591A" : "\u5C11"}\u4E86 \xA5${money(Math.abs(alt.difference))}\u3002`}</b><p>\u57FA\u4E8E ${alt.date} \u7684\u7B2C\u4E00\u7B14\uFF1A${esc2(alt.name)}\uFF0C\u4E70\u5165\u652F\u51FA \xA5${money(alt.amount)}\u3002\u6BD4\u8F83\u4F1A\u540C\u65F6\u5305\u542B\u4E4B\u540E\u7684\u6295\u5165\u89C4\u6A21\u3001\u57FA\u91D1\u9009\u62E9\u3001\u4E70\u5356\u65F6\u673A\u548C\u8D39\u7528\u5DEE\u5F02\uFF0C\u4E0D\u80FD\u53EA\u5F52\u56E0\u4E8E\u67D0\u4E00\u6B21\u64CD\u4F5C\u3002</p></div><details class="report-method"><summary>\u5E73\u884C\u8DEF\u7EBF\u600E\u4E48\u7B97\uFF1F</summary><p>\u521D\u59CB\u672C\u91D1\u51CF\u53BB\u7B2C\u4E00\u7B14\u4E70\u5165\u652F\u51FA\uFF0C\u4FDD\u7559\u7B2C\u4E00\u7B14\u5B9E\u9645\u83B7\u5F97\u7684\u4EFD\u989D\uFF0C\u6309\u622A\u6B62\u65F6\u70B9\u5DF2\u77E5\u51C0\u503C\u4F30\u503C\uFF0C\u52A0\u4E0A\u6B64\u540E\u8BE5\u4EFD\u989D\u5E94\u5F97\u7684\u73B0\u91D1\u5206\u7EA2\u3002\u4FDD\u7559\u7B2C\u4E00\u7B14\u7533\u8D2D\u8D39\uFF0C\u5FFD\u7565\u6240\u6709\u540E\u7EED\u8BA2\u5355\uFF1B\u4E24\u6761\u8DEF\u7EBF\u5747\u4E0D\u5F3A\u5236\u6E05\u4ED3\u3001\u4E0D\u9884\u6263\u672A\u6765\u8D4E\u56DE\u8D39\u3002\u53EA\u8BA1\u7B97\u5DF2\u7ECF\u8D70\u8FC7\u7684\u65E5\u5B50\uFF0C\u4E0D\u4F7F\u7528\u672A\u6765\u884C\u60C5\u3002</p></details>` : `<div class="report-empty"><span></span><h3>\u7B2C\u4E00\u7B14\u5C1A\u672A\u53D1\u751F\uFF0C\u5C94\u8DEF\u8FD8\u6CA1\u6709\u5C55\u5F00\u3002</h3><p>\u6709\u4E70\u5165\u6210\u4EA4\u540E\uFF0C\u8FD9\u91CC\u4F1A\u628A\u4F60\u7684\u5B9E\u9645\u8DEF\u7EBF\uFF0C\u4E0E\u201C\u53EA\u4FDD\u7559\u7B2C\u4E00\u7B14\u201D\u7684\u56FA\u5B9A\u8DEF\u7EBF\u653E\u5728\u4E00\u8D77\u3002\u65E0\u9700\u4E3A\u4E86\u751F\u6210\u62A5\u544A\u800C\u4EA4\u6613\u3002</p></div>`}<div class="cash-alternate"><span>\u53E6\u4E00\u6761\u5DF2\u77E5\u8DEF\u7EBF\uFF1A\u59CB\u7EC8\u6301\u6709\u73B0\u91D1</span><b>0.00% \xB7 \xA5${money(r.initial)}</b><small>\u6309\u672C\u6F14\u7EC3\u73B0\u91D1\u4E0D\u8BA1\u606F\u7684\u5047\u8BBE\u3002</small></div>`;
  const c5 = `${heading(5, "\u6709\u4E9B\u65E5\u5B50\uFF0C\u503C\u5F97\u518D\u770B\u4E00\u6B21\u3002", "\u5148\u8FD8\u539F\u53D1\u751F\u4E86\u4EC0\u4E48\uFF0C\u518D\u5224\u65AD\u81EA\u5DF1\u5F53\u65F6\u4E3A\u4EC0\u4E48\u8FD9\u6837\u505A\u3002")}<div class="story-timeline">${a.moments.map((m, i) => `<article><div class="moment-pin">${String(i + 1).padStart(2, "0")}</div><time>${m.date}</time><h3>${esc2(m.title)}</h3><p>${esc2(m.body)}</p>${m.quote ? `<blockquote>\u201C${esc2(m.quote)}\u201D</blockquote>` : ""}</article>`).join("") || '<div class="report-empty"><h3>\u6545\u4E8B\u8FD8\u5728\u7B49\u5F85\u7B2C\u4E00\u6761\u8BB0\u5F55\u3002</h3><p>\u4E0D\u4EA4\u6613\u4E5F\u53EF\u4EE5\u5199\u4E0B\u4ECA\u5929\u4E3A\u4EC0\u4E48\u7EE7\u7EED\u7B49\u5F85\u3002</p></div>'}</div>`;
  const c6 = `${heading(6, "\u628A\u8FD9\u4E00\u5C40\uFF0C\u53D8\u6210\u4E0B\u4E00\u5C40\u7684\u8D77\u70B9\u3002", "\u6210\u5C31\u8BB0\u5F55\u4F60\u505A\u8FC7\u4EC0\u4E48\uFF0C\u7EC3\u4E60\u4EFB\u52A1\u5E2E\u52A9\u4F60\u68C0\u9A8C\u4E0B\u4E00\u6B21\u7684\u5224\u65AD\u3002")}<div class="badge-heading"><b>${earned} / ${a.badges.length} \u679A\u672C\u5C40\u6210\u5C31</b><span>\u4E0D\u662F\u73A9\u5BB6\u6392\u540D\uFF0C\u4E0D\u8BC4\u4EF7\u6536\u76CA\u80FD\u529B</span></div><div class="achievement-grid">${a.badges.map((b) => `<article class="achievement ${b.earned ? "earned" : ""}"><span aria-hidden="true">${b.icon}</span><h3>${b.name}</h3><b>${b.earned ? "\u5DF2\u8BB0\u5F55" : "\u5C1A\u672A\u8FBE\u6210"}</b><p>${esc2(b.reason)}</p></article>`).join("")}</div><h3 class="mission-heading">\u9009\u4E00\u4E2A\u503C\u5F97\u5E26\u8D70\u7684\u5C0F\u5B9E\u9A8C</h3><div class="mission-grid">${a.missions.map((m, i) => `<article><span>QUEST 0${i + 1}</span><h3>${m.title}</h3><p>${m.body}</p><button data-report-mission="${i}">\u52A0\u5165\u6211\u7684\u590D\u76D8</button></article>`).join("")}</div><p class="report-footnote">\u4E00\u5C40${r.duration || 30}\u5929\u53EA\u80FD\u63CF\u8FF0\u4E00\u6B21\u7ECF\u5386\u3002\u79F0\u53F7\u3001\u6210\u5C31\u548C\u76EE\u6807\u90FD\u662F\u6E38\u620F\u89C4\u5219\uFF1B\u6CA1\u6709\u4EBA\u7FA4\u6392\u540D\u3001\u5FC3\u7406\u8BCA\u65AD\u6216\u5BF9\u672A\u6765\u6536\u76CA\u7684\u4FDD\u8BC1\u3002</p>`;
  const chapters = [c1, c2, c3, c4, c5, c6];
  return `<div class="review-screen" id="rehearsalReport"><div class="report-topline"><div><span class="eyebrow">THE REHEARSAL CHRONICLE</span><p>${r.start} \u2014 ${r.date} \xB7 ${r.completed ? "\u5B8C\u6574\u590D\u76D8" : "\u9636\u6BB5\u590D\u76D8"}</p></div><div class="report-actions"><button id="expandReport">\u5C55\u5F00\u5B8C\u6574\u62A5\u544A</button><button id="printReport">\u6253\u5370 / \u4FDD\u5B58PDF</button><button id="exportRun">\u5BFC\u51FA\u6570\u636E</button></div></div>${hero}<nav class="chapter-nav" aria-label="\u590D\u76D8\u7AE0\u8282">${chapterNames.map((name, i) => `<button data-chapter="${i + 1}" class="${i < revealed ? "revealed" : ""}"><span>0${i + 1}</span>${name}</button>`).join("")}</nav><p class="chapter-progress" aria-live="polite">\u5DF2\u5C55\u5F00 ${revealed} / 6 \u7AE0 \xB7 \u6BCF\u4E00\u6761\u7ED3\u8BBA\u90FD\u6709\u8BA1\u7B97\u4F9D\u636E</p>${chapters.map((content, i) => `<section class="report-chapter" id="reportChapter${i + 1}" ${i >= revealed ? "hidden" : ""}>${content}</section>`).join("")}<div class="next-chapter" ${revealed >= 6 ? "hidden" : ""}><span>\u63A5\u4E0B\u6765\uFF0C\u4F60\u4F1A\u770B\u5230</span><h3>${chapterNames[Math.min(revealed, 5)]}</h3><button id="nextReportChapter" class="primary">\u7EE7\u7EED\u7FFB\u5F00\u4E0B\u4E00\u7AE0 \u2192</button><p>\u5B8C\u6574\u5185\u5BB9\u5747\u53EF\u9605\u8BFB</p></div></div>`;
}

// simulation/stocks.js
var $ = (id) => document.getElementById(id);
var esc3 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var money2 = (n) => Number(n).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
var pct3 = (n) => (n >= 0 ? "+" : "") + (n * 100).toFixed(2) + "%";
var meta;
var view;
var date = "2024-09-02";
var duration = 90;
var capital = 1e5;
var level = 1;
var tab = "stocks";
var query = "";
var matchOnly = true;
var busy = false;
var chapter = 1;
var chartDays = 90;
var setupToken = 0;
var modal = $("modal");
document.querySelector(".modal-close").onclick = () => modal.close();
function toast(text, error = false) {
  $("toast").textContent = text;
  $("toast").className = error ? "error-toast" : "";
  $("toast").hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("toast").hidden = true, 6e3);
}
async function api(path, body) {
  let response;
  try {
    response = await fetch("/api/stock/" + path, { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : void 0 });
  } catch {
    throw Error("\u65E0\u6CD5\u8FDE\u63A5\u670D\u52A1\u3002\u8BF7\u91CD\u65B0\u8F7D\u5165\u5B58\u6863\u6838\u5BF9\u64CD\u4F5C\u7ED3\u679C\u3002");
  }
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "\u8BF7\u6C42\u5931\u8D25");
  return data;
}
function dialog(html, wide = false) {
  $("modalContent").innerHTML = html;
  modal.classList.toggle("wide-dialog", wide);
  if (!modal.open) modal.showModal();
}
function candles(bars, label) {
  if (!bars.length) return "<p>\u6682\u65E0\u6B64\u524D\u5DF2\u62AB\u9732\u884C\u60C5</p>";
  const lo = Math.min(...bars.map((b) => b[4])), hi = Math.max(...bars.map((b) => b[3])), range = hi - lo || 1, maxVol = Math.max(1, ...bars.map((b) => b[5])), width = 720 / bars.length, w = Math.max(1, width * 0.65), x = (i) => 10 + (i + 0.5) * width, y = (v) => 12 + (hi - v) / range * 158;
  return `<div class="candle-chart"><div class="candle-price-range"><span>\u533A\u95F4\u6700\u9AD8 \xA5${hi.toFixed(2)}</span><span>\u533A\u95F4\u6700\u4F4E \xA5${lo.toFixed(2)}</span></div><svg viewBox="0 0 740 242" role="img" aria-label="${esc3(label)}\uFF0C${bars[0][0]}\u81F3${bars.at(-1)[0]}\uFF0C\u65E5K\u7EBF\u53CA\u6210\u4EA4\u91CF" preserveAspectRatio="none"><path d="M0 12H740 M0 90H740 M0 170H740 M0 188H740" stroke="#d5e4e0" stroke-dasharray="3 4"/>${bars.map((b, i) => {
    const color = b[2] >= b[1] ? "#e36440" : "#15816c";
    return `<g><title>${b[0]} \u5F00${b[1]} \u9AD8${b[3]} \u4F4E${b[4]} \u6536${b[2]} \u6210\u4EA4${money2(b[5])}\u624B</title><path d="M${x(i)} ${y(b[3])}V${y(b[4])}" stroke="${color}"/><rect x="${x(i) - w / 2}" y="${Math.min(y(b[1]), y(b[2]))}" width="${w}" height="${Math.max(1, Math.abs(y(b[1]) - y(b[2])))}" fill="${color}"/><rect x="${x(i) - w / 2}" y="${236 - b[5] / maxVol * 42}" width="${w}" height="${b[5] / maxVol * 42}" fill="${color}" opacity=".5"/></g>`;
  }).join("")}</svg><div class="holding-chart-dates"><span>${bars[0][0]}</span><span>\u672A\u590D\u6743 \xB7 \u4E0B\u65B9\u4E3A\u6210\u4EA4\u91CF</span><span>${bars.at(-1)[0]}</span></div></div>`;
}
function historyBars(s) {
  const cutoff = new Date(Date.parse(view.run.date + "T00:00:00Z") - chartDays * 864e5).toISOString().slice(0, 10);
  return s.bars.filter((b) => b[0] >= cutoff);
}
function caveat() {
  return `<details class="data-note"><summary>\u6837\u672C\u3001\u6210\u4EA4\u89C4\u5219\u4E0E\u6570\u636E\u6765\u6E90</summary><p>${esc3(meta.limitations)}</p><p>${esc3(meta.assumptions)}</p><p>\u8FD9\u662F09:00\u51B3\u7B56\u3001\u6B21\u65E5\u67E5\u770B\u7ED3\u679C\u7684\u65E5\u7EBF\u6F14\u7EC3\uFF0C\u4E0D\u63D0\u4F9B\u76D8\u4E2D\u64AE\u5408\u6216\u771F\u5B9E\u4E0B\u5355\u3002\u5F00\u76D8\u9650\u4EF7\u5904\u4FDD\u5B88\u62D2\u7EDD\u8BA2\u5355\u4E0D\u4EE3\u8868\u5B9E\u9645\u5168\u5929\u4E0D\u80FD\u6210\u4EA4\uFF1B\u672A\u590D\u539F\u8BA2\u5355\u961F\u5217\u3002\u5356\u51FA\u6240\u5F97\u5728\u63A8\u8FDB\u540E\u6210\u4E3A\u8D26\u6237\u53EF\u7528\u8D44\u91D1\uFF0C\u4E0D\u6A21\u62DF\u94F6\u884C\u5361\u53D6\u6B3E\u3002</p><p>\u6A2A\u76D8\u548C\u7A81\u7834\u4F7F\u7528\u6309\u5F53\u65F6\u5206\u7EA2\u9001\u8F6C\u9010\u65E5\u8BA1\u7B97\u7684\u6536\u76CA\u5E8F\u5217\uFF1BK\u7EBF\u5C55\u793A\u672A\u590D\u6743\u4EF7\u683C\u3002\u4E0D\u540C\u53E3\u5F84\u5206\u522B\u6807\u793A\u3002\u56FA\u5B9A\u6837\u672C\u672A\u7EB3\u5165\u9000\u5E02\u80A1\uFF0C\u4E0D\u80FD\u5F53\u4F5C\u5168\u5E02\u573A\u65E0\u504F\u56DE\u6D4B\u3002</p><p>\u884C\u60C5\uFF1A<a href="https://gu.qq.com/sh000300" target="_blank" rel="noopener">\u817E\u8BAF\u8BC1\u5238</a>\uFF1B\u516C\u53F8\u884C\u52A8\uFF1A\u5404\u80A1\u7968\u5361\u7247\u7684\u65B0\u6D6A\u5206\u7EA2\u9001\u8F6C\u8D44\u6599\u3002\u89C4\u5219\u53C2\u8003\uFF1A<a href="https://docs.static.szse.cn/www/lawrules/rule/trade/W020230217564423808793.pdf" target="_blank" rel="noopener">\u6DF1\u4EA4\u62402023\u4EA4\u6613\u89C4\u5219</a>\uFF1B<a href="https://shanghai.chinatax.gov.cn/zcfw/zcfgk/yhs/202308/t468451.html" target="_blank" rel="noopener">2023\u5370\u82B1\u7A0E\u516C\u544A</a>\u3002\u8D39\u7528\u3001\u6ED1\u70B9\u53CA\u6D3E\u606F\u5904\u7406\u4EE5\u672C\u9875\u6559\u5B66\u5047\u8BBE\u4E3A\u51C6\u3002</p><p>\u8FDB\u5EA6\u6309\u5F53\u524D\u6D4F\u89C8\u5668\u8EAB\u4EFD\u4FDD\u5B58\u5230\u670D\u52A1\u7AEF\u3002\u6E05\u9664Cookie\u6216\u6362\u8BBE\u5907\u540E\u65E0\u6CD5\u6062\u590D\uFF0C\u8BF7\u5BFC\u51FA\u62A5\u544A\u3002</p></details>`;
}
async function setup() {
  const token = ++setupToken;
  view = null;
  document.querySelector(".end-day")?.remove();
  date = date > meta.startMaxByDuration[duration] ? meta.startMaxByDuration[duration] : date;
  try {
    const [m, calendar] = await Promise.all([api("preview?date=" + date + "&duration=" + duration), api("calendar?date=" + date + "&duration=" + duration)]);
    if (token !== setupToken) return;
    const first = date.slice(0, 7) + "-01", offset = ((/* @__PURE__ */ new Date(first + "T00:00:00Z")).getUTCDay() + 6) % 7 + (Number(calendar.days[0]?.date.slice(-2) || 1) - 1);
    $("app").innerHTML = `<div class="stock-intro"><div><span class="eyebrow">A-SHARE / MANUAL REHEARSAL</span><h1>A\u80A1\uFF0C\u56DE\u5230\u51B3\u7B56\u53D1\u751F\u4E4B\u524D\u3002</h1><p>${meta.stockCount}\u53EA\u6CAA\u6DF1\u4E3B\u677F\u884C\u4E1A\u6837\u672C \xB7 \u771F\u5B9E\u5386\u53F2\u65E5\u7EBF \xB7 \u865A\u62DF\u8D44\u91D1</p></div><a class="market-home" href="/simulation.html">\u5207\u6362\u57FA\u91D1\u6F14\u7EC3</a></div><div class="setup-grid"><section class="panel calendar-panel"><h2>\u9009\u62E9\u5386\u53F2\u8D77\u70B9</h2><label>\u8D77\u59CB\u65E5\u671F<input id="stockDate" type="date" value="${date}" min="${meta.startMin}" max="${meta.startMaxByDuration[duration]}"></label><div class="week">${["\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u65E5"].map((x) => `<span>${x}</span>`).join("")}</div><div class="calendar">${"<span></span>".repeat(offset)}${calendar.days.map((d) => `<button class="${d.regime} ${d.date === date ? "selected" : ""}" data-date="${d.date}" aria-label="${d.date} ${d.label}">${Number(d.date.slice(-2))}${d.events ? '<span class="event-mark">\u2022</span>' : ""}</button>`).join("")}</div><p class="data-note">\u989C\u8272\u57FA\u4E8E\u5F53\u65F6\u5DF2\u77E5\u6307\u6570\uFF1B\u5706\u70B9\u8868\u793A\u5F53\u65E5\u8D77\u53EF\u89C1\u7684\u7CBE\u9009\u4E8B\u4EF6\u3002\u8D77\u70B9\u4E0A\u9650\u968F\u6F14\u7EC3\u671F\u9650\u8C03\u6574\u3002</p></section>${marketCard(m)}<section class="panel challenge-panel"><div><h2>\u8BBE\u7F6E\u672C\u5C40</h2><label>\u6F14\u7EC3\u671F\u9650<select id="stockDuration">${[30, 90, 180, 365].map((d) => `<option value="${d}" ${d === duration ? "selected" : ""}>${d === 365 ? "1\u5E74" : d + "\u5929"}</option>`).join("")}</select></label><label>\u521D\u59CB\u8D44\u91D1<input id="stockCapital" type="number" min="1000" max="100000000" value="${capital}"></label></div><div><p>${m.label}\u5F00\u5C40 \xB7 ${duration}\u5929\u6E38\u620F\u76EE\u6807</p><div class="level-grid">${["\u57FA\u7840", "\u8FDB\u9636", "\u6311\u6218"].map((l, i) => `<button data-level="${i}" class="level ${level === i ? "selected" : ""}">${l}<b>${pct3(m.targets[i])}</b></button>`).join("")}</div><p class="data-note">\u76EE\u6807\u662F\u6309\u5F00\u5C40\u73AF\u5883\u4E0E\u671F\u9650\u8BBE\u7F6E\u7684\u7EC3\u4E60\u53C2\u6570\uFF0C\u4E0D\u662F\u6210\u529F\u7387\u6216\u6536\u76CA\u9884\u6D4B\u3002</p></div><div class="launch-row"><p>\u5148\u770B\u5F53\u65F6\u53D1\u751F\u4E86\u4EC0\u4E48\uFF0C\u518D\u9009\u80A1\u3002\u4E70\u5356\u7531\u4F60\u51B3\u5B9A\u3002</p><button id="launchStock" class="primary">\u5F00\u542F${duration}\u5929\u6F14\u7EC3</button></div></section></div><section class="event-section">${eventCards(m)}</section>${caveat()}`;
    $("stockDate").onchange = (e) => {
      date = e.target.value;
      setup();
    };
    $("stockDuration").onchange = (e) => {
      duration = +e.target.value;
      capital = +$("stockCapital").value;
      setup();
    };
    $("stockCapital").oninput = (e) => capital = +e.target.value;
    document.querySelectorAll("[data-date]").forEach((b) => b.onclick = () => {
      date = b.dataset.date;
      setup();
    });
    document.querySelectorAll("[data-level]").forEach((b) => b.onclick = () => {
      level = +b.dataset.level;
      capital = +$("stockCapital").value;
      setup();
    });
    $("launchStock").onclick = async () => {
      if (busy) return;
      busy = true;
      try {
        view = await api("start", { id: crypto.randomUUID(), date, duration, capital: +$("stockCapital").value, level });
        history.replaceState(null, "", "/stocks.html?run=" + view.run.id);
        tab = "stocks";
        render();
      } catch (e) {
        toast(e.message, true);
      } finally {
        busy = false;
      }
    };
  } catch (e) {
    toast(e.message, true);
  }
}
async function act(input) {
  if (busy) return false;
  busy = true;
  document.body.classList.add("busy");
  try {
    view = await api("action", { id: view.run.id, version: view.run.version, actionId: crypto.randomUUID(), ...input });
    if (view.run.completed) tab = "review";
    render();
    return true;
  } catch (e) {
    toast(e.message, true);
    return false;
  } finally {
    busy = false;
    document.body.classList.remove("busy");
  }
}
function render() {
  const { run: r, portfolio: p, market: m } = view;
  $("app").innerHTML = `<div class="run-heading"><div><span class="eyebrow">A-SHARE / ${r.completed ? "REHEARSAL COMPLETE" : "YOUR NEXT DECISION"}</span><h1>${r.completed ? "\u672C\u5C40\u5DF2\u7ED3\u675F" : r.date}<span class="pill">${view.isTrading ? "\u4EA4\u6613\u65E5" : "\u4F11\u5E02\u65E5"} \xB7 09:00</span></h1><p>${r.start} \u2192 ${r.end} \xB7 \u5DF2\u63A8\u8FDB ${r.elapsed}/${r.duration}\u5929 \xB7 \u670D\u52A1\u7AEF\u5DF2\u4FDD\u5B58</p></div><button id="newStock">\u65B0\u5EFA\u6F14\u7EC3</button></div><div class="dashboard"><section class="panel account"><span class="eyebrow">TOTAL ASSETS / \u80A1\u7968\u8D26\u6237</span><div class="total">\xA5${money2(p.total)}</div><div class="account-stats"><div><strong>${pct3(p.return)}</strong><span>\u8D26\u6237\u6536\u76CA</span></div><div><strong>${pct3(p.benchmark)}</strong><span>\u540C\u671F\u6CAA\u6DF1300\u4EF7\u683C</span></div><div><strong>${(p.drawdown * 100).toFixed(2)}%</strong><span>\u6700\u5927\u56DE\u64A4</span></div></div><div class="mini-balances"><div>\u53EF\u7528\u73B0\u91D1<b>\xA5${money2(p.cash)}</b></div><div>\u80A1\u7968\u5E02\u503C<b>\xA5${money2(p.held)}</b></div><div>\u4E70\u5165\u51BB\u7ED3<b>\xA5${money2(p.pending)}</b></div></div></section><section class="panel"><h3>${r.openingRegime}\u5F00\u5C40</h3><div class="target">${pct3(r.target)}</div><p>${r.duration}\u5929\u6E38\u620F\u76EE\u6807 \xB7 \u8D39\u7528 \xA5${money2(p.fees)}</p><div class="progress-track"><i style="width:${r.elapsed / r.duration * 100}%"></i></div><p class="data-note">\u5F53\u524D ${m.label} \xB7 ${m.sentiment}\u3002\u76EE\u6807\u5728\u5F00\u5C40\u9501\u5B9A\u3002</p><button id="stockMarket">\u67E5\u770B\u5E02\u573A\u6863\u6848</button></section></div><div class="tabs" role="tablist">${[["stocks", "\u80A1\u7968\u7B5B\u9009"], ["holdings", "\u6211\u7684\u6301\u4ED3 \xB7 " + p.holdings.length], ["orders", "\u4EA4\u6613\u8BA2\u5355"], ["review", "\u590D\u76D8\u62A5\u544A"]].map(([id, label]) => `<button role="tab" aria-selected="${tab === id}" class="${tab === id ? "active" : ""}" data-tab="${id}">${label}</button>`).join("")}</div><div id="stockWorkspace"></div><section class="event-section">${eventCards(m)}</section>${caveat()}`;
  $("newStock").onclick = () => {
    history.replaceState(null, "", "/stocks.html");
    setup();
  };
  $("stockMarket").onclick = () => dialog(marketCard(m, true) + eventCards(m), true);
  document.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => {
    tab = b.dataset.tab;
    render();
  });
  workspace();
  document.querySelector(".end-day")?.remove();
  if (!r.completed) {
    const bar = document.createElement("div");
    bar.className = "end-day";
    bar.innerHTML = `<div><div class="trade-dock-balances"><span>\u53EF\u7528\u73B0\u91D1<b>\xA5${money2(p.cash)}</b></span><button type="button" data-dock-tab="holdings">\u6301\u4ED3 \xB7 ${p.holdings.length}<b>\xA5${money2(p.held)}</b></button><button type="button" data-dock-tab="orders">\u5F85\u6210\u4EA4<b>${r.orders.filter((o) => o.status === "queued").length} \u7B14</b></button></div><p>${r.orders.filter((o) => o.status === "queued").length}\u7B14\u5F85\u5904\u7406 \xB7 ${view.isTrading ? "\u4E0B\u5355\u540E\u63A8\u8FDB\u65E5\u671F\u67E5\u770B\u6210\u4EA4" : "\u4F11\u5E02\u65E5\u8BA2\u5355\u987A\u5EF6\u5230\u4E0B\u4E00\u4EA4\u6613\u65E5"}</p><label class="advance-pause"><input id="stockPause" type="checkbox" checked>\u91CD\u8981\u4E8B\u4EF6\u6216\u6301\u4ED3\u4FE1\u53F7\u53D8\u5316\u65F6\u6682\u505C</label></div><div class="advance-buttons"><button class="primary" data-next="1">\u4E0B\u4E00\u5929 \u2192</button><button data-next="7">\u4E0B\u4E00\u5468</button><button data-next="30">\u63A8\u8FDB30\u5929</button></div>`;
    document.body.append(bar);
    sizeTradeDock(bar);
    bar.querySelectorAll("[data-dock-tab]").forEach((b) => b.onclick = () => {
      document.querySelector('[data-tab="' + b.dataset.dockTab + '"]')?.click();
      document.querySelector(".tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    bar.querySelectorAll("[data-next]").forEach((b) => b.onclick = async () => {
      if (await act({ type: "advance", days: +b.dataset.next, pause: $("stockPause").checked })) toast(`\u5DF2\u63A8\u8FDB${view.run.advanceSummary.advanced}\u5929 \xB7 ${view.run.advanceSummary.reason}`);
    });
  }
}
function workspace() {
  const { run: r, portfolio: p, stocks } = view, w = $("stockWorkspace");
  if (tab === "stocks") {
    w.innerHTML = `<section class="rule-bar"><h3>\u9009\u62E9\u7B5B\u9009\u89C4\u5219</h3><div class="rule-controls">${[["rule1", "\u6A2A\u76D8\u533A\u95F4"], ["rule2", "\u56FA\u5B9A\u533A\u95F4\u7A81\u7834 \xB7 \u4E24\u70B9\u786E\u8BA4"], ["rule3", "\u6210\u4EA4\u91CF\u653E\u5927"]].map(([id, label]) => `<label class="check-label"><input id="s_${id}" type="checkbox" ${r.rules.enabled.includes(id) ? "checked" : ""}>${label}</label>`).join("")}</div><details><summary>\u53C2\u6570\u4E0E\u8BA1\u7B97\u4F9D\u636E</summary><div class="rule-settings"><label>\u533A\u95F4\u81EA\u7136\u65E5<input id="s_days" type="number" min="5" max="180" value="${r.rules.days}"></label><label>\u632F\u5E45\u4E0A\u9650 %<input id="s_amp" type="number" value="${r.rules.amp}"></label><label>\u6DA8\u8DCC\u4E0B\u9650 %<input id="s_min" type="number" value="${r.rules.min}"></label><label>\u6DA8\u8DCC\u4E0A\u9650 %<input id="s_max" type="number" value="${r.rules.max}"></label><label>\u91CF\u6BD4\u4E0B\u9650<input id="s_volume" type="number" step=".1" value="${r.rules.volume}"></label></div><p>\u591A\u9009\u53D6\u4EA4\u96C6\u3002\u6A2A\u76D8\u7528\u5206\u7EA2\u9001\u8F6C\u8C03\u6574\u540E\u7684\u6536\u76D8\u6536\u76CA\u5E8F\u5217\u3002\u7A81\u7834\u4F7F\u7528\u7A81\u7834\u524D\u5DF2\u786E\u5B9A\u7684\u533A\u95F4\uFF0C\u4E24\u6B21\u8FDE\u7EED\u62AB\u9732\u70B9\u9AD8\u4E8E\u4E0A\u6CBF\u624D\u786E\u8BA4\uFF0C\u56DE\u843D\u81F3\u4E0A\u6CBF\u4EE5\u4E0B\u9000\u51FA\u3002\u91CF\u6BD4=\u6700\u8FD1\u6210\u4EA4\u91CF\xF7\u6B64\u524D20\u4E2A\u4EA4\u6613\u65E5\u5E73\u5747\u6210\u4EA4\u91CF\u3002K\u7EBF\u4FDD\u6301\u771F\u5B9E\u672A\u590D\u6743\u4EF7\u683C\u3002</p></details><button id="applyStockRules" ${r.completed ? "disabled" : ""}>\u5E94\u7528\u89C4\u5219</button></section><div class="filters"><label class="search">\u641C\u7D22\u80A1\u7968<input id="stockSearch" value="${esc3(query)}" placeholder="\u540D\u79F0\u3001\u4EE3\u7801\u6216\u884C\u4E1A"></label><label>\u7ED3\u679C<select id="stockMatch"><option value="match" ${matchOnly ? "selected" : ""}>\u7B26\u5408\u89C4\u5219</option><option value="all" ${!matchOnly ? "selected" : ""}>\u5168\u90E8\u6837\u672C</option></select></label><label>K\u7EBF\u81EA\u7136\u65E5\u671F\u95F4<select id="stockChartDays">${[30, 90, 180].map((n) => `<option value="${n}" ${n === chartDays ? "selected" : ""}>${n}\u5929</option>`).join("")}</select></label></div><p class="data-note">${meta.stockCount}\u53EA\u56FA\u5B9A\u5386\u53F2\u6837\u672C \xB7 \u5F53\u524D\u53EA\u5C55\u793A ${r.date} \u4E4B\u524D\u5DF2\u77E5\u884C\u60C5</p><div id="stockCards" class="stock-cards"></div>`;
    $("stockSearch").oninput = (e) => {
      query = e.target.value;
      cards();
    };
    $("stockMatch").onchange = (e) => {
      matchOnly = e.target.value === "match";
      cards();
    };
    $("stockChartDays").onchange = (e) => {
      chartDays = +e.target.value;
      cards();
    };
    $("applyStockRules").onclick = () => act({ type: "rules", rules: { enabled: ["rule1", "rule2", "rule3"].filter((k) => $("s_" + k).checked), ...Object.fromEntries(["days", "amp", "min", "max", "volume"].map((k) => [k, +$("s_" + k).value])) } });
    cards();
  } else if (tab === "holdings") {
    w.innerHTML = p.holdings.length ? `<div class="holdings-cards">${p.holdings.map((h) => {
      const s = stocks.find((s2) => s2.code === h.code);
      return `<article class="holding-card"><header><div><h3>${esc3(h.name)}</h3><span>${h.code}</span></div><button data-sell="${h.code}" ${!h.available || r.completed ? "disabled" : ""}>\u5356\u51FA</button></header><div class="holding-stats"><div><span>\u6301\u4ED3\u5E02\u503C</span><strong>\xA5${money2(h.value)}</strong><small>\u6210\u672C \xA5${money2(h.cost)}</small></div><div><span>\u6301\u4ED3\u6D6E\u52A8\u76C8\u4E8F</span><strong>${pct3(h.change)}</strong><small>\xA5${money2(h.value - h.cost)}</small></div></div>${candles(historyBars(s), h.name)}<div class="holding-details"><div><span>\u6301\u6709 / \u53EF\u5356\u80A1\u6570</span><b>${h.units} / ${h.available}</b><small>\u5F85\u786E\u8BA4 ${h.locked} \xB7 \u5356\u51FA\u51BB\u7ED3 ${h.reserved}</small></div><div><span>\u5DF2\u77E5\u6536\u76D8\u4EF7</span><b>\xA5${h.nav.toFixed(2)}</b><small>${h.navDate}</small></div></div></article>`;
    }).join("")}</div><p class="data-note">K\u7EBF\u6700\u8FD1${chartDays}\u4E2A\u81EA\u7136\u65E5\u3002\u6301\u4ED3\u6D6E\u76C8\u4E8F\u4E0D\u542B\u5DF2\u5165\u8D26\u73B0\u91D1\u5206\u7EA2\uFF1B\u8D26\u6237\u603B\u6536\u76CA\u542B\u5206\u7EA2\u3002\u4E70\u5165\u80A1\u4EFDT+1\u53EF\u5356\u3002</p>` : '<div class="empty">\u8FD8\u6CA1\u6709\u6301\u4ED3\uFF0C\u53EF\u4EE5\u5148\u7B5B\u9009\u548C\u89C2\u5BDF\u3002</div>';
    w.querySelectorAll("[data-sell]").forEach((b) => b.onclick = () => trade(b.dataset.sell, "sell"));
  } else if (tab === "orders") {
    w.innerHTML = r.orders.length ? `<div class="table-wrap"><table><thead><tr><th>\u80A1\u7968 / \u65B9\u5411</th><th>\u72B6\u6001</th><th>\u91D1\u989D / \u80A1\u6570</th><th>\u6210\u4EA4\u4FE1\u606F</th><th>\u64CD\u4F5C</th></tr></thead><tbody>${[...r.orders].reverse().map((o) => `<tr><td>${esc3(o.name)} \xB7 ${o.side === "buy" ? "\u4E70\u5165" : "\u5356\u51FA"}<small>${o.submitted} \u63D0\u4EA4</small></td><td>${{ queued: "\u5F85\u6210\u4EA4", filled: "\u5DF2\u6210\u4EA4", cancelled: "\u5DF2\u64A4\u9500", rejected: "\u672A\u6210\u4EA4" }[o.status]}<small>${esc3(o.rejection || "")}</small></td><td>\xA5${money2(o.amount || 0)}<small>${o.units || "\u2014"}\u80A1 \xB7 \u8D39\u7528 \xA5${money2(o.fee || 0)}</small></td><td>${o.price ? "\xA5" + o.price.toFixed(2) + " \xB7 " + o.filled : o.execute + "\u8BA1\u5212\u6210\u4EA4"}</td><td>${o.status === "queued" ? `<button data-cancel="${o.id}">\u64A4\u9500</button>` : "\u2014"}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">\u6682\u65E0\u8BA2\u5355\u3002</div>';
    w.querySelectorAll("[data-cancel]").forEach((b) => b.onclick = () => act({ type: "cancel", orderId: b.dataset.cancel }));
  } else renderReport();
}
function cards() {
  const list = view.stocks.filter((s) => (!matchOnly || s.match) && (!query || (s.code + s.name + s.sector).includes(query)));
  $("stockCards").innerHTML = list.map((s) => `<article class="holding-card"><header><div><span class="small muted">${s.code} \xB7 ${esc3(s.sector)}</span><h3>${esc3(s.name)}</h3></div><button class="dark-btn" data-buy="${s.code}" ${view.run.completed ? "disabled" : ""}>\u4E70\u5165</button></header><div class="holding-stats"><div><span>\u533A\u95F4\u6DA8\u8DCC \xB7 \u5206\u7EA2\u9001\u8F6C\u8C03\u6574</span><strong>${s.change === null ? "\u2014" : pct3(s.change)}</strong></div><div><span>\u533A\u95F4\u632F\u5E45 / \u91CF\u6BD4</span><b>${s.amp === null ? "\u2014" : (s.amp * 100).toFixed(2) + "%"} / ${s.volumeRatio?.toFixed(2) || "\u2014"}\u500D</b></div></div><div class="tags"><span class="pill">\u6A2A\u76D8 ${s.rule1 ? "\u7B26\u5408" : "\u672A\u6EE1\u8DB3"}</span><span class="pill blue">${s.signal.phase === "confirmed" ? "\u7A81\u7834\u5DF2\u786E\u8BA4" : s.signal.phase === "pending" ? "\u7A81\u7834\u5F85\u786E\u8BA4" : "\u89C2\u5BDF\u4E2D"}</span>${!s.known ? '<span class="pill">\u884C\u60C5\u672A\u66F4\u65B0</span>' : ""}</div>${candles(historyBars(s), s.name)}<p class="small muted">\u5DF2\u77E5\u6536\u76D8 \xA5${s.close.toFixed(2)} \xB7 ${s.asof}</p><details><summary>\u7B5B\u9009\u4F9D\u636E\u4E0E\u516C\u53F8\u884C\u52A8</summary><p>${s.signal.from ? `\u9501\u5B9A\u533A\u95F4 ${s.signal.from}\u2014${s.signal.to}\uFF0C\u9996\u6B21\u7A81\u7834 ${s.signal.first}\uFF0C\u786E\u8BA4 ${s.signal.confirm || "\u5C1A\u672A\u786E\u8BA4"}\u3002` : "\u5C1A\u65E0\u6709\u6548\u7A81\u7834\u533A\u95F4\u3002"}</p>${s.actions.map((a) => `<p>${a.ex} \u9664\u6743\u606F\uFF1A\u6BCF\u80A1\u73B0\u91D1 ${a.cash} \u5143\uFF0C\u9001\u8F6C ${a.bonus} \u80A1\u3002</p>`).join("")}<a href="${s.source}" target="_blank" rel="noopener">\u884C\u60C5\u6765\u6E90</a> \xB7 <a href="${s.actionsSource}" target="_blank" rel="noopener">\u5206\u7EA2\u9001\u8F6C\u8D44\u6599</a><p>\u6765\u6E90\u9875\u9762\u53EF\u80FD\u5305\u542B\u6F14\u7EC3\u65E5\u4E4B\u540E\u7684\u4FE1\u606F\uFF0C\u8BF7\u5728\u590D\u76D8\u65F6\u67E5\u9605\u3002</p></details></article>`).join("") || '<div class="empty">\u6CA1\u6709\u7B26\u5408\u5F53\u524D\u89C4\u5219\u7684\u6837\u672C\u3002\u53EF\u4EE5\u8C03\u6574\u89C4\u5219\uFF0C\u6216\u67E5\u770B\u5168\u90E8\u6837\u672C\u3002</div>';
  $("stockCards").querySelectorAll("[data-buy]").forEach((b) => b.onclick = () => trade(b.dataset.buy, "buy"));
}
function trade(code, side) {
  const s = view.stocks.find((s2) => s2.code === code), h = view.portfolio.holdings.find((h2) => h2.code === code), buy = side === "buy";
  dialog(`<h2>${buy ? "\u4E70\u5165" : "\u5356\u51FA"} ${esc3(s.name)}</h2><p>\u5DF2\u77E5\u6536\u76D8 \xA5${s.close.toFixed(2)}\uFF08${s.asof}\uFF09\u3002\u6210\u4EA4\u65E5\u5F00\u76D8\u4EF7\u73B0\u5728\u5C1A\u4E0D\u53EF\u89C1\u3002</p><form id="stockOrder"><label>${buy ? "\u4E70\u5165\u9884\u7B97\uFF08\u542B\u8D39\u7528\uFF0C\u5143\uFF09" : "\u5356\u51FA\u80A1\u6570"}<input id="stockAmount" type="number" min="${buy ? 100 : 1}" step="${buy ? "0.01" : 1}" max="${buy ? view.portfolio.cash : h.available}" value="${buy ? Math.min(1e4, view.portfolio.cash) : h.available}" required></label><p class="data-note">${buy ? "\u7CFB\u7EDF\u6309\u9884\u7B97\u548C\u6210\u4EA4\u4EF7\u53D6100\u80A1\u6574\u6570\u500D\uFF0C\u591A\u4F59\u9884\u7B97\u9000\u56DE\u3002\u53EF\u7528\u73B0\u91D1 \xA5" + money2(view.portfolio.cash) : "\u53EF\u5356 " + h.available + " \u80A1\uFF1B\u4E0D\u8DB3100\u80A1\u7684\u4F59\u6570\u987B\u968F\u5168\u90E8\u53EF\u5356\u80A1\u6570\u4E00\u6B21\u5356\u51FA\u3002"}</p><label>\u8FD9\u6B21\u51B3\u5B9A\u7684\u7406\u7531<textarea id="stockReason" required maxlength="1000" placeholder="\u4E70\u5165\u4F9D\u636E\u3001\u4ED3\u4F4D\u8003\u8651\u548C\u590D\u6838\u6761\u4EF6"></textarea></label><p class="data-note">${esc3(meta.assumptions)}</p><button class="primary" type="submit">\u63D0\u4EA4${buy ? "\u4E70\u5165" : "\u5356\u51FA"}\u8BA2\u5355</button><p id="stockOrderError" role="alert"></p></form><section class="event-section">${eventCards(view.market)}</section>`, true);
  $("stockOrder").onsubmit = async (e) => {
    e.preventDefault();
    if (await act({ type: side, code, [buy ? "amount" : "units"]: +$("stockAmount").value, reason: $("stockReason").value })) {
      modal.close();
      toast("\u8BA2\u5355\u5DF2\u4FDD\u5B58\u3002\u63A8\u8FDB\u65E5\u671F\u540E\u67E5\u770B\u6210\u4EA4\u7ED3\u679C\u3002");
    } else $("stockOrderError").textContent = $("toast").textContent;
  };
}
function renderReport() {
  const r = view.run, w = $("stockWorkspace"), adapt = (html) => html.replaceAll("\u57FA\u91D1", "\u80A1\u7968").replaceAll("\u51C0\u503C", "\u4EF7\u683C").replaceAll("\u7533\u8D2D\u8D39", "\u4E70\u5165\u8D39\u7528").replaceAll("\u8D4E\u56DE\u8D39", "\u5356\u51FA\u8D39\u7528");
  w.innerHTML = adapt(reportMarkup(view, chapter)) + `<p class="data-note">\u80A1\u7968\u8D26\u6237\u5206\u7EA2\u6309\u7A0E\u524D\u989D\u5728\u9664\u606F\u65E5\u5165\u8D26\uFF0C\u9001\u8F6C\u80A1\u8C03\u6574\u80A1\u6570\uFF1B\u672A\u6263\u5DEE\u522B\u7EA2\u5229\u7A0E\u3002\u9996\u6B21\u4E70\u5165\u5BF9\u7167\u540C\u6837\u8BA1\u5165\u671F\u95F4\u5206\u7EA2\u9001\u8F6C\uFF0C\u4E0D\u4F7F\u7528\u4E4B\u540E\u7684\u884C\u60C5\u3002</p><form id="stockNote"><label>\u7ED9\u672C\u5C40\u7559\u4E00\u6761\u590D\u76D8<textarea id="stockNoteText" required maxlength="1000"></textarea></label><button type="submit">\u4FDD\u5B58\u590D\u76D8</button></form><details><summary>\u67E5\u770B\u5168\u90E8\u4EA4\u6613\u4E0E\u51B3\u7B56\u65E5\u5FD7</summary><div class="journal">${[...r.journal].reverse().map((j) => `<article class="journal-entry"><time>${j.date}</time><p>${esc3(j.text)}</p>${j.reason ? `<blockquote>${esc3(j.reason)}</blockquote>` : ""}</article>`).join("")}</div></details>`;
  const reveal = (n) => {
    chapter = n;
    renderReport();
    $("reportChapter" + n)?.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  $("expandReport").onclick = () => reveal(6);
  $("nextReportChapter").onclick = () => reveal(Math.min(6, chapter + 1));
  w.querySelectorAll("[data-chapter]").forEach((b) => b.onclick = () => reveal(+b.dataset.chapter));
  $("printReport").onclick = () => window.print();
  $("exportRun").onclick = () => {
    const a = document.createElement("a"), url = URL.createObjectURL(new Blob([JSON.stringify(view, null, 2)], { type: "application/json" }));
    a.href = url;
    a.download = "A\u80A1\u590D\u76D8_" + r.start + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  };
  $("reportDay").oninput = (e) => {
    const t = document.createElement("template");
    t.innerHTML = reportChart(view, +e.target.value);
    w.querySelector(".return-plot").innerHTML = t.content.querySelector(".return-plot").innerHTML;
    w.querySelector(".day-readout").innerHTML = t.content.querySelector(".day-readout").innerHTML;
  };
  $("stockNote").onsubmit = async (e) => {
    e.preventDefault();
    if (await act({ type: "note", reason: $("stockNoteText").value })) toast("\u590D\u76D8\u5DF2\u4FDD\u5B58");
  };
  w.querySelectorAll("[data-report-mission]").forEach((b) => b.onclick = () => {
    const m = view.report.missions[+b.dataset.reportMission];
    act({ type: "note", reason: adapt("\u4E0B\u4E00\u5C40\u7EC3\u4E60\uFF1A" + m.title + "\u3002" + m.body) });
  });
}
async function resume(id) {
  try {
    view = await api("state?id=" + encodeURIComponent(id));
    history.replaceState(null, "", "/stocks.html?run=" + id);
    tab = view.run.completed ? "review" : "stocks";
    chapter = 1;
    modal.close();
    render();
  } catch (e) {
    toast(e.message, true);
  }
}
$("sessionsBtn").onclick = async () => {
  try {
    const m = await api("bootstrap");
    dialog(`<h2>\u6211\u7684A\u80A1\u6F14\u7EC3</h2><div class="sessions">${m.runs.map((r) => `<button class="session-card result-session" data-resume="${r.id}"><span><b>${r.start} \u5F00\u59CB</b><small>${r.duration}\u5929 \xB7 ${r.completed ? "\u5DF2\u7ED3\u675F" : "\u8FDB\u884C\u4E2D"} \xB7 \u521D\u59CB \xA5${money2(r.initial)}</small></span><span class="session-performance"><strong>${pct3(r.return)}</strong><small>\xA5${money2(r.profit)}</small></span><span>${r.completed ? "\u7FFB\u5F00\u62A5\u544A" : "\u7EE7\u7EED\u6F14\u7EC3"}</span></button>`).join("") || "<p>\u6682\u65E0\u80A1\u7968\u6F14\u7EC3\u5B58\u6863\u3002</p>"}</div>`, true);
    document.querySelectorAll("[data-resume]").forEach((b) => b.onclick = () => resume(b.dataset.resume));
  } catch (e) {
    toast(e.message, true);
  }
};
(async () => {
  try {
    meta = await api("bootstrap");
    const id = new URLSearchParams(location.search).get("run");
    if (id) await resume(id);
    else await setup();
  } catch (e) {
    $("app").innerHTML = '<div class="empty">' + esc3(e.message) + "</div>";
  }
})();
