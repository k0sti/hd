import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { sendGiftWrap, type BirthDataPayload } from '../nostr';
import { nip19 } from 'nostr-tools';
import type { PersonData } from '../hooks/useAppState';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: PersonData | null;
}

export function ShareDialog({ open, onOpenChange, person }: Props) {
  const [recipientNpub, setRecipientNpub] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    if (!person || !recipientNpub.trim()) return;

    // Decode npub to hex pubkey
    let recipientPubkey: string;
    try {
      const decoded = nip19.decode(recipientNpub.trim());
      if (decoded.type !== 'npub') {
        setError('Please enter a valid npub');
        return;
      }
      recipientPubkey = decoded.data;
    } catch {
      setError('Invalid npub format');
      return;
    }

    setStatus('sending');
    setError(null);

    try {
      // Build ISO 8601 datetime from person data
      const dt = new Date(person.year, person.month - 1, person.day, person.hour, person.minute);
      const offsetH = Math.floor(Math.abs(person.tzOffset));
      const offsetM = Math.round((Math.abs(person.tzOffset) - offsetH) * 60);
      const sign = person.tzOffset >= 0 ? '+' : '-';
      const datetime = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}T${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}:00${sign}${String(offsetH).padStart(2, '0')}:${String(offsetM).padStart(2, '0')}`;

      const payload: BirthDataPayload = {
        type: 'hd/birthdata',
        name: person.name,
        datetime,
      };

      await sendGiftWrap(recipientPubkey, payload);
      setStatus('success');
      setTimeout(() => {
        onOpenChange(false);
        setStatus('idle');
        setRecipientNpub('');
      }, 1500);
    } catch (e: any) {
      setError(e.message || 'Failed to send');
      setStatus('error');
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setStatus('idle');
      setError(null);
      setRecipientNpub('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-80">
        <DialogHeader>
          <DialogTitle className="text-center">Share Birth Data</DialogTitle>
        </DialogHeader>
        {person && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              Share <span className="font-medium">{person.name}</span>'s birth data via encrypted gift wrap
            </p>
            <Input
              placeholder="Recipient npub1..."
              value={recipientNpub}
              onChange={(e) => setRecipientNpub(e.target.value)}
              disabled={status === 'sending'}
              className="text-sm"
            />
            <Button
              onClick={handleShare}
              disabled={status === 'sending' || !recipientNpub.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-sm"
            >
              {status === 'sending' ? 'Sending...' : status === 'success' ? 'Sent!' : 'Send Gift Wrap'}
            </Button>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            {status === 'success' && <p className="text-xs text-green-600 text-center">Birth data shared successfully</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
