/** Payment module — Cashu/Lightning for paid reports */

import { Wallet } from '@cashu/cashu-ts';

const DEFAULT_MINT = 'https://mint.minibits.cash/Bitcoin';
const REPORT_PRICE_SATS = 210;

let wallet: InstanceType<typeof Wallet> | null = null;

async function getWallet(): Promise<InstanceType<typeof Wallet>> {
  if (wallet) return wallet;
  wallet = new Wallet(DEFAULT_MINT, { unit: 'sat' });
  await wallet.loadMint();
  return wallet;
}

export interface PaymentQuote {
  quoteId: string;
  request: string; // Lightning invoice (BOLT11)
  amount: number;
  expiry: number;
}

/** Create a Lightning invoice for a report payment */
export async function createReportQuote(): Promise<PaymentQuote> {
  const w = await getWallet();
  const quote = await w.createMintQuoteBolt11(REPORT_PRICE_SATS, 'HD Insight Report');
  return {
    quoteId: quote.quote,
    request: quote.request,
    amount: REPORT_PRICE_SATS,
    expiry: quote.expiry,
  };
}

/** Check if a quote has been paid */
export async function checkQuotePaid(quoteId: string): Promise<boolean> {
  const w = await getWallet();
  const status = await w.checkMintQuoteBolt11(quoteId);
  return status.state === 'PAID';
}

/** Poll for payment and resolve when paid (timeout after 5 minutes) */
export function waitForPayment(quoteId: string): Promise<boolean> {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes at 5s intervals
    const interval = setInterval(async () => {
      attempts++;
      try {
        const paid = await checkQuotePaid(quoteId);
        if (paid) {
          clearInterval(interval);
          resolve(true);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          resolve(false);
        }
      } catch {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          resolve(false);
        }
      }
    }, 5000);
  });
}

export function getReportPrice(): number {
  return REPORT_PRICE_SATS;
}
