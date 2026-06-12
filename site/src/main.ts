import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { store } from './lib/store.svelte';
import { fromUrlHash } from './lib/share';

// A shared link (#c=…) takes precedence over restored localStorage; overrides are kept
// since the URL form intentionally omits them.
const urlConfig = fromUrlHash(location.hash);
if (urlConfig) store.applyConfig(urlConfig);

const app = mount(App, { target: document.getElementById('app')! });

export default app;
