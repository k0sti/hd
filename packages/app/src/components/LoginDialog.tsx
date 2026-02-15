import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { useNostr } from '../hooks/useNostr';
import { useAppState } from '../hooks/useAppState';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: Props) {
  const { loginExtension, loginGuest } = useNostr();
  const { syncFromNostr, syncReceivedGiftWraps } = useAppState();
  const [error, setError] = useState<string | null>(null);

  const handleExtension = async () => {
    try {
      await loginExtension();
      onOpenChange(false);
      setError(null);
      syncFromNostr().catch(() => {});
      syncReceivedGiftWraps().catch(() => {});
    } catch (e: any) {
      setError(e.message || 'Extension not found. Install a NIP-07 extension.');
    }
  };

  const handleGuest = () => {
    loginGuest();
    onOpenChange(false);
    syncFromNostr().catch(() => {});
    syncReceivedGiftWraps().catch(() => {});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-80" id="login-modal">
        <DialogHeader>
          <DialogTitle className="text-center">Login to Nostr</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Button id="login-extension-btn" onClick={handleExtension} className="w-full bg-purple-600 hover:bg-purple-700 text-sm">
            Login with Extension (NIP-07)
          </Button>
          <Button id="login-guest-btn" onClick={handleGuest} variant="secondary" className="w-full bg-gray-600 hover:bg-gray-700 text-white text-sm">
            Continue as Guest
          </Button>
          <Button id="cancel-login-btn" variant="outline" onClick={() => onOpenChange(false)} className="w-full text-sm">
            Cancel
          </Button>
        </div>
        {error && <p id="login-error" className="mt-3 text-xs text-red-500 text-center">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
