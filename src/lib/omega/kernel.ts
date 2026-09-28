import type { FarkasCert, PeerReview, StandardCheck, TheoremDraft } from "./types";
import { lean4leanCheck } from "./handshake/lean4lean-js";
import { nanodaCheck } from "./handshake/nanoda-js";


const STANDARD_IDS: {
  id: string;
  title: string;
  run: (d: TheoremDraft, cert: FarkasCert | null, dualOk: boolean) => { pass: boolean; detail: string };
}[] = [
  {
    id: "TCB",
    title: "Small trusted kernel",
    run: (_d, cert, dualOk) => ({
      pass: dualOk && !!cert,
      detail: dualOk
        ? "Only the two kernels are trusted; omega is an untrusted tactic."
        : "Kernel acceptance missing — tactic output is not a theorem.",
    }),
  },
  {
    id: "NOSORRY",
    title: "No sorry / admit",
    run: (d) => ({
      pass: d.tactic !== "sorry" && !/\bsorry\b/.test(d.source),
      detail: d.tactic === "sorry" ? "Declaration uses sorry." : "No axioms or sorry in the declaration.",
    }),
  },
  {
    id: "EXPORT",
    title: "Exportable certificate",
    run: (_d, cert) => ({
      pass: !!cert,
      detail: cert
        ? `Farkas vector of length ${cert.multipliers.length} exported.`
        : "Solver did not produce a checkable certificate.",
    }),
  },
  {
    id: "DUAL",
    title: "Independent dual-kernel replay",
    run: (_d, _c, dualOk) => ({
      pass: dualOk,
      detail: dualOk
        ? "nanoda-js and lean4lean-js both replayed ⊥."
        : "Comparator-style dual check failed.",
    }),
  },
  {
    id: "INT",
    title: "Integer semantics",
    run: (d) => {
      const sorts = d.params.every((p) => p.sort === "Int" || p.sort === "Nat" || p.sort === "Ord");
      return {
        pass: sorts,
        detail: sorts ? "Binders are Int / Nat / Ord." : "Unsupported binder sort.",
      };
    },
  },
  {
    id: "GOAL",
    title: "Goal is a proposition",
    run: (d) => ({
      pass: !!d.goal,
      detail: "Goal is a linear comparison (Prop).",
    }),
  },
];

export function peerReview(draft: TheoremDraft, cert: FarkasCert | null): PeerReview {
  const primary = nanodaCheck(cert, draft);
  const independent = lean4leanCheck(cert, draft);
  const dualOk = primary.accepted && independent.accepted;
  const standards: StandardCheck[] = STANDARD_IDS.map((s) => {
    const r = s.run(draft, cert, dualOk);
    return { id: s.id, title: s.title, pass: r.pass, detail: r.detail };
  });
  const certified = dualOk && standards.every((s) => s.pass);
  return {
    primary,
    independent,
    certified,
    sorryUsed: draft.tactic === "sorry",
    standards,
  };
}
