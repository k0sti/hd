import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import { calculateChart, calculateTransit, analyze, type Chart, type Activation, type ChartAnalysis } from '../hd';
import { isLoggedIn, saveChartsToNostr, loadChartsFromNostr, checkIncomingGiftWraps, saveReceivedBirthData, loadReceivedBirthData, type BirthDataPayload } from '../nostr';

export type ViewMode = 'transit' | 'single' | 'person-transit' | 'person-person';

export interface PersonData {
  id: string;
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  tzOffset: number;
  sharedBy?: string; // npub or pubkey of person who shared this data
}

export interface PersonChart {
  person: PersonData;
  chart: Chart;
  analysis: ChartAnalysis;
}

export interface AppState {
  viewMode: ViewMode;
  persons: PersonData[];
  selectedPersonA: string | null;
  selectedPersonB: string | null;
  transitDate: Date;
  transitActivations: Activation[];
  personCharts: Map<string, PersonChart>;
  sidebarOpen: boolean;
}

type Action =
  | { type: 'SET_VIEW_MODE'; mode: ViewMode }
  | { type: 'ADD_PERSON'; person: PersonData; chart: Chart; analysis: ChartAnalysis }
  | { type: 'REMOVE_PERSON'; id: string }
  | { type: 'SELECT_PERSON_A'; id: string | null }
  | { type: 'SELECT_PERSON_B'; id: string | null }
  | { type: 'SET_TRANSIT'; date: Date; activations: Activation[] }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SYNC_PERSONS'; persons: PersonData[]; charts: Map<string, PersonChart> };

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
  if (isLoggedIn()) {
    saveChartsToNostr(persons).catch(() => {});
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.mode };

    case 'ADD_PERSON': {
      const persons = [...state.persons, action.person];
      const personCharts = new Map(state.personCharts);
      personCharts.set(action.person.id, { person: action.person, chart: action.chart, analysis: action.analysis });
      const isFirst = !state.selectedPersonA;
      return {
        ...state,
        persons,
        personCharts,
        selectedPersonA: isFirst ? action.person.id : state.selectedPersonA,
        viewMode: isFirst ? 'single' : state.viewMode,
      };
    }

    case 'REMOVE_PERSON': {
      const persons = state.persons.filter((p) => p.id !== action.id);
      const personCharts = new Map(state.personCharts);
      personCharts.delete(action.id);
      let selectedA = state.selectedPersonA === action.id ? (persons[0]?.id || null) : state.selectedPersonA;
      let selectedB = state.selectedPersonB === action.id ? null : state.selectedPersonB;
      return {
        ...state,
        persons,
        personCharts,
        selectedPersonA: selectedA,
        selectedPersonB: selectedB,
        viewMode: !selectedA ? 'transit' : state.viewMode,
      };
    }

    case 'SELECT_PERSON_A':
      return {
        ...state,
        selectedPersonA: action.id,
        viewMode: !action.id ? 'transit' : state.viewMode,
      };

    case 'SELECT_PERSON_B':
      return { ...state, selectedPersonB: action.id };

    case 'SET_TRANSIT':
      return { ...state, transitDate: action.date, transitActivations: action.activations };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case 'SYNC_PERSONS':
      return {
        ...state,
        persons: action.persons,
        personCharts: action.charts,
        selectedPersonA: state.selectedPersonA || (action.persons.length > 0 ? action.persons[0].id : null),
      };

    default:
      return state;
  }
}

function createInitialState(): AppState {
  const persons = loadPersons();
  const personCharts = new Map<string, PersonChart>();
  const now = new Date();
  const transitActivations = calculateTransit(now);

  for (const person of persons) {
    const chart = calculateChart(person.year, person.month, person.day, person.hour, person.minute, person.tzOffset);
    const analysis = analyze(chart);
    personCharts.set(person.id, { person, chart, analysis });
  }

  return {
    viewMode: 'transit',
    persons,
    selectedPersonA: persons.length > 0 ? persons[0].id : null,
    selectedPersonB: null,
    transitDate: now,
    transitActivations,
    personCharts,
    sidebarOpen: true,
  };
}

/** Convert a received BirthDataPayload to PersonData.
 *  Parses ISO 8601 string manually to preserve birth-time hour/minute
 *  regardless of the browser's local timezone. */
