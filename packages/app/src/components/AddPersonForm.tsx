import { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { Input } from './ui/input';
import { Button } from './ui/button';

const TZ_PRESETS: Record<string, number> = {
  'UTC': 0, 'US/Eastern': -5, 'US/Central': -6, 'US/Pacific': -8,
  'Europe/London': 0, 'Europe/Helsinki': 2, 'Europe/Berlin': 1,
  'Asia/Tokyo': 9, 'Asia/Kolkata': 5.5, 'Australia/Sydney': 11,
};

interface Props {
  onClose: () => void;
}

export function AddPersonForm({ onClose }: Props) {
  const { addPerson } = useAppState();
  const [name, setName] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('12:00');
  const [tz, setTz] = useState('2'); // Europe/Helsinki default

  const handleSave = () => {
    if (!dateStr) return;
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    addPerson({ name: name || 'Unnamed', year, month, day, hour, minute, tzOffset: parseFloat(tz) });
    setName('');
    setDateStr('');
    onClose();
  };

  return (
    <div id="add-person-form" className="bg-gray-50 rounded-lg p-3 mb-4">
      <h4 className="text-sm font-semibold mb-2">New Chart</h4>
      <div className="space-y-2">
        <Input id="person-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" className="text-sm h-8" />
        <Input id="person-date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} placeholder="yyyy-mm-dd" className="text-sm h-8" />
        <div className="flex gap-2">
          <Input id="person-time" value={timeStr} onChange={(e) => setTimeStr(e.target.value)} placeholder="HH:mm" className="flex-1 text-sm h-8" />
          <select
            id="person-tz"
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="flex-1 text-sm border rounded px-2 py-1"
          >
            {Object.entries(TZ_PRESETS).map(([tzName, offset]) => (
              <option key={tzName} value={offset}>
                {tzName} ({offset >= 0 ? '+' : ''}{offset})
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Button id="save-person-btn" onClick={handleSave} className="flex-1 h-8 text-sm">Save</Button>
          <Button id="cancel-person-btn" variant="secondary" onClick={onClose} className="flex-1 h-8 text-sm">Cancel</Button>
        </div>
      </div>
    </div>
  );
}
