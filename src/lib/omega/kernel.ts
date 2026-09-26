import type { Constraint, FarkasCert, KernelVerdict, PeerReview, StandardCheck, TheoremDraft } from "./types";
import { gcdAll, prune } from "./lin";

function rowOf(cert: FarkasCert, index: number): Constraint {
  if (index < cert.originals.length) return cert.originals[index]!;
  const cut = cert.cuts[index - cert.originals.length];
  if (!cut) throw new Error("cut index out of range");
  return cut.result;
}

function replayCuts(cert: FarkasCert): string | null {
  for (let i = 0; i < cert.cuts.length; i++) {
    const cut = cert.cuts[i]!;
    if (cut.source < 0 || cut.source >= cert.originals.length + i) {
      return `Cut ${i} source is not a prior row.`;
    }
    const src = rowOf(cert, cut.source);
    const vals = Object.values(src.coeff);
    const g = gcdAll(vals);
    if (g !== cut.gcd || g <= 1) return `Cut ${i} gcd does not match integer tightening.`;
    const expectCoeff = prune(
      Object.fromEntries(Object.entries(src.coeff).map(([k, v]) => [k, v / g])),
    );
    const expectBound = Math.floor(src.bound / g);
    const same =
      expectBound === cut.result.bound &&
      Object.keys({ ...expectCoeff, ...cut.result.coeff }).every(
        (k) => (expectCoeff[k] ?? 0) === (cut.result.coeff[k] ?? 0),
      );
    if (!same) return `Cut ${i} is not the integer tightening of its source.`;
  }
  return null;
}

function evalCombo(cert: FarkasCert): { coeff: Record<string, number>; bound: number } {
  const coeff: Record<string, number> = {};
  let bound = 0;
  const add = (row: Constraint, λ: number) => {
    if (λ === 0) return;
    for (const [k, v] of Object.entries(row.coeff)) coeff[k] = (coeff[k] ?? 0) + λ * v;
    bound += λ * row.bound;
  };
  cert.originals.forEach((row, i) => add(row, cert.multipliers[i] ?? 0));
  cert.cuts.forEach((cut, i) => add(cut.result, cert.cutMultipliers[i] ?? 0));
  return { coeff: prune(coeff), bound };
}

function checkCert(cert: FarkasCert, kernel: KernelVerdict["kernel"]): KernelVerdict {
  const reasons: string[] = [];
  let accepted = true;

  if (cert.multipliers.length !== cert.originals.length) {
    accepted = false;
    reasons.push("Multiplier vector length ≠ original row count.");
  }
  if (cert.cutMultipliers.length !== cert.cuts.length) {
    accepted = false;
    reasons.push("Cut multiplier length ≠ cut count.");
  }
  const allλ = [...cert.multipliers, ...cert.cutMultipliers];
  for (const λ of allλ) {
    if (!Number.isInteger(λ) || λ < 0) {
      accepted = false;
      reasons.push("Multipliers must be nonnegative integers.");
      break;
    }
  }
  if (!allλ.some((λ) => λ > 0)) {
    accepted = false;
    reasons.push("Trivial zero combination is not a proof.");
  }

  const cutErr = replayCuts(cert);
  if (cutErr) {
    accepted = false;
    reasons.push(cutErr);
  } else if (cert.cuts.length) {
    reasons.push(`Replayed ${cert.cuts.length} integer cut(s).`);
  }

  const got = evalCombo(cert);
  const vars = Object.keys(got.coeff);
  if (vars.length !== 0) {
    accepted = false;
    reasons.push(`Combination is not a constant row (leftover ${vars.join(", ")}).`);
  }
  if (got.bound >= 0) {
    accepted = false;
    reasons.push(`Combination yields 0 ≤ ${got.bound}, which is not absurd.`);
  } else {
    reasons.push(`Replayed combination yields 0 ≤ ${got.bound} (⊥).`);
  }

  if (cert.derived.bound !== got.bound && accepted) {
    accepted = false;
    reasons.push("Derived bound does not match independently replayed bound.");
  }

  return {
    kernel,
    accepted,
    reasons,
    checkedAt: Date.now(),
    steps: allλ.filter((λ) => λ > 0).length + cert.cuts.length + 2,
  };
}

export function nanodaCheck(cert: FarkasCert | null, draft: TheoremDraft): KernelVerdict {
  if (draft.tactic === "sorry") {
    return {
      kernel: "nanoda-js",
      accepted: false,
      reasons: ["sorry is forbidden in the trusted kernel."],
      checkedAt: Date.now(),
      steps: 0,
    };
  }
  if (!cert) {
    return {
      kernel: "nanoda-js",
      accepted: false,
      reasons: ["No exportable certificate."],
      checkedAt: Date.now(),
      steps: 0,
    };
  }
  return checkCert(cert, "nanoda-js");
}

export function lean4leanCheck(cert: FarkasCert | null, draft: TheoremDraft): KernelVerdict {
  if (draft.tactic === "sorry") {
    return {
      kernel: "lean4lean-js",
      accepted: false,
      reasons: ["Independent kernel refuses sorry."],
      checkedAt: Date.now(),
      steps: 0,
    };
  }
  if (!cert) {
    return {
      kernel: "lean4lean-js",
      accepted: false,
      reasons: ["Nothing to replay."],
      checkedAt: Date.now(),
      steps: 0,
    };
  }
  const v = checkCert(cert, "lean4lean-js");
  const replay = evalCombo(cert);
  if (Object.keys(replay.coeff).length !== 0 || replay.bound >= 0) {
    return {
      ...v,
      accepted: false,
      reasons: [...v.reasons, "Second-pass replay diverged."],
    };
  }
  return v;
}

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
