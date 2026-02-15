import { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { ChartInfo } from './ChartInfo';
import { PersonList } from './PersonList';
import { AddPersonForm } from './AddPersonForm';
import { GatesInfo } from './GatesInfo';
import { ChannelsInfo } from './ChannelsInfo';
import { Button } from './ui/button';

interface Props {
  onInsightClick: () => void;
}

export function Sidebar({ onInsightClick }: Props) {
  const { state } = useAppState();
  const [showAddForm, setShowAddForm] = useState(false);

  const showInsight = state.selectedPersonA && (state.viewMode === 'person-transit' || state.viewMode === 'single');

  return (
    <aside
      id="sidebar"
      className={`w-80 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0 transition-all duration-200 ${state.sidebarOpen ? '' : 'hidden'}`}
    >
      <div className="p-4">
        <ChartInfo />
        <div id="person-management" className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Charts</h3>
          <PersonList />
          {!showAddForm && (
            <Button id="add-person-btn" variant="ghost" onClick={() => setShowAddForm(true)} className="w-full text-sm bg-gray-100 hover:bg-gray-200">
              + Add Chart
            </Button>
          )}
          {showAddForm && <AddPersonForm onClose={() => setShowAddForm(false)} />}
        </div>
        <div id="insight-section" className={showInsight ? 'mb-6' : 'mb-6 hidden'}>
          <Button id="insight-btn" onClick={onInsightClick} className="w-full text-sm bg-indigo-500 hover:bg-indigo-600 text-white">
            Generate Insight Report
          </Button>
        </div>
        <GatesInfo />
        <ChannelsInfo />
      </div>
    </aside>
  );
}
