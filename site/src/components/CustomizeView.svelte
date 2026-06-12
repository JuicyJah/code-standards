<script lang="ts">
  import { units } from '../lib/catalog';
  import { store } from '../lib/store.svelte';
  import { renderBody } from '../lib/export/render';
  import Markdown from '../lib/Markdown.svelte';

  const selectedUnits = $derived(units.filter((u) => store.isSelected(u.key)));

  let preview = $state<Record<string, boolean>>({});

  function paramValue(key: string, id: string, def: string): string {
    return store.getParam(key, id) ?? def;
  }
</script>

{#if selectedUnits.length === 0}
  <p class="muted">Nothing selected yet. Pick rules on the “Browse &amp; select” tab.</p>
{:else}
  <section class="org">
    <h3>Organization &amp; branding</h3>
    <label>Org name
      <input
        type="text"
        placeholder="Acme"
        value={store.org.name}
        oninput={(e) => store.setOrg({ name: e.currentTarget.value })}
      />
    </label>
    <label>Preamble (markdown)
      <textarea
        rows="3"
        placeholder="Intro shown at the top of your standard…"
        value={store.org.preamble}
        oninput={(e) => store.setOrg({ preamble: e.currentTarget.value })}
      ></textarea>
    </label>
    <label>Footer (markdown)
      <textarea
        rows="2"
        placeholder="Optional footer / attribution…"
        value={store.org.footer}
        oninput={(e) => store.setOrg({ footer: e.currentTarget.value })}
      ></textarea>
    </label>
  </section>

  <p class="muted">{selectedUnits.length} selected unit(s). Edits below are saved automatically.</p>

  {#each selectedUnits as u (u.key)}
    <section class="unit">
      <header>
        <strong>{u.title}</strong>
        {#if u.sid}<span class="sid">{u.sid}</span>{/if}
        <span class="muted small">{u.standardTitle}{u.section ? ` · ${u.section}` : ''}</span>
        <button class="link" type="button" onclick={() => (preview[u.key] = !preview[u.key])}>
          {preview[u.key] ? 'Hide preview' : 'Preview'}
        </button>
      </header>

      {#if u.params.length}
        <div class="params">
          {#each u.params as p (p.id)}
            <label class="param">
              <span>{p.label}</span>
              <span class="paramrow">
                <input
                  type="text"
                  value={paramValue(u.key, p.id, p.default)}
                  oninput={(e) => store.setParam(u.key, p.id, e.currentTarget.value)}
                />
                {#if store.getParam(u.key, p.id) !== undefined && store.getParam(u.key, p.id) !== p.default}
                  <button class="link" type="button" onclick={() => store.clearParam(u.key, p.id)}>
                    reset → {p.default}
                  </button>
                {/if}
              </span>
            </label>
          {/each}
        </div>
      {/if}

      <label class="override">
        <span class="muted small">Rule text {store.getOverride(u.key) !== undefined ? '(edited)' : ''}</span>
        <textarea
          rows="5"
          value={store.getOverride(u.key) ?? u.bodyMarkdown}
          oninput={(e) => store.setOverride(u.key, e.currentTarget.value)}
        ></textarea>
      </label>
      {#if store.getOverride(u.key) !== undefined}
        <button class="link" type="button" onclick={() => store.clearOverride(u.key)}>
          revert to original text
        </button>
      {/if}

      {#if preview[u.key]}
        <div class="previewbox">
          <Markdown source={renderBody(u, store.getOverride(u.key), store.params[u.key])} />
        </div>
      {/if}
    </section>
  {/each}
{/if}

<style>
  .muted { color: var(--muted); }
  .small { font-size: 0.82rem; }
  .org,
  .unit {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.75rem;
    background: var(--panel);
    margin-bottom: 0.75rem;
  }
  .org h3 { margin: 0 0 0.5rem; }
  .org label,
  .override {
    display: block;
    margin-bottom: 0.5rem;
  }
  .org input,
  .org textarea { width: 100%; margin-top: 0.2rem; }
  .unit header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }
  .params {
    display: grid;
    gap: 0.4rem;
    margin-bottom: 0.5rem;
  }
  .param { display: grid; gap: 0.2rem; }
  .param > span:first-child { font-size: 0.85rem; color: var(--muted); }
  .paramrow { display: flex; align-items: center; gap: 0.5rem; }
  .paramrow input { flex: 0 0 12rem; }
  .override textarea { margin-top: 0.2rem; }
  .link {
    background: transparent;
    border: none;
    color: var(--accent);
    padding: 0;
    font-size: 0.82rem;
  }
  .previewbox {
    border-top: 1px solid var(--border);
    margin-top: 0.5rem;
    padding-top: 0.5rem;
  }
</style>
