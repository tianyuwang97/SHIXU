// opportunity-chart.mjs
var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var pct = (n) => (n >= 0 ? "+" : "") + (n * 100).toFixed(2) + "%";
function opportunityChart(s) {
  const p = s.points, vals = p.map((v) => (v[1] - 1) * 100), b = s.chartBox;
  const hasBox = Number.isFinite(b?.lower) && Number.isFinite(b?.upper) && b.lower <= b.upper;
  const edges = hasBox ? [(b.lower - 1) * 100, (b.upper - 1) * 100] : [];
  const lo = Math.min(0, ...vals, ...edges), hi = Math.max(0, ...vals, ...edges), span = Math.max(hi - lo, 0.1), start = Date.parse(s.start);
  const x = (i) => 8 + (Date.parse(p[i][0]) - start) / (29 * 864e5) * 284, y = (v) => 72 - (v - lo) / span * 60;
  const guides = hasBox ? `<g class="pick-chart-box"><title>R2\u56FA\u5B9A\u533A\u95F4 ${esc(b.rangeStart)}\u2014${esc(b.rangeEnd)} \xB7 \u4E0A\u6CBF ${pct(b.upper - 1)} \xB7 \u4E0B\u6CBF ${pct(b.lower - 1)}\uFF08\u76F8\u5BF930\u65E5\u9996\u4E2A\u6536\u76D8\u4EF7\uFF09</title><rect x="8" y="${y(edges[1])}" width="284" height="${Math.max(1, y(edges[0]) - y(edges[1]))}" fill="#d3e6c5" fill-opacity=".38"/><path d="M8 ${y(edges[1])}H292 M8 ${y(edges[0])}H292" fill="none" stroke="#8ca881" stroke-width="1" stroke-dasharray="4 4"/></g>` : `<path d="M8 ${y(0)}H292" stroke="#d1dfd8" stroke-dasharray="3 3"/>`;
  return `<svg viewBox="0 0 300 88" role="img" aria-label="${esc(s.name)}\u8FD130\u81EA\u7136\u65E5\u8C03\u6574\u6536\u76D8\u8D70\u52BF${hasBox ? "\uFF0C\u542BR2\u56FA\u5B9A\u533A\u95F4\u4E0A\u4E0B\u6CBF" : ""}"><title>${esc(s.name)} \xB7 ${s.start}\u2014${s.asof} \xB7 ${pct(s.change)}</title>${guides}<polyline fill="none" stroke="#237b65" stroke-width="2.5" points="${vals.map((v, i) => x(i).toFixed(2) + "," + y(v).toFixed(2)).join(" ")}"/>${hasBox ? `<circle cx="${x(p.length - 1)}" cy="${y(vals.at(-1))}" r="2.5" fill="#237b65"/>` : ""}</svg>${hasBox ? '<div class="pick-chart-key">\u865A\u7EBF \xB7 R2\u56FA\u5B9A\u533A\u95F4\u4E0A\u4E0B\u6CBF</div>' : ""}`;
}

