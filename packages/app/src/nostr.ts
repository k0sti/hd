/** Nostr integration — login, relay pool, event helpers */

import { AccountManager } from 'applesauce-accounts';
import { ExtensionAccount, PrivateKeyAccount } from 'applesauce-accounts/accounts';
import { SimpleConnectionPool } from 'applesauce-net';
import { MultiSubscription } from 'applesauce-net';
import type { Filter, NostrEvent } from 'nostr-tools';
import { nip19 } from 'nostr-tools';

const ACCOUNTS_KEY = 'hd-nostr-accounts';
const ACTIVE_KEY = 'hd-nostr-active';

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.snort.social',
];

export const accountManager = new AccountManager();
export const pool = new SimpleConnectionPool();

let initialized = false;

export function initNostr(): void {
  if (initialized) return;
  initialized = true;

  accountManager.registerType(ExtensionAccount);
  accountManager.registerType(PrivateKeyAccount);

  // Restore saved accounts
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (raw) {
      const accounts = JSON.parse(raw);
      accountManager.fromJSON(accounts);

      // Restore active account
      const activeId = localStorage.getItem(ACTIVE_KEY);
      if (activeId) {
        try { accountManager.setActive(activeId); } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }

  // Auto-save on changes
  accountManager.accounts$.subscribe(() => saveAccounts());
  accountManager.active$.subscribe(() => saveAccounts());
}

function saveAccounts(): void {
  try {
    const serialized = accountManager.toJSON(true);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(serialized));
    const active = accountManager.active;
    if (active) {
      localStorage.setItem(ACTIVE_KEY, active.id);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  } catch { /* ignore */ }
}

export async function loginWithExtension(): Promise<void> {
  const account = await ExtensionAccount.fromExtension();
  accountManager.addAccount(account);
  accountManager.setActive(account);
}

export function loginAsGuest(name?: string): void {
  const account = PrivateKeyAccount.generateNew();
  accountManager.addAccount(account);
  accountManager.setActive(account);
}

export function logout(): void {
  const active = accountManager.active;
  if (active) {
    accountManager.removeAccount(active);
  }
  accountManager.clearActive();
}

export function isLoggedIn(): boolean {
  return !!accountManager.active;
}

export function getPublicKey(): string | null {
  return accountManager.active?.pubkey ?? null;
}

export function getNpub(): string | null {
  const pk = getPublicKey();
  return pk ? nip19.npubEncode(pk) : null;
}

/** Query events from default relays */
export async function queryEvents(filters: Filter[]): Promise<NostrEvent[]> {
  const sub = new MultiSubscription(pool);
  sub.setFilters(filters);
  sub.setRelays(DEFAULT_RELAYS);

  const events: NostrEvent[] = [];
  return new Promise((resolve) => {
    const subscription = sub.onEvent.subscribe((event) => {
      events.push(event);
    });

    sub.open();
    sub.waitForAllConnection().then(() => {
      // Wait a bit for events to come in after connection
      setTimeout(() => {
        subscription.unsubscribe();
        sub.close();
        resolve(events);
      }, 2000);
    });
  });
}

/** Publish an event to default relays */
export async function publishEvent(event: NostrEvent): Promise<void> {
  const sub = new MultiSubscription(pool);
  sub.setRelays(DEFAULT_RELAYS);
  sub.open();
  await sub.waitForAllConnection();
  await sub.publish(event);
  sub.close();
}

/** Sign and publish a kind 30078 (NIP-78) addressable event */
export async function publishAppData(dTag: string, content: string): Promise<void> {
  const signer = accountManager.signer;
  if (!signer) throw new Error('Not logged in');

  const template = {
    kind: 30078,
    content,
    tags: [['d', dTag]],
    created_at: Math.floor(Date.now() / 1000),
  };

  const signed = await signer.signEvent(template);
  await publishEvent(signed);
}

/** Query user's own NIP-78 app data by d-tag prefix */
export async function queryAppData(dTagPrefix: string): Promise<NostrEvent[]> {
  const pubkey = getPublicKey();
  if (!pubkey) return [];

  return queryEvents([{
    kinds: [30078],
    authors: [pubkey],
    '#d': [dTagPrefix],
  }]);
}
