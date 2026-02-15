/** UI components — top bar, sidebar, person management */

import { state, subscribe, setViewMode, addPerson, removePerson, selectPersonA, selectPersonB, setTransitDate, toggleSidebar, syncFromNostr, type ViewMode } from './state';
import { renderBodygraph } from './bodygraph';
import { generateInsightReport, type InsightReport } from './hd';
import { initNostr, loginWithExtension, loginAsGuest, logout, isLoggedIn, getNpub, accountManager } from './nostr';
import { createReportQuote, waitForPayment, getReportPrice, type PaymentQuote } from './payment';

let currentReport: InsightReport | null = null;

// Timezone presets for common locations
const TZ_PRESETS: Record<string, number> = {
  'UTC': 0, 'US/Eastern': -5, 'US/Central': -6, 'US/Pacific': -8,
  'Europe/London': 0, 'Europe/Helsinki': 2, 'Europe/Berlin': 1,
  'Asia/Tokyo': 9, 'Asia/Kolkata': 5.5, 'Australia/Sydney': 11,
};

export function initUI(): void {
  initNostr();

  const app = document.getElementById('app')!;
  app.innerHTML = buildLayout();

  // Wire up event handlers
  setupEventHandlers();

  // Subscribe to state changes
  subscribe(render);

  // Initial render
  render();
  updateProfileButton();
}

