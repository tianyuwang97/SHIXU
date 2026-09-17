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
function setQueue(key, items, days = 30, source = "page") {
  const s = readState(), next = cleanState({ queues: { [key]: { items, days } } }).queues[key];
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
function itemURL(i) {
  return i.market === "fund" ? "/compare?code=" + encodeURIComponent(i.code) : "/stock-peers?" + new URLSearchParams({ market: i.market, code: i.code });
}
function groupURL(key, g) {
  if (!g || g.items.length < 2) return null;
  const first = g.items[0], p = new URLSearchParams({ codes: g.items.map((i) => i.code).join(","), days: String(g.days) });
  if (key === "fund") return "/compare?" + p + "#selection";
  p.set("market", first.market);
  p.set("industry", first.industry);
  return "/stock-peers?" + p + "#comparison";
}
function researchButtons(item) {
  const i = cleanItem(item);
  if (!i) return "";
  const encoded = encodeURIComponent(JSON.stringify(i)), watched = readState().watch.some((x) => itemKey(x) === itemKey(i));
  return `<span class="research-actions"><button type="button" data-research-watch="${encoded}" aria-pressed="${watched}">${watched ? "\u2605 \u5DF2\u81EA\u9009" : "\u2606 \u81EA\u9009"}</button></span>`;
}

// research-dock.js
var esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var market = new URL(location.href).searchParams.get("market") || (/funds|compare|companies|portfolio/.test(location.pathname) ? "fund" : "cn");
var panel = "";
var activeGroup = "";
var lastFocus;
if (!Object.hasOwn(markets, market)) market = "cn";
var dock = document.createElement("aside");
dock.className = "research-dock";
dock.setAttribute("aria-label", "\u7814\u7A76\u5DE5\u5177\u680F");
dock.innerHTML = `<div class="research-context"><span class="research-dot"></span><div><b id="researchMarket"></b><small>\u7814\u7A76\u53F0</small></div></div><nav aria-label="\u7814\u7A76\u8BB0\u5F55"><button data-panel="watch" aria-controls="researchPanel" aria-expanded="false"><i aria-hidden="true">\u2606</i>\u81EA\u9009 <span></span></button><button data-panel="queue" aria-controls="researchPanel" aria-expanded="false"><i aria-hidden="true">\u21C4</i>\u5F85\u5BF9\u6BD4 <span></span></button><button data-panel="recent" aria-controls="researchPanel" aria-expanded="false"><i aria-hidden="true">\u25F7</i>\u6700\u8FD1 <span></span></button><a id="researchHoldings" class="research-holdings" href="/portfolio"><i aria-hidden="true">\u25A5</i>\u6301\u4ED3</a></nav><button class="research-start" id="researchStart">\u5BF9\u6BD4</button>`;
var sheet = document.createElement("section");
sheet.id = "researchPanel";
sheet.className = "research-panel";
sheet.hidden = true;
sheet.setAttribute("role", "region");
sheet.setAttribute("aria-label", "\u7814\u7A76\u8BB0\u5F55");
var live = document.createElement("div");
live.className = "research-toast";
live.setAttribute("role", "status");
live.hidden = true;
var launcher = document.createElement("button");
launcher.className = "research-launcher";
launcher.textContent = "\u7814\u7A76";
launcher.setAttribute("aria-label", "\u5C55\u5F00\u7814\u7A76\u5DE5\u5177\u680F");
launcher.setAttribute("aria-expanded", "false");
dock.id = "researchDock";
launcher.setAttribute("aria-controls", dock.id);
launcher.onclick = () => {
  const on = document.body.classList.toggle("research-open");
  launcher.setAttribute("aria-expanded", String(on));
  launcher.setAttribute("aria-label", on ? "\u6536\u8D77\u7814\u7A76\u5DE5\u5177\u680F" : "\u5C55\u5F00\u7814\u7A76\u5DE5\u5177\u680F");
  if (!on && panel) close();
};
document.body.append(sheet, dock, live, launcher);
document.body.classList.add("has-research-dock");
var aiEgg = document.createElement("dialog");
aiEgg.id = "holdingsAiEgg";
aiEgg.setAttribute("aria-labelledby", "holdingsAiTitle");
aiEgg.setAttribute("aria-describedby", "holdingsAiDescription");
aiEgg.innerHTML = `<button class="ai-egg-close" aria-label="\u5173\u95ED\u6301\u4ED3\u5F69\u86CB" autofocus>\xD7</button><div class="ai-egg-art" aria-hidden="true"><span>\u2726</span><i></i><b>AI</b></div><span class="ai-egg-label">A LITTLE PREVIEW / \u65F6\u5E8F\u5F69\u86CB</span><h2 id="holdingsAiTitle">\u4F60\u7684\u6301\u4ED3\u3002<br>\u4F60\u7684 AI\u3002</h2><p id="holdingsAiDescription">\u672A\u6765\uFF0C\u4F60\u53EF\u4EE5\u63A5\u5165\u81EA\u5DF1\u7684\u5927\u6A21\u578B API Key\uFF0C\u8BA9\u719F\u6089\u7684\u6A21\u578B\u5E2E\u4F60\u5206\u6790\u6301\u4ED3\u3002</p><div class="ai-egg-note"><strong>\u81EA\u5DF1\u7684\u5BC6\u94A5\uFF0C\u81EA\u5DF1\u7684\u6A21\u578B\u8D26\u6237\u3002</strong><p>\u6A21\u578B\u8C03\u7528\u8D39\u7528\u7531\u4F60\u5411\u670D\u52A1\u5546\u652F\u4ED8\uFF0C\u6309\u5B9E\u9645\u7528\u91CF\u8BA1\u8D39\u3002</p></div><p class="ai-egg-status"><span></span>AI \u5206\u6790\u5C1A\u672A\u5F00\u653E\uFF0C\u76EE\u524D\u4ECD\u662F\u89C4\u5219\u5206\u6790\u3002<br>\u8FD9\u91CC\u6682\u4E0D\u6536\u96C6\u6216\u4FDD\u5B58 API Key\u3002</p><a id="holdingsAiContinue" class="ai-egg-continue" href="/portfolio">\u5148\u7528\u89C4\u5219\u5206\u6790</a>`;
document.body.append(aiEgg);
var holdingsEntry = document.getElementById("researchHoldings");
holdingsEntry.setAttribute("aria-haspopup", "dialog");
holdingsEntry.setAttribute("aria-controls", aiEgg.id);
holdingsEntry.addEventListener("click", (e) => {
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  if (panel) close();
  document.getElementById("holdingsAiContinue").href = holdingsEntry.href;
  aiEgg.showModal();
});
aiEgg.querySelector(".ai-egg-close").onclick = () => aiEgg.close();
aiEgg.addEventListener("click", (e) => {
  if (e.target !== aiEgg) return;
  const r = aiEgg.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) aiEgg.close();
});
var toastTimer;
function tell(text) {
  live.textContent = text;
  live.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => live.hidden = true, 3200);
}
var encode = (i) => encodeURIComponent(JSON.stringify(i));
function decode(s) {
  try {
    return cleanItem(JSON.parse(decodeURIComponent(s)));
  } catch {
    return null;
  }
}
function groupLabel(key, g) {
  const i = g.items[0];
  return markets[i.market] + (key === "fund" ? " \xB7 \u57FA\u91D1\u5BF9\u6BD4" : " \xB7 " + (i.industryName || "\u540C\u884C"));
}
function row(i, type) {
  const watched = readState().watch.some((x) => itemKey(x) === itemKey(i));
  return `<article class="research-row"><div><a href="${esc(itemURL(i))}" data-research-visit="${encode(i)}">${esc(i.name)}</a><small>${markets[i.market]} \xB7 ${esc(i.code)}${i.industryName ? " \xB7 " + esc(i.industryName) : ""}</small>${type === "watch" ? `<label class="research-note">\u5173\u6CE8\u7406\u7531<input maxlength="180" data-note="${encode(i)}" value="${esc(i.note)}" placeholder="\u8BB0\u4E0B\u60F3\u9A8C\u8BC1\u7684\u5224\u65AD\u2026"></label>` : ""}</div><div class="research-row-actions">${type !== "queue" ? `<button data-queue-add="${encode(i)}">${groupKey(i) ? "\u52A0\u5165\u5BF9\u6BD4" : "\u9009\u540C\u884C\u5BF9\u6BD4"}</button>` : ""}${type !== "watch" ? `<button data-research-watch="${encode(i)}" aria-pressed="${watched}">${watched ? "\u2605 \u5DF2\u81EA\u9009" : "\u2606 \u81EA\u9009"}</button>` : ""}<button data-list-remove="${encode(i)}" data-list="${type}" aria-label="\u79FB\u9664${esc(i.name)}">\u79FB\u9664</button></div></article>`;
}
function selectedGroup(s) {
  if (s.queues[activeGroup]) return activeGroup;
  return Object.keys(s.queues).find((k) => s.queues[k].items[0].market === market) || Object.keys(s.queues)[0] || "";
}
function render() {
  const s = readState();
  activeGroup = selectedGroup(s);
  document.getElementById("researchMarket").textContent = markets[market];
  document.getElementById("researchHoldings").href = "/portfolio?market=" + market;
  const counts = { watch: s.watch.length, recent: s.recent.length, queue: Object.values(s.queues).reduce((n, g) => n + g.items.length, 0) };
  dock.querySelectorAll("[data-panel]").forEach((b) => {
    b.querySelector("span").textContent = counts[b.dataset.panel];
    b.setAttribute("aria-expanded", String(panel === b.dataset.panel));
    b.classList.toggle("active", panel === b.dataset.panel);
  });
  document.querySelectorAll("[data-research-watch]").forEach((b) => {
    const i = decode(b.dataset.researchWatch);
    if (!i) return;
    const on = s.watch.some((x) => itemKey(x) === itemKey(i));
    b.textContent = on ? "\u2605 \u5DF2\u81EA\u9009" : "\u2606 \u81EA\u9009";
    b.setAttribute("aria-pressed", String(on));
  });
  if (!panel || document.activeElement?.hasAttribute("data-note")) return;
  const title = { watch: "\u6211\u7684\u81EA\u9009", queue: "\u5F85\u5BF9\u6BD4", recent: "\u6700\u8FD1\u6D4F\u89C8" }[panel];
  const hint = panel === "watch" ? "\u7559\u4E0B\u503C\u5F97\u7EE7\u7EED\u89C2\u5BDF\u7684\u6807\u7684\uFF0C\u4E5F\u7559\u4E0B\u5F53\u65F6\u7684\u7406\u7531\u3002" : panel === "queue" ? "\u80A1\u7968\u6309\u5E02\u573A\u4E0E\u884C\u4E1A\u5206\u7EC4\uFF1B\u57FA\u91D1\u6700\u591A4\u53EA\uFF0C\u80A1\u7968\u6BCF\u7EC4\u6700\u591A5\u53EA\u3002" : "\u4FDD\u7559\u6700\u8FD130\u4E2A\u4E3B\u52A8\u67E5\u770B\u6216\u9009\u62E9\u7684\u6807\u7684\u3002";
  let content = "";
  if (panel === "queue") {
    const groups = Object.entries(s.queues);
    const g = s.queues[activeGroup];
    content = groups.length ? `<div class="research-groups">${groups.map(([key, value]) => `<button data-group="${esc(key)}" aria-pressed="${key === activeGroup}">${esc(groupLabel(key, value))} <span>${value.items.length}</span></button>`).join("")}</div>${g.items.map((i) => row(i, "queue")).join("")}<div class="research-group-footer"><span>\u89C2\u5BDF\u671F ${g.days} \u81EA\u7136\u65E5 \xB7 ${g.items.length}/${limitFor(activeGroup)} \u5DF2\u9009</span>${groupURL(activeGroup, g) ? `<a class="research-primary" href="${esc(groupURL(activeGroup, g))}">\u6BD4\u8F83\u8FD9\u4E00\u7EC4</a>` : "<span>\u518D\u9009\u62E91\u53EA\u5373\u53EF\u6BD4\u8F83</span>"}</div>` : '<div class="research-empty">\u8FD8\u6CA1\u6709\u5F85\u5BF9\u6BD4\u6807\u7684\u3002<br>\u5728\u57FA\u91D1\u6216\u80A1\u7968\u5217\u8868\u91CC\u70B9\u51FB\u201C\u52A0\u5165\u5BF9\u6BD4\u201D\u6216\u52FE\u9009\u516C\u53F8\u3002</div>';
  } else {
    const list = s[panel];
    content = list.length ? list.map((i) => row(i, panel)).join("") : `<div class="research-empty">${panel === "watch" ? "\u770B\u5230\u60F3\u7EE7\u7EED\u7814\u7A76\u7684\u6807\u7684\uFF0C\u70B9\u51FB\u201C\u2606 \u81EA\u9009\u201D\u3002" : "\u6253\u5F00\u4E00\u53EA\u57FA\u91D1\u6216\u9009\u62E9\u4E00\u5BB6\u80A1\u7968\u540E\uFF0C\u4F1A\u5728\u8FD9\u91CC\u7559\u4E0B\u8BB0\u5F55\u3002"}</div>`;
  }
  sheet.innerHTML = `<header><div><span class="research-eyebrow">YOUR RESEARCH / \u65F6\u5E8F</span><h2>${title}</h2><p>${hint}</p></div><button data-close aria-label="\u5173\u95ED\u7814\u7A76\u9762\u677F">\xD7</button></header><div class="research-scroll" tabindex="0">${content}</div><footer>${globalThis.__shixuResearchSaved === false ? "\u6D4F\u89C8\u5668\u672A\u5141\u8BB8\u4FDD\u5B58\uFF0C\u5F53\u524D\u8BB0\u5F55\u4EC5\u4FDD\u7559\u5230\u672C\u9875\u5173\u95ED\u3002" : "\u4EC5\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668 \xB7 \u6E05\u7406\u7F51\u7AD9\u6570\u636E\u540E\u4F1A\u4E22\u5931"}${panel === "recent" && s.recent.length ? "<button data-clear-recent>\u6E05\u7A7A\u6700\u8FD1\u6D4F\u89C8</button>" : ""}</footer>`;
}
function open(which, trigger) {
  lastFocus = trigger || document.activeElement;
  panel = which;
  sheet.hidden = false;
  render();
  sheet.querySelector("[data-close]").focus({ preventScroll: true });
}
function close() {
  panel = "";
  sheet.hidden = true;
  render();
  if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
}
dock.addEventListener("click", (e) => {
  const b = e.target.closest("[data-panel]");
  if (b) {
    panel === b.dataset.panel ? close() : open(b.dataset.panel, b);
    return;
  }
  if (e.target.closest("#researchStart")) {
    const s = readState(), key = selectedGroup(s), g = s.queues[key], href = groupURL(key, g);
    if (href) location.href = href;
    else {
      open("queue", e.target);
      tell("\u9009\u62E9\u540C\u4E00\u7EC4\u5185\u81F3\u5C112\u53EA\u6807\u7684\uFF0C\u5373\u53EF\u5F00\u59CB\u5BF9\u6BD4\u3002");
    }
  }
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-research-watch],[data-queue-add],[data-list-remove],[data-group],[data-close],[data-clear-recent],[data-research-visit]");
  if (!b) return;
  if (b.hasAttribute("data-close")) return close();
  if (b.dataset.group) {
    activeGroup = b.dataset.group;
    render();
    return;
  }
  if (b.hasAttribute("data-clear-recent")) {
    const s2 = readState();
    s2.recent = [];
    writeState(s2);
    return;
  }
  if (b.dataset.researchVisit) {
    visit(decode(b.dataset.researchVisit));
    return;
  }
  const i = decode(b.dataset.researchWatch || b.dataset.queueAdd || b.dataset.listRemove);
  if (!i) return;
  const s = readState(), key = itemKey(i), gkey = groupKey(i);
  if (b.dataset.researchWatch) {
    const exists = s.watch.some((x) => itemKey(x) === key);
    if (!exists && s.watch.length >= 200) return tell("\u81EA\u9009\u5DF2\u6EE1200\u53EA\uFF0C\u8BF7\u5148\u79FB\u9664\u4E00\u4E9B\u3002");
    s.watch = exists ? s.watch.filter((x) => itemKey(x) !== key) : [i, ...s.watch];
    writeState(s);
    tell(exists ? "\u5DF2\u79FB\u51FA\u81EA\u9009" : "\u5DF2\u52A0\u5165\u81EA\u9009\uFF0C\u7A0D\u540E\u53EF\u4EE5\u5199\u4E0B\u5173\u6CE8\u7406\u7531\u3002");
  } else if (b.dataset.queueAdd) {
    if (!gkey) {
      visit(i);
      location.href = itemURL(i);
      return;
    }
    const g = s.queues[gkey] || { items: [], days: 30 };
    if (g.items.some((x) => itemKey(x) === key)) return tell("\u5DF2\u5728\u8FD9\u4E00\u7EC4\u5F85\u5BF9\u6BD4\u4E2D\u3002");
    if (g.items.length >= limitFor(gkey)) return tell(`\u8FD9\u4E00\u7EC4\u6700\u591A${limitFor(gkey)}\u53EA\uFF0C\u8BF7\u5148\u79FB\u9664\u4E00\u53EA\u3002`);
    activeGroup = gkey;
    setQueue(gkey, [...g.items, i], g.days, "dock");
    tell("\u5DF2\u52A0\u5165\u5F85\u5BF9\u6BD4");
  } else if (b.dataset.listRemove) {
    if (b.dataset.list === "queue") {
      const g = s.queues[gkey];
      if (g) setQueue(gkey, g.items.filter((x) => itemKey(x) !== key), g.days, "dock");
    } else {
      s[b.dataset.list] = s[b.dataset.list].filter((x) => itemKey(x) !== key);
      writeState(s);
    }
  }
});
sheet.addEventListener("input", (e) => {
  if (!e.target.dataset.note) return;
  const i = decode(e.target.dataset.note);
  if (!i) return;
  const s = readState(), found = s.watch.find((x) => itemKey(x) === itemKey(i));
  if (found) {
    found.note = e.target.value.slice(0, 180);
    writeState(s, { source: "note" });
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (panel) {
      e.preventDefault();
      close();
    } else if (document.body.classList.contains("research-open")) {
      launcher.click();
      launcher.focus();
    }
  }
});
document.addEventListener("pointerdown", (e) => {
  if (panel && !sheet.contains(e.target) && !dock.contains(e.target) && !e.target.closest("[data-research-watch]")) close();
});
document.addEventListener("research:change", (e) => {
  if (e.detail?.source !== "note") render();
});
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY) {
    render();
    document.dispatchEvent(new CustomEvent("research:external"));
  }
});
document.addEventListener("demo:market", (e) => {
  if (Object.hasOwn(markets, e.detail?.market)) {
    market = e.detail.market;
    activeGroup = "";
    render();
  }
});
document.addEventListener("research:context", (e) => {
  if (e.detail?.group) {
    activeGroup = e.detail.group;
    render();
  }
});
var dataset = document.getElementById("dataset");
var fundBody = document.getElementById("body");
if (dataset && fundBody) {
  let decorate = function() {
    fundBody.querySelectorAll(".detail-link[data-code]").forEach((b) => {
      const r = funds.get(b.dataset.code), host = b.closest("tr")?.querySelector(".row-actions");
      if (!r || !host || host.querySelector("[data-research-watch]")) return;
      const i = { market: "fund", code: r.code, name: r.name };
      host.insertAdjacentHTML("beforeend", researchButtons(i) + `<button data-queue-add="${encode(i)}">\uFF0B \u52A0\u5165\u5BF9\u6BD4</button>`);
    });
  };
  const funds = new Map(JSON.parse(dataset.textContent).rows.map((r) => [r.code, r]));
  new MutationObserver(decorate).observe(fundBody, { childList: true, subtree: true });
  decorate();
  fundBody.addEventListener("click", (e) => {
    const b = e.target.closest(".detail-link[data-code]");
    if (b) {
      const r = funds.get(b.dataset.code);
      if (r) visit({ market: "fund", code: r.code, name: r.name });
    }
  });
}
render();
