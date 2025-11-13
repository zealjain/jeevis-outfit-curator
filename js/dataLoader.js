import { QuizData } from "./models.js";

export async function loadData(){
  const res = await fetch("./data/outfits.json");
  const raw = await res.json();
  return new QuizData(raw);
}

// pick options for step considering dependencies + prior selections
export function getOptionsForStep(step, selections){
  // find mapping key from any prior selection that appears in dependencies
  const keys = Object.values(selections).filter(Boolean);
  const priority = keys.find(k => step.dependencies && step.dependencies[k]);
  if (!priority) return step.options;
  const orderIds = step.dependencies[priority];
  // reorder existing options by orderIds (then the rest)
  const map = new Map(step.options.map(o => [o.id, o]));
  const ordered = orderIds.map(id => map.get(id)).filter(Boolean);
  const rest = step.options.filter(o => !orderIds.includes(o.id));
  return [...ordered, ...rest].slice(0, 4);
}
