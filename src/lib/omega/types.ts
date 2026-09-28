/** Integer linear form: Σ coeff[v] · v + const */
export type Lin = {
  coeff: Record<string, number>;
  k: number;
};

export type Cmp = "<=" | ">=" | "<" | ">" | "=";

export type Atom = {
  left: Lin;
  cmp: Cmp;
  right: Lin;
};

export type Sort = "Int" | "Nat" | "Ord" | "Prop";

export type Binder = {
  name: string;
  sort: Sort;
};

export type TheoremDraft = {
  name: string;
  params: Binder[];
  hyps: { name: string; atom: Atom }[];
  goal: Atom;
  tactic: "omega" | "ordinal" | "sorry";
  source: string;
};

export type Constraint = {
  /** Σ coeff[v] · v  ≤  bound */
  coeff: Record<string, number>;
  bound: number;
  label: string;
};

export type Combo = number[];

export type FmConstraint = Constraint & { combo: Combo };

export type OmegaStep =
  | { kind: "normalize"; text: string; constraints: Constraint[] }
  | { kind: "eliminate"; variable: string; text: string }
  | { kind: "tighten"; text: string }
  | { kind: "combine"; multipliers: number[]; result: Constraint; text: string }
  | { kind: "contradiction"; text: string }
  | { kind: "sat"; witness: Record<string, number>; text: string }
  | { kind: "reject"; text: string };

export type CutStep = {
  source: number;
  gcd: number;
  result: Constraint;
};

export type FarkasCert = {
  /** Nonnegative integer multipliers on original rows. */
  multipliers: number[];
  /** Nonnegative integer multipliers on derived cuts. */
  cutMultipliers: number[];
  cuts: CutStep[];
  originals: Constraint[];
  derived: Constraint;
  /** Second direction when the goal is an equality. */
  also?: FarkasCert;
};

export type KernelVerdict = {
  kernel: "nanoda-js" | "lean4lean-js";
  accepted: boolean;
  reasons: string[];
  checkedAt: number;
  steps: number;
};

export type PeerReview = {
  primary: KernelVerdict;
  independent: KernelVerdict;
  certified: boolean;
  sorryUsed: boolean;
  standards: StandardCheck[];
};

export type StandardCheck = {
  id: string;
  title: string;
  pass: boolean;
  detail: string;
};

export type VerifyResult = {
  ok: boolean;
  unsat: boolean;
  steps: OmegaStep[];
  certificate: FarkasCert | null;
  witness: Record<string, number> | null;
  review: PeerReview | null;
  error?: string;
  draft: TheoremDraft;
};
