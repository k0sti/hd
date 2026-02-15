import { initEphemeris } from './hd';
import { loadSvgTemplate } from './bodygraph';
import { initState } from './state';
import { initUI } from './ui';
import './style.css';

async function main() {
  const app = document.getElementById('app')!;
  app.innerHTML = '<div class="flex items-center justify-center h-screen"><p class="text-gray-400">Loading ephemeris...</p></div>';

  try {
    // Initialize WASM ephemeris and load SVG template in parallel
    await Promise.all([
      initEphemeris(),
      loadSvgTemplate(),
    ]);

    // Calculate initial state
    initState();

    // Build UI
    initUI();
  } catch (err) {
    console.error('Initialization failed:', err);
    app.innerHTML = `<div class="flex items-center justify-center h-screen">
      <div class="text-center">
        <p class="text-red-500 font-medium">Failed to initialize</p>
        <p class="text-gray-400 text-sm mt-2">${err}</p>
      </div>
    </div>`;
  }
}

main();
