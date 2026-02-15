/** Application state management */

import { calculateChart, calculateTransit, analyze, type Chart, type Activation, type ChartAnalysis } from './hd';
import { isLoggedIn, saveChartsToNostr, loadChartsFromNostr } from './nostr';

export type ViewMode = 'transit' | 'single' | 'person-transit' | 'person-person';

export interface PersonData {
  id: string;
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  tzOffset: number; // hours from UTC
}

export interface PersonChart {
  person: PersonData;
  chart: Chart;
  analysis: ChartAnalysis;
}

export interface AppState {
  viewMode: ViewMode;
  persons: PersonData[];
  selectedPersonA: string | null; // person id
  selectedPersonB: string | null; // person id
  transitDate: Date;
  transitActivations: Activation[];
  personCharts: Map<string, PersonChart>;
  sidebarOpen: boolean;
}

const STORAGE_KEY = 'hd-app-persons';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function loadPersons(): PersonData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function savePersons(persons: PersonData[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persons));
  // Also save to Nostr if logged in (fire and forget)
  if (isLoggedIn()) {
    saveChartsToNostr(persons).catch(() => {});
  }
}

/** Sync charts from Nostr (merges with local data) */
export async function syncFromNostr(): Promise<void> {
  const remote = await loadChartsFromNostr();
  if (!remote || remote.length === 0) return;

  // Merge: add remote persons that don't exist locally (by matching name+date)
  const localIds = new Set(state.persons.map((p) => `${p.name}-${p.year}-${p.month}-${p.day}`));
  let added = false;

  for (const p of remote) {
    const key = `${p.name}-${p.year}-${p.month}-${p.day}`;
    if (!localIds.has(key)) {
      const person: PersonData = { ...p, id: p.id || generateId() };
      state.persons.push(person);
      const chart = calculateChart(person.year, person.month, person.day, person.hour, person.minute, person.tzOffset);
      const analysis = analyze(chart);
      state.personCharts.set(person.id, { person, chart, analysis });
      added = true;
    }
  }

  if (added) {
    savePersons(state.persons);
    if (!state.selectedPersonA && state.persons.length > 0) {
      state.selectedPersonA = state.persons[0].id;
    }
    notify();
  }
}

// Global state
export const state: AppState = {
  viewMode: 'transit',
  persons: loadPersons(),
  selectedPersonA: null,
  selectedPersonB: null,
  transitDate: new Date(),
  transitActivations: [],
  personCharts: new Map(),
  sidebarOpen: true,
};

// Listeners
type Listener = () => void;
const listeners: Listener[] = [];

export function subscribe(fn: Listener): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

function notify(): void {
  for (const fn of listeners) fn();
}

// Actions
export function setViewMode(mode: ViewMode): void {
  state.viewMode = mode;
  notify();
}

export function addPerson(data: Omit<PersonData, 'id'>): PersonData {
  const person: PersonData = { ...data, id: generateId() };
  state.persons.push(person);
  savePersons(state.persons);

  // Calculate chart
  const chart = calculateChart(person.year, person.month, person.day, person.hour, person.minute, person.tzOffset);
  const analysis = analyze(chart);
  state.personCharts.set(person.id, { person, chart, analysis });

  // Auto-select if first person
  if (!state.selectedPersonA) {
    state.selectedPersonA = person.id;
    state.viewMode = 'single';
  }

  notify();
  return person;
}

export function removePerson(id: string): void {
  state.persons = state.persons.filter((p) => p.id !== id);
  state.personCharts.delete(id);
  savePersons(state.persons);

  if (state.selectedPersonA === id) state.selectedPersonA = state.persons[0]?.id || null;
  if (state.selectedPersonB === id) state.selectedPersonB = null;

  if (!state.selectedPersonA) state.viewMode = 'transit';
  notify();
}

export function selectPersonA(id: string | null): void {
  state.selectedPersonA = id;
  if (!id) state.viewMode = 'transit';
  notify();
}

export function selectPersonB(id: string | null): void {
  state.selectedPersonB = id;
  notify();
}

export function setTransitDate(date: Date): void {
  state.transitDate = date;
  state.transitActivations = calculateTransit(date);
  notify();
}

export function toggleSidebar(): void {
  state.sidebarOpen = !state.sidebarOpen;
  notify();
}

/** Initialize state: load saved persons and calculate their charts */
export function initState(): void {
  // Calculate transit
  state.transitActivations = calculateTransit(state.transitDate);

  // Calculate charts for all saved persons
  for (const person of state.persons) {
    const chart = calculateChart(person.year, person.month, person.day, person.hour, person.minute, person.tzOffset);
    const analysis = analyze(chart);
    state.personCharts.set(person.id, { person, chart, analysis });
  }

  // Auto-select first person if any
  if (state.persons.length > 0 && !state.selectedPersonA) {
    state.selectedPersonA = state.persons[0].id;
  }

  notify();
}
