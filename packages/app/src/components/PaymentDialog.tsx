import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { usePayment } from '../hooks/usePayment';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid: () => void;
}

export function PaymentDialog({ open, onOpenChange, onPaid }: Props) {
  const { quote, status, error, startPayment, reset, getReportPrice } = usePayment();
  const [copied, setCopied] = useState(false);

  const handleOpen = async (isOpen: boolean) => {
    if (isOpen && status === 'idle') {
      const paid = await startPayment();
      if (paid) {
        setTimeout(() => {
          onOpenChange(false);
          reset();
          onPaid();
        }, 1000);
      }
    }
    if (!isOpen) {
      onOpenChange(false);
      reset();
    }
  };

  const copyInvoice = () => {
    if (quote) {
      navigator.clipboard.writeText(quote.request).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="w-96" id="payment-modal">
        <DialogHeader>
          <DialogTitle className="text-center">Pay for Insight Report</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500 text-center mb-4">{getReportPrice()} sats</p>
        <div id="payment-invoice-section" className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Pay this Lightning invoice:</p>
          <div
            id="payment-invoice"
            onClick={copyInvoice}
            className="bg-gray-50 rounded-lg p-3 text-xs font-mono break-all cursor-pointer hover:bg-gray-100 transition-colors"
            title="Click to copy"
          >
            {status === 'loading' ? 'Loading...' : error ? `Error: ${error}` : quote?.request || ''}
          </div>
          {copied && <p id="payment-copied" className="text-xs text-green-500 mt-1">Copied!</p>}
        </div>
        <div id="payment-status" className="text-sm text-gray-600 mb-4 text-center">
          {status === 'waiting' && <span id="payment-waiting">Waiting for payment...</span>}
          {status === 'paid' && <span id="payment-success" className="text-green-600 font-medium">Payment received!</span>}
          {status === 'timeout' && <span id="payment-timeout" className="text-red-500">Payment timed out</span>}
        </div>
        <Button id="cancel-payment-btn" variant="outline" onClick={() => { onOpenChange(false); reset(); }} className="w-full text-sm">
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
