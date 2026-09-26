import type { Atom, Cmp, Constraint, Lin } from "./types";

export function lin(coeff: Record<string, number> = {}, k = 0): Lin {
  return { coeff: prune(coeff), k };
}

export function prune(coeff: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(coeff)) {
    if (v !== 0) out[k] = v;
  }
  return out;
}

export function addLin(a: Lin, b: Lin, sa = 1, sb = 1): Lin {
  const coeff: Record<string, number> = {};
  for (const [k, v] of Object.entries(a.coeff)) coeff[k] = (coeff[k] ?? 0) + sa * v;
  for (const [k, v] of Object.entries(b.coeff)) coeff[k] = (coeff[k] ?? 0) + sb * v;
  return lin(coeff, sa * a.k + sb * b.k);
}

export function scaleLin(a: Lin, s: number): Lin {
  const coeff: Record<string, number> = {};
  for (const [k, v] of Object.entries(a.coeff)) coeff[k] = v * s;
  return lin(coeff, a.k * s);
}

export function varsOf(l: Lin): string[] {
  return Object.keys(l.coeff).sort();
}

export function varsOfCs(cs: Constraint[]): string[] {
  const s = new Set<string>();
  for (const c of cs) for (const k of Object.keys(c.coeff)) s.add(k);
  return [...s].sort();
}

export function formatLin(l: Lin): string {
  const parts: string[] = [];
  const keys = Object.keys(l.coeff).sort();
  for (const k of keys) {
    const v = l.coeff[k]!;
    if (v === 0) continue;
    const abs = Math.abs(v);
    const term = abs === 1 ? k : `${abs}·${k}`;
    if (parts.length === 0) parts.push(v < 0 ? `−${term}` : term);
    else parts.push(v < 0 ? `− ${term}` : `+ ${term}`);
  }
  if (l.k !== 0) {
    const abs = Math.abs(l.k);
    if (parts.length === 0) parts.push(String(l.k));
    else parts.push(l.k < 0 ? `− ${abs}` : `+ ${abs}`);
  }
  return parts.length ? parts.join(" ") : "0";
}

export function formatAtom(a: Atom): string {
  return `${formatLin(a.left)} ${prettyCmp(a.cmp)} ${formatLin(a.right)}`;
}

export function prettyCmp(c: Cmp): string {
  return { "<=": "≤", ">=": "≥", "<": "<", ">": ">", "=": "=" }[c];
}

export function formatConstraint(c: Constraint): string {
  return `${formatLin({ coeff: c.coeff, k: 0 })} ≤ ${c.bound}`;
}

/** Normalize atom to a single ≤ constraint (or two for =). Integers only. */
export function atomToConstraints(atom: Atom, label: string): Constraint[] {
  const d = addLin(atom.left, atom.right, 1, -1);
  switch (atom.cmp) {
    case "<=":
      return [{ coeff: d.coeff, bound: -d.k, label }];
    case ">=":
      return [{ coeff: scaleLin(d, -1).coeff, bound: d.k, label }];
    case "<":
      return [{ coeff: d.coeff, bound: -d.k - 1, label }];
    case ">":
      return [{ coeff: scaleLin(d, -1).coeff, bound: d.k - 1, label }];
    case "=":
      return [
        { coeff: d.coeff, bound: -d.k, label: `${label}≤` },
        { coeff: scaleLin(d, -1).coeff, bound: d.k, label: `${label}≥` },
      ];
  }
}

export function negateAtom(atom: Atom): Atom {
  const flip: Record<Cmp, Cmp> = {
    "<=": ">",
    ">=": "<",
    "<": ">=",
    ">": "<=",
    "=": "=",
  };
  if (atom.cmp === "=") {
    return { left: atom.left, cmp: ">", right: atom.right };
  }
  return { left: atom.left, cmp: flip[atom.cmp], right: atom.right };
}

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.trunc(a));
  b = Math.abs(Math.trunc(b));
  while (b) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a || 1;
}

export function gcdAll(xs: number[]): number {
  return xs.reduce((g, x) => gcd(g, x), 0) || 1;
}
