const SEED_GROCERIES = [
  "water", "oats", "strawberries", "blueberries", "almond butter",
  "chia seeds", "milk", "eggs", "spinach", "pickles", "avocado", "ginger",
  "almonds", "chicken", "steak", "salmon", "rice", "sweet potato",
  "broccoli", "ghee", "salt", "honey", "pepper", "lemon pepper", "thyme"
];

const TAB_CONFIG = {
  list:      { key: "list-tracker-items-v1", legacy: null, seed: [] },
  groceries: { key: "grocery-tracker-items-v1", legacy: "grocery-tracker-state-v1", seed: SEED_GROCERIES },
  hygiene:   { key: "hygiene-tracker-items-v1", legacy: null, seed: [] }
};

const TAB_KEY = "grocery-tracker-active-tab";
const MIGRATIONS_KEY = "grocery-tracker-migrations";

const MIGRATIONS = {
  "2026-04-23-add-bananas-apples": () => {
    for (const name of ["bananas", "apples"]) {
      if (!lists.groceries.some(i => i.name === name)) lists.groceries.push({ name, have: false });
    }
  }
};

function loadList(tab) {
  const cfg = TAB_CONFIG[tab];
  try {
    const raw = localStorage.getItem(cfg.key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(i => i && typeof i.name === "string");
    }
    if (cfg.legacy) {
      const legacyRaw = localStorage.getItem(cfg.legacy);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw);
        return cfg.seed.map(name => ({ name, have: Boolean(legacy[name]) }));
      }
    }
  } catch {}
  return cfg.seed.map(name => ({ name, have: false }));
}

function saveList(tab) {
  localStorage.setItem(TAB_CONFIG[tab].key, JSON.stringify(lists[tab]));
}

function runMigrations() {
  let applied = [];
  try { applied = JSON.parse(localStorage.getItem(MIGRATIONS_KEY) || "[]"); } catch {}
  let changed = false;
  for (const [id, fn] of Object.entries(MIGRATIONS)) {
    if (!applied.includes(id)) {
      try { fn(); applied.push(id); changed = true; } catch (e) { console.error("migration failed", id, e); }
    }
  }
  if (changed) {
    localStorage.setItem(MIGRATIONS_KEY, JSON.stringify(applied));
    saveList("groceries");
  }
}

let lists = {
  list: loadList("list"),
  groceries: loadList("groceries"),
  hygiene: loadList("hygiene")
};
runMigrations();

let currentTab = TAB_CONFIG[localStorage.getItem(TAB_KEY)] ? localStorage.getItem(TAB_KEY) : "groceries";

const listEl = document.getElementById("list");
const haveCountEl = document.getElementById("haveCount");
const missCountEl = document.getElementById("missCount");
const resetBtn = document.getElementById("resetBtn");
const addInput = document.getElementById("addInput");
const addBtn = document.getElementById("addBtn");
const tabBtns = Array.from(document.querySelectorAll(".tab"));

function items() { return lists[currentTab]; }
function save() { saveList(currentTab); }

function updateSummary() {
  const list = items();
  const have = list.reduce((n, i) => n + (i.have ? 1 : 0), 0);
  haveCountEl.textContent = have;
  missCountEl.textContent = list.length - have;
}

function render() {
  const list = items();
  listEl.innerHTML = "";
  for (let idx = 0; idx < list.length; idx++) {
    const item = list[idx];
    const li = document.createElement("li");
    li.className = "item" + (item.have ? " have" : "");

    const dot = document.createElement("span");
    dot.className = "dot";

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = item.name;

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete";
    del.setAttribute("aria-label", `Remove ${item.name}`);
    del.textContent = "×";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      removeItem(idx);
    });

    li.appendChild(dot);
    li.appendChild(name);
    li.appendChild(del);
    li.addEventListener("click", () => toggle(idx, li));
    listEl.appendChild(li);
  }
  updateSummary();
}

function toggle(idx, el) {
  const list = items();
  list[idx].have = !list[idx].have;
  el.classList.toggle("have", list[idx].have);
  save();
  updateSummary();
}

function addItem(rawName) {
  const list = items();
  const name = (rawName || "").trim().toLowerCase();
  if (!name) {
    addInput.focus();
    return;
  }
  const existing = list.findIndex(i => i.name === name);
  if (existing >= 0) {
    addInput.value = "";
    const li = listEl.children[existing];
    if (li) {
      li.scrollIntoView({ behavior: "smooth", block: "center" });
      li.classList.remove("flash");
      void li.offsetWidth;
      li.classList.add("flash");
    }
    return;
  }
  list.push({ name, have: false });
  save();
  render();
  addInput.value = "";
}

function removeItem(idx) {
  items().splice(idx, 1);
  save();
  render();
}

function handleAdd() {
  addItem(addInput.value);
}

function switchTab(tab) {
  if (!TAB_CONFIG[tab] || tab === currentTab) return;
  currentTab = tab;
  localStorage.setItem(TAB_KEY, tab);
  for (const btn of tabBtns) btn.classList.toggle("active", btn.dataset.tab === tab);
  addInput.value = "";
  render();
}

addBtn.addEventListener("click", handleAdd);
addBtn.addEventListener("touchend", (e) => { e.preventDefault(); handleAdd(); });
addInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
});

for (const btn of tabBtns) {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
}

resetBtn.addEventListener("click", () => {
  for (const item of items()) item.have = false;
  save();
  render();
});

for (const btn of tabBtns) btn.classList.toggle("active", btn.dataset.tab === currentTab);
render();

if ("serviceWorker" in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").then((reg) => {
      reg.update().catch(() => {});
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    }).catch(() => {});
  });
}
