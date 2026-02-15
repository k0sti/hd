import { useState, useEffect } from 'react';
import { useNostr } from '../hooks/useNostr';

const DefaultAvatar = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
  </svg>
);

const LoggedInAvatar = ({ picture }: { picture?: string }) => {
  if (picture) {
    return <img src={picture} alt="" className="w-8 h-8 rounded-full object-cover" />;
  }
  return (
    <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  );
};

interface Props {
  onClick: () => void;
}

export function ProfileButton({ onClick }: Props) {
  const { loggedIn, profile, loadProfile } = useNostr();

  useEffect(() => {
    if (loggedIn) loadProfile();
  }, [loggedIn, loadProfile]);

  const bgClass = loggedIn
    ? 'bg-purple-200 hover:bg-purple-300'
    : 'bg-gray-200 hover:bg-gray-300';

  return (
    <button
      id="profile-btn"
      onClick={onClick}
      className={`ml-2 w-8 h-8 rounded-full ${bgClass} flex items-center justify-center overflow-hidden transition-colors`}
      title="Login / Profile"
    >
      {loggedIn ? <LoggedInAvatar picture={profile?.picture} /> : <DefaultAvatar />}
    </button>
  );
}
