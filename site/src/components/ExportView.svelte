<script lang="ts">
  import { catalog } from '../lib/catalog';
  import { store } from '../lib/store.svelte';
  import { buildFileMap, buildCombined, selectionCount, type BuildInput } from '../lib/export/build';
  import { zipFileMap, downloadBlob, zipFilename } from '../lib/export/zip';

  let layout = $state<'combined' | 'mirrored'>('combined');
  let busy = $state(false);
  let error = $state('');

  const input = $derived<BuildInput>({
    catalog,
    selected: store.selected,
    overrides: store.overrides,
    params: store.params,
    org: store.org,
  });

  const count = $derived(selectionCount(input));
  const fileMap = $derived(buildFileMap(input, layout));
  const paths = $derived(Object.keys(fileMap).sort());
  const combinedPreview = $derived(layout === 'combined' ? buildCombined(input) : '');

  async function download() {
    error = '';
    busy = true;
    try {
      const blob = await zipFileMap(fileMap);
      downloadBlob(blob, zipFilename(store.org.name));
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      busy = false;
    }
  }
</script>

{#if count === 0}
  <p class="muted">Nothing selected yet. Pick rules on the “Browse &amp; select” tab.</p>
{:else}
  <section class="controls">
    <fieldset>
      <legend>Layout</legend>
      <label><input type="radio" value="combined" bind:group={layout} /> Single combined file (<code>STANDARD.md</code>)</label>
      <label><input type="radio" value="mirrored" bind:group={layout} /> Mirror source folders (trimmed)</label>
    </fieldset>
    <button class="primary" type="button" onclick={download} disabled={busy}>
      {busy ? 'Building…' : `Download zip (${count} unit${count === 1 ? '' : 's'})`}
    </button>
  </section>

  {#if error}<p class="error">Export failed: {error}</p>{/if}

  <section class="files">
    <h3>{paths.length} file{paths.length === 1 ? '' : 's'} in the zip</h3>
    <ul>
      {#each paths as p (p)}<li><code>{p}</code></li>{/each}
    </ul>
  </section>

  {#if layout === 'combined'}
    <section class="preview">
      <h3>Preview — <code>STANDARD.md</code></h3>
      <pre>{combinedPreview}</pre>
    </section>
  {/if}
{/if}

<style>
  .muted { color: var(--muted); }
  .controls {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  fieldset {
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  fieldset label { display: block; }
  .primary {
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.6rem 1rem;
    font-weight: 600;
  }
  .primary:disabled { opacity: 0.6; }
  .error { color: #ff6b6b; }
  .files ul { columns: 2; font-size: 0.85rem; }
  .preview pre {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.75rem;
    max-height: 24rem;
    overflow: auto;
    white-space: pre-wrap;
    font-size: 0.8rem;
  }
</style>
