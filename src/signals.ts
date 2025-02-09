abstract class BaseSignal<T> {
  protected static computingMode = false;
  protected static toBeDependant: BaseSignal<unknown>[] = [];
  protected dependants: ComputedSignal<unknown>[] = [];

  abstract get value(): T;

  static computed<U>(fn: () => U) {
    BaseSignal.computingMode = true;

    const signal = new ComputedSignal(fn);

    for (const parent of BaseSignal.toBeDependant)
      parent.dependants.push(signal);

    BaseSignal.toBeDependant = [];
    BaseSignal.computingMode = false;
    return signal;
  }

  protected setUpdatedFlag() {
    for (const dependency of this.dependants) {
      dependency.shouldUpdate = true;
      dependency.setUpdatedFlag();
    }
  }
}

export class Signal<T> extends BaseSignal<T> {
  #value: T;

  constructor(value: T) {
    super();
    this.#value = value;
  }

  get value() {
    if (BaseSignal.computingMode) BaseSignal.toBeDependant.push(this);
    return this.#value;
  }

  set value(newValue: T) {
    if (this.#value === newValue) return;
    this.#value = newValue;
    this.setUpdatedFlag();
  }
}

class ComputedSignal<T> extends BaseSignal<T> {
  shouldUpdate = false;

  #value: T;
  readonly #fn: () => T;

  constructor(fn: () => T) {
    super();
    this.#fn = fn;
    this.#value = fn();
  }

  get value() {
    if (BaseSignal.computingMode) BaseSignal.toBeDependant.push(this);
    if (this.shouldUpdate) {
      this.#value = this.#fn();
      this.shouldUpdate = false;
    }

    return this.#value;
  }
}