function updateProfileButton(): void {
  const btn = document.getElementById('profile-btn');
  if (!btn) return;

  if (isLoggedIn()) {
    btn.classList.remove('bg-gray-200', 'hover:bg-gray-300');
    btn.classList.add('bg-purple-200', 'hover:bg-purple-300');
    btn.innerHTML = `<svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
  } else {
    btn.classList.add('bg-gray-200', 'hover:bg-gray-300');
    btn.classList.remove('bg-purple-200', 'hover:bg-purple-300');
    btn.innerHTML = `<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`;
  }
}

function buildLayout(): string {
  return `
    <div class="flex flex-col h-screen">
      <!-- Top Bar -->
      <header class="bg-white shadow-sm border-b border-gray-200 px-4 py-2 flex items-center gap-4 flex-shrink-0 z-10">
        <button id="sidebar-toggle" class="p-2 hover:bg-gray-100 rounded-lg lg:hidden" title="Toggle sidebar">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <h1 class="text-lg font-semibold text-gray-700 hidden sm:block">Human Design</h1>
        <div class="flex items-center gap-2 ml-auto">
          <div id="view-mode-selector" class="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button data-mode="transit" class="view-btn px-3 py-1 text-sm rounded-md transition-colors">Transit</button>
            <button data-mode="single" class="view-btn px-3 py-1 text-sm rounded-md transition-colors">Person</button>
            <button data-mode="person-transit" class="view-btn px-3 py-1 text-sm rounded-md transition-colors">+Transit</button>
            <button data-mode="person-person" class="view-btn px-3 py-1 text-sm rounded-md transition-colors">+Person</button>
          </div>
          <input type="datetime-local" id="transit-datetime" class="text-sm border rounded px-2 py-1 hidden sm:block" />
          <button id="profile-btn" class="ml-2 w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center overflow-hidden transition-colors" title="Login / Profile">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </button>
        </div>
      </header>

      <div class="flex flex-1 overflow-hidden">
        <!-- Main Area -->
        <main class="flex-1 flex items-center justify-center overflow-auto p-4" style="background-color:#C1C0BF">
          <div id="bodygraph-container" class="w-full max-w-2xl"></div>
        </main>

        <!-- Sidebar -->
        <aside id="sidebar" class="w-80 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0 transition-all duration-200">
          <div class="p-4">
            <div id="chart-info" class="mb-6"></div>
            <div id="person-management" class="mb-6">
              <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Charts</h3>
              <div id="person-list" class="space-y-2 mb-3"></div>
              <button id="add-person-btn" class="w-full py-2 px-3 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                + Add Chart
              </button>
            </div>
            <div id="add-person-form" class="hidden bg-gray-50 rounded-lg p-3 mb-4">
              <h4 class="text-sm font-semibold mb-2">New Chart</h4>
              <div class="space-y-2">
                <input id="person-name" type="text" placeholder="Name (optional)" class="w-full text-sm border rounded px-2 py-1" />
                <input id="person-date" type="date" class="w-full text-sm border rounded px-2 py-1" />
                <div class="flex gap-2">
                  <input id="person-time" type="time" value="12:00" class="flex-1 text-sm border rounded px-2 py-1" />
                  <select id="person-tz" class="flex-1 text-sm border rounded px-2 py-1">
                    ${Object.entries(TZ_PRESETS).map(([name, offset]) =>
                      `<option value="${offset}" ${name === 'Europe/Helsinki' ? 'selected' : ''}>${name} (${offset >= 0 ? '+' : ''}${offset})</option>`
                    ).join('')}
                  </select>
                </div>
                <div class="flex gap-2">
                  <button id="save-person-btn" class="flex-1 py-1 px-3 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
                  <button id="cancel-person-btn" class="flex-1 py-1 px-3 text-sm bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                </div>
              </div>
            </div>
            <div id="insight-section" class="mb-6 hidden">
              <button id="insight-btn" class="w-full py-2 px-3 text-sm bg-indigo-500 text-white hover:bg-indigo-600 rounded-lg transition-colors">
                Generate Insight Report
              </button>
            </div>
            <div id="gates-info" class="mb-6"></div>
            <div id="channels-info"></div>
          </div>
        </aside>
      </div>
    </div>

    <!-- Login Modal -->
    <div id="login-modal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl w-80">
        <div class="p-6 text-center">
          <h2 class="text-lg font-semibold mb-4">Login to Nostr</h2>
          <div class="space-y-3">
            <button id="login-extension-btn" class="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
              Login with Extension (NIP-07)
            </button>
            <button id="login-guest-btn" class="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
              Continue as Guest
            </button>
            <button id="cancel-login-btn" class="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              Cancel
            </button>
          </div>
          <p id="login-error" class="mt-3 text-xs text-red-500 hidden"></p>
        </div>
      </div>
    </div>

    <!-- Profile Modal -->
    <div id="profile-modal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl w-80">
        <div class="p-6 text-center">
          <div class="w-16 h-16 rounded-full bg-purple-100 mx-auto mb-3 flex items-center justify-center">
            <svg class="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <p id="profile-npub" class="text-xs font-mono text-gray-500 break-all mb-4"></p>
          <div class="space-y-2">
            <button id="logout-btn" class="w-full py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm">
              Logout
            </button>
            <button id="close-profile-btn" class="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <div id="payment-modal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl w-96">
        <div class="p-6 text-center">
          <h2 class="text-lg font-semibold mb-2">Pay for Insight Report</h2>
          <p class="text-sm text-gray-500 mb-4">${getReportPrice()} sats</p>
          <div id="payment-invoice-section" class="mb-4">
            <p class="text-xs text-gray-500 mb-2">Pay this Lightning invoice:</p>
            <div id="payment-invoice" class="bg-gray-50 rounded-lg p-3 text-xs font-mono break-all cursor-pointer hover:bg-gray-100 transition-colors" title="Click to copy"></div>
            <p id="payment-copied" class="text-xs text-green-500 mt-1 hidden">Copied!</p>
          </div>
          <div id="payment-status" class="text-sm text-gray-600 mb-4">
            <span id="payment-waiting" class="hidden">Waiting for payment...</span>
            <span id="payment-success" class="hidden text-green-600 font-medium">Payment received!</span>
            <span id="payment-timeout" class="hidden text-red-500">Payment timed out</span>
          </div>
          <button id="cancel-payment-btn" class="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Insight Report Modal -->
    <div id="insight-modal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between p-4 border-b">
          <h2 class="text-lg font-semibold">Transit Insight Report</h2>
          <button id="close-insight-modal" class="p-1 hover:bg-gray-100 rounded">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div id="insight-report-content" class="p-4 overflow-y-auto flex-1 text-sm whitespace-pre-wrap font-mono leading-relaxed"></div>
      </div>
    </div>
  `;
}

function setupEventHandlers(): void {
  // View mode buttons
  document.querySelectorAll('.view-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = (btn as HTMLElement).dataset.mode as ViewMode;
      setViewMode(mode);
    });
  });

  // Transit datetime
  const dtInput = document.getElementById('transit-datetime') as HTMLInputElement;
  if (dtInput) {
    // Set initial value
    const now = new Date();
    dtInput.value = toLocalDatetimeString(now);
    dtInput.addEventListener('change', () => {
      setTransitDate(new Date(dtInput.value));
    });
  }

  // Sidebar toggle
  document.getElementById('sidebar-toggle')?.addEventListener('click', toggleSidebar);

  // Add person
  document.getElementById('add-person-btn')?.addEventListener('click', () => {
    document.getElementById('add-person-form')?.classList.remove('hidden');
  });

  document.getElementById('cancel-person-btn')?.addEventListener('click', () => {
    document.getElementById('add-person-form')?.classList.add('hidden');
  });

  // Insight report — show payment modal first
  document.getElementById('insight-btn')?.addEventListener('click', async () => {
    const personA = state.selectedPersonA ? state.personCharts.get(state.selectedPersonA) : null;
    if (!personA) return;

    // Show payment modal
    const paymentModal = document.getElementById('payment-modal');
    const invoiceEl = document.getElementById('payment-invoice');
    const waitingEl = document.getElementById('payment-waiting');
    const successEl = document.getElementById('payment-success');
    const timeoutEl = document.getElementById('payment-timeout');
    if (!paymentModal || !invoiceEl || !waitingEl || !successEl || !timeoutEl) return;

    // Reset payment state
    waitingEl.classList.add('hidden');
    successEl.classList.add('hidden');
    timeoutEl.classList.add('hidden');
    invoiceEl.textContent = 'Loading...';
    paymentModal.classList.remove('hidden');

    try {
      const quote = await createReportQuote();
      invoiceEl.textContent = quote.request;
      waitingEl.classList.remove('hidden');

      // Copy on click
      invoiceEl.onclick = () => {
        navigator.clipboard.writeText(quote.request).then(() => {
          const copiedEl = document.getElementById('payment-copied');
          if (copiedEl) {
            copiedEl.classList.remove('hidden');
            setTimeout(() => copiedEl.classList.add('hidden'), 2000);
          }
        });
      };

      // Wait for payment
      const paid = await waitForPayment(quote.quoteId);
      waitingEl.classList.add('hidden');

      if (paid) {
        successEl.classList.remove('hidden');
        // Generate and show report
        setTimeout(() => {
          paymentModal.classList.add('hidden');
          showInsightReport(personA);
        }, 1000);
      } else {
        timeoutEl.classList.remove('hidden');
      }
    } catch (e: any) {
      invoiceEl.textContent = 'Error: ' + (e.message || 'Could not create invoice');
    }
  });

  document.getElementById('close-insight-modal')?.addEventListener('click', () => {
    document.getElementById('insight-modal')?.classList.add('hidden');
  });

  document.getElementById('insight-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      document.getElementById('insight-modal')?.classList.add('hidden');
    }
  });

  document.getElementById('cancel-payment-btn')?.addEventListener('click', () => {
    document.getElementById('payment-modal')?.classList.add('hidden');
  });

  document.getElementById('payment-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      (e.currentTarget as HTMLElement).classList.add('hidden');
    }
  });

  // Profile / Login button
  document.getElementById('profile-btn')?.addEventListener('click', () => {
    if (isLoggedIn()) {
      const npub = getNpub();
      const npubEl = document.getElementById('profile-npub');
      if (npubEl && npub) npubEl.textContent = npub;
      document.getElementById('profile-modal')?.classList.remove('hidden');
    } else {
      document.getElementById('login-modal')?.classList.remove('hidden');
    }
  });

  document.getElementById('login-extension-btn')?.addEventListener('click', async () => {
    const errorEl = document.getElementById('login-error');
    try {
      await loginWithExtension();
      document.getElementById('login-modal')?.classList.add('hidden');
      if (errorEl) errorEl.classList.add('hidden');
      updateProfileButton();
      syncFromNostr().catch(() => {});
    } catch (e: any) {
      if (errorEl) {
        errorEl.textContent = e.message || 'Extension not found. Install a NIP-07 extension.';
        errorEl.classList.remove('hidden');
      }
    }
  });

  document.getElementById('login-guest-btn')?.addEventListener('click', () => {
    loginAsGuest();
    document.getElementById('login-modal')?.classList.add('hidden');
    updateProfileButton();
    syncFromNostr().catch(() => {});
  });

  document.getElementById('cancel-login-btn')?.addEventListener('click', () => {
    document.getElementById('login-modal')?.classList.add('hidden');
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    logout();
    document.getElementById('profile-modal')?.classList.add('hidden');
    updateProfileButton();
  });

  document.getElementById('close-profile-btn')?.addEventListener('click', () => {
    document.getElementById('profile-modal')?.classList.add('hidden');
  });

  // Close modals on backdrop click
  for (const id of ['login-modal', 'profile-modal']) {
    document.getElementById(id)?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        (e.currentTarget as HTMLElement).classList.add('hidden');
      }
    });
  }

  document.getElementById('save-person-btn')?.addEventListener('click', () => {
    const name = (document.getElementById('person-name') as HTMLInputElement).value || 'Unnamed';
    const dateStr = (document.getElementById('person-date') as HTMLInputElement).value;
    const timeStr = (document.getElementById('person-time') as HTMLInputElement).value;
    const tzOffset = parseFloat((document.getElementById('person-tz') as HTMLSelectElement).value);

    if (!dateStr) return;

    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);

    addPerson({ name, year, month, day, hour, minute, tzOffset });

    // Reset form
    (document.getElementById('person-name') as HTMLInputElement).value = '';
    document.getElementById('add-person-form')?.classList.add('hidden');
  });
}

function render(): void {
  // Update view mode buttons
  document.querySelectorAll('.view-btn').forEach((btn) => {
    const mode = (btn as HTMLElement).dataset.mode;
    if (mode === state.viewMode) {
      btn.classList.add('bg-white', 'shadow-sm', 'font-medium');
      btn.classList.remove('text-gray-500');
    } else {
      btn.classList.remove('bg-white', 'shadow-sm', 'font-medium');
      btn.classList.add('text-gray-500');
    }
  });

  // Sidebar visibility
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    if (state.sidebarOpen) {
      sidebar.classList.remove('hidden');
    } else {
      sidebar.classList.add('hidden');
    }
  }

  // Render bodygraph
  const container = document.getElementById('bodygraph-container');
  if (container) {
    renderBodygraph(container, state);
  }

  // Show insight button when person + transit available
  const insightSection = document.getElementById('insight-section');
  if (insightSection) {
    const showInsight = state.selectedPersonA && (state.viewMode === 'person-transit' || state.viewMode === 'single');
    insightSection.classList.toggle('hidden', !showInsight);
  }

  // Render chart info in sidebar
  renderChartInfo();
  renderPersonList();
  renderGatesInfo();
  renderChannelsInfo();
}

function renderChartInfo(): void {
  const el = document.getElementById('chart-info');
  if (!el) return;

  const personA = state.selectedPersonA ? state.personCharts.get(state.selectedPersonA) : null;

  if (state.viewMode === 'transit') {
    el.innerHTML = `
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Transit</h3>
      <p class="text-sm text-gray-600">${formatDateISO(state.transitDate)}</p>
    `;
  } else if (personA) {
    const a = personA.analysis;
    const cross = a.incarnationCross;
    el.innerHTML = `
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">${personA.person.name}</h3>
      <div class="space-y-1 text-sm">
        <div><span class="text-gray-500">Type:</span> <span class="font-medium" data-testid="chart-type">${a.type}</span></div>
        <div><span class="text-gray-500">Authority:</span> <span class="font-medium" data-testid="chart-authority">${a.authority}</span></div>
        <div><span class="text-gray-500">Profile:</span> <span class="font-medium" data-testid="chart-profile">${a.profile[0]}/${a.profile[1]}</span></div>
        <div><span class="text-gray-500">Cross:</span> <span class="font-medium">${cross[0]}-${cross[1]} / ${cross[2]}-${cross[3]}</span></div>
      </div>
    `;

    if (state.viewMode === 'person-person') {
      const personB = state.selectedPersonB ? state.personCharts.get(state.selectedPersonB) : null;
      if (personB) {
        const b = personB.analysis;
        const crossB = b.incarnationCross;
        el.innerHTML += `
          <div class="mt-4 pt-4 border-t">
            <h3 class="text-sm font-semibold text-blue-500 uppercase tracking-wide mb-2">${personB.person.name}</h3>
            <div class="space-y-1 text-sm">
              <div><span class="text-gray-500">Type:</span> <span class="font-medium">${b.type}</span></div>
              <div><span class="text-gray-500">Authority:</span> <span class="font-medium">${b.authority}</span></div>
              <div><span class="text-gray-500">Profile:</span> <span class="font-medium">${b.profile[0]}/${b.profile[1]}</span></div>
              <div><span class="text-gray-500">Cross:</span> <span class="font-medium">${crossB[0]}-${crossB[1]} / ${crossB[2]}-${crossB[3]}</span></div>
            </div>
          </div>
        `;
      }
    }
  } else {
    el.innerHTML = '<p class="text-sm text-gray-400">No chart selected</p>';
  }
}

function renderPersonList(): void {
  const el = document.getElementById('person-list');
  if (!el) return;

  el.innerHTML = state.persons.map((p) => {
    const isA = p.id === state.selectedPersonA;
    const isB = p.id === state.selectedPersonB;
    const activeClass = isA ? 'ring-2 ring-gray-400' : isB ? 'ring-2 ring-blue-400' : '';

    return `
      <div class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 ${activeClass}" data-person-id="${p.id}">
        <button class="select-person-a flex-1 text-left text-sm font-medium truncate" data-id="${p.id}">${p.name}</button>
        <button class="select-person-b text-xs px-2 py-1 rounded ${isB ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}" data-id="${p.id}" title="Select as Person B">B</button>
        <button class="remove-person text-gray-400 hover:text-red-500" data-id="${p.id}" title="Remove">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    `;
  }).join('');

  // Wire up person buttons
  el.querySelectorAll('.select-person-a').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.id!;
      selectPersonA(id);
      if (state.viewMode === 'transit') setViewMode('single');
    });
  });

  el.querySelectorAll('.select-person-b').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.id!;
      if (state.selectedPersonB === id) {
        selectPersonB(null);
      } else {
        selectPersonB(id);
        setViewMode('person-person');
      }
    });
  });

  el.querySelectorAll('.remove-person').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.id!;
      removePerson(id);
    });
  });
}

function renderGatesInfo(): void {
  const el = document.getElementById('gates-info');
  if (!el) return;

  let activations: { planet: string; gate: number; line: number; source: string }[] = [];

  if (state.viewMode === 'transit') {
    activations = state.transitActivations.map((a) => ({ ...a, source: 'transit' }));
  } else {
    const personA = state.selectedPersonA ? state.personCharts.get(state.selectedPersonA) : null;
    if (personA) {
      activations = [
        ...personA.chart.personality.map((a) => ({ ...a, source: 'personality' })),
        ...personA.chart.design.map((a) => ({ ...a, source: 'design' })),
      ];
    }
  }

  if (activations.length === 0) {
    el.innerHTML = '';
    return;
  }

  el.innerHTML = `
    <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Active Gates</h3>
    <div class="space-y-1 text-xs">
      ${activations.map((a) => {
        const colorClass = a.source === 'personality' ? 'text-gray-800' :
                          a.source === 'design' ? 'text-red-700' : 'text-green-600';
        const tag = a.source === 'personality' ? 'P' : a.source === 'design' ? 'D' : 'T';
        return `<div class="flex justify-between ${colorClass}">
          <span>${a.planet}</span>
          <span class="font-mono">Gate ${a.gate}.${a.line}</span>
          <span class="text-xs opacity-60">${tag}</span>
        </div>`;
      }).join('')}
    </div>
  `;
}

function renderChannelsInfo(): void {
  const el = document.getElementById('channels-info');
  if (!el) return;

  const personA = state.selectedPersonA ? state.personCharts.get(state.selectedPersonA) : null;

  if (!personA || state.viewMode === 'transit') {
    el.innerHTML = '';
    return;
  }

  const channels = personA.analysis.definedChannels;
  if (channels.length === 0) {
    el.innerHTML = '';
    return;
  }

  el.innerHTML = `
    <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Defined Channels</h3>
    <div class="space-y-1 text-xs" data-testid="channels-list">
      ${channels.map((ch) => `
        <div class="flex justify-between">
          <span class="font-mono font-medium" data-testid="channel">${ch.gate1}-${ch.gate2}</span>
          <span class="text-gray-500">${ch.name}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function showInsightReport(personChart: { person: { name: string }; chart: any; analysis: any }): void {
  currentReport = generateInsightReport(
    personChart.person.name,
    personChart.chart,
    personChart.analysis,
    state.transitActivations,
  );

  const modal = document.getElementById('insight-modal');
  const content = document.getElementById('insight-report-content');
  if (modal && content) {
    content.textContent = currentReport.fullText;
    modal.classList.remove('hidden');
  }
}

function toLocalDatetimeString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
