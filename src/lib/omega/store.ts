import { create } from "zustand";
import { LIBRARY } from "./library";
import { SUBJECTS, type Kingdom, type SubjectApp } from "./subjects";
import type { VerifyResult } from "./types";
import { verifySource } from "./verify";

export type Tab = "applications" | "studio" | "kernel" | "omega" | "review" | "ordinals";

type State = {
  source: string;
  result: VerifyResult | null;
  tab: Tab;
  history: { name: string; certified: boolean; at: number }[];
  subjectId: string | null;
  kingdom: Kingdom | "all";
  verdicts: Record<string, boolean>;
  setSource: (s: string) => void;
  loadSample: (id: string) => void;
  loadSubject: (id: string) => void;
  setKingdom: (k: Kingdom | "all") => void;
  certifyKingdom: () => void;
  run: () => void;
  setTab: (t: Tab) => void;
};

function pushHistory(
  history: State["history"],
  name: string,
  certified: boolean,
): State["history"] {
  return [{ name, certified, at: Date.now() }, ...history].slice(0, 12);
}

export const useOmega = create<State>((set, get) => ({
  source: SUBJECTS[0]!.source,
  result: null,
  tab: "applications",
  history: [],
  subjectId: SUBJECTS[0]!.id,
  kingdom: "all",
  verdicts: {},
  setSource: (source) => set({ source }),
  loadSample: (id) => {
    const s = LIBRARY.find((x) => x.id === id);
    if (!s) return;
    const result = verifySource(s.source);
    set((st) => ({
      source: s.source,
      result,
      subjectId: null,
      tab: "studio",
      history: pushHistory(st.history, result.draft.name, !!result.review?.certified),
    }));
  },
  loadSubject: (id) => {
    const s = SUBJECTS.find((x) => x.id === id);
    if (!s) return;
    const result = verifySource(s.source);
    const certified = !!result.review?.certified;
    set((st) => ({
      source: s.source,
      result,
      subjectId: s.id,
      tab: "applications",
      verdicts: { ...st.verdicts, [s.id]: certified },
      history: pushHistory(st.history, s.name, certified),
    }));
  },
  setKingdom: (kingdom) => set({ kingdom }),
  certifyKingdom: () => {
    const { kingdom } = get();
    const list =
      kingdom === "all" ? SUBJECTS : SUBJECTS.filter((s) => s.kingdom === kingdom);
    const verdicts = { ...get().verdicts };
    let last: { app: SubjectApp; result: VerifyResult } | null = null;
    for (const app of list) {
      const result = verifySource(app.source);
      verdicts[app.id] = !!result.review?.certified;
      last = { app, result };
    }
    if (!last) return;
    set((st) => ({
      verdicts,
      source: last.app.source,
      result: last.result,
      subjectId: last.app.id,
      history: pushHistory(st.history, `${list.length} ${kingdom}`, list.every((a) => verdicts[a.id])),
    }));
  },
  run: () => {
    const result = verifySource(get().source);
    const certified = !!result.review?.certified;
    const subjectId = get().subjectId;
    set((st) => ({
      result,
      verdicts: subjectId ? { ...st.verdicts, [subjectId]: certified } : st.verdicts,
      history: pushHistory(st.history, result.draft.name, certified),
    }));
  },
  setTab: (tab) => set({ tab }),
}));
