const GROCERIES = [
  "water", "oats", "strawberries", "blueberries", "almond butter",
  "chia seeds", "milk", "eggs", "spinach", "pickles", "avocado", "ginger",
  "almonds", "chicken", "steak", "salmon", "rice", "sweet potato",
  "broccoli", "ghee", "salt", "honey", "pepper", "lemon pepper", "thyme"
];

const STORAGE_KEY = "grocery-tracker-state-v1";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    const state = {};
    for (const item of GROCERIES) {
      state[item] = Boolean(saved[item]);
    }
    return state;
  } catch {
    return Object.fromEntries(GROCERIES.map(g => [g, false]));
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const state = loadState();
const listEl = document.getElementById("list");
const haveCountEl = document.getElementById("haveCount");
const missCountEl = document.getElementById("missCount");
const resetBtn = document.getElementById("resetBtn");

function updateSummary() {
  let have = 0;
  for (const name of GROCERIES) if (state[name]) have++;
  haveCountEl.textContent = have;
  missCountEl.textContent = GROCERIES.length - have;
}

function render() {
  listEl.innerHTML = "";
  for (const name of GROCERIES) {
    const li = document.createElement("li");
    li.className = "item" + (state[name] ? " have" : "");
    li.dataset.name = name;
    li.innerHTML = `<span class="dot"></span><span class="name">${name}</span>`;
    li.addEventListener("click", () => toggle(name, li));
    listEl.appendChild(li);
  }
  updateSummary();
}

function toggle(name, el) {
  state[name] = !state[name];
  el.classList.toggle("have", state[name]);
  saveState(state);
  updateSummary();
}

resetBtn.addEventListener("click", () => {
  for (const name of GROCERIES) state[name] = false;
  saveState(state);
  render();
});

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
