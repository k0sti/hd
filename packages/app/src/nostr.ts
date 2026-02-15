/** Nostr integration — login, relay pool, event helpers */

import { AccountManager } from 'applesauce-accounts';
import { ExtensionAccount, PrivateKeyAccount } from 'applesauce-accounts/accounts';
import { EventFactory } from 'applesauce-core/event-factory';
import { SimpleConnectionPool } from 'applesauce-net';
import { MultiSubscription } from 'applesauce-net';
import { GiftWrapBlueprint } from 'applesauce-common/blueprints/gift-wrap';
import { unlockGiftWrap, type Rumor } from 'applesauce-common/helpers/gift-wrap';
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
  clearProfileCache();
  clearReceivedBirthData();
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

export function compressNpub(npub: string): string {
  if (npub.length <= 14) return npub;
  return `${npub.slice(0, 10)}...${npub.slice(-4)}`;
}

export interface NostrProfile {
  name?: string;
  display_name?: string;
  picture?: string;
  about?: string;
}

let cachedProfile: NostrProfile | null = null;

/** Fetch kind 0 profile metadata for the logged-in user */
export async function fetchProfile(): Promise<NostrProfile | null> {
  if (cachedProfile) return cachedProfile;
  const pubkey = getPublicKey();
  if (!pubkey) return null;

  const events = await queryEvents([{ kinds: [0], authors: [pubkey], limit: 1 }]);
  if (events.length === 0) return null;

  try {
    cachedProfile = JSON.parse(events[0].content) as NostrProfile;
    return cachedProfile;
  } catch {
    return null;
  }
}

/** Clear cached profile (call on logout) */
export function clearProfileCache(): void {
  cachedProfile = null;
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

/** Sign and publish a kind 30078 (NIP-78) addressable event with NIP-44 encryption */
export async function publishAppData(dTag: string, content: string): Promise<void> {
  const signer = accountManager.signer;
  const pubkey = getPublicKey();
  if (!signer || !pubkey) throw new Error('Not logged in');

  // NIP-44 self-encryption
  let encrypted = content;
  if (signer.nip44) {
    encrypted = await signer.nip44.encrypt(pubkey, content);
  }

  const template = {
    kind: 30078,
    content: encrypted,
    tags: [['d', dTag]],
    created_at: Math.floor(Date.now() / 1000),
  };

  const signed = await signer.signEvent(template);
  await publishEvent(signed);
}

/** Query user's own NIP-78 app data by d-tag(s) and decrypt */
export async function queryAppData(dTags: string | string[]): Promise<NostrEvent[]> {
  const pubkey = getPublicKey();
  if (!pubkey) return [];

  const tags = Array.isArray(dTags) ? dTags : [dTags];
  return queryEvents([{
    kinds: [30078],
    authors: [pubkey],
    '#d': tags,
  }]);
}

/** Decrypt a NIP-78 event's content (NIP-44 self-encrypted) */
async function decryptAppData(event: NostrEvent): Promise<string> {
  const signer = accountManager.signer;
  const pubkey = getPublicKey();
  if (!signer || !pubkey) return event.content;

  if (signer.nip44) {
    try {
      return await signer.nip44.decrypt(pubkey, event.content);
    } catch {
      // Fallback: content may be unencrypted (legacy)
      return event.content;
    }
  }
  return event.content;
}

/** Create a URL-safe slug from a name */
function nameSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Save all person charts to Nostr as encrypted NIP-78 events */
export async function saveChartsToNostr(persons: any[]): Promise<void> {
  if (!isLoggedIn()) return;

  // Save each person as a separate addressable event
  const promises = persons.map((p) => {
    const slug = nameSlug(p.name);
    const dTag = `hd/natal/${slug}`;
    return publishAppData(dTag, JSON.stringify(p));
  });
  await Promise.all(promises);
}

/** Load person charts from Nostr (encrypted NIP-78) */
export async function loadChartsFromNostr(knownPersonNames?: string[]): Promise<any[] | null> {
  if (!isLoggedIn()) return null;
  const pubkey = getPublicKey();
  if (!pubkey) return null;

  // Build d-tag list from known person names, plus primary
  const dTags = ['hd/natal/primary'];
  if (knownPersonNames) {
    for (const name of knownPersonNames) {
      const slug = nameSlug(name);
      if (slug) dTags.push(`hd/natal/${slug}`);
    }
  }

  // Query with specific d-tags; also do a broader query to discover unknown charts
  const [knownEvents, allEvents] = await Promise.all([
    queryEvents([{ kinds: [30078], authors: [pubkey], '#d': dTags }]),
    // Broader query to find charts we don't know about yet
    queryEvents([{ kinds: [30078], authors: [pubkey] }]),
  ]);

  // Merge and filter to hd/natal/* d-tags
  const seen = new Set<string>();
  const natalEvents: NostrEvent[] = [];
  for (const e of [...knownEvents, ...allEvents]) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    const dTag = e.tags.find((t) => t[0] === 'd')?.[1];
    if (dTag && dTag.startsWith('hd/natal/')) {
      natalEvents.push(e);
    }
  }

  if (natalEvents.length === 0) return null;

  // Deduplicate by d-tag (keep most recent)
  const byDTag = new Map<string, NostrEvent>();
  for (const e of natalEvents) {
    const dTag = e.tags.find((t) => t[0] === 'd')![1];
    const existing = byDTag.get(dTag);
    if (!existing || e.created_at > existing.created_at) {
      byDTag.set(dTag, e);
    }
  }

  // Decrypt all events
  const persons: any[] = [];
  for (const event of byDTag.values()) {
    try {
      const content = await decryptAppData(event);
      const person = JSON.parse(content);
      persons.push(person);
    } catch {
      // Skip malformed events
    }
  }

  return persons.length > 0 ? persons : null;
}

