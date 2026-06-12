<script lang="ts">
  import { marked } from 'marked';

  let { source }: { source: string } = $props();

  // Content is first-party (our own standards markdown), so rendering it is safe here.
  const html = $derived(marked.parse(source, { async: false }) as string);
</script>

<div class="markdown">{@html html}</div>
