<script lang="ts">
  import type { Unit } from '../lib/types';
  import { store } from '../lib/store.svelte';
  import Markdown from '../lib/Markdown.svelte';

  let { unit }: { unit: Unit } = $props();

  let expanded = $state(false);
  const selected = $derived(store.isSelected(unit.key));
</script>

<div class="card" class:selected>
  <label class="row">
    <input type="checkbox" checked={selected} onchange={() => store.toggle(unit.key)} />
    <span class="title">{unit.title}</span>
    {#if unit.sid}
      <span class="sid">{unit.sid}</span>
    {:else}
      <span class="badge" title="No SID assigned yet">no&nbsp;SID</span>
    {/if}
    {#if unit.kind !== 'rule'}
      <span class="badge">{unit.kind}</span>
    {/if}
    {#if unit.params.length}
      <span class="badge" title="Has tunable parameters">{unit.params.length}&nbsp;param</span>
    {/if}
    <button class="expand" type="button" onclick={() => (expanded = !expanded)}>
      {expanded ? 'Hide' : 'Preview'}
    </button>
  </label>
  <div class="meta">
    <code>{unit.id}</code> · {unit.standardTitle} · {unit.fileTitle}{unit.section
      ? ` · ${unit.section}`
      : ''}
  </div>
  {#if expanded}
    <div class="body">
      <Markdown source={unit.bodyMarkdown} />
    </div>
  {/if}
</div>

<style>
  .card {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.6rem 0.75rem;
    background: var(--panel);
  }
  .card.selected {
    border-color: var(--accent);
    background: var(--panel-2);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    cursor: pointer;
  }
  .title {
    font-weight: 600;
  }
  .meta {
    color: var(--muted);
    font-size: 0.82rem;
    margin-top: 0.3rem;
  }
  .expand {
    margin-left: auto;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--muted);
    border-radius: 6px;
    padding: 0.15rem 0.5rem;
    font-size: 0.8rem;
  }
  .body {
    margin-top: 0.5rem;
    border-top: 1px solid var(--border);
    padding-top: 0.5rem;
  }
</style>
