import { Store } from "./store.js";
import { $, toast, setView, card, renderProgress } from "./ui.js";
import { loadData, getOptionsForStep } from "./dataLoader.js";
import { sendSelections, formatSelectionsText } from "./email.js";

const store = new Store();
let DATA = null;

const jokesRotator = (idx) => DATA?.jokes?.[idx % (DATA.jokes.length || 1)] || "";

function announce(msg) {
  const sr = document.getElementById("srStatus");
  if (!sr) return;
  sr.textContent = "";
  setTimeout(() => (sr.textContent = msg), 10);
}

function focusCardAt(index = 0) {
  const cards = [...document.querySelectorAll("#cardGrid .card")];
  if (cards.length === 0) return;
  const i = Math.max(0, Math.min(index, cards.length - 1));
  cards[i].focus();
}

function wireGridArrows() {
  const grid = document.getElementById("cardGrid");
  if (!grid || grid._arrowWired) return; // prevent double-binding
  grid._arrowWired = true;
  grid.addEventListener("keydown", (e) => {
    const cards = [...grid.querySelectorAll(".card")];
    if (!cards.length) return;

    const current = document.activeElement;
    let i = cards.indexOf(current);
    if (i === -1) {
      const parentCard = current.closest(".card");
      i = parentCard ? cards.indexOf(parentCard) : 0;
    }

    const cols =
      getComputedStyle(grid).gridTemplateColumns.split(" ").length || 2;
    const key = e.key;
    let next = i;

    if (key === "ArrowRight") next = Math.min(i + 1, cards.length - 1);
    else if (key === "ArrowLeft") next = Math.max(i - 1, 0);
    else if (key === "ArrowDown") next = Math.min(i + cols, cards.length - 1);
    else if (key === "ArrowUp") next = Math.max(i - cols, 0);
    else if (key === "Home") next = 0;
    else if (key === "End") next = cards.length - 1;
    else return;

    e.preventDefault();
    cards[next].focus();
  });
}

function updateQuizView(){
  const { stepIndex, selections } = store.get();
  const step = DATA.steps[stepIndex];
  // header
  $("#stepTitle").textContent = step.title;
  $("#stepBlurb").textContent = step.blurb || "";
  $("#jokeBanner").textContent = jokesRotator(stepIndex);
  renderProgress(stepIndex, DATA.steps.length);

  // grid
  const grid = $("#cardGrid");
  grid.innerHTML = "";
  const options = getOptionsForStep(step, selections);
  
  options.forEach((opt, idx) => {
    const isSel = selections[step.id] === opt.id;
    grid.appendChild(
      card(opt, isSel, () => {
        store.select(step.id, opt.id);
        updateQuizView(); // refresh selected state
        $("#nextBtn").disabled = false;
        announce(`${step.title} selected: ${opt.name}`);
      })
    );
  });
  
  $("#backBtn").disabled = stepIndex === 0;
  $("#nextBtn").textContent =
    stepIndex === DATA.steps.length - 1 ? "Review →" : "Next →";
  $("#nextBtn").disabled = !selections[step.id];
  
  // enable arrow navigation and focus behavior
  wireGridArrows();
  const selectedIdx = options.findIndex((o) => o.id === selections[step.id]);
  focusCardAt(selectedIdx >= 0 ? selectedIdx : 0);  
}

function goToSummary(){
  const { selections } = store.get();
  const list = $("#summaryList"); list.innerHTML = "";
  for (const step of DATA.steps){
    const chosen = step.options.find(o => o.id === selections[step.id]);
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="${chosen?.img || ''}" alt="Photo of ${chosen?.name || ''}">
      <div class="body">
        <div class="name">${step.title}</div>
        <div class="desc">${chosen ? chosen.name : "No selection"}</div>
        <button class="btn link" data-step="${step.id}">Change ${step.id}</button>
      </div>`;
    div.querySelector("button").addEventListener("click", () => {
      const idx = DATA.steps.findIndex(s => s.id === step.id);
      store.set({ stepIndex: idx });
      setView("view-quiz"); updateQuizView();
    });
    list.appendChild(div);
  }
  setView("view-summary");
}

async function submit() {
  const state = store.get();
  const text = formatSelectionsText(state.selections, DATA);
  const ok = await sendSelections({
    toEmail: "zeal.jain110@gmail.com",
    text
  });

  if (ok) {
    setView("view-success");
    announce("Your selections are saved.");
    document.getElementById("restartBtn")?.focus();
  } else {
    toast("Eek—glitter spill! Try again in a sec.");
    announce("Submission failed. Try again.");
  }
}

function wireEvents(){
  $("#startBtn").addEventListener("click", () => { setView("view-quiz"); updateQuizView(); });
  $("#backBtn").addEventListener("click", () => { store.back(); updateQuizView(); });
  $("#nextBtn").addEventListener("click", () => {
    const { stepIndex } = store.get();
    if (stepIndex === DATA.steps.length - 1) { goToSummary(); }
    else { store.next(DATA.steps.length); updateQuizView(); }
  });
  $("#submitBtn").addEventListener("click", async () => {
    $("#submitBtn").disabled = true; $("#submitBtn").textContent = "Working the magic…";
    await submit();
    $("#submitBtn").disabled = false; $("#submitBtn").textContent = "Lock It In";
  });
  $("#restartBtn").addEventListener("click", () => { store.reset(); setView("view-landing"); });
  $("#themeToggle").addEventListener("click", () => {
    const order = ["theme-pastel","theme-party","theme-minimal"];
    const cur = order.find(c => document.body.classList.contains(c));
    const next = order[(order.indexOf(cur)+1)%order.length];
    document.body.classList.remove(...order);
    document.body.classList.add(next);
    toast(next.replace("theme-","Theme: "));
  });
}

(async function init() {
  wireEvents();
  try {
    DATA = await loadData();
  } catch (e) {
    toast("Steaming fresh looks… (loading failed)");
    return;
  }

  const { stepIndex, selections } = store.get();
  if (stepIndex === 0 && !Object.values(selections).some(Boolean)) {
    setView("view-landing");
    document.getElementById("startBtn")?.focus();
  } else {
    setView("view-quiz");
    updateQuizView();
  }
})();
