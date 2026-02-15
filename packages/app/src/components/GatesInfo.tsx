import { useAppState } from '../hooks/useAppState';

export function GatesInfo() {
  const { state } = useAppState();

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

  if (activations.length === 0) return null;

  return (
    <div id="gates-info" className="mb-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Active Gates</h3>
      <div className="space-y-1 text-xs">
        {activations.map((a, i) => {
          const colorClass = a.source === 'personality' ? 'text-gray-800' :
                            a.source === 'design' ? 'text-red-700' : 'text-green-600';
          const tag = a.source === 'personality' ? 'P' : a.source === 'design' ? 'D' : 'T';
          return (
            <div key={i} className={`flex justify-between ${colorClass}`}>
              <span>{a.planet}</span>
              <span className="font-mono">Gate {a.gate}.{a.line}</span>
              <span className="text-xs opacity-60">{tag}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
