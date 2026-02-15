import { useRef, useEffect } from 'react';
import { renderBodygraph } from '../bodygraph';
import { useAppState } from '../hooks/useAppState';

export function BodygraphView() {
  const ref = useRef<HTMLDivElement>(null);
  const { state } = useAppState();

  useEffect(() => {
    if (ref.current) {
      renderBodygraph(ref.current, state as any);
    }
  }, [state.viewMode, state.selectedPersonA, state.selectedPersonB, state.transitActivations, state.personCharts]);

  return <div id="bodygraph-container" ref={ref} className="w-full max-w-2xl" />;
}