// us-company-profiles.json
var us_company_profiles_default = {
  DGX: {
    name: "\u594E\u65AF\u7279\u8BCA\u65AD",
    industry: "\u533B\u7597\u68C0\u9A8C",
    summary: "\u4E3A\u533B\u9662\u3001\u533B\u751F\u548C\u4E2A\u4EBA\u63D0\u4F9B\u8840\u6DB2\u3001\u75C5\u7406\u53CA\u5176\u4ED6\u533B\u5B66\u68C0\u9A8C\uFF0C\u901A\u8FC7\u5B9E\u9A8C\u5BA4\u548C\u91C7\u6837\u7F51\u70B9\u51FA\u5177\u8BCA\u65AD\u4FE1\u606F\uFF0C\u5E2E\u52A9\u533B\u751F\u5224\u65AD\u75BE\u75C5\u548C\u5236\u5B9A\u6CBB\u7597\u65B9\u6848\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/dgx/company/"
      }
    ]
  },
  XOM: {
    name: "\u57C3\u514B\u68EE\u7F8E\u5B5A",
    industry: "\u77F3\u6CB9\u4E0E\u5929\u7136\u6C14",
    summary: "\u4E1A\u52A1\u8986\u76D6\u77F3\u6CB9\u3001\u5929\u7136\u6C14\u5F00\u91C7\u3001\u70BC\u6CB9\u548C\u5316\u5DE5\u3002\u4F60\u719F\u6089\u7684\u7F8E\u5B5A\u6DA6\u6ED1\u6CB9\u5C5E\u4E8E\u5B83\u7684\u4EA7\u54C1\uFF0C\u65D7\u4E0B\u8FD8\u4F7F\u7528 Exxon\u3001Esso \u7B49\u54C1\u724C\u9500\u552E\u80FD\u6E90\u4EA7\u54C1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/xom/company/"
      }
    ]
  },
  V: {
    name: "Visa \u7EF4\u8428",
    industry: "\u652F\u4ED8\u7F51\u7EDC",
    summary: "\u8FD0\u8425\u8FDE\u63A5\u94F6\u884C\u3001\u5546\u6237\u4E0E\u6D88\u8D39\u8005\u7684\u652F\u4ED8\u7F51\u7EDC\u3002\u5237 Visa \u5361\u65F6\uFF0C\u80CC\u540E\u7684\u4EA4\u6613\u6388\u6743\u3001\u6E05\u7B97\u548C\u7ED3\u7B97\u7531\u5176\u7F51\u7EDC\u63D0\u4F9B\u652F\u6301\uFF0C\u4E5F\u7ECF\u8425\u8DE8\u5883\u8F6C\u8D26\u548C\u98CE\u63A7\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/v/company/"
      }
    ]
  },
  HCA: {
    name: "HCA \u533B\u7597\u96C6\u56E2",
    industry: "\u533B\u9662\u8FD0\u8425",
    summary: "\u5728\u7F8E\u56FD\u7ECF\u8425\u533B\u9662\u3001\u6025\u8BCA\u3001\u95E8\u8BCA\u624B\u672F\u53CA\u5176\u4ED6\u533B\u7597\u8BBE\u65BD\uFF0C\u4E3A\u60A3\u8005\u63D0\u4F9B\u4F4F\u9662\u3001\u624B\u672F\u3001\u8BCA\u65AD\u548C\u5EB7\u590D\u670D\u52A1\uFF0C\u4E3B\u8425\u4E1A\u52A1\u662F\u5B9E\u9645\u533B\u7597\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/hca/company/"
      }
    ]
  },
  ADP: {
    name: "ADP \u81EA\u52A8\u6570\u636E\u5904\u7406",
    industry: "\u4EBA\u529B\u8D44\u6E90\u670D\u52A1",
    summary: "\u5E2E\u52A9\u4F01\u4E1A\u53D1\u5DE5\u8D44\u3001\u7BA1\u7406\u5458\u5DE5\u548C\u5904\u7406\u4EBA\u4E8B\u4E8B\u52A1\u3002\u4EA7\u54C1\u5305\u62EC\u85AA\u916C\u53CA\u4EBA\u529B\u8D44\u6E90\u8F6F\u4EF6\uFF0C\u4E5F\u63D0\u4F9B\u5458\u5DE5\u798F\u5229\u7BA1\u7406\u3001\u4EBA\u4E8B\u5916\u5305\u7B49\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/adp/company/"
      }
    ]
  },
  EG: {
    name: "Everest \u4FDD\u9669\u96C6\u56E2",
    industry: "\u4FDD\u9669\u4E0E\u518D\u4FDD\u9669",
    summary: "\u5411\u4F01\u4E1A\u63D0\u4F9B\u8D22\u4EA7\u548C\u8D23\u4EFB\u4FDD\u9669\uFF0C\u540C\u65F6\u7ECF\u8425\u518D\u4FDD\u9669\uFF0C\u4E5F\u5C31\u662F\u5E2E\u52A9\u5176\u4ED6\u4FDD\u9669\u516C\u53F8\u5206\u62C5\u90E8\u5206\u627F\u4FDD\u98CE\u9669\uFF0C\u4E1A\u52A1\u6D89\u53CA\u707E\u5BB3\u3001\u822A\u7A7A\u3001\u6D77\u8FD0\u7B49\u9886\u57DF\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/eg/company/"
      }
    ]
  },
  TRV: {
    name: "\u65C5\u884C\u8005\u4FDD\u9669",
    industry: "\u8D22\u4EA7\u4E0E\u8D23\u4EFB\u4FDD\u9669",
    summary: "\u4E3A\u4E2A\u4EBA\u548C\u4F01\u4E1A\u63D0\u4F9B\u6C7D\u8F66\u3001\u4F4F\u5B85\u3001\u5546\u4E1A\u8D22\u4EA7\u53CA\u8D23\u4EFB\u4FDD\u9669\uFF0C\u4E5F\u7ECF\u8425\u4FDD\u8BC1\u62C5\u4FDD\u548C\u4E13\u4E1A\u9669\uFF0C\u4E3B\u8981\u4E1A\u52A1\u662F\u627F\u4FDD\u98CE\u9669\u5E76\u5904\u7406\u7D22\u8D54\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/trv/company/"
      }
    ]
  },
  KDP: {
    name: "Keurig Dr Pepper",
    industry: "\u996E\u6599\u4E0E\u5496\u5561",
    summary: "\u9500\u552E Dr Pepper\u3001Canada Dry \u7B49\u996E\u6599\uFF0C\u4EE5\u53CA Keurig \u5355\u676F\u5496\u5561\u673A\u548C K-Cup \u5496\u5561\u80F6\u56CA\uFF0C\u4E1A\u52A1\u6DB5\u76D6\u996E\u6599\u54C1\u724C\u3001\u751F\u4EA7\u548C\u5206\u9500\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/kdp/company/"
      }
    ]
  },
  UHS: {
    name: "Universal Health Services",
    industry: "\u533B\u9662\u4E0E\u7CBE\u795E\u5065\u5EB7",
    summary: "\u7ECF\u8425\u7EFC\u5408\u533B\u9662\u3001\u95E8\u8BCA\u53CA\u884C\u4E3A\u5065\u5EB7\u8BBE\u65BD\uFF0C\u63D0\u4F9B\u6025\u8BCA\u3001\u624B\u672F\u548C\u8BCA\u65AD\u7B49\u533B\u7597\u670D\u52A1\uFF0C\u4E5F\u4E13\u95E8\u7ECF\u8425\u7CBE\u795E\u5065\u5EB7\u4E0E\u76F8\u5173\u6CBB\u7597\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/uhs/company/"
      }
    ]
  },
  SOLV: {
    name: "Solventum \u7D22\u5C14\u601D\u6587",
    industry: "\u533B\u7597\u7528\u54C1\u4E0E\u6280\u672F",
    summary: "\u63D0\u4F9B\u4F24\u53E3\u62A4\u7406\u3001\u624B\u672F\u8017\u6750\u3001\u7259\u79D1\u53CA\u6B63\u7578\u4EA7\u54C1\uFF0C\u5E76\u7ECF\u8425\u533B\u7597\u4FE1\u606F\u7CFB\u7EDF\u3002\u4EA7\u54C1\u7528\u4E8E\u533B\u9662\u65E5\u5E38\u6CBB\u7597\u3001\u611F\u67D3\u9884\u9632\u548C\u53E3\u8154\u533B\u7597\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/solv/company/"
      }
    ]
  },
  "BRK-B": {
    name: "\u4F2F\u514B\u5E0C\u5C14\xB7\u54C8\u6492\u97E6 B\u7C7B",
    industry: "\u591A\u5143\u5316\u63A7\u80A1",
    summary: "\u65D7\u4E0B\u4E1A\u52A1\u6D89\u53CA\u4FDD\u9669\u3001\u94C1\u8DEF\u8D27\u8FD0\u3001\u516C\u7528\u4E8B\u4E1A\u548C\u591A\u79CD\u5236\u9020\u3001\u96F6\u552E\u4E1A\u52A1\uFF0C\u4E5F\u6301\u6709\u6295\u8D44\u8D44\u4EA7\u3002\u8D2D\u4E70\u8FD9\u53EA\u80A1\u7968\u76F8\u5F53\u4E8E\u6301\u6709\u8FD9\u5BB6\u591A\u5143\u4E1A\u52A1\u63A7\u80A1\u516C\u53F8\u7684\u80A1\u4EFD\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/brk.b/company/"
      }
    ]
  },
  MSFT: {
    name: "\u5FAE\u8F6F",
    industry: "\u8F6F\u4EF6\u4E0E\u4E91\u8BA1\u7B97",
    summary: "\u63D0\u4F9B Windows\u3001Microsoft 365 \u529E\u516C\u8F6F\u4EF6\u548C Azure \u4E91\u670D\u52A1\uFF0C\u540C\u65F6\u7ECF\u8425\u4F01\u4E1A\u8F6F\u4EF6\u3001Xbox \u6E38\u620F\u53CA\u4EBA\u5DE5\u667A\u80FD\u76F8\u5173\u4EA7\u54C1\uFF0C\u5BA2\u6237\u5305\u62EC\u4E2A\u4EBA\u548C\u4F01\u4E1A\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/msft/company/"
      }
    ]
  },
  NWS: {
    name: "\u65B0\u95FB\u96C6\u56E2 B\u7C7B",
    industry: "\u65B0\u95FB\u4E0E\u51FA\u7248",
    summary: "\u7ECF\u8425\u65B0\u95FB\u3001\u5546\u4E1A\u4FE1\u606F\u3001\u56FE\u4E66\u51FA\u7248\u548C\u6570\u5B57\u623F\u5730\u4EA7\u670D\u52A1\u3002\u65D7\u4E0B\u4E1A\u52A1\u5305\u62EC\u300A\u534E\u5C14\u8857\u65E5\u62A5\u300B\u3001\u9053\u743C\u65AF\u4FE1\u606F\u670D\u52A1\u53CA HarperCollins \u51FA\u7248\u793E\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/nws/company/"
      }
    ]
  },
  RSG: {
    name: "Republic Services",
    industry: "\u5783\u573E\u5904\u7406\u4E0E\u73AF\u4FDD",
    summary: "\u4E3A\u5C45\u6C11\u3001\u4F01\u4E1A\u548C\u5DE5\u4E1A\u5BA2\u6237\u6536\u96C6\u3001\u8FD0\u8F93\u5E76\u5904\u7406\u5783\u573E\uFF0C\u7ECF\u8425\u56DE\u6536\u3001\u586B\u57CB\u53CA\u5176\u4ED6\u73AF\u5883\u670D\u52A1\uFF0C\u53EF\u4EE5\u7406\u89E3\u4E3A\u57CE\u5E02\u4E0E\u4F01\u4E1A\u7684\u5E9F\u5F03\u7269\u5904\u7406\u670D\u52A1\u5546\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/rsg/company/"
      }
    ]
  },
  MDT: {
    name: "\u7F8E\u6566\u529B",
    industry: "\u533B\u7597\u5668\u68B0",
    summary: "\u4E3A\u533B\u9662\u548C\u533B\u751F\u63D0\u4F9B\u533B\u7597\u8BBE\u5907\u53CA\u6CBB\u7597\u6280\u672F\uFF0C\u6D89\u53CA\u5FC3\u810F\u8D77\u640F\u5668\u3001\u5FC3\u8840\u7BA1\u4ECB\u5165\u3001\u795E\u7ECF\u7CFB\u7EDF\u53CA\u5916\u79D1\u6CBB\u7597\u7B49\u9886\u57DF\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/mdt/company/"
      }
    ]
  },
  COR: {
    name: "Cencora",
    industry: "\u836F\u54C1\u6D41\u901A",
    summary: "\u628A\u836F\u54C1\u4ECE\u5236\u9020\u5546\u914D\u9001\u5230\u533B\u9662\u3001\u836F\u623F\u548C\u8BCA\u6240\uFF0C\u4E5F\u4E3A\u836F\u4F01\u53CA\u533B\u7597\u673A\u6784\u63D0\u4F9B\u4F9B\u5E94\u94FE\u3001\u4E13\u79D1\u836F\u7269\u652F\u6301\u548C\u76F8\u5173\u670D\u52A1\uFF0C\u662F\u533B\u836F\u6D41\u901A\u73AF\u8282\u7684\u516C\u53F8\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/cor/company/"
      }
    ]
  },
  VTRS: {
    name: "\u6656\u81F4",
    industry: "\u5236\u836F",
    summary: "\u9500\u552E\u54C1\u724C\u5904\u65B9\u836F\u3001\u4EFF\u5236\u836F\u7B49\u533B\u836F\u4EA7\u54C1\uFF0C\u8986\u76D6\u5FC3\u8840\u7BA1\u3001\u795E\u7ECF\u3001\u76AE\u80A4\u3001\u547C\u5438\u7B49\u6CBB\u7597\u9886\u57DF\uFF0C\u4E1A\u52A1\u5206\u5E03\u5728\u591A\u4E2A\u56FD\u5BB6\u548C\u5730\u533A\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/vtrs/company/"
      }
    ]
  },
  BIIB: {
    name: "\u6E24\u5065",
    industry: "\u751F\u7269\u5236\u836F",
    summary: "\u7814\u53D1\u5E76\u9500\u552E\u75BE\u75C5\u6CBB\u7597\u836F\u7269\uFF0C\u4EA7\u54C1\u6D89\u53CA\u591A\u53D1\u6027\u786C\u5316\u3001\u810A\u9AD3\u6027\u808C\u840E\u7F29\u548C\u963F\u5C14\u8328\u6D77\u9ED8\u75C5\u7B49\u9886\u57DF\uFF0C\u5305\u62EC SPINRAZA \u548C LEQEMBI \u7B49\u836F\u7269\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/biib/company/"
      }
    ]
  },
  DHR: {
    name: "\u4E39\u7EB3\u8D6B",
    industry: "\u751F\u547D\u79D1\u5B66\u4E0E\u8BCA\u65AD",
    summary: "\u4E3A\u836F\u7269\u7814\u53D1\u3001\u751F\u4EA7\u548C\u533B\u5B66\u8BCA\u65AD\u63D0\u4F9B\u4EEA\u5668\u3001\u8017\u6750\u4E0E\u6280\u672F\u670D\u52A1\uFF0C\u8986\u76D6\u751F\u7269\u5236\u836F\u3001\u751F\u547D\u79D1\u5B66\u548C\u8BCA\u65AD\u4E1A\u52A1\uFF0C\u5BA2\u6237\u4E3B\u8981\u662F\u5B9E\u9A8C\u5BA4\u3001\u836F\u4F01\u548C\u533B\u7597\u673A\u6784\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/dhr/company/"
      }
    ]
  },
  HUM: {
    name: "\u54C8\u95E8\u90A3",
    industry: "\u533B\u7597\u4FDD\u9669",
    summary: "\u63D0\u4F9B\u533B\u7597\u4FDD\u9669\uFF0C\u4E1A\u52A1\u5305\u62EC\u9762\u5411\u7F8E\u56FD\u8001\u5E74\u4EBA\u7B49\u7FA4\u4F53\u7684 Medicare \u76F8\u5173\u8BA1\u5212\uFF1B\u65D7\u4E0B CenterWell \u8FD8\u7ECF\u8425\u57FA\u5C42\u533B\u7597\u3001\u836F\u623F\u53CA\u5065\u5EB7\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/hum/company/"
      }
    ]
  },
  CME: {
    name: "\u829D\u5546\u6240",
    industry: "\u91D1\u878D\u4EA4\u6613\u6240",
    summary: "\u8FD0\u8425\u671F\u8D27\u53CA\u671F\u6743\u4EA4\u6613\u5E02\u573A\uFF0C\u4EA7\u54C1\u6D89\u53CA\u5229\u7387\u3001\u80A1\u6307\u3001\u5916\u6C47\u3001\u80FD\u6E90\u548C\u519C\u4EA7\u54C1\u7B49\uFF0C\u5E76\u63D0\u4F9B\u4EA4\u6613\u6E05\u7B97\u4E0E\u5E02\u573A\u6570\u636E\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/cme/company/"
      }
    ]
  },
  VMRK: {
    name: "Vivmark Residential",
    industry: "\u4F4F\u5B85\u623F\u5730\u4EA7",
    summary: "\u6295\u8D44\u3001\u5F00\u53D1\u5E76\u7BA1\u7406\u7F8E\u56FD\u4E3B\u8981\u90FD\u5E02\u5730\u533A\u7684\u51FA\u79DF\u516C\u5BD3\uFF0C\u4E1A\u52A1\u56F4\u7ED5\u4F4F\u5B85\u793E\u533A\u8FD0\u8425\u5C55\u5F00\uFF0C\u79DF\u6237\u652F\u4ED8\u7684\u623F\u79DF\u662F\u7406\u89E3\u5176\u4E1A\u52A1\u7684\u91CD\u8981\u7EBF\u7D22\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/vmrk/company/"
      }
    ]
  },
  EXPD: {
    name: "\u5EB7\u6377\u56FD\u9645\u7269\u6D41",
    industry: "\u8D27\u8FD0\u4EE3\u7406",
    summary: "\u4E3A\u4F01\u4E1A\u5B89\u6392\u56FD\u9645\u7A7A\u8FD0\u3001\u6D77\u8FD0\u3001\u62A5\u5173\u53CA\u4ED3\u50A8\u914D\u9001\uFF0C\u5E2E\u52A9\u8D27\u7269\u8DE8\u5883\u6D41\u901A\uFF0C\u6838\u5FC3\u670D\u52A1\u662F\u7EC4\u7EC7\u7269\u6D41\u548C\u5904\u7406\u8FD0\u8F93\u94FE\u6761\u4E2D\u7684\u624B\u7EED\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/expd/company/"
      }
    ]
  },
  IFF: {
    name: "\u56FD\u9645\u9999\u6599\u9999\u7CBE",
    industry: "\u98DF\u54C1\u914D\u6599\u4E0E\u9999\u6599",
    summary: "\u4E3A\u98DF\u54C1\u3001\u996E\u6599\u3001\u65E5\u5316\u7B49\u4F01\u4E1A\u63D0\u4F9B\u9999\u7CBE\u3001\u9999\u6599\u3001\u98DF\u54C1\u914D\u6599\u53CA\u751F\u7269\u79D1\u6280\u4EA7\u54C1\uFF0C\u5E2E\u52A9\u4E0B\u6E38\u54C1\u724C\u8C03\u6574\u5473\u9053\u3001\u9999\u6C14\u548C\u4EA7\u54C1\u529F\u80FD\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/iff/company/"
      }
    ]
  },
  DIS: {
    name: "\u8FEA\u58EB\u5C3C",
    industry: "\u5A31\u4E50\u4E0E\u4E3B\u9898\u4E50\u56ED",
    summary: "\u7ECF\u8425\u5F71\u89C6\u5185\u5BB9\u3001\u6D41\u5A92\u4F53\u3001\u4F53\u80B2\u548C\u4E3B\u9898\u4E50\u56ED\u3002\u4F60\u719F\u6089\u7684\u8FEA\u58EB\u5C3C\u3001\u6F2B\u5A01\u3001\u76AE\u514B\u65AF\u3001Disney+ \u53CA\u8FEA\u58EB\u5C3C\u4E50\u56ED\u90FD\u4E0E\u5B83\u7684\u4E1A\u52A1\u6709\u5173\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/dis/company/"
      }
    ]
  },
  TRGP: {
    name: "Targa Resources",
    industry: "\u80FD\u6E90\u8FD0\u8F93\u4E0E\u5904\u7406",
    summary: "\u4E3A\u5929\u7136\u6C14\u548C\u5929\u7136\u6C14\u6DB2\u4F53\u63D0\u4F9B\u6536\u96C6\u3001\u52A0\u5DE5\u3001\u8FD0\u8F93\u3001\u50A8\u5B58\u7B49\u670D\u52A1\uFF0C\u7ECF\u8425\u80FD\u6E90\u57FA\u7840\u8BBE\u65BD\uFF0C\u8FDE\u63A5\u6CB9\u6C14\u751F\u4EA7\u5546\u4E0E\u4E0B\u6E38\u5E02\u573A\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/trgp/company/"
      }
    ]
  },
  AWK: {
    name: "\u7F8E\u56FD\u6C34\u52A1",
    industry: "\u4F9B\u6C34\u4E0E\u6C61\u6C34\u5904\u7406",
    summary: "\u4E3A\u5C45\u6C11\u3001\u4F01\u4E1A\u53CA\u516C\u5171\u673A\u6784\u63D0\u4F9B\u81EA\u6765\u6C34\u548C\u6C61\u6C34\u5904\u7406\u670D\u52A1\uFF0C\u7ECF\u8425\u6C34\u5382\u3001\u7BA1\u7F51\u53CA\u76F8\u5173\u8BBE\u65BD\uFF0C\u4E5F\u4E3A\u90E8\u5206\u5E02\u653F\u5BA2\u6237\u7BA1\u7406\u4F9B\u6392\u6C34\u7CFB\u7EDF\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/awk/company/"
      }
    ]
  },
  BDX: {
    name: "\u78A7\u8FEA\u533B\u7597",
    industry: "\u533B\u7597\u8017\u6750\u4E0E\u8BBE\u5907",
    summary: "\u63D0\u4F9B\u6CE8\u5C04\u5668\u3001\u5BFC\u7BA1\u3001\u8F93\u6DB2\u53CA\u7528\u836F\u7BA1\u7406\u8BBE\u5907\uFF0C\u4E5F\u7ECF\u8425\u5B9E\u9A8C\u5BA4\u548C\u8BCA\u65AD\u4EA7\u54C1\uFF0C\u5BA2\u6237\u5305\u62EC\u533B\u9662\u3001\u8BCA\u6240\u3001\u836F\u4F01\u4E0E\u7814\u7A76\u673A\u6784\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/bdx/company/"
      }
    ]
  },
  MSI: {
    name: "\u6469\u6258\u7F57\u62C9\u89E3\u51B3\u65B9\u6848",
    industry: "\u516C\u5171\u5B89\u5168\u901A\u4FE1",
    summary: "\u4E3A\u8B66\u52A1\u3001\u516C\u5171\u5B89\u5168\u548C\u4F01\u4E1A\u5BA2\u6237\u63D0\u4F9B\u4E13\u4E1A\u5BF9\u8BB2\u901A\u4FE1\u3001\u6307\u6325\u4E2D\u5FC3\u8F6F\u4EF6\u3001\u89C6\u9891\u76D1\u63A7\u53CA\u95E8\u7981\u89E3\u51B3\u65B9\u6848\uFF0C\u6838\u5FC3\u4E1A\u52A1\u56F4\u7ED5\u5B89\u5168\u901A\u4FE1\u7CFB\u7EDF\u5C55\u5F00\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/msi/company/"
      }
    ]
  },
  KO: {
    name: "\u53EF\u53E3\u53EF\u4E50",
    industry: "\u996E\u6599\u54C1\u724C",
    summary: "\u7ECF\u8425\u53EF\u53E3\u53EF\u4E50\u3001\u96EA\u78A7\u3001\u82AC\u8FBE\u7B49\u996E\u6599\u54C1\u724C\uFF0C\u9500\u552E\u996E\u6599\u6D53\u7F29\u6DB2\u3001\u7CD6\u6D46\u548C\u6210\u54C1\u996E\u6599\uFF0C\u5E76\u901A\u8FC7\u88C5\u74F6\u5408\u4F5C\u4F19\u4F34\u53CA\u5206\u9500\u7F51\u7EDC\u89E6\u8FBE\u6D88\u8D39\u8005\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/ko/company/"
      }
    ]
  },
  FANG: {
    name: "\u54CD\u5C3E\u86C7\u80FD\u6E90",
    industry: "\u6CB9\u6C14\u5F00\u91C7",
    summary: "\u5728\u7F8E\u56FD\u4E8C\u53E0\u7EAA\u76C6\u5730\u52D8\u63A2\u548C\u5F00\u53D1\u9646\u4E0A\u77F3\u6CB9\u3001\u5929\u7136\u6C14\u8D44\u6E90\uFF0C\u4E1A\u52A1\u91CD\u70B9\u662F\u6CB9\u6C14\u751F\u4EA7\u3002FANG \u5728\u8FD9\u91CC\u662F\u516C\u53F8\u80A1\u7968\u4EE3\u7801\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/fang/company/"
      }
    ]
  },
  PFE: {
    name: "\u8F89\u745E",
    industry: "\u521B\u65B0\u836F\u4E0E\u75AB\u82D7",
    summary: "\u7814\u53D1\u3001\u751F\u4EA7\u5E76\u9500\u552E\u836F\u54C1\u548C\u75AB\u82D7\uFF0C\u4EA7\u54C1\u8986\u76D6\u80BF\u7624\u3001\u5FC3\u8840\u7BA1\u3001\u708E\u75C7\u514D\u75AB\u548C\u611F\u67D3\u7B49\u75BE\u75C5\u9886\u57DF\uFF0C\u6D88\u8D39\u8005\u53EF\u80FD\u719F\u6089\u5176\u80BA\u708E\u7403\u83CC\u75AB\u82D7\u548C Paxlovid\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/pfe/company/"
      }
    ]
  },
  WFC: {
    name: "\u5BCC\u56FD\u94F6\u884C",
    industry: "\u7EFC\u5408\u94F6\u884C",
    summary: "\u4E3A\u4E2A\u4EBA\u4E0E\u4F01\u4E1A\u63D0\u4F9B\u5B58\u6B3E\u3001\u8D37\u6B3E\u3001\u4FE1\u7528\u5361\u3001\u623F\u8D37\u548C\u8D22\u5BCC\u7BA1\u7406\uFF0C\u4E5F\u7ECF\u8425\u4F01\u4E1A\u94F6\u884C\u53CA\u8D44\u672C\u5E02\u573A\u76F8\u5173\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/wfc/company/"
      }
    ]
  },
  JNJ: {
    name: "\u5F3A\u751F",
    industry: "\u521B\u65B0\u836F\u4E0E\u533B\u7597\u5668\u68B0",
    summary: "\u4E3B\u8425\u521B\u65B0\u836F\u4E0E\u533B\u7597\u6280\u672F\uFF0C\u836F\u7269\u6D89\u53CA\u80BF\u7624\u3001\u514D\u75AB\u7B49\u9886\u57DF\uFF1B\u533B\u7597\u5668\u68B0\u4E1A\u52A1\u6DB5\u76D6\u624B\u672F\u3001\u9AA8\u79D1\u3001\u5FC3\u8840\u7BA1\u548C\u89C6\u529B\u4FDD\u5065\u7B49\u4EA7\u54C1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/jnj/company/"
      }
    ]
  },
  WAT: {
    name: "\u6C83\u7279\u4E16",
    industry: "\u5206\u6790\u4EEA\u5668",
    summary: "\u4E3A\u5B9E\u9A8C\u5BA4\u63D0\u4F9B\u6DB2\u76F8\u8272\u8C31\u3001\u8D28\u8C31\u53CA\u76F8\u5173\u8017\u6750\u548C\u8F6F\u4EF6\uFF0C\u5E2E\u52A9\u68C0\u6D4B\u6837\u54C1\u4E2D\u7684\u6210\u5206\uFF0C\u5E38\u7528\u4E8E\u836F\u7269\u7814\u53D1\u3001\u8D28\u91CF\u63A7\u5236\u3001\u98DF\u54C1\u548C\u73AF\u5883\u68C0\u6D4B\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/wat/company/"
      }
    ]
  },
  WRB: {
    name: "W. R. Berkley",
    industry: "\u5546\u4E1A\u4FDD\u9669",
    summary: "\u4E3B\u8981\u4E3A\u4F01\u4E1A\u63D0\u4F9B\u8D22\u4EA7\u3001\u8D23\u4EFB\u548C\u4E13\u4E1A\u9669\uFF0C\u4E5F\u7ECF\u8425\u518D\u4FDD\u9669\u3002\u4E1A\u52A1\u6D89\u53CA\u591A\u79CD\u884C\u4E1A\u98CE\u9669\uFF0C\u5305\u62EC\u5546\u4E1A\u8D22\u4EA7\u3001\u96C7\u5458\u548C\u4E13\u4E1A\u8D23\u4EFB\u7B49\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/wrb/company/"
      }
    ]
  },
  LYB: {
    name: "\u5229\u5B89\u5FB7\u5DF4\u585E\u5C14",
    industry: "\u5316\u5DE5\u4E0E\u5851\u6599",
    summary: "\u751F\u4EA7\u70EF\u70C3\u3001\u805A\u4E59\u70EF\u3001\u805A\u4E19\u70EF\u53CA\u5176\u4ED6\u5316\u5DE5\u6750\u6599\uFF0C\u4E3A\u5305\u88C5\u3001\u6C7D\u8F66\u3001\u5DE5\u4E1A\u5236\u9020\u7B49\u4E0B\u6E38\u63D0\u4F9B\u5851\u6599\u4E0E\u5316\u5DE5\u539F\u6599\uFF0C\u4E5F\u63D0\u4F9B\u76F8\u5173\u5DE5\u827A\u6280\u672F\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/lyb/company/"
      }
    ]
  },
  AIZ: {
    name: "Assurant",
    industry: "\u8BBE\u5907\u4E0E\u8D22\u4EA7\u4FDD\u969C",
    summary: "\u4E3A\u624B\u673A\u3001\u5BB6\u7535\u3001\u6C7D\u8F66\u548C\u4F4F\u5B85\u63D0\u4F9B\u4FDD\u9669\u53CA\u4FDD\u969C\u670D\u52A1\uFF0C\u5305\u62EC\u8BBE\u5907\u4FDD\u62A4\u3001\u5EF6\u957F\u670D\u52A1\u5408\u7EA6\u548C\u79DF\u5BA2\u4FDD\u9669\uFF0C\u5E38\u901A\u8FC7\u5546\u4E1A\u5408\u4F5C\u4F19\u4F34\u9500\u552E\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/aiz/company/"
      },
      {
        label: "Assurant \u5B98\u7F51",
        url: "https://www.assurant.com/capabilities/protection-solutions"
      }
    ]
  },
  MA: {
    name: "\u4E07\u4E8B\u8FBE",
    industry: "\u652F\u4ED8\u7F51\u7EDC",
    summary: "\u8FDE\u63A5\u94F6\u884C\u3001\u5546\u6237\u548C\u6D88\u8D39\u8005\uFF0C\u4E3A\u94F6\u884C\u5361\u53CA\u5176\u4ED6\u652F\u4ED8\u63D0\u4F9B\u4EA4\u6613\u5904\u7406\u670D\u52A1\uFF0C\u540C\u65F6\u63D0\u4F9B\u8DE8\u5883\u652F\u4ED8\u3001\u6570\u636E\u5206\u6790\u548C\u5B89\u5168\u98CE\u63A7\u76F8\u5173\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/ma/company/"
      }
    ]
  },
  ICE: {
    name: "\u6D32\u9645\u4EA4\u6613\u6240",
    industry: "\u4EA4\u6613\u6240\u4E0E\u91D1\u878D\u6570\u636E",
    summary: "\u7ECF\u8425\u8BC1\u5238\u53CA\u884D\u751F\u54C1\u4EA4\u6613\u548C\u6E05\u7B97\u5E73\u53F0\uFF0C\u5E76\u63D0\u4F9B\u56FA\u5B9A\u6536\u76CA\u6570\u636E\u3001\u91D1\u878D\u4FE1\u606F\u53CA\u623F\u8D37\u6280\u672F\u670D\u52A1\uFF0C\u4E1A\u52A1\u8FDE\u63A5\u91D1\u878D\u4EA4\u6613\u4E0E\u540E\u53F0\u57FA\u7840\u8BBE\u65BD\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/ice/company/"
      }
    ]
  },
  MET: {
    name: "\u5927\u90FD\u4F1A\u4EBA\u5BFF",
    industry: "\u4EBA\u5BFF\u4FDD\u9669\u4E0E\u798F\u5229",
    summary: "\u63D0\u4F9B\u4EBA\u5BFF\u4FDD\u9669\u3001\u5E74\u91D1\u548C\u5458\u5DE5\u798F\u5229\uFF0C\u4E5F\u7ECF\u8425\u8D44\u4EA7\u7BA1\u7406\uFF0C\u670D\u52A1\u4E2A\u4EBA\u3001\u4F01\u4E1A\u96C7\u4E3B\u53CA\u673A\u6784\u5BA2\u6237\uFF0C\u4E1A\u52A1\u8986\u76D6\u591A\u4E2A\u56FD\u5BB6\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/met/company/"
      }
    ]
  },
  KHC: {
    name: "\u5361\u592B\u4EA8\u6C0F",
    industry: "\u5305\u88C5\u98DF\u54C1",
    summary: "\u9500\u552E\u8C03\u5473\u9171\u3001\u5976\u916A\u3001\u65B9\u4FBF\u98DF\u54C1\u53CA\u996E\u6599\u7B49\uFF0C\u6D88\u8D39\u8005\u719F\u6089\u7684\u4EA8\u6C0F\u756A\u8304\u9171\u548C Kraft \u54C1\u724C\u98DF\u54C1\u5C5E\u4E8E\u5176\u4EA7\u54C1\u7EC4\u5408\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/khc/company/"
      }
    ]
  },
  GM: {
    name: "\u901A\u7528\u6C7D\u8F66",
    industry: "\u6C7D\u8F66\u5236\u9020",
    summary: "\u8BBE\u8BA1\u3001\u751F\u4EA7\u548C\u9500\u552E\u6C7D\u8F66\u53CA\u96F6\u90E8\u4EF6\uFF0C\u65D7\u4E0B\u54C1\u724C\u5305\u62EC\u96EA\u4F5B\u5170\u3001\u522B\u514B\u3001\u51EF\u8FEA\u62C9\u514B\u548C GMC\uFF0C\u5E76\u901A\u8FC7\u6C7D\u8F66\u91D1\u878D\u4E1A\u52A1\u652F\u6301\u8D2D\u8F66\u878D\u8D44\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/gm/company/"
      }
    ]
  },
  J: {
    name: "Jacobs \u96C5\u5404\u5E03\u65AF",
    industry: "\u5DE5\u7A0B\u8BBE\u8BA1\u4E0E\u54A8\u8BE2",
    summary: "\u4E3A\u57FA\u7840\u8BBE\u65BD\u548C\u5148\u8FDB\u5236\u9020\u8BBE\u65BD\u63D0\u4F9B\u89C4\u5212\u3001\u8BBE\u8BA1\u3001\u5DE5\u7A0B\u54A8\u8BE2\u53CA\u9879\u76EE\u7BA1\u7406\u670D\u52A1\uFF0C\u5BA2\u6237\u6D89\u53CA\u4EA4\u901A\u3001\u6C34\u52A1\u3001\u80FD\u6E90\u3001\u653F\u5E9C\u548C\u751F\u547D\u79D1\u5B66\u7B49\u9886\u57DF\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/j/company/"
      }
    ]
  },
  CB: {
    name: "\u5B89\u8FBE\u4FDD\u9669 Chubb",
    industry: "\u7EFC\u5408\u4FDD\u9669",
    summary: "\u4E3A\u4F01\u4E1A\u548C\u4E2A\u4EBA\u63D0\u4F9B\u8D22\u4EA7\u3001\u8D23\u4EFB\u3001\u4EBA\u5BFF\u7B49\u4FDD\u9669\uFF0C\u4E5F\u7ECF\u8425\u518D\u4FDD\u9669\uFF0C\u4EA7\u54C1\u5305\u62EC\u4F01\u4E1A\u98CE\u9669\u4FDD\u969C\u3001\u4F4F\u5B85\u3001\u6C7D\u8F66\u53CA\u4E13\u4E1A\u8D23\u4EFB\u9669\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/cb/company/"
      }
    ]
  },
  CTAS: {
    name: "\u4FE1\u8FBE\u601D",
    industry: "\u4F01\u4E1A\u65E5\u5E38\u670D\u52A1",
    summary: "\u4E3A\u4F01\u4E1A\u63D0\u4F9B\u5236\u670D\u79DF\u8D41\u4E0E\u6E05\u6D17\u3001\u5730\u57AB\u53CA\u536B\u751F\u7528\u54C1\uFF0C\u4E5F\u9500\u552E\u6025\u6551\u3001\u5B89\u5168\u548C\u6D88\u9632\u76F8\u5173\u4EA7\u54C1\u4E0E\u670D\u52A1\uFF0C\u670D\u52A1\u4E8E\u5BA2\u6237\u7684\u65E5\u5E38\u8FD0\u8425\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/ctas/company/"
      }
    ]
  },
  CVS: {
    name: "CVS \u5065\u5EB7",
    industry: "\u836F\u623F\u4E0E\u533B\u7597\u4FDD\u9669",
    summary: "\u7ECF\u8425\u96F6\u552E\u836F\u623F\u53CA\u5065\u5EB7\u670D\u52A1\uFF0C\u5E76\u63D0\u4F9B\u836F\u54C1\u798F\u5229\u7BA1\u7406\u548C\u533B\u7597\u4FDD\u9669\uFF0C\u4E1A\u52A1\u6DB5\u76D6\u6D88\u8D39\u8005\u53D6\u836F\u3001\u4F01\u4E1A\u836F\u54C1\u8BA1\u5212\u548C\u53C2\u4FDD\u4EBA\u7684\u533B\u7597\u4FDD\u969C\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/cvs/company/"
      }
    ]
  },
  WBD: {
    name: "\u534E\u7EB3\u5144\u5F1F\u63A2\u7D22",
    industry: "\u5F71\u89C6\u4E0E\u6D41\u5A92\u4F53",
    summary: "\u5236\u4F5C\u548C\u53D1\u884C\u7535\u5F71\u3001\u7535\u89C6\u5267\u53CA\u5176\u4ED6\u8282\u76EE\uFF0C\u7ECF\u8425 HBO Max\u3001discovery+ \u7B49\u6D41\u5A92\u4F53\u4E0E\u7535\u89C6\u4E1A\u52A1\uFF0C\u65D7\u4E0B\u5305\u62EC\u534E\u7EB3\u5144\u5F1F\u548C HBO \u7B49\u5185\u5BB9\u54C1\u724C\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/wbd/company/"
      }
    ]
  },
  CINF: {
    name: "\u8F9B\u8F9B\u90A3\u63D0\u91D1\u878D",
    industry: "\u8D22\u4EA7\u4E0E\u8D23\u4EFB\u4FDD\u9669",
    summary: "\u4E3A\u4F01\u4E1A\u548C\u4E2A\u4EBA\u63D0\u4F9B\u8D22\u4EA7\u53CA\u8D23\u4EFB\u4FDD\u9669\uFF0C\u4EA7\u54C1\u5305\u62EC\u5546\u4E1A\u8D22\u4EA7\u3001\u6C7D\u8F66\u3001\u4F4F\u5B85\u548C\u96C7\u5458\u4FDD\u969C\uFF0C\u4E5F\u7ECF\u8425\u4EBA\u5BFF\u4FDD\u9669\u53CA\u6295\u8D44\u4E1A\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/cinf/company/"
      }
    ]
  },
  UPS: {
    name: "\u8054\u5408\u5305\u88F9",
    industry: "\u5FEB\u9012\u4E0E\u7269\u6D41",
    summary: "\u63D0\u4F9B\u5305\u88F9\u3001\u6587\u4EF6\u53CA\u8D27\u7269\u8FD0\u8F93\uFF0C\u4E1A\u52A1\u8986\u76D6\u7F8E\u56FD\u56FD\u5185\u548C\u56FD\u9645\u5E02\u573A\uFF0C\u901A\u8FC7\u5730\u9762\u4E0E\u822A\u7A7A\u7F51\u7EDC\u4E3A\u4E2A\u4EBA\u548C\u4F01\u4E1A\u9001\u8D27\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/ups/company/"
      }
    ]
  },
  AES: {
    name: "AES \u7535\u529B",
    industry: "\u53D1\u7535\u4E0E\u516C\u7528\u4E8B\u4E1A",
    summary: "\u7ECF\u8425\u53D1\u7535\u4E0E\u4F9B\u7535\u4E1A\u52A1\uFF0C\u5411\u516C\u7528\u4E8B\u4E1A\u3001\u5DE5\u4E1A\u548C\u5C45\u6C11\u7B49\u5BA2\u6237\u9500\u552E\u7535\u529B\uFF0C\u4E1A\u52A1\u6D89\u53CA\u53EF\u518D\u751F\u80FD\u6E90\u3001\u7535\u529B\u57FA\u7840\u8BBE\u65BD\u53CA\u76F8\u5173\u6280\u672F\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/aes/company/"
      }
    ]
  },
  ALL: {
    name: "\u597D\u4E8B\u8FBE\u4FDD\u9669",
    industry: "\u6C7D\u8F66\u4E0E\u4F4F\u5B85\u4FDD\u9669",
    summary: "\u4E3A\u4E2A\u4EBA\u53CA\u4F01\u4E1A\u63D0\u4F9B\u4FDD\u9669\uFF0C\u4EA7\u54C1\u5305\u62EC\u6C7D\u8F66\u3001\u4F4F\u5B85\u7B49\u8D22\u4EA7\u4FDD\u969C\uFF0C\u4E5F\u7ECF\u8425\u8BBE\u5907\u548C\u6D88\u8D39\u54C1\u4FDD\u62A4\u8BA1\u5212\uFF0C\u65D7\u4E0B\u54C1\u724C\u5305\u62EC Allstate \u548C National General\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/all/company/"
      }
    ]
  },
  GOOG: {
    name: "Alphabet \u8C37\u6B4C\u6BCD\u516C\u53F8 C\u7C7B",
    industry: "\u4E92\u8054\u7F51\u4E0E\u4E91\u8BA1\u7B97",
    summary: "\u65D7\u4E0B\u8C37\u6B4C\u63D0\u4F9B\u641C\u7D22\u3001YouTube\u3001Android \u7B49\u4EA7\u54C1\uFF0C\u5E76\u7ECF\u8425\u6570\u5B57\u5E7F\u544A\u3001Google Cloud \u4E91\u670D\u52A1\u53CA\u5176\u4ED6\u6280\u672F\u4E1A\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/goog/company/"
      }
    ]
  },
  TECH: {
    name: "Bio-Techne",
    industry: "\u751F\u547D\u79D1\u5B66\u5DE5\u5177",
    summary: "\u5411\u79D1\u7814\u3001\u8BCA\u65AD\u548C\u751F\u7269\u5236\u836F\u5BA2\u6237\u9500\u552E\u8BD5\u5242\u3001\u86CB\u767D\u3001\u6297\u4F53\u53CA\u5206\u6790\u4EEA\u5668\uFF0C\u5E2E\u52A9\u5B9E\u9A8C\u5BA4\u5F00\u5C55\u751F\u547D\u79D1\u5B66\u7814\u7A76\u548C\u76F8\u5173\u68C0\u6D4B\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/tech/company/"
      }
    ]
  },
  BALL: {
    name: "\u6CE2\u5C14\u516C\u53F8",
    industry: "\u94DD\u5236\u5305\u88C5",
    summary: "\u751F\u4EA7\u94DD\u5236\u996E\u6599\u7F50\u53CA\u5176\u4ED6\u94DD\u5305\u88C5\uFF0C\u4E3A\u996E\u6599\u3001\u4E2A\u4EBA\u62A4\u7406\u548C\u5BB6\u5C45\u4EA7\u54C1\u4F01\u4E1A\u4F9B\u8D27\uFF0C\u4E5F\u63D0\u4F9B\u94DD\u74F6\u3001\u94DD\u676F\u7B49\u4EA7\u54C1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/ball/company/"
      }
    ]
  },
  CPAY: {
    name: "Corpay",
    industry: "\u4F01\u4E1A\u652F\u4ED8",
    summary: "\u5E2E\u52A9\u4F01\u4E1A\u7BA1\u7406\u8F66\u8F86\u3001\u4F4F\u5BBF\u548C\u5176\u4ED6\u7ECF\u8425\u652F\u51FA\uFF0C\u63D0\u4F9B\u71C3\u6CB9\u7B49\u652F\u4ED8\u65B9\u6848\u3001\u8DE8\u5883\u4ED8\u6B3E\u3001\u865A\u62DF\u5361\u53CA\u8D39\u7528\u7BA1\u7406\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/cpay/company/"
      }
    ]
  },
  HIG: {
    name: "\u54C8\u7279\u798F\u5FB7\u4FDD\u9669",
    industry: "\u5546\u4E1A\u4E0E\u4E2A\u4EBA\u4FDD\u9669",
    summary: "\u4E3A\u4F01\u4E1A\u548C\u4E2A\u4EBA\u63D0\u4F9B\u8D22\u4EA7\u3001\u6C7D\u8F66\u3001\u8D23\u4EFB\u53CA\u5458\u5DE5\u798F\u5229\u76F8\u5173\u4FDD\u9669\uFF0C\u5E76\u7ECF\u8425\u57FA\u91D1\u4E1A\u52A1\uFF0C\u5546\u4E1A\u9669\u662F\u5176\u4E3B\u8981\u4E1A\u52A1\u9886\u57DF\u4E4B\u4E00\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/hig/company/"
      }
    ]
  },
  MDLZ: {
    name: "\u4EBF\u6ECB\u56FD\u9645",
    industry: "\u96F6\u98DF\u98DF\u54C1",
    summary: "\u9500\u552E\u997C\u5E72\u3001\u5DE7\u514B\u529B\u548C\u5176\u4ED6\u96F6\u98DF\uFF0C\u65D7\u4E0B\u54C1\u724C\u5305\u62EC\u5965\u5229\u5965\u3001Ritz\u3001\u5409\u767E\u5229\u548C Milka\uFF0C\u4EA7\u54C1\u901A\u8FC7\u96F6\u552E\u6E20\u9053\u9500\u5F80\u591A\u4E2A\u5E02\u573A\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/mdlz/company/"
      }
    ]
  },
  VRTX: {
    name: "\u798F\u6CF0\u5236\u836F",
    industry: "\u751F\u7269\u5236\u836F",
    summary: "\u7814\u53D1\u5E76\u9500\u552E\u7528\u4E8E\u4E25\u91CD\u75BE\u75C5\u7684\u836F\u7269\uFF0C\u4E1A\u52A1\u6D89\u53CA\u56CA\u6027\u7EA4\u7EF4\u5316\u3001\u9570\u72B6\u7EC6\u80DE\u75C5\u548C\u6025\u6027\u75BC\u75DB\u7B49\u9886\u57DF\uFF0C\u4EA7\u54C1\u5305\u62EC TRIKAFTA \u7B49\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/vrtx/company/"
      }
    ]
  },
  GPC: {
    name: "Genuine Parts",
    industry: "\u6C7D\u8F66\u4E0E\u5DE5\u4E1A\u914D\u4EF6",
    summary: "\u5206\u9500\u6C7D\u8F66\u7EF4\u4FEE\u914D\u4EF6\u53CA\u5DE5\u4E1A\u66FF\u6362\u96F6\u4EF6\uFF0C\u670D\u52A1\u4FEE\u7406\u5382\u3001\u8F66\u4E3B\u548C\u5DE5\u4E1A\u5BA2\u6237\uFF0C\u4EA7\u54C1\u6D89\u53CA\u5239\u8F66\u3001\u7535\u6C60\u3001\u8FC7\u6EE4\u5668\u7B49\u65E5\u5E38\u7EF4\u62A4\u7528\u54C1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/gpc/company/"
      }
    ]
  },
  AMP: {
    name: "Ameriprise \u5B89\u7F8E",
    industry: "\u8D22\u5BCC\u4E0E\u8D44\u4EA7\u7BA1\u7406",
    summary: "\u4E3A\u4E2A\u4EBA\u548C\u673A\u6784\u63D0\u4F9B\u7406\u8D22\u89C4\u5212\u3001\u6295\u8D44\u987E\u95EE\u53CA\u8D44\u4EA7\u7BA1\u7406\uFF0C\u4E5F\u7ECF\u8425\u9000\u4F11\u548C\u4FDD\u969C\u76F8\u5173\u4EA7\u54C1\uFF0C\u4E1A\u52A1\u56F4\u7ED5\u5BA2\u6237\u8D22\u5BCC\u7BA1\u7406\u5C55\u5F00\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/amp/company/"
      }
    ]
  },
  OKE: {
    name: "ONEOK",
    industry: "\u80FD\u6E90\u7BA1\u9053\u4E0E\u50A8\u8FD0",
    summary: "\u7ECF\u8425\u5929\u7136\u6C14\u6536\u96C6\u3001\u5904\u7406\u3001\u7BA1\u9053\u8FD0\u8F93\u548C\u50A8\u5B58\u7B49\u80FD\u6E90\u4E2D\u6E38\u4E1A\u52A1\uFF0C\u4E5F\u63D0\u4F9B\u5929\u7136\u6C14\u6DB2\u4F53\u3001\u6210\u54C1\u6CB9\u53CA\u539F\u6CB9\u76F8\u5173\u7269\u6D41\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/oke/company/"
      }
    ]
  },
  NVR: {
    name: "NVR \u4F4F\u5B85\u5EFA\u7B51",
    industry: "\u4F4F\u5B85\u5F00\u53D1",
    summary: "\u5728\u7F8E\u56FD\u5EFA\u9020\u5E76\u9500\u552E\u72EC\u680B\u4F4F\u5B85\u3001\u8054\u6392\u4F4F\u5B85\u7B49\uFF0C\u54C1\u724C\u5305\u62EC Ryan Homes \u548C NVHomes\uFF0C\u4E5F\u4E3A\u8D2D\u623F\u5BA2\u6237\u63D0\u4F9B\u623F\u8D37\u76F8\u5173\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/nvr/company/"
      }
    ]
  },
  ACGL: {
    name: "Arch Capital",
    industry: "\u4FDD\u9669\u4E0E\u518D\u4FDD\u9669",
    summary: "\u63D0\u4F9B\u4F01\u4E1A\u4FDD\u9669\u3001\u518D\u4FDD\u9669\u548C\u623F\u8D37\u4FDD\u9669\uFF0C\u5E2E\u52A9\u5BA2\u6237\u7BA1\u7406\u8D22\u4EA7\u3001\u8D23\u4EFB\u53CA\u4F4F\u623F\u8D37\u6B3E\u7B49\u98CE\u9669\uFF0C\u4E1A\u52A1\u8986\u76D6\u7F8E\u56FD\u53CA\u5176\u4ED6\u5E02\u573A\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/acgl/company/"
      }
    ]
  },
  WELL: {
    name: "Welltower",
    industry: "\u517B\u8001\u4F4F\u5B85\u623F\u5730\u4EA7",
    summary: "\u6295\u8D44\u5E76\u7ECF\u8425\u9762\u5411\u8001\u5E74\u4EBA\u7684\u4F4F\u5B85\u4E0E\u793E\u533A\uFF0C\u4E1A\u52A1\u5206\u5E03\u4E8E\u7F8E\u56FD\u3001\u82F1\u56FD\u548C\u52A0\u62FF\u5927\uFF0C\u91CD\u70B9\u56F4\u7ED5\u517B\u8001\u5C45\u4F4F\u7A7A\u95F4\u53CA\u76F8\u5173\u7269\u4E1A\u8FD0\u8425\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/well/company/"
      }
    ]
  },
  GPN: {
    name: "Global Payments",
    industry: "\u5546\u6237\u652F\u4ED8\u670D\u52A1",
    summary: "\u4E3A\u5546\u6237\u63D0\u4F9B\u6536\u6B3E\u53CA\u652F\u4ED8\u5904\u7406\u6280\u672F\uFF0C\u628A\u7EBF\u4E0A\u3001\u95E8\u5E97\u548C\u8F6F\u4EF6\u7CFB\u7EDF\u4E2D\u7684\u652F\u4ED8\u8FDE\u63A5\u8D77\u6765\uFF0C\u5E76\u63D0\u4F9B\u76F8\u5173\u5546\u4E1A\u7BA1\u7406\u89E3\u51B3\u65B9\u6848\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/gpn/company/"
      }
    ]
  },
  CAH: {
    name: "\u5EB7\u5FB7\u4E50",
    industry: "\u836F\u54C1\u4E0E\u533B\u7597\u7528\u54C1\u6D41\u901A",
    summary: "\u5411\u533B\u9662\u3001\u836F\u623F\u548C\u8BCA\u6240\u914D\u9001\u836F\u54C1\u3001\u533B\u7597\u7528\u54C1\u53CA\u76F8\u5173\u4EA7\u54C1\uFF0C\u540C\u65F6\u63D0\u4F9B\u836F\u623F\u7BA1\u7406\u548C\u4E13\u79D1\u836F\u7269\u670D\u52A1\uFF0C\u5904\u4E8E\u533B\u7597\u4F9B\u5E94\u94FE\u73AF\u8282\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/cah/company/"
      }
    ]
  },
  VLTO: {
    name: "Veralto",
    industry: "\u6C34\u8D28\u4E0E\u4EA7\u54C1\u8D28\u91CF",
    summary: "\u63D0\u4F9B\u6C34\u8D28\u5206\u6790\u3001\u6C34\u5904\u7406\u3001\u5305\u88C5\u5370\u7801\u548C\u989C\u8272\u7BA1\u7406\u6280\u672F\u3002\u65D7\u4E0B Hach \u7B49\u4EA7\u54C1\u5E2E\u52A9\u5BA2\u6237\u76D1\u6D4B\u6C34\u8D28\uFF0C\u5176\u4ED6\u4E1A\u52A1\u652F\u6301\u5546\u54C1\u6807\u8BC6\u548C\u5305\u88C5\u8D28\u91CF\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/vlto/company/"
      }
    ]
  },
  FOX: {
    name: "\u798F\u514B\u65AF B\u7C7B",
    industry: "\u65B0\u95FB\u4E0E\u4F53\u80B2\u5A92\u4F53",
    summary: "\u7ECF\u8425\u65B0\u95FB\u3001\u4F53\u80B2\u548C\u5A31\u4E50\u8282\u76EE\uFF0C\u4E1A\u52A1\u5305\u62EC FOX \u7535\u89C6\u7F51\u7EDC\u3001\u76F8\u5173\u6709\u7EBF\u7535\u89C6\u5185\u5BB9\u53CA Tubi \u89C6\u9891\u5E73\u53F0\uFF0C\u6536\u5165\u6765\u6E90\u6D89\u53CA\u5E7F\u544A\u548C\u5185\u5BB9\u5206\u53D1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/fox/company/"
      }
    ]
  },
  INCY: {
    name: "Incyte \u56E0\u8D5B\u7279",
    industry: "\u751F\u7269\u5236\u836F",
    summary: "\u7814\u53D1\u5E76\u9500\u552E\u6CBB\u7597\u836F\u7269\uFF0C\u4EA7\u54C1\u6D89\u53CA\u8840\u6DB2\u75BE\u75C5\u3001\u80BF\u7624\u7B49\u9886\u57DF\uFF0C\u5305\u62EC\u7528\u4E8E\u7279\u5B9A\u9AA8\u9AD3\u53CA\u8840\u6DB2\u75BE\u75C5\u7684 JAKAFI \u7B49\u836F\u7269\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/incy/company/"
      }
    ]
  },
  DOC: {
    name: "Healthpeak",
    industry: "\u533B\u7597\u623F\u5730\u4EA7",
    summary: "\u62E5\u6709\u3001\u7ECF\u8425\u5E76\u5F00\u53D1\u670D\u52A1\u4E8E\u533B\u7597\u7814\u7A76\u548C\u8BCA\u7597\u7684\u623F\u5730\u4EA7\uFF0C\u4E3A\u751F\u547D\u79D1\u5B66\u53CA\u533B\u7597\u6D3B\u52A8\u63D0\u4F9B\u7269\u4E1A\u7A7A\u95F4\uFF0C\u662F\u533B\u7597\u623F\u5730\u4EA7\u9886\u57DF\u7684\u6295\u8D44\u516C\u53F8\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/doc/company/"
      }
    ]
  },
  C: {
    name: "\u82B1\u65D7\u96C6\u56E2",
    industry: "\u7EFC\u5408\u94F6\u884C",
    summary: "\u4E3A\u4E2A\u4EBA\u3001\u4F01\u4E1A\u3001\u653F\u5E9C\u548C\u673A\u6784\u63D0\u4F9B\u94F6\u884C\u670D\u52A1\uFF0C\u4E1A\u52A1\u5305\u62EC\u8DE8\u5883\u73B0\u91D1\u7BA1\u7406\u3001\u8BC1\u5238\u670D\u52A1\u3001\u6295\u884C\u4E1A\u52A1\u3001\u4EA4\u6613\u3001\u4E2A\u4EBA\u94F6\u884C\u548C\u8D22\u5BCC\u7BA1\u7406\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/c/company/"
      }
    ]
  },
  FOXA: {
    name: "\u798F\u514B\u65AF A\u7C7B",
    industry: "\u65B0\u95FB\u4E0E\u4F53\u80B2\u5A92\u4F53",
    summary: "\u4E0E FOX \u5BF9\u5E94\u540C\u4E00\u5BB6\u516C\u53F8\uFF0C\u7ECF\u8425\u65B0\u95FB\u3001\u4F53\u80B2\u3001\u5A31\u4E50\u7535\u89C6\u53CA Tubi \u89C6\u9891\u5E73\u53F0\u3002A\u7C7B\u4E0EB\u7C7B\u5C5E\u4E8E\u4E0D\u540C\u80A1\u4EFD\u7C7B\u522B\uFF0C\u516C\u53F8\u4E3B\u4F53\u76F8\u540C\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/foxa/company/"
      }
    ]
  },
  HSIC: {
    name: "\u6C49\u745E\u7965",
    industry: "\u7259\u79D1\u4E0E\u533B\u7597\u4F9B\u5E94",
    summary: "\u5411\u7259\u79D1\u8BCA\u6240\u548C\u5176\u4ED6\u533B\u7597\u673A\u6784\u9500\u552E\u8017\u6750\u3001\u8BBE\u5907\u53CA\u6280\u672F\u670D\u52A1\uFF0C\u5305\u62EC\u7259\u79D1\u5668\u68B0\u3001\u5F71\u50CF\u8BBE\u5907\u548C\u6570\u5B57\u5316\u5DE5\u5177\uFF0C\u5E2E\u52A9\u8BCA\u6240\u5F00\u5C55\u65E5\u5E38\u4E1A\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/hsic/company/"
      }
    ]
  },
  AVY: {
    name: "\u827E\u5229\u4E39\u5C3C\u68EE",
    industry: "\u6807\u7B7E\u4E0E\u8BC6\u522B\u6750\u6599",
    summary: "\u751F\u4EA7\u6807\u7B7E\u6750\u6599\u3001\u80F6\u5E26\u53CA\u56FE\u5F62\u6750\u6599\uFF0C\u5E76\u63D0\u4F9B\u6570\u5B57\u8EAB\u4EFD\u8BC6\u522B\u89E3\u51B3\u65B9\u6848\uFF0C\u4EA7\u54C1\u7528\u4E8E\u5546\u54C1\u5305\u88C5\u3001\u54C1\u724C\u6807\u8BC6\u53CA\u4F9B\u5E94\u94FE\u4E2D\u7684\u7269\u54C1\u8BC6\u522B\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/avy/company/"
      }
    ]
  },
  AFL: {
    name: "Aflac \u7F8E\u56FD\u5BB6\u5EAD\u4EBA\u5BFF",
    industry: "\u8865\u5145\u5065\u5EB7\u4E0E\u5BFF\u9669",
    summary: "\u5728\u65E5\u672C\u548C\u7F8E\u56FD\u7ECF\u8425\u8865\u5145\u5065\u5EB7\u4FDD\u9669\u4E0E\u4EBA\u5BFF\u4FDD\u9669\uFF0C\u4EA7\u54C1\u6D89\u53CA\u764C\u75C7\u3001\u610F\u5916\u3001\u4F4F\u9662\u548C\u4F24\u6B8B\u7B49\u98CE\u9669\uFF0C\u4E3A\u5BA2\u6237\u8865\u5145\u73B0\u6709\u4FDD\u969C\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/afl/company/"
      }
    ]
  },
  JPM: {
    name: "\u6469\u6839\u5927\u901A",
    industry: "\u7EFC\u5408\u94F6\u884C",
    summary: "\u7ECF\u8425\u4E2A\u4EBA\u94F6\u884C\u3001\u4FE1\u7528\u5361\u3001\u4F01\u4E1A\u4E0E\u6295\u8D44\u94F6\u884C\u3001\u8D44\u4EA7\u7BA1\u7406\u548C\u8D22\u5BCC\u7BA1\u7406\uFF0C\u65E2\u4E3A\u4E2A\u4EBA\u63D0\u4F9B\u5B58\u8D37\u6B3E\uFF0C\u4E5F\u4E3A\u4F01\u4E1A\u878D\u8D44\u548C\u673A\u6784\u4EA4\u6613\u63D0\u4F9B\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/jpm/company/"
      }
    ]
  },
  XYZ: {
    name: "Block",
    industry: "\u91D1\u878D\u79D1\u6280\u4E0E\u652F\u4ED8",
    summary: "\u65D7\u4E0B Square \u4E3A\u5546\u6237\u63D0\u4F9B\u6536\u6B3E\u8BBE\u5907\u3001\u652F\u4ED8\u548C\u7ECF\u8425\u8F6F\u4EF6\uFF1BCash App \u4E3A\u4E2A\u4EBA\u63D0\u4F9B\u8F6C\u8D26\u53CA\u5176\u4ED6\u91D1\u878D\u5DE5\u5177\uFF0C\u8FDE\u63A5\u5546\u6237\u7ECF\u8425\u4E0E\u4E2A\u4EBA\u652F\u4ED8\u573A\u666F\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/xyz/company/"
      }
    ]
  },
  CCEP: {
    name: "\u53EF\u53E3\u53EF\u4E50\u6B27\u6D32\u592A\u5E73\u6D0B\u4F19\u4F34",
    industry: "\u996E\u6599\u88C5\u74F6\u4E0E\u5206\u9500",
    summary: "\u751F\u4EA7\u3001\u5305\u88C5\u5E76\u9500\u552E\u53EF\u53E3\u53EF\u4E50\u7B49\u996E\u6599\u54C1\u724C\u4EA7\u54C1\u3002\u5B83\u5C5E\u4E8E\u88C5\u74F6\u4E0E\u5206\u9500\u4F01\u4E1A\uFF0C\u4E0E\u80A1\u7968\u4EE3\u7801 KO \u5BF9\u5E94\u7684\u53EF\u53E3\u53EF\u4E50\u516C\u53F8\u662F\u4E0D\u540C\u4E0A\u5E02\u516C\u53F8\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/ccep/company/"
      }
    ]
  },
  ESS: {
    name: "Essex \u516C\u5BD3\u4FE1\u6258",
    industry: "\u4F4F\u5B85\u623F\u5730\u4EA7",
    summary: "\u5728\u7F8E\u56FD\u897F\u6D77\u5CB8\u90E8\u5206\u5E02\u573A\u6295\u8D44\u3001\u5F00\u53D1\u5E76\u7BA1\u7406\u591A\u6237\u4F4F\u5B85\u548C\u516C\u5BD3\u793E\u533A\uFF0C\u4E1A\u52A1\u56F4\u7ED5\u51FA\u79DF\u4F4F\u5B85\u7684\u6301\u6709\u53CA\u8FD0\u8425\u5C55\u5F00\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/ess/company/"
      }
    ]
  },
  CSCO: {
    name: "\u601D\u79D1",
    industry: "\u7F51\u7EDC\u4E0E\u5B89\u5168\u8BBE\u5907",
    summary: "\u4E3A\u4F01\u4E1A\u548C\u8FD0\u8425\u5546\u63D0\u4F9B\u7F51\u7EDC\u8FDE\u63A5\u3001\u5B89\u5168\u53CA\u534F\u4F5C\u6280\u672F\uFF0C\u4EA7\u54C1\u5305\u62EC\u6570\u636E\u4E2D\u5FC3\u4EA4\u6362\u8BBE\u5907\u3001\u7F51\u7EDC\u5B89\u5168\u65B9\u6848\u548C Webex \u534F\u4F5C\u5DE5\u5177\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/csco/company/"
      }
    ]
  },
  SCHW: {
    name: "\u5609\u4FE1\u7406\u8D22",
    industry: "\u8BC1\u5238\u7ECF\u7EAA\u4E0E\u8D22\u5BCC\u7BA1\u7406",
    summary: "\u4E3A\u4E2A\u4EBA\u6295\u8D44\u8005\u548C\u6295\u8D44\u987E\u95EE\u63D0\u4F9B\u8BC1\u5238\u4EA4\u6613\u3001\u6258\u7BA1\u3001\u8D22\u5BCC\u7BA1\u7406\u53CA\u94F6\u884C\u670D\u52A1\uFF0C\u5BA2\u6237\u53EF\u901A\u8FC7\u5176\u5E73\u53F0\u6295\u8D44\u80A1\u7968\u3001\u503A\u5238\u3001\u57FA\u91D1\u7B49\u4EA7\u54C1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/schw/company/"
      }
    ]
  },
  BEN: {
    name: "\u5BCC\u5170\u514B\u6797\u9093\u666E\u987F",
    industry: "\u8D44\u4EA7\u7BA1\u7406",
    summary: "\u4E3A\u4E2A\u4EBA\u3001\u673A\u6784\u53CA\u9000\u4F11\u8BA1\u5212\u7BA1\u7406\u6295\u8D44\uFF0C\u4EA7\u54C1\u8986\u76D6\u80A1\u7968\u3001\u503A\u5238\u3001\u591A\u8D44\u4EA7\u53CA\u53E6\u7C7B\u6295\u8D44\uFF0C\u901A\u8FC7\u65D7\u4E0B\u6295\u8D44\u7BA1\u7406\u4E1A\u52A1\u63D0\u4F9B\u57FA\u91D1\u548C\u76F8\u5173\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/ben/company/"
      }
    ]
  },
  NXPI: {
    name: "\u6069\u667A\u6D66\u534A\u5BFC\u4F53",
    industry: "\u6C7D\u8F66\u4E0E\u5DE5\u4E1A\u82AF\u7247",
    summary: "\u8BBE\u8BA1\u5E76\u9500\u552E\u5FAE\u63A7\u5236\u5668\u3001\u5904\u7406\u5668\u3001\u8FDE\u63A5\u548C\u5B89\u5168\u82AF\u7247\u7B49\uFF0C\u4EA7\u54C1\u7528\u4E8E\u6C7D\u8F66\u3001\u5DE5\u4E1A\u53CA\u5176\u4ED6\u7535\u5B50\u8BBE\u5907\uFF0C\u4E5F\u5305\u62EC\u8FD1\u573A\u901A\u4FE1\u7B49\u65E0\u7EBF\u8FDE\u63A5\u6280\u672F\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/nxpi/company/"
      }
    ]
  },
  SYY: {
    name: "Sysco \u897F\u65AF\u79D1\u98DF\u54C1",
    industry: "\u9910\u996E\u4F9B\u5E94\u94FE",
    summary: "\u5411\u9910\u5385\u3001\u9152\u5E97\u3001\u5B66\u6821\u548C\u533B\u7597\u673A\u6784\u914D\u9001\u98DF\u54C1\u53CA\u9910\u996E\u7528\u54C1\uFF0C\u4EA7\u54C1\u5305\u62EC\u8089\u7C7B\u3001\u6D77\u9C9C\u3001\u4E73\u5236\u54C1\u3001\u679C\u852C\u53CA\u4E00\u6B21\u6027\u7528\u54C1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/syy/company/"
      }
    ]
  },
  VTR: {
    name: "Ventas",
    industry: "\u517B\u8001\u4E0E\u533B\u7597\u623F\u5730\u4EA7",
    summary: "\u6301\u6709\u5E76\u7ECF\u8425\u517B\u8001\u4F4F\u5B85\u53CA\u5176\u4ED6\u533B\u7597\u76F8\u5173\u7269\u4E1A\uFF0C\u4E3A\u8001\u5E74\u4EBA\u53E3\u7684\u5C45\u4F4F\u548C\u670D\u52A1\u9700\u6C42\u63D0\u4F9B\u623F\u5730\u4EA7\u7A7A\u95F4\uFF0C\u4E1A\u52A1\u8986\u76D6\u5317\u7F8E\u53CA\u82F1\u56FD\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/vtr/company/"
      }
    ]
  },
  HST: {
    name: "Host Hotels & Resorts",
    industry: "\u9152\u5E97\u623F\u5730\u4EA7",
    summary: "\u6301\u6709\u9152\u5E97\u53CA\u5EA6\u5047\u6751\u7269\u4E1A\uFF0C\u5E76\u4E0E\u4E07\u8C6A\u3001\u51EF\u60A6\u3001\u5E0C\u5C14\u987F\u7B49\u9152\u5E97\u54C1\u724C\u5408\u4F5C\uFF0C\u4E1A\u52A1\u91CD\u70B9\u662F\u9152\u5E97\u623F\u5730\u4EA7\u8D44\u4EA7\u7684\u6295\u8D44\u4E0E\u7BA1\u7406\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/hst/company/"
      }
    ]
  },
  PRU: {
    name: "\u4FDD\u5FB7\u4FE1\u91D1\u878D",
    industry: "\u4FDD\u9669\u4E0E\u8D44\u4EA7\u7BA1\u7406",
    summary: "\u63D0\u4F9B\u4EBA\u5BFF\u4FDD\u9669\u3001\u9000\u4F11\u53CA\u5E74\u91D1\u4EA7\u54C1\uFF0C\u540C\u65F6\u901A\u8FC7 PGIM \u7ECF\u8425\u8D44\u4EA7\u7BA1\u7406\uFF0C\u670D\u52A1\u4E2A\u4EBA\u548C\u673A\u6784\u5BA2\u6237\uFF0C\u4E1A\u52A1\u5206\u5E03\u4E8E\u7F8E\u56FD\u53CA\u6D77\u5916\u5E02\u573A\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/pru/company/"
      }
    ]
  },
  PLD: {
    name: "\u5B89\u535A Prologis",
    industry: "\u7269\u6D41\u623F\u5730\u4EA7",
    summary: "\u56F4\u7ED5\u7269\u6D41\u57FA\u7840\u8BBE\u65BD\u5F00\u5C55\u4E1A\u52A1\uFF0C\u6301\u6709\u548C\u8FD0\u8425\u652F\u6301\u8D27\u7269\u6D41\u901A\u7684\u5DE5\u4E1A\u7269\u6D41\u7269\u4E1A\uFF0C\u4E3A\u4F01\u4E1A\u4ED3\u50A8\u548C\u4F9B\u5E94\u94FE\u6D3B\u52A8\u63D0\u4F9B\u7A7A\u95F4\u53CA\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/pld/company/"
      },
      {
        label: "\u5B89\u535A\u4E2D\u56FD\u5B98\u7F51",
        url: "https://www.prologis.cn/about-us/company-history"
      }
    ]
  },
  GL: {
    name: "Globe Life",
    industry: "\u4EBA\u5BFF\u4E0E\u5065\u5EB7\u4FDD\u9669",
    summary: "\u9762\u5411\u7F8E\u56FD\u4E2A\u4EBA\u548C\u5BB6\u5EAD\u63D0\u4F9B\u4EBA\u5BFF\u53CA\u8865\u5145\u5065\u5EB7\u4FDD\u9669\uFF0C\u4EA7\u54C1\u6D89\u53CA\u5B9A\u671F\u4E0E\u7EC8\u8EAB\u5BFF\u9669\u3001\u610F\u5916\u3001\u764C\u75C7\u548C\u4F4F\u9662\u7B49\u4FDD\u969C\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/gl/company/"
      }
    ]
  },
  APD: {
    name: "\u7A7A\u6C14\u4EA7\u54C1\u516C\u53F8",
    industry: "\u5DE5\u4E1A\u6C14\u4F53",
    summary: "\u4E3A\u70BC\u5316\u3001\u5236\u9020\u3001\u7535\u5B50\u548C\u533B\u7597\u7B49\u884C\u4E1A\u63D0\u4F9B\u6C27\u6C14\u3001\u6C2E\u6C14\u3001\u6C22\u6C14\u53CA\u5176\u4ED6\u5DE5\u4E1A\u6C14\u4F53\uFF0C\u540C\u65F6\u63D0\u4F9B\u76F8\u5173\u8BBE\u5907\u548C\u6280\u672F\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/apd/company/"
      }
    ]
  },
  FRT: {
    name: "Federal Realty",
    industry: "\u5546\u4E1A\u623F\u5730\u4EA7",
    summary: "\u6295\u8D44\u3001\u7ECF\u8425\u5E76\u6539\u9020\u8D2D\u7269\u4E2D\u5FC3\u53CA\u7EFC\u5408\u7528\u9014\u7269\u4E1A\uFF0C\u9879\u76EE\u7ED3\u5408\u96F6\u552E\u548C\u5176\u4ED6\u57CE\u5E02\u751F\u6D3B\u7A7A\u95F4\uFF0C\u4E1A\u52A1\u91CD\u70B9\u5728\u5546\u4E1A\u5730\u4EA7\u8FD0\u8425\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/frt/company/"
      }
    ]
  },
  AXP: {
    name: "\u7F8E\u56FD\u8FD0\u901A",
    industry: "\u94F6\u884C\u5361\u4E0E\u652F\u4ED8",
    summary: "\u63D0\u4F9B\u4FE1\u7528\u5361\u548C\u7B7E\u8D26\u5361\u3001\u5546\u6237\u652F\u4ED8\u7F51\u7EDC\u53CA\u65C5\u884C\u7B49\u670D\u52A1\uFF0C\u5E76\u7ECF\u8425\u878D\u8D44\u4E0E\u94F6\u884C\u4EA7\u54C1\uFF0C\u5BA2\u6237\u5305\u62EC\u4E2A\u4EBA\u6D88\u8D39\u8005\u548C\u4F01\u4E1A\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/axp/company/"
      }
    ]
  },
  CSX: {
    name: "CSX \u94C1\u8DEF",
    industry: "\u94C1\u8DEF\u8D27\u8FD0",
    summary: "\u901A\u8FC7\u94C1\u8DEF\u8FD0\u8F93\u5316\u5DE5\u54C1\u3001\u519C\u4EA7\u54C1\u3001\u6C7D\u8F66\u3001\u91D1\u5C5E\u3001\u7164\u70AD\u548C\u96C6\u88C5\u7BB1\u7B49\u8D27\u7269\uFF0C\u4E5F\u63D0\u4F9B\u516C\u94C1\u8054\u8FD0\u7B49\u76F8\u5173\u7269\u6D41\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/csx/company/"
      }
    ]
  },
  ROST: {
    name: "Ross \u767E\u8D27",
    industry: "\u6298\u6263\u96F6\u552E",
    summary: "\u7ECF\u8425 Ross Dress for Less \u548C dd\u2019s DISCOUNTS \u6298\u6263\u5546\u5E97\uFF0C\u9500\u552E\u670D\u88C5\u3001\u978B\u5C65\u3001\u914D\u9970\u548C\u5BB6\u5C45\u7528\u54C1\uFF0C\u4E3B\u8981\u9762\u5411\u5927\u4F17\u6D88\u8D39\u5E02\u573A\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/rost/company/"
      }
    ]
  },
  GWW: {
    name: "\u56FA\u5B89\u6377",
    industry: "\u5DE5\u4E1A\u7528\u54C1\u5206\u9500",
    summary: "\u5411\u4F01\u4E1A\u548C\u673A\u6784\u9500\u552E\u7EF4\u4FEE\u3001\u4FDD\u517B\u4E0E\u8FD0\u8425\u7528\u54C1\uFF0C\u5305\u62EC\u5DE5\u5177\u3001\u5B89\u5168\u8BBE\u5907\u3001\u6E05\u6D01\u7528\u54C1\u548C\u7269\u6599\u642C\u8FD0\u8BBE\u5907\uFF0C\u5E76\u63D0\u4F9B\u5E93\u5B58\u7BA1\u7406\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/gww/company/"
      }
    ]
  },
  F: {
    name: "\u798F\u7279\u6C7D\u8F66",
    industry: "\u6C7D\u8F66\u5236\u9020",
    summary: "\u9500\u552E\u798F\u7279\u6C7D\u8F66\u3001\u76AE\u5361\u3001\u5546\u7528\u8F66\u548C\u6797\u80AF\u8C6A\u534E\u8F66\uFF0C\u4E1A\u52A1\u5305\u62EC\u71C3\u6CB9\u3001\u6DF7\u5408\u52A8\u529B\u53CA\u7535\u52A8\u8F66\uFF0C\u540C\u65F6\u63D0\u4F9B\u8F66\u8F86\u670D\u52A1\u4E0E\u6C7D\u8F66\u91D1\u878D\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/f/company/"
      }
    ]
  },
  USB: {
    name: "\u7F8E\u56FD\u5408\u4F17\u94F6\u884C",
    industry: "\u7EFC\u5408\u94F6\u884C",
    summary: "\u4E3A\u4E2A\u4EBA\u3001\u4F01\u4E1A\u548C\u673A\u6784\u63D0\u4F9B\u5B58\u8D37\u6B3E\u3001\u652F\u4ED8\u3001\u8D22\u5BCC\u7BA1\u7406\u53CA\u5176\u4ED6\u94F6\u884C\u670D\u52A1\uFF0C\u4E1A\u52A1\u5305\u62EC\u96F6\u552E\u94F6\u884C\u3001\u4F01\u4E1A\u91D1\u878D\u548C\u652F\u4ED8\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/usb/company/"
      }
    ]
  },
  STT: {
    name: "\u9053\u5BCC",
    industry: "\u673A\u6784\u91D1\u878D\u670D\u52A1",
    summary: "\u4E3A\u57FA\u91D1\u548C\u5176\u4ED6\u673A\u6784\u6295\u8D44\u8005\u63D0\u4F9B\u8D44\u4EA7\u6258\u7BA1\u3001\u4F1A\u8BA1\u6838\u7B97\u3001\u57FA\u91D1\u884C\u653F\u53CA\u4EA4\u6613\u76F8\u5173\u670D\u52A1\uFF0C\u5E76\u7ECF\u8425\u6295\u8D44\u7BA1\u7406\u4E1A\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/stt/company/"
      }
    ]
  },
  TSCO: {
    name: "Tractor Supply",
    industry: "\u4E61\u6751\u751F\u6D3B\u96F6\u552E",
    summary: "\u9500\u552E\u7272\u755C\u9972\u6599\u3001\u5BA0\u7269\u7528\u54C1\u3001\u56ED\u827A\u8BBE\u5907\u3001\u5DE5\u5177\u548C\u5DE5\u4F5C\u670D\u7B49\uFF0C\u670D\u52A1\u519C\u573A\u3001\u5C0F\u578B\u517B\u6B96\u53CA\u4E61\u6751\u751F\u6D3B\u573A\u666F\u7684\u6D88\u8D39\u8005\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/tsco/company/"
      }
    ]
  },
  ALLE: {
    name: "\u5B89\u6717\u6770",
    industry: "\u95E8\u9501\u4E0E\u51FA\u5165\u5B89\u5168",
    summary: "\u63D0\u4F9B\u95E8\u9501\u3001\u95E8\u63A7\u3001\u7535\u5B50\u95E8\u7981\u53CA\u76F8\u5173\u8F6F\u4EF6\u4E0E\u670D\u52A1\uFF0C\u5E2E\u52A9\u4F4F\u5B85\u548C\u5546\u4E1A\u5EFA\u7B51\u7BA1\u7406\u4EBA\u5458\u51FA\u5165\u53CA\u5B89\u5168\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/alle/company/"
      }
    ]
  },
  HAS: {
    name: "\u5B69\u4E4B\u5B9D",
    industry: "\u73A9\u5177\u4E0E\u6E38\u620F",
    summary: "\u8BBE\u8BA1\u5E76\u9500\u552E\u73A9\u5177\u3001\u5361\u724C\u3001\u684C\u6E38\u53CA\u76F8\u5173\u6D88\u8D39\u54C1\uFF0C\u4E5F\u901A\u8FC7\u54C1\u724C\u6388\u6743\u5F00\u5C55\u4E1A\u52A1\uFF0C\u4EA7\u54C1\u8986\u76D6\u513F\u7AE5\u73A9\u5177\u53CA\u6210\u4EBA\u6E38\u620F\u6536\u85CF\u573A\u666F\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/has/company/"
      }
    ]
  },
  UNH: {
    name: "\u8054\u5408\u5065\u5EB7",
    industry: "\u533B\u7597\u4FDD\u9669\u4E0E\u670D\u52A1",
    summary: "\u65D7\u4E0B UnitedHealthcare \u63D0\u4F9B\u533B\u7597\u4FDD\u9669\uFF0COptum \u63D0\u4F9B\u533B\u7597\u670D\u52A1\u3001\u5065\u5EB7\u4FE1\u606F\u6280\u672F\u548C\u836F\u54C1\u76F8\u5173\u670D\u52A1\uFF0C\u4E1A\u52A1\u8986\u76D6\u4FDD\u969C\u4E0E\u533B\u7597\u8FD0\u8425\u4E24\u7AEF\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/unh/company/"
      }
    ]
  },
  TROW: {
    name: "\u666E\u5F95\u4ED5",
    industry: "\u8D44\u4EA7\u7BA1\u7406",
    summary: "\u4E3A\u4E2A\u4EBA\u3001\u673A\u6784\u548C\u9000\u4F11\u8BA1\u5212\u63D0\u4F9B\u6295\u8D44\u7BA1\u7406\uFF0C\u7BA1\u7406\u80A1\u7968\u3001\u503A\u5238\u7B49\u57FA\u91D1\u53CA\u76F8\u5173\u6295\u8D44\u7EC4\u5408\uFF0C\u7814\u7A76\u548C\u6295\u8D44\u7BA1\u7406\u662F\u5176\u6838\u5FC3\u4E1A\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/trow/company/"
      }
    ]
  },
  KIM: {
    name: "Kimco Realty",
    industry: "\u8D2D\u7269\u4E2D\u5FC3\u623F\u5730\u4EA7",
    summary: "\u6295\u8D44\u5E76\u7ECF\u8425\u9732\u5929\u8D2D\u7269\u4E2D\u5FC3\u548C\u7EFC\u5408\u7528\u9014\u7269\u4E1A\uFF0C\u8BB8\u591A\u9879\u76EE\u4EE5\u98DF\u54C1\u8D85\u5E02\u4E3A\u4E3B\u8981\u79DF\u6237\uFF0C\u670D\u52A1\u5468\u8FB9\u5C45\u6C11\u65E5\u5E38\u8D2D\u7269\u9700\u6C42\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/kim/company/"
      }
    ]
  },
  KVUE: {
    name: "\u79D1\u8D74",
    industry: "\u6D88\u8D39\u5065\u5EB7",
    summary: "\u9500\u552E\u975E\u5904\u65B9\u836F\u3001\u76AE\u80A4\u62A4\u7406\u3001\u53E3\u8154\u53CA\u5176\u4ED6\u65E5\u5E38\u5065\u5EB7\u7528\u54C1\uFF0C\u4E1A\u52A1\u8986\u76D6\u81EA\u6211\u5065\u5EB7\u7BA1\u7406\u3001\u7F8E\u5BB9\u62A4\u80A4\u548C\u57FA\u7840\u5065\u5EB7\u62A4\u7406\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/kvue/company/"
      }
    ]
  },
  CRL: {
    name: "\u67E5\u5C14\u65AF\u6CB3\u5B9E\u9A8C\u5BA4",
    industry: "\u836F\u7269\u7814\u53D1\u670D\u52A1",
    summary: "\u4E3A\u836F\u4F01\u53CA\u7814\u7A76\u673A\u6784\u63D0\u4F9B\u836F\u7269\u53D1\u73B0\u3001\u4E34\u5E8A\u524D\u7814\u7A76\u548C\u5B89\u5168\u6027\u6D4B\u8BD5\u670D\u52A1\uFF0C\u4E5F\u63D0\u4F9B\u7814\u7A76\u6A21\u578B\u7B49\u4EA7\u54C1\uFF0C\u652F\u6301\u65B0\u836F\u8FDB\u5165\u4E34\u5E8A\u524D\u7684\u7814\u7A76\u5DE5\u4F5C\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/crl/company/"
      }
    ]
  },
  UNP: {
    name: "\u8054\u5408\u592A\u5E73\u6D0B",
    industry: "\u94C1\u8DEF\u8D27\u8FD0",
    summary: "\u901A\u8FC7\u65D7\u4E0B\u94C1\u8DEF\u8FD0\u8F93\u7CAE\u98DF\u3001\u5316\u5DE5\u54C1\u3001\u6C7D\u8F66\u3001\u5DE5\u4E1A\u539F\u6599\u53CA\u96C6\u88C5\u7BB1\u7B49\u8D27\u7269\uFF0C\u5E2E\u52A9\u4F01\u4E1A\u5728\u7F8E\u56FD\u8FDB\u884C\u5927\u89C4\u6A21\u9646\u8DEF\u8FD0\u8F93\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/unp/company/"
      }
    ]
  },
  KEY: {
    name: "KeyCorp \u94F6\u884C\u96C6\u56E2",
    industry: "\u533A\u57DF\u94F6\u884C",
    summary: "\u901A\u8FC7 KeyBank \u4E3A\u4E2A\u4EBA\u53CA\u4F01\u4E1A\u63D0\u4F9B\u5B58\u8D37\u6B3E\u3001\u623F\u8D37\u3001\u73B0\u91D1\u7BA1\u7406\u548C\u8D22\u5BCC\u7BA1\u7406\u7B49\u670D\u52A1\uFF0C\u4E1A\u52A1\u5305\u62EC\u6D88\u8D39\u8005\u94F6\u884C\u4E0E\u5546\u4E1A\u94F6\u884C\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/key/company/"
      }
    ]
  },
  AMZN: {
    name: "\u4E9A\u9A6C\u900A",
    industry: "\u7535\u5546\u4E0E\u4E91\u8BA1\u7B97",
    summary: "\u7ECF\u8425\u7EBF\u4E0A\u53CA\u5B9E\u4F53\u96F6\u552E\u3001\u7B2C\u4E09\u65B9\u5546\u5BB6\u670D\u52A1\u3001\u5E7F\u544A\u548C\u4F1A\u5458\u8BA2\u9605\uFF1B\u65D7\u4E0B AWS \u5411\u4F01\u4E1A\u63D0\u4F9B\u4E91\u8BA1\u7B97\u670D\u52A1\uFF0C\u4E5F\u9500\u552E Kindle \u7B49\u8BBE\u5907\u5E76\u5236\u4F5C\u5A92\u4F53\u5185\u5BB9\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/amzn/company/"
      }
    ]
  },
  AEP: {
    name: "\u7F8E\u56FD\u7535\u529B",
    industry: "\u7535\u529B\u516C\u7528\u4E8B\u4E1A",
    summary: "\u901A\u8FC7\u53D1\u7535\u548C\u8F93\u914D\u7535\u7F51\u7EDC\u5411\u5BB6\u5EAD\u4E0E\u4F01\u4E1A\u4F9B\u7535\uFF0C\u4E1A\u52A1\u56F4\u7ED5\u7535\u529B\u8BBE\u65BD\u7684\u5EFA\u8BBE\u3001\u7EF4\u62A4\u548C\u8FD0\u8425\u5C55\u5F00\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.aep.com/about/"
      }
    ]
  },
  AIG: {
    name: "\u7F8E\u56FD\u56FD\u9645\u96C6\u56E2",
    industry: "\u8D22\u4EA7\u4E0E\u610F\u5916\u9669",
    summary: "\u4E3A\u4F01\u4E1A\u548C\u4E2A\u4EBA\u63D0\u4F9B\u8D22\u4EA7\u3001\u8D23\u4EFB\u53CA\u610F\u5916\u5065\u5EB7\u7B49\u4FDD\u9669\uFF0C\u5E2E\u52A9\u5BA2\u6237\u8F6C\u79FB\u7ECF\u8425\u548C\u751F\u6D3B\u4E2D\u7684\u98CE\u9669\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.aig.com/about"
      }
    ]
  },
  AMT: {
    name: "\u7F8E\u56FD\u7535\u5854",
    industry: "\u901A\u4FE1\u57FA\u7840\u8BBE\u65BD",
    summary: "\u6301\u6709\u3001\u5F00\u53D1\u548C\u8FD0\u8425\u4F9B\u591A\u5BB6\u5BA2\u6237\u5171\u7528\u7684\u901A\u4FE1\u7AD9\u70B9\uFF0C\u5E76\u7ECF\u8425\u7F8E\u56FD\u6570\u636E\u4E2D\u5FC3\u8BBE\u65BD\uFF0C\u4E3A\u901A\u4FE1\u7F51\u7EDC\u63D0\u4F9B\u57FA\u7840\u8BBE\u65BD\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/amt/company/"
      }
    ]
  },
  ATO: {
    name: "\u963F\u7279\u83AB\u65AF\u80FD\u6E90",
    industry: "\u5929\u7136\u6C14\u516C\u7528\u4E8B\u4E1A",
    summary: "\u5411\u5C45\u6C11\u548C\u4F01\u4E1A\u8F93\u9001\u5929\u7136\u6C14\uFF0C\u7ECF\u8425\u5929\u7136\u6C14\u914D\u9001\u3001\u7BA1\u9053\u548C\u50A8\u5B58\u8BBE\u65BD\uFF0C\u5E76\u6301\u7EED\u7EF4\u62A4\u548C\u5347\u7EA7\u4F9B\u6C14\u7F51\u7EDC\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.atmosenergy.com/company/about-atmos-energy/"
      }
    ]
  },
  BMY: {
    name: "\u767E\u65F6\u7F8E\u65BD\u8D35\u5B9D",
    industry: "\u751F\u7269\u5236\u836F",
    summary: "\u7814\u53D1\u548C\u9500\u552E\u5904\u65B9\u836F\uFF0C\u4E1A\u52A1\u6D89\u53CA\u80BF\u7624\u3001\u8840\u6DB2\u75BE\u75C5\u3001\u514D\u75AB\u53CA\u5FC3\u8840\u7BA1\u7B49\u6CBB\u7597\u9886\u57DF\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.bms.com/"
      }
    ]
  },
  CCI: {
    name: "\u51A0\u57CE\u56FD\u9645",
    industry: "\u901A\u4FE1\u57FA\u7840\u8BBE\u65BD",
    summary: "\u7ECF\u8425\u901A\u4FE1\u57FA\u7840\u8BBE\u65BD\uFF0C\u4E3A\u65E0\u7EBF\u7F51\u7EDC\u5BA2\u6237\u63D0\u4F9B\u7AD9\u70B9\u53CA\u76F8\u5173\u8FDE\u63A5\u670D\u52A1\uFF0C\u652F\u6301\u79FB\u52A8\u901A\u4FE1\u7F51\u7EDC\u8986\u76D6\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.crowncastle.com/"
      }
    ]
  },
  CHD: {
    name: "\u5207\u8FDF\u675C\u5A01",
    industry: "\u5BB6\u5EAD\u4E0E\u4E2A\u4EBA\u62A4\u7406",
    summary: "\u751F\u4EA7\u548C\u9500\u552E\u5BB6\u5EAD\u6E05\u6D01\u53CA\u4E2A\u4EBA\u62A4\u7406\u6D88\u8D39\u54C1\uFF0C\u4EA7\u54C1\u7528\u4E8E\u8863\u7269\u6E05\u6D01\u3001\u53E3\u8154\u62A4\u7406\u7B49\u65E5\u5E38\u573A\u666F\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://churchdwight.com/"
      }
    ]
  },
  CL: {
    name: "\u9AD8\u9732\u6D01\u68D5\u6984",
    industry: "\u65E5\u7528\u6D88\u8D39\u54C1",
    summary: "\u7ECF\u8425\u53E3\u8154\u62A4\u7406\u3001\u4E2A\u4EBA\u62A4\u7406\u3001\u5BB6\u5C45\u6E05\u6D01\u53CA\u5BA0\u7269\u8425\u517B\u4EA7\u54C1\uFF0C\u65D7\u4E0B\u5305\u62EC\u9AD8\u9732\u6D01\u548C\u5E0C\u5C14\u601D\u7B49\u54C1\u724C\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.colgatepalmolive.com/en-us"
      }
    ]
  },
  DUK: {
    name: "\u675C\u514B\u80FD\u6E90",
    industry: "\u7535\u529B\u4E0E\u5929\u7136\u6C14",
    summary: "\u901A\u8FC7\u7535\u529B\u548C\u5929\u7136\u6C14\u516C\u7528\u4E8B\u4E1A\u5411\u5BB6\u5EAD\u53CA\u4F01\u4E1A\u4F9B\u80FD\uFF0C\u540C\u65F6\u6295\u8D44\u7535\u7F51\u5347\u7EA7\u548C\u53D1\u7535\u8BBE\u65BD\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.duke-energy.com/our-company/about-us?id=1921"
      }
    ]
  },
  ECL: {
    name: "\u827A\u5EB7",
    industry: "\u6C34\u5904\u7406\u4E0E\u536B\u751F\u670D\u52A1",
    summary: "\u4E3A\u98DF\u54C1\u3001\u9152\u5E97\u3001\u533B\u7597\u548C\u5DE5\u4E1A\u5BA2\u6237\u63D0\u4F9B\u6C34\u5904\u7406\u3001\u6E05\u6D01\u536B\u751F\u53CA\u611F\u67D3\u9884\u9632\u4EA7\u54C1\u4E0E\u670D\u52A1\uFF0C\u5E2E\u52A9\u5BA2\u6237\u7BA1\u7406\u7528\u6C34\u548C\u8FD0\u8425\u73AF\u5883\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.ecolab.com/en-us/about"
      }
    ]
  },
  ED: {
    name: "\u8054\u5408\u7231\u8FEA\u751F",
    industry: "\u7EFC\u5408\u516C\u7528\u4E8B\u4E1A",
    summary: "\u901A\u8FC7\u53D7\u76D1\u7BA1\u7684\u516C\u7528\u4E8B\u4E1A\u63D0\u4F9B\u7535\u529B\u3001\u5929\u7136\u6C14\u53CA\u84B8\u6C7D\u670D\u52A1\uFF0C\u5E76\u7ECF\u8425\u76F8\u5173\u80FD\u6E90\u8F93\u9001\u8BBE\u65BD\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.conedison.com/en/about-us/our-businesses"
      }
    ]
  },
  EQT: {
    name: "EQT \u5929\u7136\u6C14",
    industry: "\u5929\u7136\u6C14\u751F\u4EA7",
    summary: "\u4ECE\u4E8B\u5929\u7136\u6C14\u751F\u4EA7\u53CA\u76F8\u5173\u4E2D\u6E38\u4E1A\u52A1\uFF0C\u901A\u8FC7\u751F\u4EA7\u548C\u8F93\u9001\u73AF\u8282\u4E3A\u80FD\u6E90\u5E02\u573A\u4F9B\u5E94\u5929\u7136\u6C14\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.eqt.com/"
      }
    ]
  },
  EVRG: {
    name: "Evergy \u7535\u529B",
    industry: "\u7535\u529B\u516C\u7528\u4E8B\u4E1A",
    summary: "\u5728\u7F8E\u56FD\u582A\u8428\u65AF\u5DDE\u548C\u5BC6\u82CF\u91CC\u5DDE\u63D0\u4F9B\u53D7\u76D1\u7BA1\u7684\u7535\u529B\u670D\u52A1\uFF0C\u9762\u5411\u5C45\u6C11\u3001\u793E\u533A\u548C\u4F01\u4E1A\u4F9B\u7535\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.evergy.com/about-evergy/our-company/company-facts"
      }
    ]
  },
  EXE: {
    name: "Expand Energy \u80FD\u6E90",
    industry: "\u5929\u7136\u6C14\u80FD\u6E90",
    summary: "\u7ECF\u8425\u5929\u7136\u6C14\u751F\u4EA7\u4E1A\u52A1\uFF0C\u4E3B\u8981\u8FD0\u8425\u533A\u57DF\u5305\u62EC\u963F\u5DF4\u62C9\u5951\u4E9A\u548C\u6D77\u6069\u65AF\u7EF4\u5C14\uFF0C\u5E76\u53D1\u5C55\u5929\u7136\u6C14\u4F9B\u5E94\u4E0E\u5E02\u573A\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.expandenergy.com/"
      }
    ]
  },
  FAST: {
    name: "\u6CD5\u601D\u8BFA",
    industry: "\u5DE5\u4E1A\u7528\u54C1\u4F9B\u5E94",
    summary: "\u5411\u4F01\u4E1A\u4F9B\u5E94\u5DE5\u4E1A\u7528\u54C1\uFF0C\u5E76\u63D0\u4F9B\u5E93\u5B58\u3001\u7269\u6D41\u548C\u4F9B\u5E94\u94FE\u7BA1\u7406\u670D\u52A1\uFF0C\u5E2E\u52A9\u5BA2\u6237\u7EF4\u6301\u65E5\u5E38\u751F\u4EA7\u53CA\u8BBE\u5907\u7EF4\u62A4\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.fastenal.com/fast/about-us"
      }
    ]
  },
  FE: {
    name: "\u7B2C\u4E00\u80FD\u6E90",
    industry: "\u7535\u529B\u516C\u7528\u4E8B\u4E1A",
    summary: "\u901A\u8FC7\u65D7\u4E0B\u7535\u529B\u516C\u53F8\u7ECF\u8425\u8F93\u914D\u7535\u7F51\u7EDC\uFF0C\u4E3A\u5BB6\u5EAD\u548C\u4F01\u4E1A\u63D0\u4F9B\u7535\u529B\u8F93\u9001\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.firstenergycorp.com/fehome.html"
      }
    ]
  },
  FISV: {
    name: "\u8D39\u54F2\u91D1\u878D\u670D\u52A1",
    industry: "\u91D1\u878D\u79D1\u6280\u4E0E\u652F\u4ED8",
    summary: "\u4E3A\u91D1\u878D\u673A\u6784\u548C\u5546\u6237\u63D0\u4F9B\u652F\u4ED8\u5904\u7406\u3001\u94F6\u884C\u6280\u672F\u53CA\u5546\u4E1A\u7BA1\u7406\u5DE5\u5177\uFF0C\u652F\u6301\u6536\u6B3E\u548C\u91D1\u878D\u4E1A\u52A1\u6570\u5B57\u5316\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.fiserv.com/"
      }
    ]
  },
  KMI: {
    name: "\u91D1\u5FB7\u6469\u6839",
    industry: "\u80FD\u6E90\u7BA1\u9053\u4E0E\u50A8\u8FD0",
    summary: "\u7ECF\u8425\u5929\u7136\u6C14\u53CA\u5176\u4ED6\u80FD\u6E90\u4EA7\u54C1\u7684\u7BA1\u9053\u548C\u50A8\u8FD0\u8BBE\u65BD\uFF0C\u4E3A\u5BA2\u6237\u63D0\u4F9B\u8FD0\u8F93\u3001\u50A8\u5B58\u53CA\u88C5\u5378\u7B49\u57FA\u7840\u8BBE\u65BD\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://ir.kindermorgan.com/home/"
      }
    ]
  },
  L: {
    name: "Loews \u6D1B\u65AF\u96C6\u56E2",
    industry: "\u591A\u5143\u5316\u63A7\u80A1",
    summary: "\u901A\u8FC7\u65D7\u4E0B\u4F01\u4E1A\u7ECF\u8425\u4FDD\u9669\u3001\u80FD\u6E90\u7BA1\u9053\u3001\u9152\u5E97\u53CA\u5305\u88C5\u4E1A\u52A1\uFF0C\u4EE5\u63A7\u80A1\u516C\u53F8\u7684\u65B9\u5F0F\u53C2\u4E0E\u591A\u4E2A\u884C\u4E1A\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.loews.com/"
      }
    ]
  },
  LIN: {
    name: "\u6797\u5FB7",
    industry: "\u5DE5\u4E1A\u6C14\u4F53\u4E0E\u5DE5\u7A0B",
    summary: "\u4F9B\u5E94\u5DE5\u4E1A\u548C\u533B\u7597\u7B49\u9886\u57DF\u4F7F\u7528\u7684\u6C14\u4F53\uFF0C\u5E76\u63D0\u4F9B\u6C14\u4F53\u5904\u7406\u76F8\u5173\u5DE5\u7A0B\u4E0E\u6280\u672F\uFF0C\u670D\u52A1\u5236\u9020\u3001\u533B\u7597\u548C\u7535\u5B50\u7B49\u884C\u4E1A\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.linde.com/"
      }
    ]
  },
  MCD: {
    name: "\u9EA6\u5F53\u52B3",
    industry: "\u8FDE\u9501\u9910\u996E",
    summary: "\u7ECF\u8425\u5168\u7403\u5FEB\u9910\u54C1\u724C\uFF0C\u901A\u8FC7\u76F4\u8425\u548C\u7279\u8BB8\u7ECF\u8425\u9910\u5385\u5411\u6D88\u8D39\u8005\u63D0\u4F9B\u9910\u996E\uFF0C\u5E76\u5411\u52A0\u76DF\u4F53\u7CFB\u63D0\u4F9B\u54C1\u724C\u53CA\u8FD0\u8425\u652F\u6301\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://corporate.mcdonalds.com/corpmcd/home.html"
      }
    ]
  },
  MSCI: {
    name: "\u660E\u665F",
    industry: "\u6295\u8D44\u6570\u636E\u4E0E\u6307\u6570",
    summary: "\u5411\u6295\u8D44\u673A\u6784\u63D0\u4F9B\u6307\u6570\u3001\u6295\u8D44\u7EC4\u5408\u5206\u6790\u53CA\u7814\u7A76\u6570\u636E\u5DE5\u5177\uFF0C\u5E2E\u52A9\u5BA2\u6237\u6BD4\u8F83\u5E02\u573A\u8868\u73B0\u548C\u8BC4\u4F30\u6295\u8D44\u98CE\u9669\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.msci.com/"
      }
    ]
  },
  NFLX: {
    name: "\u5948\u98DE",
    industry: "\u6D41\u5A92\u4F53\u5A31\u4E50",
    summary: "\u5411\u7528\u6237\u63D0\u4F9B\u5F71\u89C6\u53CA\u5176\u4ED6\u5A31\u4E50\u5185\u5BB9\uFF0C\u901A\u8FC7\u5728\u7EBF\u5E73\u53F0\u5206\u53D1\u5267\u96C6\u3001\u7535\u5F71\u7B49\u4F5C\u54C1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://about.netflix.com/en"
      }
    ]
  },
  NI: {
    name: "NiSource \u80FD\u6E90",
    industry: "\u5929\u7136\u6C14\u4E0E\u7535\u529B",
    summary: "\u901A\u8FC7\u65D7\u4E0B\u516C\u7528\u4E8B\u4E1A\u63D0\u4F9B\u5929\u7136\u6C14\u548C\u7535\u529B\u670D\u52A1\uFF0C\u7ECF\u8425\u652F\u6301\u793E\u533A\u53CA\u4F01\u4E1A\u7528\u80FD\u7684\u57FA\u7840\u8BBE\u65BD\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.nisource.com/"
      }
    ]
  },
  OTIS: {
    name: "\u5965\u7684\u65AF",
    industry: "\u7535\u68AF\u4E0E\u81EA\u52A8\u6276\u68AF",
    summary: "\u8BBE\u8BA1\u3001\u5236\u9020\u548C\u5B89\u88C5\u7535\u68AF\u3001\u81EA\u52A8\u6276\u68AF\u53CA\u81EA\u52A8\u4EBA\u884C\u9053\uFF0C\u5E76\u4E3A\u65E2\u6709\u8BBE\u5907\u63D0\u4F9B\u7EF4\u62A4\u548C\u66F4\u65B0\u6539\u9020\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.otis.com/en/us/"
      }
    ]
  },
  PEP: {
    name: "\u767E\u4E8B\u516C\u53F8",
    industry: "\u98DF\u54C1\u4E0E\u996E\u6599",
    summary: "\u7ECF\u8425\u996E\u6599\u548C\u4F11\u95F2\u98DF\u54C1\u4E1A\u52A1\uFF0C\u65D7\u4E0B\u4EA7\u54C1\u6DB5\u76D6\u767E\u4E8B\u996E\u6599\u3001\u4E50\u4E8B\u85AF\u7247\u548C\u6842\u683C\u98DF\u54C1\u7B49\u6D88\u8D39\u54C1\u724C\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.pepsico.com/"
      }
    ]
  },
  REG: {
    name: "Regency \u5546\u4E1A\u5730\u4EA7",
    industry: "\u8D2D\u7269\u4E2D\u5FC3\u5730\u4EA7",
    summary: "\u6301\u6709\u3001\u8FD0\u8425\u548C\u5F00\u53D1\u8D2D\u7269\u4E2D\u5FC3\uFF0C\u8BB8\u591A\u7269\u4E1A\u4EE5\u8D85\u5E02\u4E3A\u6838\u5FC3\u79DF\u6237\uFF0C\u9762\u5411\u5468\u8FB9\u793E\u533A\u63D0\u4F9B\u8D2D\u7269\u548C\u751F\u6D3B\u670D\u52A1\u7A7A\u95F4\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.regencycenters.com/"
      }
    ]
  },
  SBAC: {
    name: "SBA \u901A\u4FE1",
    industry: "\u901A\u4FE1\u57FA\u7840\u8BBE\u65BD",
    summary: "\u5EFA\u8BBE\u3001\u6301\u6709\u548C\u51FA\u79DF\u901A\u4FE1\u94C1\u5854\u53CA\u7AD9\u70B9\uFF0C\u5E76\u63D0\u4F9B\u7AD9\u70B9\u5F00\u53D1\u3001\u65BD\u5DE5\u3001\u7EF4\u62A4\u548C\u8FD0\u8425\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.sbasite.com/"
      }
    ]
  },
  VICI: {
    name: "VICI \u5730\u4EA7",
    industry: "\u4F53\u9A8C\u5F0F\u5546\u4E1A\u5730\u4EA7",
    summary: "\u6301\u6709\u535A\u5F69\u3001\u9152\u5E97\u3001\u5A31\u4E50\u548C\u4F11\u95F2\u7C7B\u7269\u4E1A\uFF0C\u5E76\u901A\u8FC7\u957F\u671F\u79DF\u8D41\u5411\u8FD0\u8425\u5546\u63D0\u4F9B\u7ECF\u8425\u573A\u6240\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://viciproperties.com/about-us/"
      }
    ]
  },
  WM: {
    name: "\u7F8E\u56FD\u5E9F\u7269\u7BA1\u7406",
    industry: "\u73AF\u5883\u4E0E\u5E9F\u7269\u5904\u7406",
    summary: "\u63D0\u4F9B\u5783\u573E\u6536\u8FD0\u3001\u8F6C\u8FD0\u3001\u56DE\u6536\u53CA\u5904\u7F6E\u670D\u52A1\uFF0C\u540C\u65F6\u7ECF\u8425\u586B\u57CB\u6C14\u80FD\u6E90\u9879\u76EE\u548C\u7279\u6B8A\u5E9F\u7269\u5904\u7406\u7B49\u4E1A\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/wm/company/"
      }
    ]
  },
  WMB: {
    name: "\u5A01\u5EC9\u59C6\u65AF\u516C\u53F8",
    industry: "\u5929\u7136\u6C14\u57FA\u7840\u8BBE\u65BD",
    summary: "\u7ECF\u8425\u5929\u7136\u6C14\u76F8\u5173\u57FA\u7840\u8BBE\u65BD\uFF0C\u4E3A\u80FD\u6E90\u5BA2\u6237\u63D0\u4F9B\u5929\u7136\u6C14\u96C6\u8F93\u3001\u5904\u7406\u548C\u8FD0\u8F93\u670D\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.williams.com/"
      }
    ]
  },
  ZBH: {
    name: "\u6377\u8FC8\u90A6\u7F8E",
    industry: "\u9AA8\u79D1\u533B\u7597\u5668\u68B0",
    summary: "\u63D0\u4F9B\u9AA8\u79D1\u76F8\u5173\u533B\u7597\u5668\u68B0\u548C\u6280\u672F\uFF0C\u5305\u62EC\u5173\u8282\u7F6E\u6362\u53CA\u914D\u5957\u624B\u672F\u89E3\u51B3\u65B9\u6848\uFF0C\u670D\u52A1\u533B\u751F\u548C\u533B\u7597\u673A\u6784\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.zimmerbiomet.com/en"
      }
    ]
  },
  ZTS: {
    name: "\u7855\u817E",
    industry: "\u52A8\u7269\u4FDD\u5065",
    summary: "\u4E3A\u5BA0\u7269\u548C\u517B\u6B96\u52A8\u7269\u7814\u53D1\u5E76\u63D0\u4F9B\u836F\u54C1\u3001\u75AB\u82D7\u53CA\u8BCA\u65AD\u7B49\u4EA7\u54C1\uFF0C\u670D\u52A1\u517D\u533B\u548C\u52A8\u7269\u517B\u6B96\u5BA2\u6237\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u4E1A\u52A1\u8D44\u6599",
        url: "https://www.zoetis.com/"
      }
    ]
  },
  GOOGL: {
    name: "Alphabet \u8C37\u6B4C\u6BCD\u516C\u53F8 C\u7C7B\uFF08A\u7C7B\u80A1\uFF09",
    industry: "\u4E92\u8054\u7F51\u4E0E\u4E91\u8BA1\u7B97",
    summary: "\u65D7\u4E0B\u8C37\u6B4C\u63D0\u4F9B\u641C\u7D22\u3001YouTube\u3001Android \u7B49\u4EA7\u54C1\uFF0C\u5E76\u7ECF\u8425\u6570\u5B57\u5E7F\u544A\u3001Google Cloud \u4E91\u670D\u52A1\u53CA\u5176\u4ED6\u6280\u672F\u4E1A\u52A1\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "Stock Analysis \u516C\u53F8\u8D44\u6599",
        url: "https://stockanalysis.com/stocks/goog/company/"
      }
    ]
  },
  "BF-B": {
    name: "\u767E\u5BCC\u95E8",
    industry: "\u6D88\u8D39\u54C1 \xB7 \u70C8\u9152",
    summary: "\u767E\u5BCC\u95E8\uFF08Brown-Forman\uFF09\u751F\u4EA7\u3001\u8425\u9500\u548C\u9500\u552E\u70C8\u9152\uFF0C\u4E1A\u52A1\u91CD\u70B9\u5305\u62EC\u7F8E\u56FD\u5A01\u58EB\u5FCC\u53CA\u9AD8\u7AEF\u70C8\u9152\u54C1\u724C\u3002",
    checkedAt: "2026-09-17",
    sources: [
      {
        label: "\u516C\u53F8\u5B98\u7F51 \xB7 \u5173\u4E8E\u6211\u4EEC",
        url: "https://www.brown-forman.com/about-us"
      }
    ]
  }
};

