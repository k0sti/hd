import { useState, useEffect } from 'react';
import { initEphemeris } from '../hd';
import { loadSvgTemplate } from '../bodygraph';

export function useInit() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([initEphemeris(), loadSvgTemplate()])
      .then(() => setReady(true))
      .catch((err) => setError(String(err)));
  }, []);

  return { ready, error };
}
