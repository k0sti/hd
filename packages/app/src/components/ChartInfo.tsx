import { useAppState } from '../hooks/useAppState';

function pad(n: number) { return String(n).padStart(2, '0'); }

function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ChartInfo() {
  const { state } = useAppState();
  const personA = state.selectedPersonA ? state.personCharts.get(state.selectedPersonA) : null;

  if (state.viewMode === 'transit') {
    return (
      <div id="chart-info" className="mb-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Transit</h3>
        <p className="text-sm text-gray-600">{formatDateISO(state.transitDate)}</p>
      </div>
    );
  }

  if (!personA) {
    return (
      <div id="chart-info" className="mb-6">
        <p className="text-sm text-gray-400">No chart selected</p>
      </div>
    );
  }

  const a = personA.analysis;
  const cross = a.incarnationCross;
  const personB = state.selectedPersonB ? state.personCharts.get(state.selectedPersonB) : null;

  return (
    <div id="chart-info" className="mb-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{personA.person.name}</h3>
      <div className="space-y-1 text-sm">
        <div><span className="text-gray-500">Type:</span> <span className="font-medium" data-testid="chart-type">{a.type}</span></div>
        <div><span className="text-gray-500">Authority:</span> <span className="font-medium" data-testid="chart-authority">{a.authority}</span></div>
        <div><span className="text-gray-500">Profile:</span> <span className="font-medium" data-testid="chart-profile">{a.profile[0]}/{a.profile[1]}</span></div>
        <div><span className="text-gray-500">Cross:</span> <span className="font-medium">{cross[0]}-{cross[1]} / {cross[2]}-{cross[3]}</span></div>
      </div>

      {state.viewMode === 'person-person' && personB && (
        <div className="mt-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-blue-500 uppercase tracking-wide mb-2">{personB.person.name}</h3>
          <div className="space-y-1 text-sm">
            <div><span className="text-gray-500">Type:</span> <span className="font-medium">{personB.analysis.type}</span></div>
            <div><span className="text-gray-500">Authority:</span> <span className="font-medium">{personB.analysis.authority}</span></div>
            <div><span className="text-gray-500">Profile:</span> <span className="font-medium">{personB.analysis.profile[0]}/{personB.analysis.profile[1]}</span></div>
            <div><span className="text-gray-500">Cross:</span> <span className="font-medium">{personB.analysis.incarnationCross[0]}-{personB.analysis.incarnationCross[1]} / {personB.analysis.incarnationCross[2]}-{personB.analysis.incarnationCross[3]}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
