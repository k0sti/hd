import { useAppState } from '../hooks/useAppState';

export function PersonList() {
  const { state, selectPersonA, selectPersonB, removePerson, setViewMode } = useAppState();

  return (
    <div id="person-list" className="space-y-2 mb-3">
      {state.persons.map((p) => {
        const isA = p.id === state.selectedPersonA;
        const isB = p.id === state.selectedPersonB;
        const activeClass = isA ? 'ring-2 ring-gray-400' : isB ? 'ring-2 ring-blue-400' : '';

        return (
          <div key={p.id} className={`flex items-center gap-2 p-2 rounded-lg bg-gray-50 ${activeClass}`} data-person-id={p.id}>
            <button
              className="select-person-a flex-1 text-left text-sm font-medium truncate"
              data-id={p.id}
              onClick={() => {
                selectPersonA(p.id);
                if (state.viewMode === 'transit') setViewMode('single');
              }}
            >
              {p.name}
            </button>
            <button
              className={`select-person-b text-xs px-2 py-1 rounded ${isB ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
              data-id={p.id}
              title="Select as Person B"
              onClick={() => {
                if (state.selectedPersonB === p.id) {
                  selectPersonB(null);
                } else {
                  selectPersonB(p.id);
                  setViewMode('person-person');
                }
              }}
            >
              B
            </button>
            <button
              className="remove-person text-gray-400 hover:text-red-500"
              data-id={p.id}
              title="Remove"
              onClick={() => removePerson(p.id)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
