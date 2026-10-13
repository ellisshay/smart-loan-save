import { createContext, useContext, useEffect, useRef } from "react";

/** Saves a step's in-progress answers while the client (or staff on the phone) types. */
type AutosaveFn = (stepKey: string, data: any) => void;

export const IntakeAutosaveContext = createContext<AutosaveFn | null>(null);

const DELAY_MS = 1200;

export function useStepAutosave(stepKey: string, watch: (cb: (values: any) => void) => { unsubscribe: () => void }) {
  const save = useContext(IntakeAutosaveContext);
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let latest: any;
    const flush = () => { if (latest !== undefined && saveRef.current) { saveRef.current(stepKey, JSON.parse(JSON.stringify(latest))); latest = undefined; } };
    const sub = watch((values) => {
      latest = values;
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, DELAY_MS);
    });
    // Leaving the step (or closing the tab) must not lose the last keystrokes.
    window.addEventListener("pagehide", flush);
    return () => { sub.unsubscribe(); if (timer) clearTimeout(timer); flush(); window.removeEventListener("pagehide", flush); };
  }, [stepKey, watch]);
}
