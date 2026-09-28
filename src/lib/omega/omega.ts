import type { Constraint, FarkasCert, FmConstraint, OmegaStep, TheoremDraft } from "./types";
import {
  atomToConstraints,
  formatConstraint,
  gcdAll,
  negateAtom,
  prune,
  varsOfCs,
} from "./lin";

const LIMIT = 64;

type ArenaRow = FmConstraint & { origin: { kind: "orig"; i: number } | { kind: "cut"; i: number } };

function cloneC(c: FmConstraint): FmConstraint {
  return { coeff: { ...c.coeff }, bound: c.bound, label: c.label, combo: [...c.combo] };
}

function scaleC(c: FmConstraint, s: number): FmConstraint {
  const coeff: Record<string, number> = {};
  for (const [k, v] of Object.entries(c.coeff)) coeff[k] = v * s;
  return {
    coeff: prune(coeff),
    bound: c.bound * s,
    label: c.label,
    combo: c.combo.map((x) => x * s),
  };
}

function addC(a: FmConstraint, b: FmConstraint): FmConstraint {
  const coeff: Record<string, number> = { ...a.coeff };
  for (const [k, v] of Object.entries(b.coeff)) coeff[k] = (coeff[k] ?? 0) + v;
  const n = Math.max(a.combo.length, b.combo.length);
  const combo = Array.from({ length: n }, (_, i) => (a.combo[i] ?? 0) + (b.combo[i] ?? 0));
  return { coeff: prune(coeff), bound: a.bound + b.bound, label: "Σ", combo };
}

function tryTighten(c: FmConstraint): { changed: boolean; row: FmConstraint; gcd: number } {
  const vals = Object.values(c.coeff);
  if (!vals.length) return { changed: false, row: c, gcd: 1 };
  const g = gcdAll(vals);
  if (g <= 1) return { changed: false, row: c, gcd: 1 };
  const next: FmConstraint = {
    ...c,
    coeff: prune(Object.fromEntries(Object.entries(c.coeff).map(([k, v]) => [k, v / g]))),
    bound: Math.floor(c.bound / g),
    label: `${c.label}/ℤ${g}`,
  };
  const changed = next.bound !== c.bound / g || Object.keys(next.coeff).some((k) => next.coeff[k] !== c.coeff[k]);
  return { changed: next.bound !== c.bound || changed, row: next, gcd: g };
}

function isConstFalse(c: FmConstraint): boolean {
  return Object.keys(c.coeff).length === 0 && c.bound < 0;
}

function isConstTrue(c: FmConstraint): boolean {
  return Object.keys(c.coeff).length === 0 && c.bound >= 0;
}

function pickVar(cs: FmConstraint[]): string | null {
  const vars = varsOfCs(cs);
  if (!vars.length) return null;
  let best = vars[0]!;
  let score = Infinity;
  for (const v of vars) {
    let lo = 0;
    let hi = 0;
    for (const c of cs) {
      const a = c.coeff[v] ?? 0;
      if (a > 0) hi++;
      if (a < 0) lo++;
    }
    const s = lo * hi;
    if (s < score) {
      score = s;
      best = v;
    }
  }
  return best;
}

function eliminate(cs: FmConstraint[], v: string): FmConstraint[] {
  const lower: FmConstraint[] = [];
  const upper: FmConstraint[] = [];
  const rest: FmConstraint[] = [];
  for (const c of cs) {
    const a = c.coeff[v] ?? 0;
    if (a < 0) lower.push(c);
    else if (a > 0) upper.push(c);
    else rest.push(c);
  }
  const out = [...rest];
  for (const L of lower) {
    for (const U of upper) {
      const a = -(L.coeff[v] ?? 0);
      const b = U.coeff[v] ?? 0;
      const mixed = addC(scaleC(L, b), scaleC(U, a));
      delete mixed.coeff[v];
      mixed.coeff = prune(mixed.coeff);
      mixed.label = `${L.label}⋈${U.label}`;
      if (!isConstTrue(mixed)) out.push(mixed);
    }
  }
  return out;
}

function projectUnsat(
  originals: Constraint[],
  steps: OmegaStep[],
): { unsat: boolean; cert: FarkasCert | null } {
  const cuts: FarkasCert["cuts"] = [];
  /** combo layout: [orig..., cut...] */
  const dim0 = originals.length;
  let cs: FmConstraint[] = originals.map((c, i) => ({
    ...c,
    combo: Array.from({ length: dim0 }, (_, j) => (j === i ? 1 : 0)),
  }));

  const applyTight = (rows: FmConstraint[]): FmConstraint[] => {
    const out: FmConstraint[] = [];
    for (const row of rows) {
      const t = tryTighten(row);
      const src = unitIndex(row.combo);
      if (!t.changed || src === null) {
        out.push(row);
        continue;
      }
      const cutIndex = cuts.length;
      cuts.push({
        source: src,
        gcd: t.gcd,
        result: { coeff: t.row.coeff, bound: t.row.bound, label: t.row.label },
      });
      const combo = Array.from({ length: originals.length + cuts.length }, (_, j) =>
        j === originals.length + cutIndex ? 1 : 0,
      );
      steps.push({
        kind: "tighten",
        text: `Integer cut: divide ${formatConstraint(row)} by ${t.gcd} and floor the bound.`,
      });
      out.push({ ...t.row, combo });
    }
    return out;
  };

  for (let n = 0; n < LIMIT; n++) {
    cs = applyTight(cs).filter((c) => !isConstTrue(c));
    for (const c of cs) {
      if (isConstFalse(c)) {
        steps.push({
          kind: "contradiction",
          text: `Derived ${formatConstraint(c)} — a constant falsehood.`,
        });
        const origMult = c.combo.slice(0, originals.length);
        const cutMult = pad(c.combo.slice(originals.length), cuts.length);
        const derived: Constraint = { coeff: c.coeff, bound: c.bound, label: "⊥" };
        steps.push({
          kind: "combine",
          multipliers: [...origMult, ...cutMult],
          result: derived,
          text: `Certificate multipliers on rows + cuts ⟨${[...origMult, ...cutMult].join(", ")}⟩.`,
        });
        return {
          unsat: true,
          cert: {
            multipliers: origMult,
            cutMultipliers: cutMult,
            cuts,
            originals,
            derived,
          },
        };
      }
    }
    const v = pickVar(cs);
    if (!v) return { unsat: false, cert: null };
    steps.push({
      kind: "eliminate",
      variable: v,
      text: `Fourier–Motzkin eliminate ${v} from ${cs.length} rows (integer tightening).`,
    });
    cs = eliminate(cs, v);
    if (cs.length > 400) break;
  }
  return { unsat: false, cert: null };
}

