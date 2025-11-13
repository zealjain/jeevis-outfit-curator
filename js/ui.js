// Minimal UI helpers
export const $ = sel => document.querySelector(sel);
export function toast(msg, ms=1800){
  const el = $("#toast"); el.textContent = msg; el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"), ms);
}
export function setView(id){
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
export function renderProgress(stepIndex, total){
  $("#progressText").textContent = `Step ${stepIndex+1} of ${total}`;
  $("#barFill").style.width = `${((stepIndex+1)/total)*100}%`;
}
export function card(option, isSelected, onSelect){
  const div = document.createElement("div");
  div.className = "card" + (isSelected ? " selected" : "");
  div.innerHTML = `
    <img src="${option.img}" alt="Photo of ${option.name}">
    <div class="body">
      <div class="name">${option.name}</div>
      <div class="desc">${option.desc}</div>
      <button class="btn" aria-pressed="${isSelected}">${isSelected ? "Chosen" : "Pick this"}</button>
    </div>`;
  div.querySelector("button").addEventListener("click", onSelect);
  return div;
}
