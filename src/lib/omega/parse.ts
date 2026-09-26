import type { Atom, Binder, Cmp, Lin, Sort, TheoremDraft } from "./types";
import { lin } from "./lin";

const CMPS: [string, Cmp][] = [
  ["<=", "<="],
  [">=", ">="],
  ["≤", "<="],
  ["≥", ">="],
  ["==", "="],
  ["=", "="],
  ["<", "<"],
  [">", ">"],
];

function tokenizeExpr(src: string): string[] {
  return src
    .replace(/·/g, "*")
    .replace(/−/g, "-")
    .match(/\d+|[A-Za-z_][A-Za-z0-9_']*|[+\-*()]|\s+|[^\s]/g)
    ?.filter((t) => !/^\s+$/.test(t)) ?? [];
}

export function parseLin(src: string): Lin {
  const tokens = tokenizeExpr(src.trim());
  if (!tokens.length) return lin({}, 0);
  let i = 0;
  const coeff: Record<string, number> = {};
  let k = 0;
  let sign = 1;
  let started = false;

  const peek = () => tokens[i];
  const eat = () => tokens[i++];

  while (i < tokens.length) {
    const t = peek();
    if (t === "+" || t === "-") {
      sign = eat() === "-" ? -1 : 1;
      continue;
    }
    if (!started && t && t !== "+" && t !== "-") {
      /* implicit + */
    }
    started = true;
    let num = 1;
    if (peek() && /^\d+$/.test(peek()!)) {
      num = Number(eat());
      if (peek() === "*") eat();
    }
    if (peek() && /^[A-Za-z_]/.test(peek()!)) {
      const name = eat()!;
      coeff[name] = (coeff[name] ?? 0) + sign * num;
    } else {
      k += sign * num;
    }
    sign = 1;
  }
  return lin(coeff, k);
}

export function parseAtom(src: string): Atom {
  const raw = src.trim();
  for (const [sym, cmp] of CMPS) {
    const idx = raw.indexOf(sym);
    if (idx === -1) continue;
    if (sym === "=" && raw.includes("==")) continue;
    if (sym === "<" && (raw.includes("<=") || raw.includes("≤"))) continue;
    if (sym === ">" && (raw.includes(">=") || raw.includes("≥"))) continue;
    return {
      left: parseLin(raw.slice(0, idx)),
      cmp,
      right: parseLin(raw.slice(idx + sym.length)),
    };
  }
  throw new Error(`Expected a comparison in “${src}”`);
}

function parseSort(s: string): Sort {
  const t = s.trim();
  if (t === "Nat" || t === "ℕ") return "Nat";
  if (t === "Ord" || t === "Ordinal") return "Ord";
  if (t === "Prop") return "Prop";
  return "Int";
}

/**
 * Accepts Lean 4 or Python-omega surface syntax.
 *
 * Lean:
 *   theorem add_pos (a b : Int) (ha : a ≥ 1) (hb : b ≥ 1) : a + b ≥ 2 := by omega
 *
 * Python:
 *   def add_pos(a: Int, b: Int, ha: a >= 1, hb: b >= 1) -> a + b >= 2:
 *       omega
 */
export function parseTheorem(source: string): TheoremDraft {
  const text = source.replace(/\r/g, "").trim();
  if (!text) throw new Error("Empty declaration");

  const sorry = /\bsorry\b/.test(text);
  const ordinal = /\b(ordinal|omega_ord|cnf)\b/i.test(text) && !/\bby\s+omega\b/.test(text);
  const tactic: TheoremDraft["tactic"] = sorry ? "sorry" : ordinal ? "ordinal" : "omega";

  if (/^\s*(theorem|lemma|example)\b/.test(text)) return parseLean(text, tactic, source);
  if (/^\s*(def|theorem)\b/.test(text)) return parsePython(text, tactic, source);
  return parseLean(text, tactic, source);
}

function parseLean(text: string, tactic: TheoremDraft["tactic"], source: string): TheoremDraft {
  const head = text.match(/^(?:theorem|lemma|example)\s+([A-Za-z_][A-Za-z0-9_']*)/);
  const name = head?.[1] ?? "unnamed";
  const afterName = text.slice(head?.[0].length ?? 0);

  const params: Binder[] = [];
  const hyps: TheoremDraft["hyps"] = [];

  const binderRe = /\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  const binders: string[] = [];
  while ((m = binderRe.exec(afterName))) binders.push(m[1]!);

  const colonGoal = afterName.match(/\)\s*:\s*([^:=]+?)\s*:=/);
  const goalSrc = colonGoal?.[1]?.trim();
  if (!goalSrc) throw new Error("Missing goal after “: … :=”");

  for (const b of binders) {
    const parts = b.split(":").map((s) => s.trim());
    if (parts.length < 2) continue;
    const names = parts[0]!.split(/\s+/).filter(Boolean);
    const rhs = parts.slice(1).join(":").trim();
    if (/^(Int|Nat|ℕ|Ord|Ordinal|Prop)$/.test(rhs)) {
      for (const n of names) params.push({ name: n, sort: parseSort(rhs) });
    } else {
      const atom = parseAtom(rhs);
      const hname = names[0] ?? `h${hyps.length}`;
      hyps.push({ name: hname, atom });
    }
  }

  return { name, params, hyps, goal: parseAtom(goalSrc), tactic, source };
}

function parsePython(text: string, tactic: TheoremDraft["tactic"], source: string): TheoremDraft {
  const header = text.split("\n")[0] ?? text;
  const def =
    header.match(/^(?:def|theorem)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*(?:->|→)\s*(.+?)\s*:?\s*$/) ??
    text.match(/^(?:def|theorem)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*(?:->|→)\s*([^:\n]+)/s);
  if (!def) throw new Error("Expected  def name(...) -> goal:");
  const name = def[1]!;
  const args = def[2]!;
  const goalSrc = def[3]!.replace(/:$/, "").trim();
  const params: Binder[] = [];
  const hyps: TheoremDraft["hyps"] = [];

  for (const raw of splitArgs(args)) {
    const piece = raw.trim();
    if (!piece) continue;
    const col = piece.indexOf(":");
    if (col === -1) {
      params.push({ name: piece, sort: "Int" });
      continue;
    }
    const lhs = piece.slice(0, col).trim();
    const rhs = piece.slice(col + 1).trim();
    if (/^(Int|Nat|ℕ|Ord|Ordinal|Prop)$/.test(rhs)) {
      params.push({ name: lhs, sort: parseSort(rhs) });
    } else {
      hyps.push({ name: lhs, atom: parseAtom(rhs) });
    }
  }

  return { name, params, hyps, goal: parseAtom(goalSrc), tactic, source };
}

function splitArgs(s: string): string[] {
  const out: string[] = [];
  let buf = "";
  let depth = 0;
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(buf);
      buf = "";
    } else buf += ch;
  }
  if (buf.trim()) out.push(buf);
  return out;
}