// ─── NIP-59 Gift Wrap Sharing ───────────────────────────────────────

export interface BirthDataPayload {
  type: 'hd/birthdata';
  name: string;
  datetime: string; // ISO 8601
  location?: { lat: number; lon: number; name: string };
  npub?: string;
}

const RECEIVED_KEY = 'hd-received-birthdata';

/** Send birth data to a recipient via NIP-59 gift wrap */
export async function sendGiftWrap(recipientPubkey: string, payload: BirthDataPayload): Promise<void> {
  const signer = accountManager.signer;
  if (!signer) throw new Error('Not logged in');

  const factory = new EventFactory();
  factory.setSigner(signer);

  // Kind 14 sealed rumor per NIP-59 recommendation
  const rumorTemplate = {
    kind: 14,
    content: JSON.stringify(payload),
    tags: [['p', recipientPubkey]],
    created_at: Math.floor(Date.now() / 1000),
  };

  // GiftWrapBlueprint handles: rumor → seal → gift wrap
  const wrapped = await factory.create(GiftWrapBlueprint, recipientPubkey, rumorTemplate);
  await publishEvent(wrapped);
}

/** Check for incoming gift wraps addressed to the current user */
export async function checkIncomingGiftWraps(): Promise<BirthDataPayload[]> {
  const signer = accountManager.signer;
  const pubkey = getPublicKey();
  if (!signer || !pubkey) return [];

  const events = await queryEvents([{
    kinds: [1059],
    '#p': [pubkey],
  }]);

  const payloads: BirthDataPayload[] = [];
  for (const event of events) {
    try {
      const rumor: Rumor = await unlockGiftWrap(event, signer);
      const parsed = JSON.parse(rumor.content);
      if (parsed.type === 'hd/birthdata') {
        // Attach sender pubkey if not already present
        if (!parsed.npub && rumor.pubkey) {
          parsed.senderPubkey = rumor.pubkey;
        }
        payloads.push(parsed as BirthDataPayload);
      }
    } catch {
      // Skip events we can't decrypt or parse
    }
  }

  return payloads;
}

/** Save received birth data to localStorage */
export function saveReceivedBirthData(data: BirthDataPayload[]): void {
  localStorage.setItem(RECEIVED_KEY, JSON.stringify(data));
}

/** Load received birth data from localStorage */
export function loadReceivedBirthData(): BirthDataPayload[] {
  try {
    const raw = localStorage.getItem(RECEIVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Clear received birth data (for logout) */
export function clearReceivedBirthData(): void {
  localStorage.removeItem(RECEIVED_KEY);
}
