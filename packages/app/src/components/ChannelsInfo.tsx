import { useAppState } from '../hooks/useAppState';

export function ChannelsInfo() {
  const { state } = useAppState();
  const personA = state.selectedPersonA ? state.personCharts.get(state.selectedPersonA) : null;

  if (!personA || state.viewMode === 'transit') return null;

  const channels = personA.analysis.definedChannels;
  if (channels.length === 0) return null;

  return (
    <div id="channels-info">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Defined Channels</h3>
      <div className="space-y-1 text-xs" data-testid="channels-list">
        {channels.map((ch) => (
          <div key={`${ch.gate1}-${ch.gate2}`} className="flex justify-between">
            <span className="font-mono font-medium" data-testid="channel">{ch.gate1}-{ch.gate2}</span>
            <span className="text-gray-500">{ch.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