// company-intro.mjs
var esc2 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var companyProfile = (row, market2) => market2.toUpperCase() === "US" ? us_company_profiles_default[row.code] : null;
function companyIntro(row, market2) {
  if (market2.toUpperCase() !== "US") return "";
  const p = companyProfile(row, market2);
  if (!p) return '<section class="company-intro company-intro-pending"><p>\u8FD9\u5BB6\u516C\u53F8\u7684\u4E2D\u6587\u4E1A\u52A1\u7B80\u4ECB\u5F85\u8865\u5145\u3002</p></section>';
  return `<section class="company-intro" aria-label="${esc2(p.name)}\u516C\u53F8\u7B80\u4ECB"><span class="company-industry">${esc2(p.industry)}</span><p>${esc2(p.summary)}</p><details class="company-sources"><summary>\u7B80\u4ECB\u6765\u6E90 \xB7 ${esc2(p.checkedAt)}\u6838\u5BF9</summary><p>\u6309\u516C\u5F00\u516C\u53F8\u8D44\u6599\u6574\u7406\u7684\u4E1A\u52A1\u4ECB\u7ECD\uFF1B\u6838\u5BF9\u65E5\u671F\u72EC\u7ACB\u4E8E\u884C\u60C5\u622A\u6B62\u65E5\u3002</p>${p.sources.map((source) => `<a href="${esc2(source.url)}" target="_blank" rel="noopener noreferrer">${esc2(source.label)}</a>`).join(" \xB7 ")}</details></section>`;
}

