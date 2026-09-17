// market-indices-core.mjs
var INDICES = [
  { id: "sh000001", name: "\u4E0A\u8BC1\u6307\u6570", short: "SSE", market: "cn", zone: "Asia/Shanghai", zoneLabel: "\u5317\u4EAC\u65F6\u95F4" },
  { id: "sh000688", name: "\u79D1\u521B50", short: "STAR 50", market: "cn", zone: "Asia/Shanghai", zoneLabel: "\u5317\u4EAC\u65F6\u95F4" },
  { id: "hkHSI", name: "\u6052\u751F\u6307\u6570", short: "HSI", market: "hk", zone: "Asia/Hong_Kong", zoneLabel: "\u9999\u6E2F\u65F6\u95F4" },
  { id: "hkHSTECH", name: "\u6052\u751F\u79D1\u6280", short: "HSTECH", market: "hk", zone: "Asia/Hong_Kong", zoneLabel: "\u9999\u6E2F\u65F6\u95F4" },
  { id: "usNDX", name: "\u7EB3\u65AF\u8FBE\u514B100", short: "NASDAQ 100", market: "us", zone: "America/New_York", zoneLabel: "\u7EBD\u7EA6\u65F6\u95F4" },
  { id: "usINX", name: "\u6807\u666E500", short: "S&P 500", market: "us", zone: "America/New_York", zoneLabel: "\u7EBD\u7EA6\u65F6\u95F4" }
];
var quoteURL = "https://qt.gtimg.cn/q=" + INDICES.map((i) => i.id).join(",");
var sourceURL = (i) => "https://gu.qq.com/" + i.id;
function localStamp(time, zone) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(new Date(time));
}
function chartPoints(row) {
  if (!row.quote) return [];
  const end = row.quote.quoteDate, start = new Date(Date.parse(end + "T00:00:00Z") - 29 * 864e5).toISOString().slice(0, 10);
  const points = (row.points || []).filter((p) => p[0] >= start && p[0] <= end).map((p) => [...p]);
  if (points.length) {
    if (points.at(-1)[0] === end) points[points.length - 1] = [end, row.quote.price];
    else points.push([end, row.quote.price]);
  }
  return points;
}
function quoteStatus(row, index, now = Date.now()) {
  if (!row.quote) return "\u6682\u672A\u53D6\u5F97";
  if (row.fallback) return "\u66F4\u65B0\u5931\u8D25 \xB7 \u65E7\u5FEB\u7167";
  const stamp = localStamp(now, index.zone), date = stamp.slice(0, 10);
  if (row.quote.quoteDate !== date) return "\u6700\u8FD1\u884C\u60C5";
  const m = Number(stamp.slice(11, 13)) * 60 + Number(stamp.slice(14, 16));
  if (m < 570) return "\u76D8\u524D\u5FEB\u7167";
  if (index.market !== "us" && m >= (index.market === "hk" ? 720 : 690) && m < 780) return "\u5348\u95F4\u4F11\u5E02";
  if (m >= (index.market === "us" ? 960 : index.market === "hk" ? 970 : 900)) return "\u6536\u76D8\u540E\u5FEB\u7167";
  return "\u76D8\u4E2D\u5FEB\u7167";
}

