import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Project Pages are served from https://<user>.github.io/code-standards/.
// Use that base only for the production build; dev/preview stay at '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/code-standards/' : '/',
  plugins: [svelte()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
}));
