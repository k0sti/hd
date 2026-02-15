import { useAppState, type ViewMode } from '../hooks/useAppState';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

const modes: { value: ViewMode; label: string }[] = [
  { value: 'transit', label: 'Transit' },
  { value: 'single', label: 'Person' },
  { value: 'person-transit', label: '+Transit' },
  { value: 'person-person', label: '+Person' },
];

export function ViewModeSelector() {
  const { state, setViewMode } = useAppState();

  return (
    <ToggleGroup
      type="single"
      value={state.viewMode}
      onValueChange={(v) => { if (v) setViewMode(v as ViewMode); }}
      className="bg-gray-100 rounded-lg p-1"
    >
      {modes.map((m) => (
        <ToggleGroupItem
          key={m.value}
          value={m.value}
          data-mode={m.value}
          className="px-3 py-1 text-sm rounded-md data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:font-medium text-gray-500 data-[state=on]:text-gray-800"
        >
          {m.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