// candidate-order.mjs
function createCandidateOrder(random = Math.random) {
  const orders = /* @__PURE__ */ new Map();
  return (rows, key) => {
    const previous = orders.get(key) || [];
    const codes = new Set(rows.map((row) => row.code));
    const retained = previous.filter((code) => codes.has(code));
    const known = new Set(retained);
    const added = [...codes].filter((code) => !known.has(code));
    for (let i = added.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [added[i], added[j]] = [added[j], added[i]];
    }
    const order = [...retained, ...added];
    orders.set(key, order);
    const current = new Map(rows.map((row) => [row.code, row]));
    return order.map((code) => current.get(code));
  };
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

// exit-mode.js
var esc3 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var names = { cn: "A\u80A1", us: "\u7F8E\u80A1", hk: "\u6E2F\u80A1", fund: "\u57FA\u91D1" };
var pct2 = (n) => Number.isFinite(n) ? (n >= 0 ? "+" : "") + (n * 100).toFixed(2) + "%" : "\u2014";
var mysteryMark = '<img class="mystery-mark" src="/mystery-mark.svg" width="64" height="80" alt="?" draggable="false">';
var num = (n) => Number(n).toLocaleString("zh-CN", { maximumFractionDigits: 3 });
function initExitMode(onChange) {
  const orderCandidates2 = createCandidateOrder();
  const nav = document.querySelector(".market-navigation");
  nav.insertAdjacentHTML("afterend", `<section class="decision-mode" aria-label="\u7814\u7A76\u6A21\u5F0F"><div class="decision-caption"><h2 class="decision-title" id="decisionTitle" tabindex="-1"><span class="decision-kicker">\u7559\u610F</span><span>\u8FD9\u4E9B\u80A1\u7968\u6216\u57FA\u91D1</span><span class="decision-emphasis">\u673A\u4F1A\u6B63\u5728\u6D6E\u73B0</span></h2><p id="decisionHint" role="status" hidden></p></div><div class="decision-switch" role="group" aria-label="\u5207\u6362\u7814\u7A76\u6A21\u5F0F"><i aria-hidden="true"></i><div class="decision-label"><span id="decisionLabel">${mysteryMark}</span><small id="decisionLabelEnglish" hidden>DISCOVER</small></div><button type="button" data-decision="exit" aria-pressed="false" aria-label="\u67E5\u770B\u5356\u51FA\u5019\u9009\uFF08\u9700\u8981\u767B\u5F55\uFF09"><span class="portal-aura" aria-hidden="true"></span><span class="portal-art" aria-hidden="true"><img class="portal-mark portal-closed" src="/stone-portal.png" width="142" height="164" alt="" draggable="false"><img class="portal-mark portal-open" src="/stone-portal-open.png" width="142" height="164" alt="" draggable="false"></span></button></div></section>
 <section class="exit-workspace" id="exit-workspace" hidden aria-labelledby="exitTitle"><header class="exit-heading"><div><h2 id="exitTitle">A\u80A1</h2><p>\u67E5\u770B\u51FA\u73B0\u9000\u51FA\u4FE1\u53F7\u7684\u80A1\u7968\u548C\u57FA\u91D1\uFF0C\u8F85\u52A9\u5224\u65AD\u51CF\u4ED3\u4E0E\u79BB\u573A\u65F6\u673A\u3002</p></div><a id="exitHoldingsLink" href="/portfolio?market=cn">\u7BA1\u7406\u6211\u7684\u6301\u4ED3</a></header><div class="exit-toolbar"><div class="exit-scope" role="group" aria-label="\u68C0\u67E5\u8303\u56F4"><button data-exit-scope="market" aria-pressed="true">\u5E02\u573A\u89C2\u5BDF\u6C60</button><button data-exit-scope="holdings" aria-pressed="false">\u6211\u7684\u6301\u4ED3</button></div><label><span id="exitSearchLabel">\u641C\u7D22\u80A1\u7968</span><input id="exitSearch" type="search" placeholder="\u540D\u79F0\u6216\u4EE3\u7801" autocomplete="off"></label></div><p id="exitMeta" class="exit-meta" role="status"></p><div id="exitStats" class="exit-stats"></div><div id="exitRules" class="exit-rules"></div><div id="exitCards" class="exit-grid"></div><button id="exitMore" hidden>\u67E5\u770B\u66F4\u591A</button><p class="exit-footnote" id="exitFootnote">\u5E02\u573A\u5019\u9009\u6BCF\u6B21\u6253\u5F00\u968F\u673A\u5C55\u793A\uFF0C\u987A\u5E8F\u4E0D\u4EE3\u8868\u5356\u51FA\u4F18\u5148\u7EA7\u3002\u53EA\u5C55\u793A\u540C\u65F6\u7B26\u5408 R01 \u4E0E\u5411\u4E0B R02 \u7684\u5356\u51FA\u5019\u9009\uFF0C\u4F7F\u7528\u6700\u8FD130\u81EA\u7136\u65E5\u7684\u884C\u60C5\u89C2\u5BDF\u671F\u3002\u5019\u9009\u4E0D\u7B49\u4E8E\u5FC5\u987B\u5356\u51FA\uFF1B\u672A\u5165\u9009\u4E5F\u4E0D\u4EE3\u8868\u53EF\u4EE5\u653E\u5FC3\u6301\u6709\u3002\u89C4\u5219\u5C1A\u672A\u5B8C\u6210\u6536\u76CA\u56DE\u6D4B\uFF0C\u4E0D\u81EA\u52A8\u6267\u884C\u4EA4\u6613\u3002</p></section>`);
  document.body.insertAdjacentHTML("beforeend", `<dialog id="exitTransition" aria-labelledby="exitQuote"><span class="transition-brand">\u65F6\u5E8F <small>SHIXU</small></span><div class="exit-quote" id="exitQuote"><span>\u6295\u8D44\u7684\u8FDC\u89C1</span><span>\u4E0D\u6B62\u4E8E\u53D1\u73B0\u4EF7\u503C</span><strong>\u66F4\u5728\u4E8E\u8FDB\u9000\u6709\u636E</strong></div><div class="transition-bottom"><span>KNOW WHEN TO EXIT</span><button id="skipExitTransition" type="button" disabled aria-hidden="true">\u770B\u89C1\u53E6\u4E00\u9762</button></div></dialog>`);
  const $2 = (id) => document.getElementById(id), dialog = $2("exitTransition"), reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const openGate = document.querySelector(".portal-open");
  openGate.decode().then(() => openGate.parentElement.classList.add("open-ready")).catch(() => {
  });
  const requestedExit = new URL(location.href).searchParams.get("view") === "exit";
  let active = false, market2 = "cn", data2 = null, scope = "market", limit2 = 9, version = 0, busy = false, skip = null, animations = [];
  const loginURL2 = () => "/login?return_to=" + encodeURIComponent("/?market=" + market2 + "&view=exit");
  function paint() {
    document.querySelector(".decision-caption").classList.remove("has-error", "has-invitation");
    $2("decisionHint").hidden = true;
    $2("decisionHint").textContent = "";
    document.body.classList.toggle("exit-mode", active);
    $2("exit-workspace").hidden = !active;
    document.querySelector(".decision-switch").classList.toggle("is-exit", active);
    document.querySelector("[data-decision=exit]").setAttribute("aria-pressed", String(active));
    $2("decisionLabel").innerHTML = active ? "\u5BFB\u627E\u673A\u4F1A" : mysteryMark;
    $2("decisionLabelEnglish").hidden = !active;
    document.querySelector("[data-decision=exit]").setAttribute("aria-label", active ? "\u8FD4\u56DE\u5BFB\u627E\u673A\u4F1A" : "\u67E5\u770B\u5356\u51FA\u5019\u9009\uFF08\u9700\u8981\u767B\u5F55\uFF09");
    $2("decisionTitle").innerHTML = active ? '<span class="decision-kicker">\u9192\u9192</span><span>\u6301\u6709\u8FD9\u4E9B\u80A1\u7968\u6216\u57FA\u91D1</span><span class="decision-emphasis">\u8BE5\u51C6\u5907\u9000\u51FA\u4E86</span>' : '<span class="decision-kicker">\u7559\u610F</span><span>\u8FD9\u4E9B\u80A1\u7968\u6216\u57FA\u91D1</span><span class="decision-emphasis">\u673A\u4F1A\u6B63\u5728\u6D6E\u73B0</span>';
    document.getElementById("marketWorkspaces").hidden = active;
    document.dispatchEvent(new CustomEvent("shixu:mode", { detail: { exit: active } }));
  }
  function persist() {
    const u = new URL(location.href);
    if (active) u.searchParams.set("view", "exit");
    else u.searchParams.delete("view");
    u.hash = "";
    history.replaceState(null, "", u);
  }
  function scrollToWorkspace() {
    const y = document.querySelector(".market-navigation").getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(document.body).getPropertyValue("--live-header-h") || "132") - 14;
    window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
    document.dispatchEvent(new Event("shixu:scroll-reset"));
  }
  const pause = (ms) => new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    skip = () => {
      clearTimeout(timer);
      resolve();
    };
  });
  async function change(next, trigger = null) {
    if (busy || next === active) return;
    busy = true;
    skip = null;
    const action = $2("skipExitTransition");
    action.disabled = true;
    action.setAttribute("aria-hidden", "true");
    let guestReturn = false;
    const returning = !next;
    const buttons = [...document.querySelectorAll("[data-decision]")];
    buttons.forEach((b) => b.disabled = true);
    document.querySelector(".decision-caption").classList.remove("has-error", "has-invitation");
    try {
      dialog.classList.toggle("is-returning", returning);
      if (returning) {
        dialog.removeAttribute("aria-labelledby");
        dialog.setAttribute("aria-label", "\u8FD4\u56DE\u5BFB\u627E\u673A\u4F1A");
        dialog.showModal();
        if (!reduced.matches) {
          const cover = dialog.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: "ease-out", fill: "forwards" });
          animations.push(cover);
          await cover.finished;
        }
      } else {
        dialog.removeAttribute("aria-label");
        dialog.setAttribute("aria-labelledby", "exitQuote");
      }
      if (next) {
        const sessionPromise = fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(1e4) }).then((r) => r.ok ? r.json() : null).catch(() => null);
        const bounds = document.querySelector("[data-decision=exit]").getBoundingClientRect();
        const cx = bounds.left + bounds.width / 2, cy = bounds.top + bounds.height / 2, radius = Math.hypot(innerWidth, innerHeight);
        $2("exitQuote").hidden = false;
        $2("skipExitTransition").textContent = "\u770B\u89C1\u53E6\u4E00\u9762";
        dialog.showModal();
        const quoteAnimations = [];
        if (!reduced.matches) {
          animations.push(dialog.animate([{ clipPath: "circle(0px at " + cx + "px " + cy + "px)" }, { clipPath: "circle(" + radius + "px at " + cx + "px " + cy + "px)" }], { duration: 650, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" }));
          [...dialog.querySelectorAll(".exit-quote>*")].forEach((el, i) => quoteAnimations.push(el.animate([{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 1100, delay: [600, 1950, 3700][i], easing: "cubic-bezier(.22,1,.36,1)", fill: "both" })));
        }
        animations.push(...quoteAnimations);
        if (reduced.matches) await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        else await Promise.all(quoteAnimations.map((animation) => animation.finished));
        action.removeAttribute("aria-hidden");
        action.disabled = false;
        if (!reduced.matches) animations.push(action.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: "ease-out", fill: "both" }));
        await pause(reduced.matches ? 3800 : 2800);
        const session = await sessionPromise;
        guestReturn = session?.authenticated === false;
        if (!session?.authenticated) next = false;
      }
      active = next;
      paint();
      persist();
      onChange();
      scrollToWorkspace();
      if (dialog.open && !reduced.matches) {
        if (returning) {
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          await dialog.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1100, easing: "ease-in-out", fill: "forwards" }).finished;
        } else {
          await dialog.animate([{ transform: "translateY(0)", borderRadius: "0" }, { transform: "translateY(-105%)", borderRadius: "0 0 48px 48px" }], { duration: 820, easing: "cubic-bezier(.76,0,.24,1)", fill: "forwards" }).finished;
        }
      }
    } catch {
      $2("decisionHint").hidden = false;
      $2("decisionHint").textContent = "\u6682\u65F6\u65E0\u6CD5\u9A8C\u8BC1\u767B\u5F55\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002";
      document.querySelector(".decision-caption").classList.add("has-error");
    } finally {
      skip = null;
      action.disabled = true;
      action.setAttribute("aria-hidden", "true");
      animations.forEach((a) => a.cancel());
      animations = [];
      if (dialog.open) dialog.close();
      dialog.getAnimations().forEach((a) => a.cancel());
      buttons.forEach((b) => b.disabled = false);
      busy = false;
      if (active) $2("decisionTitle").focus({ preventScroll: true });
      else (trigger || document.querySelector('[data-decision="exit"]')).focus({ preventScroll: true });
      if (guestReturn && !active) {
        $2("decisionHint").hidden = false;
        $2("decisionHint").innerHTML = '<a href="' + loginURL2() + '">\u767B\u5F55\u65F6\u5E8F\uFF0C\u770B\u89C1\u6295\u8D44\u7684\u53E6\u4E00\u9762\u3002</a>';
        document.querySelector(".decision-caption").classList.add("has-invitation");
        if (!reduced.matches) $2("decisionHint").animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 800, easing: "cubic-bezier(.22,1,.36,1)" });
      }
    }
  }
  $2("skipExitTransition").onclick = () => {
    if (!$2("skipExitTransition").disabled) skip?.();
  };
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    if (!$2("skipExitTransition").disabled) skip?.();
  });
  const gateButton = document.querySelector("[data-decision=exit]");
  gateButton.onclick = () => change(!active, gateButton);
  const holdings = () => {
    try {
      const raw = JSON.parse(localStorage.getItem("shixu-holdings-v1") || "{}");
      return Array.isArray(raw[market2]?.rows) ? raw[market2].rows.filter((r) => typeof r.code === "string" && r.value > 0) : [];
    } catch {
      return [];
    }
  };
  function plot(row) {
    if (!data2.authenticated || !row.points?.length) return "";
    const p = row.points, values = p.map((p2) => p2[1]), lo = Math.min(...values, row.box?.lower ?? Infinity), hi = Math.max(...values, row.box?.upper ?? -Infinity), span = Math.max(hi - lo, 0.01), x = (i) => 10 + i / Math.max(1, p.length - 1) * 340, y = (v) => 108 - (v - lo) / span * 88;
    const lines = row.box ? `<rect x="10" y="${y(row.box.upper)}" width="340" height="${Math.max(1, y(row.box.lower) - y(row.box.upper))}" fill="#edac7220"/><path d="M10 ${y(row.box.upper)}H350 M10 ${y(row.box.lower)}H350" stroke="#eeb47f" stroke-dasharray="4 5"/>` : "";
    return `<figure class="exit-chart"><svg viewBox="0 0 360 128" role="img" aria-label="${esc3(row.name)}\u8C03\u6574\u6536\u76D8\u8D70\u52BF\u4E0E\u539F\u56FA\u5B9A\u533A\u95F4"><title>${esc3(p[0][0])} \u81F3 ${esc3(p.at(-1)[0])}\uFF0C\u865A\u7EBF\u4E3A\u539F\u533A\u95F4\u4E0A\u4E0B\u6CBF</title>${lines}<polyline points="${values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}" fill="none" stroke="#e8eee5" stroke-width="2.2"/><circle cx="350" cy="${y(values.at(-1))}" r="3" fill="#f1b57b"/></svg><figcaption><span>${esc3(p[0][0])}</span><span>${esc3(p.at(-1)[0])}</span></figcaption></figure>`;
  }
  function card(r) {
    const profile = companyProfile(r, market2), displayName = profile?.name || r.name;
    const signals = r.signals || [], triggered = signals.length > 0, title = r.status === "unknown" ? "\u6570\u636E\u5F85\u6838\u5B9E" : triggered ? "\u7B26\u5408\u5356\u51FA\u7B5B\u9009" : "\u672A\u540C\u65F6\u7B26\u5408\u4E24\u6761\u89C4\u5219";
    return `<article class="exit-card ${triggered ? "is-triggered" : ""}"><header><div><span>${esc3(r.code)} \xB7 ${names[market2]}</span><h2>${esc3(displayName)}</h2>${profile ? `<p class="company-english">${esc3(r.name)}</p>` : ""}</div><span class="exit-state">${title}</span></header>${companyIntro(r, market2)}<div class="exit-return"><b>${pct2(r.change)}</b><span>\u8FD130\u65E5\u533A\u95F4\u6DA8\u8DCC \xB7 \u975E\u6301\u4ED3\u76C8\u4E8F</span></div>${signals.length ? `<div class="exit-signals">${signals.map((s) => `<span>${esc3(s.id)}${data2.authenticated ? " \xB7 " + esc3(data2.rules.find((r2) => r2.id === s.id)?.name || "") : ""}<small>${esc3(s.date)} \u89E6\u53D1</small></span>`).join("")}</div>` : ""}${plot(r)}${r.status === "unknown" ? `<p>${esc3(r.reason || "\u672A\u8986\u76D6\u6B64\u80A1\u7968\uFF0C\u6682\u4E0D\u80FD\u5224\u65AD\u3002")}</p>` : data2.authenticated ? `<details><summary>\u67E5\u770B\u5224\u65AD\u4F9D\u636E</summary><p>${esc3(r.explanation)}</p>${r.box ? `<p>\u539F\u4E0A\u6CBF ${num(r.box.upper)} \xB7 \u539F\u4E0B\u6CBF ${num(r.box.lower)}<br>\u6700\u65B0\u89C2\u5BDF\u503C ${num(r.latest)} \xB7 ${esc3(data2.priceBasis)}<br>\u4EE5\u4E0A\u4E3A\u540C\u4E00\u8C03\u6574\u53E3\u5F84\uFF0C\u4E0D\u662F\u5B9E\u65F6\u59D4\u6258\u4EF7\u3002</p>` : ""}<p>\u4E24\u6761\u89C4\u5219\u5FC5\u987B\u540C\u65F6\u6EE1\u8DB3\u3002</p></details>` : `<p><a href="${loginURL2()}">\u767B\u5F55\u67E5\u770B\u6761\u4EF6\u3001\u5173\u952E\u4F4D\u7F6E\u4E0E\u8D70\u52BF\u56FE</a></p>`}<footer>${researchButtons({ market: market2, code: r.code, name: displayName })}<a href="${market2 === "fund" ? "/compare?code=" + encodeURIComponent(r.code) : "/stock-peers?market=" + market2 + "&code=" + encodeURIComponent(r.code)}">\u540C\u677F\u5757\u5BF9\u6BD4</a></footer></article>`;
  }
  function render2() {
    if (!data2) return;
    const triggered = data2.rows.filter((r) => r.signals.length), q = $2("exitSearch").value.trim().toLowerCase(), owned = holdings();
    let rows = scope === "holdings" ? owned.map((r) => data2.rows.find((s) => s.code === r.code) || { code: r.code, name: r.name, status: "unknown", signals: [], reason: "\u4E0D\u5728\u5F53\u524D\u884C\u60C5\u89C2\u5BDF\u6C60\u4E2D\uFF0C\u6682\u4E0D\u80FD\u68C0\u67E5\u9000\u51FA\u6761\u4EF6\u3002" }) : triggered;
    rows = rows.filter((r) => !q || [r.code, r.name, companyProfile(r, market2)?.name].join(" ").toLowerCase().includes(q));
    $2("exitMeta").textContent = `${market2 === "fund" ? "\u51C0\u503C" : "\u884C\u60C5"}\u622A\u6B62 ${data2.asof} \xB7 ${data2.total}\u53EA\u89C2\u5BDF\u6C60 \xB7 ${data2.evaluated}\u53EA\u5B8C\u6210\u5224\u65AD \xB7 ${data2.unknown}\u53EA\u5F85\u6838\u5B9E \xB7 ${scope === "holdings" ? owned.length + "\u53EA\u672C\u5730\u6301\u4ED3 / " : ""}\u975E\u5B9E\u65F6\u884C\u60C5 \xB7 \u53EF\u7528\u5386\u53F2 ${data2.historyStart} \u8D77`;
    $2("exitStats").innerHTML = `<div><span>\u540C\u65F6\u7B26\u5408\u4E24\u6761</span><b>${data2.matched}<small>\u53EA</small></b></div><div><span>\u5F85\u6838\u5B9E</span><b>${data2.unknown}<small>\u53EA</small></b></div><div><span>\u89C2\u5BDF\u671F\u95F4</span><b>30<small>\u81EA\u7136\u65E5</small></b></div>`;
    $2("exitRules").innerHTML = data2.rules.map((r) => `<span>${esc3(r.id)}${r.description ? " \xB7 " + esc3(r.description) : ""}</span>`).join("") + (data2.authenticated ? "" : `<a href="${loginURL2()}">\u767B\u5F55\u67E5\u770B\u5B8C\u6574\u89C4\u5219</a>`);
    $2("exitCards").innerHTML = rows.length ? rows.slice(0, limit2).map(card).join("") : `<div class="exit-empty"><h2>${q ? "\u6CA1\u6709\u5339\u914D\u7684\u4EA7\u54C1" : scope === "holdings" ? "\u8FD8\u6CA1\u6709\u5F55\u5165\u8FD9\u4E2A\u5E02\u573A\u7684\u6301\u4ED3" : "\u6CA1\u6709\u540C\u65F6\u7B26\u5408\u4E24\u6761\u89C4\u5219\u7684\u5019\u9009"}</h2><p>${q ? "\u6362\u4E00\u4E2A\u540D\u79F0\u6216\u4EE3\u7801\u8BD5\u8BD5\u3002" : scope === "holdings" ? "\u5F55\u5165\u6301\u4ED3\u540E\uFF0C\u53EF\u4EE5\u5728\u8FD9\u91CC\u4E00\u8D77\u68C0\u67E5\u5DF2\u7B26\u5408\u3001\u672A\u7B26\u5408\u548C\u8D44\u6599\u4E0D\u8DB3\u7684\u4EA7\u54C1\u3002" : "\u672C\u89C2\u5BDF\u6C60\u5F53\u524D\u6CA1\u6709\u540C\u65F6\u7B26\u5408 R01 \u4E0E\u5411\u4E0B R02 \u7684\u5356\u51FA\u5019\u9009\u3002\u6570\u636E\u4E0D\u8DB3\u7684\u4EA7\u54C1\u4E0D\u53C2\u4E0E\u5339\u914D\u3002"}</p>${scope === "holdings" && !q ? `<a href="/portfolio?market=${market2}">\u5F55\u5165\u6211\u7684\u6301\u4ED3</a>` : ""}</div>`;
    $2("exitMore").hidden = rows.length <= limit2;
    $2("exitMore").textContent = `\u518D\u770B ${Math.min(9, rows.length - limit2)} \u53EA`;
    document.querySelectorAll(".hd-login").forEach((a) => {
      a.textContent = data2.authenticated ? "\u8D26\u53F7" : "\u767B\u5F55";
      a.href = loginURL2();
    });
  }
  async function load2() {
    const id = ++version, selected = market2;
    data2 = null;
    limit2 = 9;
    $2("exitTitle").textContent = names[market2];
    $2("exitHoldingsLink").href = "/portfolio?market=" + market2;
    $2("exitStats").innerHTML = "";
    $2("exitRules").innerHTML = "";
    $2("exitCards").innerHTML = "";
    $2("exitMore").hidden = true;
    $2("exitSearchLabel").textContent = market2 === "fund" ? "\u641C\u7D22\u57FA\u91D1" : "\u641C\u7D22\u80A1\u7968";
    $2("exitMeta").textContent = "\u6B63\u5728\u68C0\u67E5" + names[market2] + "\u9000\u51FA\u4FE1\u53F7\u2026";
    $2("exitCards").innerHTML = '<div class="exit-loading" role="status">\u6B63\u5728\u8BFB\u53D6\u884C\u60C5\u5FEB\u7167\u4E0E\u89E6\u53D1\u8BB0\u5F55\u2026</div>';
    try {
      const response = await fetch("/api/stock-exits?" + new URLSearchParams({ market: market2, ...scope === "holdings" ? { codes: holdings().map((r) => r.code).join(",") } : {} }), { cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(2e4) });
      if (response.status === 401) {
        if (id === version && active) {
          active = false;
          paint();
          persist();
          onChange();
          $2("decisionHint").hidden = false;
          $2("decisionHint").innerHTML = '\u767B\u5F55\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55\u3002 <a href="' + loginURL2() + '">\u53BB\u767B\u5F55</a>';
          document.querySelector(".decision-caption").classList.add("has-error");
        }
        return;
      }
      if (!response.ok) throw Error();
      const next = await response.json();
      if (next.market !== selected.toUpperCase() || !Array.isArray(next.rows)) throw Error();
      if (id !== version || !active) return;
      data2 = { ...next, rows: orderCandidates2(next.rows, selected + ":" + scope) };
      render2();
    } catch {
      if (id !== version || !active) return;
      $2("exitMeta").textContent = "\u9000\u51FA\u68C0\u67E5\u6682\u672A\u8F7D\u5165";
      $2("exitCards").innerHTML = '<div class="exit-empty"><p>\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u884C\u60C5\uFF0C\u8BF7\u91CD\u8BD5\u3002</p><button id="retryExit">\u91CD\u65B0\u52A0\u8F7D</button></div>';
      $2("retryExit").onclick = load2;
    }
  }
  document.querySelectorAll("[data-exit-scope]").forEach((b) => b.onclick = () => {
    scope = b.dataset.exitScope;
    limit2 = 9;
    document.querySelectorAll("[data-exit-scope]").forEach((n) => n.setAttribute("aria-pressed", String(n === b)));
    load2();
  });
  $2("exitSearch").oninput = () => {
    limit2 = 9;
    render2();
  };
  $2("exitMore").onclick = () => {
    limit2 += 9;
    render2();
  };
  window.addEventListener("storage", (e) => {
    if (e.key === "shixu-holdings-v1" && active && scope === "holdings") load2();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      ++version;
      data2 = null;
      $2("exitCards").innerHTML = "";
      $2("exitRules").innerHTML = "";
    } else if (active) load2();
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted && active) load2();
  });
  paint();
  if (requestedExit) queueMicrotask(() => change(true));
  return { get active() {
    return active;
  }, setMarket(next) {
    market2 = next;
    paint();
    $2("exitSearch").value = "";
    if (active) load2();
    else ++version;
  }, syncURL() {
    change(new URL(location.href).searchParams.get("view") === "exit");
  } };
}

