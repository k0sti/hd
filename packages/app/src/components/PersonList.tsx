import { useState } from 'react';
import { useAppState, type PersonData } from '../hooks/useAppState';
import { useNostr } from '../hooks/useNostr';
import { ShareDialog } from './ShareDialog';

export function PersonList() {
  const { state, selectPersonA, selectPersonB, removePerson, setViewMode } = useAppState();
  const { loggedIn } = useNostr();
  const [sharePerson, setSharePerson] = useState<PersonData | null>(null);

  return (
    <>
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
                {p.sharedBy && (
                  <span className="ml-1 text-xs text-purple-500 font-normal">shared</span>
                )}
              </button>
              {loggedIn && (
                <button
                  className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-500 hover:bg-purple-100 hover:text-purple-600"
                  title="Share via gift wrap"
                  onClick={() => setSharePerson(p)}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                  </svg>
                </button>
              )}
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
      <ShareDialog open={!!sharePerson} onOpenChange={(open) => !open && setSharePerson(null)} person={sharePerson} />
    </>
  );
}
