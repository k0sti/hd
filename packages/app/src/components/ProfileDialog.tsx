import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { useNostr } from '../hooks/useNostr';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: Props) {
  const { profile, logout, loadProfile, getNpub, compressNpub } = useNostr();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) loadProfile();
  }, [open, loadProfile]);

  const npub = getNpub();

  const handleCopy = () => {
    if (npub) {
      navigator.clipboard.writeText(npub).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleLogout = () => {
    logout();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-80" id="profile-modal">
        <div className="text-center">
          <div id="profile-avatar" className="w-24 h-24 rounded-full bg-purple-100 mx-auto mb-3 flex items-center justify-center overflow-hidden">
            {profile?.picture ? (
              <img src={profile.picture} alt="" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            )}
          </div>
          <p id="profile-name" className="text-lg font-semibold text-gray-800 mb-1">
            {profile?.display_name || profile?.name || ''}
          </p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <p id="profile-npub" className="text-xs font-mono text-gray-500">{npub ? compressNpub(npub) : ''}</p>
            <button id="copy-npub-btn" onClick={handleCopy} className="p-1 hover:bg-gray-100 rounded transition-colors" title="Copy npub">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
            </button>
          </div>
          {copied && <p id="npub-copied" className="text-xs text-green-500 -mt-3 mb-3">Copied!</p>}
          <div className="space-y-2">
            <Button id="logout-btn" onClick={handleLogout} variant="destructive" className="w-full text-sm">Logout</Button>
            <Button id="close-profile-btn" variant="outline" onClick={() => onOpenChange(false)} className="w-full text-sm">Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
