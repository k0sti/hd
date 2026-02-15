import { useState, useCallback } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Input } from './ui/input';

function pad(n: number) { return String(n).padStart(2, '0'); }

function formatDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TransitDateTime() {
  const { state, setTransitDate } = useAppState();
  const [dateStr, setDateStr] = useState(formatDate(state.transitDate));
  const [timeStr, setTimeStr] = useState(formatTime(state.transitDate));

  const update = useCallback((d: string, t: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d) && /^\d{2}:\d{2}$/.test(t)) {
      setTransitDate(new Date(`${d}T${t}`));
    }
  }, [setTransitDate]);

  return (
    <>
      <Input
        id="transit-date-input"
        value={dateStr}
        onChange={(e) => setDateStr(e.target.value)}
        onBlur={() => update(dateStr, timeStr)}
        className="text-sm w-28 hidden sm:block h-8"
        placeholder="yyyy-mm-dd"
      />
      <Input
        id="transit-time-input"
        value={timeStr}
        onChange={(e) => setTimeStr(e.target.value)}
        onBlur={() => update(dateStr, timeStr)}
        className="text-sm w-16 hidden sm:block h-8"
        placeholder="HH:mm"
      />
    </>
  );
}
