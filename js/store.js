// Central store for state + persistence
export class Store {
    constructor() {
      this.key = "jeevi_outfit_state_v1";
      const saved = JSON.parse(localStorage.getItem(this.key) || "{}");
      this.state = {
        stepIndex: saved.stepIndex ?? 0,
        selections: saved.selections ?? { top:null, bottom:null, accessory:null, jewelry:null }
      };
      this.listeners = new Set();
    }
    get() { return this.state; }
    set(patch) { this.state = { ...this.state, ...patch }; this.persist(); this.emit(); }
    select(stepId, optionId) {
      this.state.selections = { ...this.state.selections, [stepId]: optionId };
      this.persist(); this.emit();
    }
    next(totalSteps) { if (this.state.stepIndex < totalSteps-1) this.set({ stepIndex: this.state.stepIndex+1 }); }
    back() { if (this.state.stepIndex > 0) this.set({ stepIndex: this.state.stepIndex-1 }); }
    reset() {
      this.set({ stepIndex: 0, selections: { top:null, bottom:null, accessory:null, jewelry:null } });
    }
    on(fn){ this.listeners.add(fn); return () => this.listeners.delete(fn); }
    emit(){ this.listeners.forEach(fn => fn(this.state)); }
    persist(){ localStorage.setItem(this.key, JSON.stringify(this.state)); }
  }
  