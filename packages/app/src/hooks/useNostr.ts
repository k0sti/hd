import { useState, useEffect, useCallback } from 'react';
import { initNostr, loginWithExtension, loginAsGuest, logout as nostrLogout, isLoggedIn, getNpub, compressNpub, fetchProfile, type NostrProfile } from '../nostr';

export function useNostr() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [profile, setProfile] = useState<NostrProfile | null>(null);

  useEffect(() => {
    initNostr();
    setLoggedIn(isLoggedIn());
  }, []);

  const loginExtension = useCallback(async () => {
    await loginWithExtension();
    setLoggedIn(true);
    fetchProfile().then(setProfile).catch(() => {});
  }, []);

  const loginGuest = useCallback(() => {
    loginAsGuest();
    setLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    nostrLogout();
    setLoggedIn(false);
    setProfile(null);
  }, []);

  const loadProfile = useCallback(async () => {
    const p = await fetchProfile();
    setProfile(p);
    return p;
  }, []);

  return {
    loggedIn,
    profile,
    loginExtension,
    loginGuest,
    logout,
    loadProfile,
    getNpub,
    compressNpub,
  };
}
