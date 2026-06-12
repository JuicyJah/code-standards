<script lang="ts">
  import { store } from './lib/store.svelte';
  import BrowseView from './components/BrowseView.svelte';
  import CustomizeView from './components/CustomizeView.svelte';
  import ExportView from './components/ExportView.svelte';

  type Tab = 'browse' | 'customize' | 'export';
  let tab = $state<Tab>('browse');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'browse', label: 'Browse & select' },
    { id: 'customize', label: 'Customize' },
    { id: 'export', label: 'Export' },
  ];
</script>

<header>
  <div class="brand">
    <h1>Standards Builder</h1>
    <p>Select rules from the code &amp; API standards, customize them, export a markdown pack.</p>
  </div>
  <nav>
    {#each tabs as t (t.id)}
      <button class:active={tab === t.id} onclick={() => (tab = t.id)}>
        {t.label}
        {#if t.id !== 'browse' && store.count}<span class="count">{store.count}</span>{/if}
      </button>
    {/each}
  </nav>
</header>

<main>
  {#if tab === 'browse'}
    <BrowseView />
  {:else if tab === 'customize'}
    <CustomizeView />
  {:else}
    <ExportView />
  {/if}
</main>

<style>
  header {
    border-bottom: 1px solid var(--border);
    padding: 1rem 1.25rem 0;
    position: sticky;
    top: 0;
    background: var(--bg);
    z-index: 2;
  }
  .brand h1 {
    margin: 0;
    font-size: 1.25rem;
  }
  .brand p {
    margin: 0.2rem 0 0.75rem;
    color: var(--muted);
    font-size: 0.9rem;
  }
  nav {
    display: flex;
    gap: 0.25rem;
  }
  nav button {
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--muted);
    padding: 0.5rem 0.75rem;
    font-size: 0.95rem;
  }
  nav button.active {
    color: var(--text);
    border-bottom-color: var(--accent);
  }
  .count {
    display: inline-block;
    min-width: 1.2rem;
    text-align: center;
    background: var(--accent-dim);
    color: var(--accent);
    border-radius: 999px;
    font-size: 0.75rem;
    padding: 0 0.35rem;
    margin-left: 0.3rem;
  }
  main {
    max-width: 60rem;
    margin: 0 auto;
    padding: 1.25rem;
  }
</style>