function unitIndex(combo: number[]): number | null {
  let idx = -1;
  for (let i = 0; i < combo.length; i++) {
    const x = combo[i] ?? 0;
    if (x === 0) continue;
    if (x !== 1 || idx !== -1) return null;
    idx = i;
  }
  return idx >= 0 ? idx : null;
}

function pad(xs: number[], n: number): number[] {
  const out = xs.slice(0, n);
  while (out.length < n) out.push(0);
  return out;
}

function findWitness(constraints: Constraint[], vars: string[]): Record<string, number> | null {
  const ranges = [-8, -4, -2, -1, 0, 1, 2, 3, 4, 5, 6, 8];
  if (vars.length === 0) {
    return constraints.every((c) => 0 <= c.bound) ? {} : null;
  }
  if (vars.length > 4) return null;
  const rec = (i: number, asg: Record<string, number>): Record<string, number> | null => {
    if (i >= vars.length) {
      for (const c of constraints) {
        let s = 0;
        for (const [k, v] of Object.entries(c.coeff)) s += v * (asg[k] ?? 0);
        if (s > c.bound) return null;
      }
      return asg;
    }
    const name = vars[i]!;
    for (const val of ranges) {
      const hit = rec(i + 1, { ...asg, [name]: val });
      if (hit) return hit;
    }
    return null;
  };
  return rec(0, {});
}

export function proveOmega(draft: TheoremDraft): {
  unsat: boolean;
  steps: OmegaStep[];
  certificate: FarkasCert | null;
  witness: Record<string, number> | null;
} {
  if (draft.goal.cmp === "=") return proveEquality(draft);
  return proveInequality(draft);
}

function proveEquality(draft: TheoremDraft): {
  unsat: boolean;
  steps: OmegaStep[];
  certificate: FarkasCert | null;
  witness: Record<string, number> | null;
} {
  const le = proveInequality({ ...draft, goal: { ...draft.goal, cmp: "<=" } });
  const ge = proveInequality({ ...draft, goal: { ...draft.goal, cmp: ">=" } });
  const steps: OmegaStep[] = [
    {
      kind: "normalize",
      text: "Equality splits into both directions. Each direction needs its own certificate.",
      constraints: [],
    },
    ...le.steps,
    ...ge.steps,
  ];
  if (le.unsat && ge.unsat && le.certificate && ge.certificate) {
    return {
      unsat: true,
      steps,
      certificate: { ...le.certificate, also: ge.certificate },
      witness: null,
    };
  }
  const witness = le.witness ?? ge.witness;
  if (witness) {
    steps.push({
      kind: "sat",
      witness,
      text: `Countermodel ${formatWitness(witness)} breaks equality.`,
    });
  }
  return { unsat: false, steps, certificate: null, witness };
}

function proveInequality(draft: TheoremDraft): {
  unsat: boolean;
  steps: OmegaStep[];
  certificate: FarkasCert | null;
  witness: Record<string, number> | null;
} {
  const steps: OmegaStep[] = [];
  const hyps: Constraint[] = [];
  draft.hyps.forEach((h, i) => {
    hyps.push(...atomToConstraints(h.atom, h.name || `h${i}`));
  });
  for (const p of draft.params) {
    if (p.sort === "Nat") {
      hyps.push({ coeff: { [p.name]: -1 }, bound: 0, label: `${p.name}≥0` });
    }
  }
  const goalNeg = atomToConstraints(negateAtom(draft.goal), "¬goal");
  const all = [...hyps, ...goalNeg];
  steps.push({
    kind: "normalize",
    text: `Normalize ${all.length} integer rows to Ax ≤ b, including the negated goal.`,
    constraints: all,
  });

  const { unsat, cert } = projectUnsat(all, steps);
  if (unsat && cert) return { unsat: true, steps, certificate: cert, witness: null };

  const witness = findWitness(all, varsOfCs(all));
  if (witness) {
    steps.push({
      kind: "sat",
      witness,
      text: `Countermodel ${formatWitness(witness)} satisfies hypotheses and the negated goal.`,
    });
    return { unsat: false, steps, certificate: null, witness };
  }
  steps.push({
    kind: "reject",
    text: "Omega could not derive ⊥, and no small-integer witness was found. Goal stands open.",
  });
  return { unsat: false, steps, certificate: null, witness: null };
}

function formatWitness(w: Record<string, number>): string {
  const body = Object.entries(w)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}↦${v}`)
    .join(", ");
  return `{ ${body} }`;
}
