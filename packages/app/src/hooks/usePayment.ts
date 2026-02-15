import { useState, useCallback } from 'react';
import { createReportQuote, waitForPayment, getReportPrice, type PaymentQuote } from '../payment';

export function usePayment() {
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'waiting' | 'paid' | 'timeout' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const startPayment = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const q = await createReportQuote();
      setQuote(q);
      setStatus('waiting');
      const paid = await waitForPayment(q.quoteId);
      setStatus(paid ? 'paid' : 'timeout');
      return paid;
    } catch (e: any) {
      setError(e.message || 'Could not create invoice');
      setStatus('error');
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setQuote(null);
    setStatus('idle');
    setError(null);
  }, []);

  return { quote, status, error, startPayment, reset, getReportPrice };
}
