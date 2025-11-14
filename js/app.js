import { Store } from "./store.js";
import { $, toast, setView, card, renderProgress } from "./ui.js";
import { loadData, getOptionsForStep } from "./dataLoader.js";
import { sendSelections, formatSelectionsText } from "./email.js";
import { confettiOnce, confettiCelebrate } from "./ui.js";

const store = new Store();
let DATA = null;
let dataPromise = null;

async function ensureData() {
  if (DATA) return DATA;
  if (!dataPromise) {
    dataPromise = loadData().then(d => {
      DATA = d;
      return d;
    });
  }
  return dataPromise;
}

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

function updateQuizView() {
  if (!DATA) return; // guard if called too early

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
  const result = await sendSelections({
    toEmail: "zeal.jain110@gmail.com",
    subject: "Jeevi's 23rd Outfit Selections",
    text,
    json: JSON.stringify(state.selections),
  });

  if (result.ok) {
    setView("view-success");
    confettiCelebrate();
    announce("Your selections are saved.");
    document.getElementById("restartBtn")?.focus();
  } else {
    // Friendlier user toast + console detail for you
    console.warn("[Email] failed:", result.error);
    let hint = "";
    if (result.error === "emailjs_sdk_missing") hint = " (SDK not loaded)";
    else if (result.error === "ids_not_configured") hint = " (Service/Template IDs)";
    else if (result.error === "auth_or_key_invalid") hint = " (Public key / auth)";
    else if (result.error === "service_or_template_not_found") hint = " (Service/Template ID typo)";
    else if (result.error === "template_vars_invalid") hint = " (Template variables)";
    else if (result.error === "origin_not_allowed") hint = " (Add your domain in EmailJS Security)";
    toast("Eek—glitter spill! Try again in a sec." + hint);
    announce("Submission failed. " + (hint ? hint.replace(/[()]/g, "") : "Try again."));
  }
}

function wireEvents() {
  const startBtn   = document.getElementById("startBtn");
  const backBtn    = document.getElementById("backBtn");
  const nextBtn    = document.getElementById("nextBtn");
  const submitBtn  = document.getElementById("submitBtn");
  const restartBtn = document.getElementById("restartBtn");

  if (startBtn) {
    startBtn.addEventListener("click", async () => {
      await ensureData(); 
      setView("view-quiz");
      updateQuizView();
    });
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      store.back();
      updateQuizView();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const { stepIndex } = store.get();
      if (!DATA) return;
      if (stepIndex === DATA.steps.length - 1) {
        // go to summary
        const { selections } = store.get();
        const list = document.getElementById("summaryList");
        list.innerHTML = "";
        for (const step of DATA.steps) {
          const chosen = step.options.find(o => o.id === selections[step.id]);
          const div = document.createElement("div");
          div.className = "card";
          div.innerHTML = `
            <img src="${chosen?.img || ""}" alt="Photo of ${chosen?.name || ""}">
            <div class="body">
              <div class="name">${step.title}</div>
              <div class="desc">${chosen ? chosen.name : "No selection"}</div>
              <button class="btn link" data-step="${step.id}">Change ${step.id}</button>
            </div>`;
          div.querySelector("button").addEventListener("click", () => {
            const idx = DATA.steps.findIndex(s => s.id === step.id);
            store.set({ stepIndex: idx });
            setView("view-quiz");
            updateQuizView();
          });
          list.appendChild(div);
        }
        setView("view-summary");
      } else {
        store.next(DATA.steps.length);
        updateQuizView();
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      submitBtn.disabled = true;
      submitBtn.textContent = "Working the magic…";
      await submit();
      submitBtn.disabled = false;
      submitBtn.textContent = "Lock It In";
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      store.reset();
      store.clearStorage?.();
      setView("view-landing");
      document.getElementById("startBtn")?.focus();
    });
  }

}

(async function init() {
  try {
    await ensureData(); // load data before binding and rendering
  } catch (e) {
    toast("Steaming fresh looks… (loading failed)");
    return;
  }

  wireEvents();

  const { stepIndex, selections } = store.get();
  if (stepIndex === 0 && !Object.values(selections).some(Boolean)) {
    setView("view-landing");
    document.getElementById("startBtn")?.focus();
  } else {
    setView("view-quiz");
    updateQuizView();
  }
})();
