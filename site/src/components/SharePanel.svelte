<script lang="ts">
  import { store } from '../lib/store.svelte';
  import { toShareUrl, toPreset, fromPreset } from '../lib/share';

  let copied = $state(false);
  let importMsg = $state('');

  async function copyLink() {
    const url = toShareUrl(store.serialize(), location.href.split('#')[0]);
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      // clipboard blocked — fall back to a prompt
      window.prompt('Copy this share link:', url);
    }
  }

  function downloadPreset() {
    const blob = new Blob([toPreset(store.serialize())], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'standards-preset.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importPreset(e: Event) {
    importMsg = '';
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    const config = fromPreset(text);
    if (!config) {
      importMsg = 'Not a valid preset file.';
    } else {
      store.applyConfig(config);
      importMsg = 'Preset loaded.';
    }
    input.value = '';
  }
</script>

<section class="share">
  <h3>Share &amp; presets</h3>
  <div class="row">
    <button type="button" onclick={copyLink}>{copied ? 'Copied!' : 'Copy share link'}</button>
    <span class="muted small">selection + parameters (no text edits)</span>
  </div>
  <div class="row">
    <button type="button" onclick={downloadPreset}>Download preset (.json)</button>
    <label class="filebtn">
      Import preset…
      <input type="file" accept="application/json,.json" onchange={importPreset} />
    </label>
    {#if importMsg}<span class="muted small">{importMsg}</span>{/if}
  </div>
</section>

<style>
  .share {
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 0.75rem;
    background: var(--panel);
    margin-bottom: 1rem;
  }
  .share h3 { margin: 0 0 0.5rem; }
  .row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin-bottom: 0.4rem;
  }
  button {
    background: var(--panel-2);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.35rem 0.7rem;
  }
  .filebtn {
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.35rem 0.7rem;
    background: var(--panel-2);
    cursor: pointer;
  }
  .filebtn input { display: none; }
  .muted { color: var(--muted); }
  .small { font-size: 0.82rem; }
</style>