function birthDataToPersonData(payload: BirthDataPayload): PersonData | null {
  try {
    // Parse ISO 8601: "1976-03-08T00:40:00+02:00"
    const m = payload.datetime.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?([+-]\d{2}:\d{2})?/
    );
    if (!m) return null;

    const year = parseInt(m[1]);
    const month = parseInt(m[2]);
    const day = parseInt(m[3]);
    const hour = parseInt(m[4]);
    const minute = parseInt(m[5]);

    // Extract timezone offset from the ISO string
    let tzOffset = 0;
    if (m[7]) {
      const tzMatch = m[7].match(/([+-])(\d{2}):(\d{2})/);
      if (tzMatch) {
        tzOffset = (tzMatch[1] === '+' ? 1 : -1) * (parseInt(tzMatch[2]) + parseInt(tzMatch[3]) / 60);
      }
    }

    return {
      id: generateId(),
      name: payload.name,
      year,
      month,
      day,
      hour,
      minute,
      tzOffset,
      sharedBy: payload.npub || 'unknown',
    };
  } catch {
    return null;
  }
}

interface AppContextValue {
  state: AppState;
  setViewMode: (mode: ViewMode) => void;
  addPerson: (data: Omit<PersonData, 'id'>) => PersonData;
  removePerson: (id: string) => void;
  selectPersonA: (id: string | null) => void;
  selectPersonB: (id: string | null) => void;
  setTransitDate: (date: Date) => void;
  toggleSidebar: () => void;
  syncFromNostr: () => Promise<void>;
  syncReceivedGiftWraps: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  // Persist persons to localStorage
  useEffect(() => {
    savePersons(state.persons);
  }, [state.persons]);

  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', mode });
  }, []);

  const addPerson = useCallback((data: Omit<PersonData, 'id'>): PersonData => {
    const person: PersonData = { ...data, id: generateId() };
    const chart = calculateChart(person.year, person.month, person.day, person.hour, person.minute, person.tzOffset);
    const analysis = analyze(chart);
    dispatch({ type: 'ADD_PERSON', person, chart, analysis });
    return person;
  }, []);

  const removePerson = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_PERSON', id });
  }, []);

  const selectPersonA = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_PERSON_A', id });
  }, []);

  const selectPersonB = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_PERSON_B', id });
  }, []);

  const setTransitDate = useCallback((date: Date) => {
    const activations = calculateTransit(date);
    dispatch({ type: 'SET_TRANSIT', date, activations });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const syncFromNostr = useCallback(async () => {
    const remote = await loadChartsFromNostr();
    if (!remote || remote.length === 0) return;

    const localIds = new Set(state.persons.map((p) => `${p.name}-${p.year}-${p.month}-${p.day}`));
    const newPersons = [...state.persons];
    const newCharts = new Map(state.personCharts);
    let added = false;

    for (const p of remote) {
      const key = `${p.name}-${p.year}-${p.month}-${p.day}`;
      if (!localIds.has(key)) {
        const person: PersonData = { ...p, id: p.id || generateId() };
        newPersons.push(person);
        const chart = calculateChart(person.year, person.month, person.day, person.hour, person.minute, person.tzOffset);
        const analysis = analyze(chart);
        newCharts.set(person.id, { person, chart, analysis });
        added = true;
      }
    }

    if (added) {
      dispatch({ type: 'SYNC_PERSONS', persons: newPersons, charts: newCharts });
    }
  }, [state.persons, state.personCharts]);

  const syncReceivedGiftWraps = useCallback(async () => {
    const payloads = await checkIncomingGiftWraps();
    if (payloads.length === 0) return;

    // Merge with previously received data
    const existing = loadReceivedBirthData();
    const existingKeys = new Set(existing.map((p) => `${p.name}-${p.datetime}`));
    const newPayloads = payloads.filter((p) => !existingKeys.has(`${p.name}-${p.datetime}`));
    if (newPayloads.length === 0) return;

    const allReceived = [...existing, ...newPayloads];
    saveReceivedBirthData(allReceived);

    // Convert to PersonData and merge into state
    const localKeys = new Set(state.persons.map((p) => `${p.name}-${p.year}-${p.month}-${p.day}`));
    const newPersons = [...state.persons];
    const newCharts = new Map(state.personCharts);
    let added = false;

    for (const payload of newPayloads) {
      const person = birthDataToPersonData(payload);
      if (!person) continue;
      const key = `${person.name}-${person.year}-${person.month}-${person.day}`;
      if (localKeys.has(key)) continue;

      newPersons.push(person);
      const chart = calculateChart(person.year, person.month, person.day, person.hour, person.minute, person.tzOffset);
      const analysis = analyze(chart);
      newCharts.set(person.id, { person, chart, analysis });
      localKeys.add(key);
      added = true;
    }

    if (added) {
      dispatch({ type: 'SYNC_PERSONS', persons: newPersons, charts: newCharts });
    }
  }, [state.persons, state.personCharts]);

  const value: AppContextValue = {
    state,
    setViewMode,
    addPerson,
    removePerson,
    selectPersonA,
    selectPersonB,
    setTransitDate,
    toggleSidebar,
    syncFromNostr,
    syncReceivedGiftWraps,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
