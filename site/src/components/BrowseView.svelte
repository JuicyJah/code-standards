<script lang="ts">
  import { units } from '../lib/catalog';
  import { store } from '../lib/store.svelte';
  import type { Unit } from '../lib/types';
  import UnitCard from './UnitCard.svelte';

  let query = $state('');
  let standard = $state<'all' | 'api' | 'code'>('all');
  let kind = $state<'all' | 'rule' | 'pattern' | 'tooling'>('all');
  let selectedOnly = $state(false);

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return units.filter((u) => {
      if (standard !== 'all' && u.standardId !== standard) return false;
      if (kind !== 'all' && u.kind !== kind) return false;
      if (selectedOnly && !store.isSelected(u.key)) return false;
      if (q) {
        const hay = `${u.sid ?? ''} ${u.id} ${u.title} ${u.section} ${u.bodyMarkdown}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  // Group filtered units by standard → file → section for display.
  interface Group {
    heading: string;
    sub: string;
    units: Unit[];
  }
  const groups = $derived.by(() => {
    const map = new Map<string, Group>();
    for (const u of filtered) {
      const key = `${u.standardTitle}␟${u.fileTitle}␟${u.section}`;
      let g = map.get(key);
      if (!g) {
        g = {
          heading: `${u.standardTitle} — ${u.fileTitle}`,
          sub: u.section,
          units: [],
        };
        map.set(key, g);
      }
      g.units.push(u);
    }
    return [...map.values()];
  });

  function selectAllFiltered() {
    store.setSelected([...store.selected, ...filtered.map((u) => u.key)]);
  }
  function deselectAllFiltered() {
    const remove = new Set(filtered.map((u) => u.key));
    store.setSelected([...store.selected].filter((k) => !remove.has(k)));
  }
</script>

<div class="controls">
  <input
    class="search"
    type="search"
    placeholder="Search SID, slug, title, or text…"
    bind:value={query}
  />
  <select bind:value={standard} aria-label="Standard">
    <option value="all">All standards</option>
    <option value="code">Code</option>
    <option value="api">API</option>
  </select>
  <select bind:value={kind} aria-label="Kind">
    <option value="all">All kinds</option>
    <option value="rule">Rules</option>
    <option value="pattern">Patterns</option>
    <option value="tooling">Tooling</option>
  </select>
  <label class="chk">
    <input type="checkbox" bind:checked={selectedOnly} /> Selected only
  </label>
</div>

<div class="summary">
  <span>{filtered.length} shown · {store.count} selected</span>
  <span class="spacer"></span>
  <button type="button" onclick={selectAllFiltered}>Select all shown</button>
  <button type="button" onclick={deselectAllFiltered}>Deselect shown</button>
</div>

{#each groups as g (g.heading + g.sub)}
  <section class="group">
    <h3>{g.heading}{g.sub ? ` · ${g.sub}` : ''}</h3>
    <div class="cards">
      {#each g.units as u (u.key)}
        <UnitCard unit={u} />
      {/each}
    </div>
  </section>
{:else}
  <p class="empty">No units match your filters.</p>
{/each}

<style>
  .controls {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  .search {
    flex: 1 1 18rem;
  }
  .chk {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--muted);
  }
  .summary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--muted);
    font-size: 0.85rem;
    margin-bottom: 0.75rem;
  }
  .summary .spacer {
    flex: 1;
  }
  .summary button {
    background: var(--panel-2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.25rem 0.6rem;
  }
  .group {
    margin-bottom: 1.25rem;
  }
  .group h3 {
    position: sticky;
    top: 0;
    background: var(--bg);
    padding: 0.4rem 0;
    margin: 0 0 0.5rem;
    border-bottom: 1px solid var(--border);
    font-size: 0.95rem;
  }
  .cards {
    display: grid;
    gap: 0.5rem;
  }
  .empty {
    color: var(--muted);
  }
</style>