// home-picks.js
var orderCandidates = createCandidateOrder();
var $ = (id) => document.getElementById(id);
var esc4 = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var pct3 = (n) => (n >= 0 ? "+" : "") + (n * 100).toFixed(2) + "%";
var PREVIEW_COUNT = 3;
var data;
var limit = PREVIEW_COUNT;
var market = "CN";
var requestVersion = 0;
var tabs = [...document.querySelectorAll("[data-home-market]")];
var panels = [...document.querySelectorAll("[data-market-panel]")];
var exitMode = initExitMode(() => setMarket(initialMarket(), false));
function initialMarket() {
  const url = new URL(location.href), m = url.searchParams.get("market")?.toLowerCase();
  return ["cn", "us", "hk", "fund"].includes(m) ? m : "cn";
}
var marketName = () => ({ CN: "A\u80A1", US: "\u7F8E\u80A1", HK: "\u6E2F\u80A1" })[market];
function setMarket(next, writeURL = true) {
  if (!["cn", "us", "hk", "fund"].includes(next)) return;
  ++requestVersion;
  limit = PREVIEW_COUNT;
  tabs.forEach((b) => {
    const active = b.dataset.homeMarket === next;
    b.setAttribute("aria-selected", String(active));
    b.tabIndex = active ? 0 : -1;
  });
  panels.forEach((p) => p.hidden = p.dataset.marketPanel !== next);
  document.dispatchEvent(new CustomEvent("demo:market", { detail: { market: next } }));
  const hasPicks = ["cn", "us", "hk"].includes(next);
  $("stock-picks").hidden = !hasPicks || exitMode.active;
  if (writeURL) {
    const url = new URL(location.href);
    url.searchParams.set("market", next);
    if (!hasPicks && url.hash === "#stock-picks") url.hash = "";
    history.replaceState(null, "", url);
  }
  exitMode.setMarket(next);
  if (hasPicks) {
    market = next.toUpperCase();
    $("stockPickTitle").textContent = `\u8FD130\u5929 \xB7 ${marketName()}\u53CC\u89C4\u5219\u5019\u9009`;
    if (!exitMode.active) load();
  }
}
function companyHeading(s) {
  const p = companyProfile(s, market);
  return `<h3>${esc4(p?.name || s.name)}</h3>${p ? `<p class="company-english">${esc4(s.name)}</p>` : ""}${researchButtons({ market: market.toLowerCase(), code: s.code, name: p?.name || s.name })}`;
}
document.addEventListener("click", (e) => {
  const a = e.target.closest(".peer-entry");
  if (!a || !data) return;
  const code = new URL(a.href).searchParams.get("code"), s = data.matches.find((s2) => s2.code === code);
  if (s) visit({ market: market.toLowerCase(), code: s.code, name: s.name });
});
var loginURL = () => "/login?return_to=" + encodeURIComponent(location.pathname + location.search + "#stock-picks");
function renderRules() {
  $("stockRuleGuide").innerHTML = (data.rules || [{ id: "R01" }, { id: "R02" }]).map((r) => `<span>${esc4(r.id)}${r.description ? " \xB7 " + esc4(r.description) : ""}</span>`).join("") + (data.authenticated ? "" : `<a href="${loginURL()}">\u767B\u5F55\u67E5\u770B\u5B8C\u6574\u89C4\u5219</a>`);
  document.querySelectorAll(".hd-login").forEach((a) => {
    a.textContent = data.authenticated ? "\u8D26\u53F7" : "\u767B\u5F55";
    a.href = loginURL();
  });
}
function render() {
  renderRules();
  $("stockPickMeta").textContent = `\u884C\u60C5\u622A\u6B62 ${data.asof} \xB7 ${data.total}\u53EA${marketName()}\u89C2\u5BDF\u6C60 \xB7 ${data.evaluated}\u53EA\u5B8C\u6210\u5224\u65AD \xB7 ${data.unknown}\u53EA\u5F85\u6838\u5B9E${market === "CN" && data.asof < data.dailyAsOf ? " \xB7 \u80A1\u7968\u5FEB\u7167\u66F4\u65B0\u6EDE\u540E" : ""}${market === "US" && data.expectedAsOf && data.asof < data.expectedAsOf ? " \xB7 " + data.expectedAsOf + "\u4EA4\u6613\u65E5\u6570\u636E\u5C1A\u672A\u9F50\u5907" : ""} \xB7 ${{ CN: "\u4E2D\u56FD\u4EA4\u6613\u65E5 / \u4EBA\u6C11\u5E01\u53E3\u5F84", US: "\u7F8E\u56FD\u4EA4\u6613\u65E5 / \u7F8E\u5143\u53E3\u5F84", HK: "\u9999\u6E2F\u4EA4\u6613\u65E5 / \u6E2F\u5E01\u53E3\u5F84" }[market]}`;
  $("stockPickCount").textContent = `${data.matches.length}\u53EA\u540C\u65F6\u7B26\u5408`;
  $("stockPickCards").innerHTML = data.matches.length ? data.matches.slice(0, limit).map((s) => `<article class="stock-pick"><header><div><span>${esc4(s.code)} \xB7 ${marketName()}</span>${companyHeading(s)}</div><strong>${pct3(s.change)}<small>30\u65E5\u9996\u5C3E\u6DA8\u8DCC\u5E45</small></strong></header>${companyIntro(s, market)}<div class="pick-tags"><span>R01 \u2713</span><span>R02 \u2713</span></div>${opportunityChart(s)}<div class="pick-dates"><span>${s.start}</span><span>${s.asof}</span></div><p>\u533A\u95F4\u632F\u5E45 ${(s.amplitude * 100).toFixed(2)}%</p><details><summary>\u4E3A\u4EC0\u4E48\u5165\u9009\uFF1F</summary>${data.authenticated && s.explanation ? `<p>${esc4(s.explanation)}</p>` : `<p>\u540C\u65F6\u7B26\u5408 R01\u3001R02\u3002<a href="${loginURL()}">\u767B\u5F55\u67E5\u770B\u5177\u4F53\u6761\u4EF6</a></p>`}</details><a class="peer-entry" href="/stock-peers.html?market=${market.toLowerCase()}&code=${esc4(s.code)}">\u540C\u677F\u5757\u5BF9\u6BD4</a><a href="${esc4(s.source)}" target="_blank" rel="noopener noreferrer">\u67E5\u770B\u884C\u60C5\u6765\u6E90</a></article>`).join("") : `<p class="pick-empty">\u622A\u81F3${data.asof}\uFF0C\u5DF2\u5B8C\u6210\u5224\u65AD\u7684${data.evaluated}\u53EA\u80A1\u7968\u4E2D\uFF0C\u6CA1\u6709\u540C\u65F6\u6EE1\u8DB3\u4E24\u6761\u89C4\u5219\u7684\u5019\u9009\u3002${data.unknown ? "\u53E6\u6709" + data.unknown + "\u53EA\u6570\u636E\u5F85\u6838\u5B9E\u3002" : ""}</p>`;
  $("stockPickMore").hidden = data.matches.length <= PREVIEW_COUNT;
  $("stockPickMore").textContent = limit === PREVIEW_COUNT ? `\u67E5\u770B\u5168\u90E8 ${data.matches.length} \u53EA\u5019\u9009` : "\u6536\u8D77\uFF0C\u4FDD\u75593\u53EA\u9884\u89C8";
  $("stockPickMore").setAttribute("aria-expanded", String(limit > PREVIEW_COUNT));
  $("stockPickCoverage").innerHTML = `\u6BCF\u6B21\u6253\u5F00\u968F\u673A\u5C55\u793A\u5019\u9009\uFF0C\u987A\u5E8F\u4E0D\u4EE3\u8868\u63A8\u8350\u4F18\u5148\u7EA7\u3002${market === "HK" ? `\u89C2\u5BDF\u6C60\u4E3A<a href="${esc4(data.universeSource)}" target="_blank" rel="noopener noreferrer">\u6E2F\u4EA4\u6240\u6E2F\u5E01\u4E3B\u677F\u53CAGEM\u666E\u901A\u80A1\u540D\u5355\uFF08${esc4(data.universeAsOf)}\uFF09</a>\uFF0C\u5171${data.total}\u53EA\uFF1B\u6709\u5B8C\u6574\u6536\u76D8\u5E8F\u5217\u7684${data.evaluated}\u53EA\u53C2\u4E0E\u5224\u65AD\uFF0C\u505C\u724C\u3001\u5386\u53F2\u4E0D\u8DB3\u53CA\u6570\u636E\u672A\u53D6\u5F97\u7684\u80A1\u7968\u5355\u5217\u5F85\u6838\u5B9E\u3002\u4F7F\u7528Yahoo Finance\u80A1\u606F\u4E0E\u62C6\u80A1\u8C03\u6574\u6536\u76D8\u5E8F\u5217\uFF0C\u6E2F\u5E01\u8BA1\u4EF7\uFF0C\u4E0D\u542B\u6C47\u7387\u53D8\u5316\u548C\u4EA4\u6613\u8D39\u7528\u3002` : market === "US" ? `\u89C2\u5BDF\u6C60\u4E3ASPY\u5B98\u65B9\u80A1\u7968\u6301\u4ED3\u4E0E\u7EB3\u65AF\u8FBE\u514B100\u6210\u5206\u7684\u53BB\u91CD\u5408\u96C6\uFF0C\u4E0D\u662F\u5168\u7F8E\u80A1\u3002${data.universeSources.map((s) => `<a href="${esc4(s.url)}" target="_blank" rel="noopener noreferrer">${esc4(s.label)}\uFF08${esc4(s.asof)}\uFF09</a>`).join(" \xB7 ")}\u3002\u4F7F\u7528Yahoo Finance\u63D0\u4F9B\u7684\u80A1\u606F\u4E0E\u62C6\u80A1\u8C03\u6574\u6536\u76D8\u5E8F\u5217\uFF0C\u7F8E\u5143\u8BA1\u4EF7\uFF0C\u4E0D\u542B\u4EBA\u6C11\u5E01\u6C47\u7387\u53D8\u5316\u53CA\u4EA4\u6613\u8D39\u7528\uFF1B\u4E0D\u542B\u76D8\u524D\u3001\u76D8\u540E\u6216\u672A\u6536\u76D8\u65E5\u3002` : `\u89C2\u5BDF\u6C60\u4E3A<a href="${esc4(data.universeSource)}" target="_blank" rel="noopener noreferrer">\u4E2D\u8BC1\u6307\u6570\u5B98\u65B9\u6CAA\u6DF1300\u6210\u5206\uFF08\u540D\u5355\u65E5\u671F${esc4(data.universeAsOf)}\uFF09</a>\uFF0C\u4E0D\u662F\u5168A\u80A1\u3002\u4F7F\u7528\u524D\u590D\u6743\u65E5\u6536\u76D8\u4EF7\uFF08\u975E\u5206\u7EA2\u518D\u6295\u8D44\u6536\u76CA\uFF09\uFF0C`}\u622A\u81F3${data.asof}\u7684\u6700\u8FD130\u4E2A\u81EA\u7136\u65E5\uFF1B\u5468\u672B\u4E0D\u8865\u70B9\u3002\u5B8C\u6574\u89C4\u5219\u53CA\u4E2A\u80A1\u5165\u9009\u4F9D\u636E\u767B\u5F55\u540E\u53EF\u89C1\u3002\u9875\u9762\u5C55\u793A\u89C4\u5219\u5339\u914D\u5019\u9009\uFF0C\u4E0D\u542B\u6536\u76CA\u9884\u6D4B\u6216\u81EA\u52A8\u4EA4\u6613\u3002${data.unknown ? "<details><summary>\u67E5\u770B\u5F85\u6838\u5B9E\u80A1\u7968</summary><p>" + data.excluded.map((s) => esc4(s.code + " " + s.name + "\uFF1A" + s.reason)).join("<br>") + "</p></details>" : ""}`;
}
async function load() {
  const version = ++requestVersion, selectedMarket = market;
  $("stockRuleGuide").innerHTML = "<span>\u89C4\u5219 R01</span><span>\u89C4\u5219 R02</span>";
  $("stockPickMeta").textContent = `\u6B63\u5728\u8BFB\u53D6${marketName()}\u7B5B\u9009\u5FEB\u7167\u2026`;
  $("stockPickCount").textContent = "\u6B63\u5728\u52A0\u8F7D";
  $("stockPickCards").innerHTML = "";
  $("stockPickCoverage").innerHTML = "";
  $("stockPickMore").hidden = true;
  try {
    const r = await fetch("/api/stock-picks?market=" + selectedMarket, { cache: "no-store", credentials: "same-origin" });
    if (!r.ok) throw Error();
    const next = await r.json();
    if (!Array.isArray(next.matches) || !next.asof || next.market !== selectedMarket) throw Error();
    if (version !== requestVersion) return;
    data = { ...next, matches: orderCandidates(next.matches, selectedMarket) };
    render();
  } catch {
    if (version !== requestVersion) return;
    $("stockPickMeta").textContent = `${marketName()}\u5019\u9009\u6682\u672A\u8F7D\u5165\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002`;
    $("stockPickCount").textContent = "\u6570\u636E\u5F85\u52A0\u8F7D";
    $("stockPickCards").innerHTML = '<button id="retryStockPicks">\u91CD\u65B0\u52A0\u8F7D</button>';
    $("retryStockPicks").onclick = load;
  }
}
$("stockPickMore").onclick = () => {
  const collapse = limit > PREVIEW_COUNT;
  limit = collapse ? PREVIEW_COUNT : data.matches.length;
  render();
  if (collapse) $("stock-picks").scrollIntoView({ block: "start" });
};
tabs.forEach((b, index) => {
  b.onclick = () => setMarket(b.dataset.homeMarket);
  b.onkeydown = (e) => {
    let i;
    if (e.key === "ArrowRight") i = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") i = (index + tabs.length - 1) % tabs.length;
    else if (e.key === "Home") i = 0;
    else if (e.key === "End") i = tabs.length - 1;
    else return;
    e.preventDefault();
    tabs[i].focus();
    setMarket(tabs[i].dataset.homeMarket);
  };
});
window.addEventListener("popstate", () => {
  exitMode.syncURL();
  setMarket(initialMarket(), false);
});
window.addEventListener("hashchange", () => {
  if (location.hash === "#stock-picks" && $("stock-picks").hidden) setMarket("cn");
});
setMarket(initialMarket(), false);
window.addEventListener("pageshow", (e) => {
  if (e.persisted && !exitMode.active && !$("stock-picks").hidden) load();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    data = null;
    $("stockPickCards").innerHTML = "";
    $("stockRuleGuide").innerHTML = "<span>\u89C4\u5219 R01</span><span>\u89C4\u5219 R02</span>";
  } else if (!$("stock-picks").hidden) load();
});
