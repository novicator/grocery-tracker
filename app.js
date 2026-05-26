const SEED_GROCERIES = [
  "water", "oats", "strawberries", "blueberries", "almond butter",
  "chia seeds", "milk", "eggs", "spinach", "pickles", "avocado", "ginger",
  "almonds", "chicken", "steak", "salmon", "rice", "sweet potato",
  "broccoli", "ghee", "salt", "honey", "pepper", "lemon pepper", "thyme"
];

const STORAGE_KEY = "grocery-tracker-items-v1";
const LEGACY_KEY = "grocery-tracker-state-v1";

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(i => i && typeof i.name === "string");
    }
    const legacyRaw = localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      return SEED_GROCERIES.map(name => ({ name, have: Boolean(legacy[name]) }));
    }
  } catch {}
  return SEED_GROCERIES.map(name => ({ name, have: false }));
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

let items = loadItems();

const listEl = document.getElementById("list");
const haveCountEl = document.getElementById("haveCount");
const missCountEl = document.getElementById("missCount");
const resetBtn = document.getElementById("resetBtn");
const addForm = document.getElementById("addForm");
const addInput = document.getElementById("addInput");

function updateSummary() {
  const have = items.reduce((n, i) => n + (i.have ? 1 : 0), 0);
  haveCountEl.textContent = have;
  missCountEl.textContent = items.length - have;
}

function render() {
  listEl.innerHTML = "";
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
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
  items[idx].have = !items[idx].have;
  el.classList.toggle("have", items[idx].have);
  saveItems();
  updateSummary();
}

function addItem(rawName) {
  const name = rawName.trim().toLowerCase();
  if (!name) return;
  if (items.some(i => i.name === name)) return;
  items.push({ name, have: false });
  saveItems();
  render();
}

function removeItem(idx) {
  items.splice(idx, 1);
  saveItems();
  render();
}

addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addItem(addInput.value);
  addInput.value = "";
  addInput.blur();
});

resetBtn.addEventListener("click", () => {
  for (const item of items) item.have = false;
  saveItems();
  render();
});

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
