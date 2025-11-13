// Simple data model classes
export class OptionItem {
    constructor({ id, name, img, desc }) {
      this.id = id; this.name = name; this.img = img; this.desc = desc;
    }
  }
  export class Step {
    constructor({ id, title, blurb, options = [], dependencies = {} }) {
      this.id = id; this.title = title; this.blurb = blurb;
      this.options = options.map(o => new OptionItem(o));
      this.dependencies = dependencies;
    }
  }
  export class QuizData {
    constructor({ steps = [], jokes = [] }) {
      this.steps = steps.map(s => new Step(s));
      this.jokes = jokes;
    }
  }
  