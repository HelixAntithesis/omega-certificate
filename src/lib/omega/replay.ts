import type { Constraint, FarkasCert, KernelVerdict, TheoremDraft } from "./types";
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

export function reviewCert(
  cert: FarkasCert | null,
  draft: TheoremDraft,
  kernel: KernelVerdict["kernel"],
): KernelVerdict {
  if (draft.tactic === "sorry") {
    return {
      kernel,
      accepted: false,
      reasons: [
        kernel === "nanoda-js"
          ? "sorry is forbidden in the trusted kernel."
          : "Independent kernel refuses sorry.",
      ],
      checkedAt: Date.now(),
      steps: 0,
    };
  }
  if (!cert) {
    return {
      kernel,
      accepted: false,
      reasons: [kernel === "nanoda-js" ? "No exportable certificate." : "Nothing to replay."],
      checkedAt: Date.now(),
      steps: 0,
    };
  }
  if (draft.goal.cmp === "=" && !cert.also) {
    return {
      kernel,
      accepted: false,
      reasons: ["Equality needs a certificate for both directions."],
      checkedAt: Date.now(),
      steps: 0,
    };
  }
  const first = checkCert(cert, kernel);
  if (draft.goal.cmp !== "=" || !cert.also) return first;
  const second = checkCert(cert.also, kernel);
  return {
    kernel,
    accepted: first.accepted && second.accepted,
    reasons: [
      ...first.reasons.map((r) => `a ≤ b: ${r}`),
      ...second.reasons.map((r) => `a ≥ b: ${r}`),
    ],
    checkedAt: Date.now(),
    steps: first.steps + second.steps,
  };
}
