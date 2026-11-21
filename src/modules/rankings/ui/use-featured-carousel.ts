"use client";
import { useEffect, useState, useSyncExternalStore } from "react";

const subscribeMotion = (notify: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const motionSnapshot = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverMotionSnapshot = () => true;
type Selection = { current: string | null; previous: string | null };

export function useFeaturedCarousel(ids: readonly string[]) {
  const [selection, setSelection] = useState<Selection>({
    current: null,
    previous: null,
  });
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    motionSnapshot,
    serverMotionSnapshot,
  );
  const currentId = ids.includes(selection.current ?? "")
    ? selection.current
    : (ids[0] ?? null);
  useEffect(() => {
    if (paused || focused || reducedMotion || ids.length < 2) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setSelection((last) => {
        const index = Math.max(0, ids.indexOf(last.current ?? ""));
        return {
          previous: ids[index] ?? null,
          current: ids[(index + 1) % ids.length] ?? null,
        };
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [ids, paused, focused, reducedMotion]);
  function select(id: string) {
    if (id !== currentId) setSelection({ previous: currentId, current: id });
  }
  function step(direction: number) {
    const index = ids.indexOf(currentId ?? "");
    const next = ids[(index + direction + ids.length) % ids.length];
    if (next) select(next);
  }
  function reset() {
    setSelection({ current: null, previous: null });
  }
  function togglePlayback() {
    // An explicit Play overrides the interaction that focused the Play button.
    if (paused) {
      setFocused(false);
    }
    setPaused(!paused);
  }
  return {
    currentId,
    previousId: selection.previous,
    select,
    step,
    reset,
    paused,
    togglePlayback,
    setFocused,
    reducedMotion,
  };
}
