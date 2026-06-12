// Reactive application state (Svelte 5 runes), persisted to localStorage.
//
// Holds the user's selection, per-rule text overrides, per-rule parameter values, and
// org metadata. URL/preset sharing (Phase 7) is layered on top of serialize()/load().

const STORAGE_KEY = 'standards-builder:v1';

export interface OrgMeta {
  name: string;
  preamble: string;
  footer: string;
}

export interface PersistShape {
  selected: string[];
  overrides: Record<string, string>;
  params: Record<string, Record<string, string>>;
  org: OrgMeta;
}

function emptyOrg(): OrgMeta {
  return { name: '', preamble: '', footer: '' };
}

class BuilderStore {
  selected = $state<Set<string>>(new Set());
  overrides = $state<Record<string, string>>({});
  params = $state<Record<string, Record<string, string>>>({});
  org = $state<OrgMeta>(emptyOrg());

  constructor() {
    this.load();
  }

  // --- selection ---
  isSelected(key: string): boolean {
    return this.selected.has(key);
  }

  toggle(key: string): void {
    const next = new Set(this.selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    this.selected = next;
    this.persist();
  }

  setSelected(keys: Iterable<string>): void {
    this.selected = new Set(keys);
    this.persist();
  }

  clearSelection(): void {
    this.selected = new Set();
    this.persist();
  }

  get count(): number {
    return this.selected.size;
  }

  // --- overrides ---
  getOverride(key: string): string | undefined {
    return this.overrides[key];
  }

  setOverride(key: string, text: string): void {
    this.overrides = { ...this.overrides, [key]: text };
    this.persist();
  }

  clearOverride(key: string): void {
    const next = { ...this.overrides };
    delete next[key];
    this.overrides = next;
    this.persist();
  }

  // --- params ---
  getParam(key: string, paramId: string): string | undefined {
    return this.params[key]?.[paramId];
  }

  setParam(key: string, paramId: string, value: string): void {
    const forKey = { ...(this.params[key] ?? {}), [paramId]: value };
    this.params = { ...this.params, [key]: forKey };
    this.persist();
  }

  clearParam(key: string, paramId: string): void {
    const forKey = { ...(this.params[key] ?? {}) };
    delete forKey[paramId];
    this.params = { ...this.params, [key]: forKey };
    this.persist();
  }

  // --- org ---
  setOrg(patch: Partial<OrgMeta>): void {
    this.org = { ...this.org, ...patch };
    this.persist();
  }

  // --- persistence ---
  serialize(): PersistShape {
    return {
      selected: [...this.selected],
      overrides: this.overrides,
      params: this.params,
      org: this.org,
    };
  }

  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      this.apply(JSON.parse(raw) as Partial<PersistShape>);
    } catch {
      // ignore malformed/inaccessible storage
    }
  }

  apply(data: Partial<PersistShape>): void {
    this.selected = new Set(data.selected ?? []);
    this.overrides = data.overrides ?? {};
    this.params = data.params ?? {};
    this.org = { ...emptyOrg(), ...(data.org ?? {}) };
  }

  reset(): void {
    this.apply({});
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.serialize()));
    } catch {
      // ignore storage failures (private mode, quota)
    }
  }
}

export const store = new BuilderStore();
