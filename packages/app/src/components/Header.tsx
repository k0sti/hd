import { useAppState } from '../hooks/useAppState';
import { ViewModeSelector } from './ViewModeSelector';
import { TransitDateTime } from './TransitDateTime';
import { ProfileButton } from './ProfileButton';

interface Props {
  onProfileClick: () => void;
}

export function Header({ onProfileClick }: Props) {
  const { toggleSidebar } = useAppState();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-2 flex items-center gap-4 flex-shrink-0 z-10">
      <button id="sidebar-toggle" onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg lg:hidden" title="Toggle sidebar">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <h1 className="text-lg font-semibold text-gray-700 hidden sm:block">Human Design</h1>
      <div className="flex items-center gap-2 ml-auto">
        <ViewModeSelector />
        <TransitDateTime />
        <ProfileButton onClick={onProfileClick} />
      </div>
    </header>
  );
}