// market-indices.js
var grid = document.getElementById("indexCards");
var note = document.getElementById("indexUpdate");
var dialog = document.getElementById("indexDialog");
var orderedIndices = ["cn", "us", "hk"].flatMap((market2) => INDICES.filter((index) => index.market === market2));
var esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var fmt = (n) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
var signed = (n) => (n > 0 ? "+" : "") + n.toFixed(2);
var data = { rows: [] };
var market = new URL(location.href).searchParams.get("market") || "cn";
var opened = "";
var busy = false;
var failed = false;
function plot(points, large = false) {
  if (points.length < 2) return '<span class="index-no-chart">\u8D70\u52BF\u6682\u672A\u53D6\u5F97</span>';
  const width = large ? 740 : 180, height = large ? 260 : 45, pad = large ? 45 : 3, top = large ? 22 : 4, bottom = large ? 35 : 4;
  const vals = points.map((p) => p[1]), lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || hi * 1e-3;
  const x = (i) => pad + i / (points.length - 1) * (width - 2 * pad), y = (v) => top + (hi - v) / span * (height - top - bottom);
  const line = points.map((p, i) => x(i).toFixed(2) + "," + y(p[1]).toFixed(2)).join(" ");
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(points[0][0])}\u81F3${esc(points.at(-1)[0])}\u6307\u6570\u70B9\u4F4D\u8D70\u52BF">${large ? [lo, (lo + hi) / 2, hi].map((v) => `<line x1="${pad}" x2="${width - pad}" y1="${y(v)}" y2="${y(v)}" stroke="currentColor" opacity=".1"/><text x="${pad}" y="${y(v) - 6}" font-size="10" fill="currentColor" opacity=".6">${fmt(v)}</text>`).join("") : ""}<polyline points="${line}" fill="none" stroke="currentColor" stroke-width="${large ? 2.4 : 1.8}" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${x(points.length - 1)}" cy="${y(points.at(-1)[1])}" r="${large ? 3 : 2}" fill="currentColor"/>${large ? `<text x="${pad}" y="${height - 6}" font-size="11" fill="currentColor">${points[0][0]}</text><text x="${width - pad}" y="${height - 6}" text-anchor="end" font-size="11" fill="currentColor">${points.at(-1)[0]}</text>` : ""}</svg>`;
}
function render() {
  grid.innerHTML = orderedIndices.map((i) => {
    const row = data.rows.find((r) => r.id === i.id) || {}, q = row.quote, points = chartPoints(row);
    return `<button class="index-card ${q ? q.change > 0 ? "index-up" : q.change < 0 ? "index-down" : "" : ""} ${market === i.market ? "index-selected" : ""}" data-index="${i.id}" aria-label="${i.name}\uFF0C${q ? fmt(q.price) + "\u70B9\uFF0C\u6DA8\u8DCC" + signed(q.percent) + "%\uFF0C\u67E5\u770B\u8D70\u52BF" : "\u884C\u60C5\u6682\u672A\u53D6\u5F97"}" aria-haspopup="dialog"><span class="index-name">${i.name}<small>${i.short}</small></span><strong class="index-price">${q ? fmt(q.price) : "\u2014"}</strong><span class="index-change">${q ? signed(q.percent) + "%" : "\u5F85\u66F4\u65B0"}<small>${q ? signed(q.change) + " \u70B9" : ""}</small></span><div class="index-spark">${plot(points)}</div><span class="index-asof">${q ? localStamp(q.time, i.zone).slice(5, 16) + " \xB7 " + i.zoneLabel : "\u6B63\u5728\u83B7\u53D6\u884C\u60C5"}</span><span class="index-status">${quoteStatus(row, i)}</span></button>`;
  }).join("");
  if (opened) renderDialog();
}
function renderDialog() {
  const i = INDICES.find((i2) => i2.id === opened), r = data.rows.find((r2) => r2.id === opened) || {}, q = r.quote, points = chartPoints(r);
  document.getElementById("indexDialogTitle").textContent = i.name;
  document.getElementById("indexDetail").innerHTML = `<div class="index-detail-numbers ${q?.change > 0 ? "index-up" : "index-down"}"><b>${q ? fmt(q.price) : "\u2014"}</b><span>${q ? signed(q.percent) + "% \xB7 " + signed(q.change) + " \u70B9" : "\u884C\u60C5\u6682\u672A\u53D6\u5F97"}</span></div><p class="index-detail-date">${q ? localStamp(q.time, i.zone) + " " + i.zoneLabel + " \xB7 " + quoteStatus(r, i) : "\u8BF7\u7A0D\u540E\u5237\u65B0\u91CD\u8BD5"}</p><div class="index-large-chart">${plot(points, true)}</div><p>\u8FD130\u81EA\u7136\u65E5\u65E5\u7EBF\u3002\u672B\u70B9\u4F7F\u7528\u6807\u6CE8\u65F6\u95F4\u7684\u6700\u65B0\u70B9\u4F4D\uFF0C\u76D8\u4E2D\u4F1A\u53D8\u5316\uFF1B\u66F2\u7EBF\u5C55\u793A\u671F\u95F4\u8D70\u52BF\uFF0C\u4E0A\u65B9\u6DA8\u8DCC\u5E45\u76F8\u5BF9\u4E8E\u524D\u4E00\u4EA4\u6613\u65E5\u6536\u76D8\u3002</p>${r.historyFailed ? '<p class="index-warning">\u5386\u53F2\u8D70\u52BF\u66F4\u65B0\u5931\u8D25\uFF0C\u5F53\u524D\u5C55\u793A\u53EF\u7528\u7684\u5386\u53F2\u7247\u6BB5\u3002</p>' : ""}<a href="${sourceURL(i)}" target="_blank" rel="noopener">\u67E5\u770B\u817E\u8BAF\u8BC1\u5238\u884C\u60C5\u6765\u6E90</a><small>\u53EF\u80FD\u5B58\u5728\u884C\u60C5\u5EF6\u8FDF\uFF0C\u5404\u5E02\u573A\u65F6\u95F4\u4E0E\u4EA4\u6613\u65F6\u6BB5\u4E0D\u540C\u3002</small>`;
}
grid.addEventListener("click", (e) => {
  const b = e.target.closest("[data-index]");
  if (!b) return;
  opened = b.dataset.index;
  renderDialog();
  dialog.showModal();
});
document.getElementById("indexDialogClose").onclick = () => dialog.close();
dialog.addEventListener("close", () => opened = "");
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  }
});
document.addEventListener("demo:market", (e) => {
  market = e.detail.market;
  grid.querySelectorAll("[data-index]").forEach((el) => el.classList.toggle("index-selected", INDICES.find((i) => i.id === el.dataset.index).market === market));
});
async function refresh() {
  if (busy || document.hidden) return;
  busy = true;
  document.getElementById("indexRefresh").disabled = true;
  try {
    const r = await fetch("/api/market-indices", { signal: AbortSignal.timeout(2e4) });
    if (!r.ok) throw Error();
    const next = await r.json();
    if (!Array.isArray(next.rows) || next.rows.length !== 6) throw Error();
    data = next;
    failed = false;
    note.textContent = next.rows.some((r2) => r2.fallback || !r2.quote) ? "\u90E8\u5206\u884C\u60C5\u66F4\u65B0\u5931\u8D25 \xB7 \u65E7\u6570\u636E\u5DF2\u6807\u6CE8" : "\u6BCF\u5206\u949F\u5C1D\u8BD5\u66F4\u65B0 \xB7 \u4EE5\u5404\u5361\u7247\u884C\u60C5\u65F6\u95F4\u4E3A\u51C6";
  } catch {
    failed = true;
    data.rows = data.rows.map((r) => ({ ...r, fallback: !!r.quote }));
    note.textContent = "\u66F4\u65B0\u6682\u672A\u6210\u529F \xB7 \u5C55\u793A\u5DF2\u6807\u6CE8\u65F6\u95F4\u7684\u5FEB\u7167\uFF0C\u53EF\u91CD\u8BD5";
  } finally {
    busy = false;
    document.getElementById("indexRefresh").disabled = false;
    render();
  }
}
document.getElementById("indexRefresh").onclick = refresh;
try {
  data = JSON.parse(document.getElementById("indexSnapshot").textContent);
  data.rows = data.rows.map((r) => ({ ...r, fallback: !!r.quote }));
} catch {
}
render();
refresh();
setInterval(refresh, 6e4);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refresh();
});
