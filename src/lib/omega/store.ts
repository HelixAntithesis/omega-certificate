import { create } from "zustand";
import { LIBRARY } from "./library";
import type { VerifyResult } from "./types";
import { verifySource } from "./verify";

export type Tab = "studio" | "kernel" | "omega" | "review" | "ordinals";

type State = {
  source: string;
  result: VerifyResult | null;
  tab: Tab;
  history: { name: string; certified: boolean; at: number }[];
  setSource: (s: string) => void;
  loadSample: (id: string) => void;
  run: () => void;
  setTab: (t: Tab) => void;
};

export const useOmega = create<State>((set, get) => ({
  source: LIBRARY[0]!.source,
  result: null,
  tab: "studio",
  history: [],
  setSource: (source) => set({ source }),
  loadSample: (id) => {
    const s = LIBRARY.find((x) => x.id === id);
    if (!s) return;
    const result = verifySource(s.source);
    const entry = {
      name: result.draft.name,
      certified: !!result.review?.certified,
      at: Date.now(),
    };
    set((st) => ({
      source: s.source,
      result,
      history: [entry, ...st.history].slice(0, 12),
    }));
  },
  run: () => {
    const result = verifySource(get().source);
    const entry = {
      name: result.draft.name,
      certified: !!result.review?.certified,
      at: Date.now(),
    };
    set((st) => ({ result, history: [entry, ...st.history].slice(0, 12) }));
  },
  setTab: (tab) => set({ tab }),
}));
