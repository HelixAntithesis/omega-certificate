/** Cantor normal form ordinals below ε₀: ω^α₁·c₁ + … + ω^αₖ·cₖ with α₁ > … > αₖ. */

export type Cnf = { exp: Cnf; coeff: number }[];

export const ZERO: Cnf = [];
export const ONE: Cnf = [{ exp: [], coeff: 1 }];
export const OMEGA: Cnf = [{ exp: [{ exp: [], coeff: 1 }], coeff: 1 }];

export function finite(n: number): Cnf {
  if (n <= 0) return [];
  return [{ exp: [], coeff: Math.trunc(n) }];
}

export function cmpCnf(a: Cnf, b: Cnf): number {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (i >= a.length) return -1;
    if (i >= b.length) return 1;
    const ea = a[i]!;
    const eb = b[i]!;
    const c = cmpCnf(ea.exp, eb.exp);
    if (c) return c;
    if (ea.coeff !== eb.coeff) return ea.coeff < eb.coeff ? -1 : 1;
  }
  return 0;
}

export function addCnf(a: Cnf, b: Cnf): Cnf {
  if (!a.length) return b;
  if (!b.length) return a;
  const headA = a[0]!;
  const headB = b[0]!;
  const c = cmpCnf(headA.exp, headB.exp);
  if (c > 0) return [headA, ...addCnf(a.slice(1), b)];
  if (c < 0) return addCnf(b, a);
  const coeff = headA.coeff + headB.coeff;
  return [{ exp: headA.exp, coeff }, ...addCnf(a.slice(1), b.slice(1))];
}

export function mulFinite(a: Cnf, n: number): Cnf {
  if (n <= 0 || !a.length) return [];
  const head = a[0]!;
  return [{ exp: head.exp, coeff: head.coeff * n }, ...a.slice(1)];
}

export function mulCnf(a: Cnf, b: Cnf): Cnf {
  if (!a.length || !b.length) return [];
  let acc: Cnf = [];
  for (const term of b) {
    const piece = a.length
      ? [{ exp: addCnf(a[0]!.exp, term.exp), coeff: a[0]!.coeff * term.coeff }, ...mulFinite(a.slice(1), 0)]
      : [];
    // ω^α · (ω^β · c) = ω^(α+β) · c when β>0; when β=0 it is finite multiply
    let contrib: Cnf;
    if (term.exp.length === 0) contrib = mulFinite(a, term.coeff);
    else {
      const head = a[0]!;
      contrib = [{ exp: addCnf(head.exp, term.exp), coeff: head.coeff * term.coeff }];
    }
    acc = addCnf(acc, contrib);
  }
  return acc;
}

export function formatCnf(o: Cnf): string {
  if (!o.length) return "0";
  return o
    .map((t, i) => {
      const e = formatCnf(t.exp);
      let term: string;
      if (e === "0") term = String(t.coeff);
      else if (e === "1") term = t.coeff === 1 ? "ω" : `${t.coeff}·ω`;
      else term = t.coeff === 1 ? `ω^${wrap(e)}` : `${t.coeff}·ω^${wrap(e)}`;
      return i === 0 ? term : term;
    })
    .join(" + ");
}

function wrap(s: string): string {
  return s.includes("+") ? `(${s})` : s;
}

export type OrdExpr =
  | { kind: "num"; n: number }
  | { kind: "omega" }
  | { kind: "add"; l: OrdExpr; r: OrdExpr }
  | { kind: "mul"; l: OrdExpr; r: OrdExpr };

export function evalOrd(e: OrdExpr): Cnf {
  switch (e.kind) {
    case "num":
      return finite(e.n);
    case "omega":
      return OMEGA;
    case "add":
      return addCnf(evalOrd(e.l), evalOrd(e.r));
    case "mul":
      return mulCnf(evalOrd(e.l), evalOrd(e.r));
  }
}

export function parseOrd(src: string): OrdExpr {
  const s = src.replace(/\s+/g, "").replace(/ω/g, "w").replace(/Omega/gi, "w");
  return parseAdd(s).e;
}

function parseAdd(s: string): { e: OrdExpr; rest: string } {
  let { e, rest } = parseMul(s);
  while (rest.startsWith("+")) {
    const n = parseMul(rest.slice(1));
    e = { kind: "add", l: e, r: n.e };
    rest = n.rest;
  }
  return { e, rest };
}

function parseMul(s: string): { e: OrdExpr; rest: string } {
  let { e, rest } = parsePow(s);
  while (rest.startsWith("*") || rest.startsWith("·")) {
    const n = parsePow(rest.slice(1));
    e = { kind: "mul", l: e, r: n.e };
    rest = n.rest;
  }
  return { e, rest };
}

function parsePow(s: string): { e: OrdExpr; rest: string } {
  const atom = parseAtom(s);
  if (atom.rest.startsWith("^")) {
    const exp = parsePow(atom.rest.slice(1));
    // ω^α ≈ mul tower via CNF: treat as omega * ... only for finite small; use add on exponents via eval
    if (atom.e.kind === "omega") {
      return {
        e: { kind: "mul", l: { kind: "omega" }, r: powRest(exp.e) },
        rest: exp.rest,
      };
    }
    return { e: atom.e, rest: atom.rest };
  }
  return atom;
}

function powRest(e: OrdExpr): OrdExpr {
  return e;
}

function parseAtom(s: string): { e: OrdExpr; rest: string } {
  if (s.startsWith("(")) {
    const inner = parseAdd(s.slice(1));
    const rest = inner.rest.startsWith(")") ? inner.rest.slice(1) : inner.rest;
    return { e: inner.e, rest };
  }
  if (s.startsWith("w")) return { e: { kind: "omega" }, rest: s.slice(1) };
  const m = s.match(/^(\d+)/);
  if (m) return { e: { kind: "num", n: Number(m[1]) }, rest: s.slice(m[1]!.length) };
  throw new Error(`Bad ordinal fragment “${s}”`);
}

export type OrdGoal = {
  left: string;
  cmp: "<" | ">" | "=" | "≠";
  right: string;
};

export function decideOrd(goal: OrdGoal): { ok: boolean; left: Cnf; right: Cnf; cmp: number; text: string } {
  const left = evalOrd(parseOrd(goal.left));
  const right = evalOrd(parseOrd(goal.right));
  const c = cmpCnf(left, right);
  let ok = false;
  if (goal.cmp === "<") ok = c < 0;
  if (goal.cmp === ">") ok = c > 0;
  if (goal.cmp === "=") ok = c === 0;
  if (goal.cmp === "≠") ok = c !== 0;
  return {
    ok,
    left,
    right,
    cmp: c,
    text: `${formatCnf(left)} ${goal.cmp} ${formatCnf(right)} is ${ok ? "true" : "false"} by CNF comparison.`,
  };
}
