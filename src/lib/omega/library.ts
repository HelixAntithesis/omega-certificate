export type Sample = {
  id: string;
  title: string;
  blurb: string;
  dialect: "lean" | "python";
  source: string;
  expect: "certify" | "reject";
};

export const LIBRARY: Sample[] = [
  {
    id: "add_pos",
    title: "add_pos",
    blurb: "Positive integers are closed under addition — Lean omega.",
    dialect: "lean",
    expect: "certify",
    source: `theorem add_pos (a b : Int) (ha : a ≥ 1) (hb : b ≥ 1) : a + b ≥ 2 := by
  omega`,
  },
  {
    id: "add_pos_py",
    title: "add_pos (Python omega)",
    blurb: "Same theorem in the all-omegas Python surface.",
    dialect: "python",
    expect: "certify",
    source: `def add_pos(a: Int, b: Int, ha: a >= 1, hb: b >= 1) -> a + b >= 2:
    omega`,
  },
  {
    id: "le_trans",
    title: "le_trans",
    blurb: "Transitivity of ≤ on integers.",
    dialect: "lean",
    expect: "certify",
    source: `theorem le_trans (a b c : Int) (hab : a ≤ b) (hbc : b ≤ c) : a ≤ c := by
  omega`,
  },
  {
    id: "nat_succ",
    title: "nat_add_le",
    blurb: "Nat binders inject the hidden ≥ 0 constraint.",
    dialect: "lean",
    expect: "certify",
    source: `theorem nat_add_le (n m : Nat) : n + m ≥ n := by
  omega`,
  },
  {
    id: "weighted",
    title: "weighted_sum",
    blurb: "Nonnegative combination of bounds.",
    dialect: "python",
    expect: "certify",
    source: `def weighted_sum(x: Int, y: Int, hx: x >= 2, hy: y >= 3) -> 3 * x + 2 * y >= 12:
    omega`,
  },
  {
    id: "eq_cancel",
    title: "eq_add_cancel",
    blurb: "Cancel a common summand.",
    dialect: "lean",
    expect: "certify",
    source: `theorem eq_add_cancel (a b c : Int) (h : a + c = b + c) : a = b := by
  omega`,
  },
  {
    id: "false_goal",
    title: "not_always_pos",
    blurb: "Countermodel: positivity is not free.",
    dialect: "lean",
    expect: "reject",
    source: `theorem not_always_pos (a : Int) : a ≥ 1 := by
  omega`,
  },
  {
    id: "sorry_block",
    title: "sorry_rejected",
    blurb: "Lean standard: sorry never certifies.",
    dialect: "lean",
    expect: "reject",
    source: `theorem fake_fermat (a b c n : Int) (hn : n ≥ 3) : a + b ≥ c := by
  sorry`,
  },
  {
    id: "tight",
    title: "tight_bound",
    blurb: "Integer tightening: 2a ≤ 3 with a ≥ 0 yields a ≤ 1, so 2a ≤ 2.",
    dialect: "python",
    expect: "certify",
    source: `def even_bound(a: Nat, h: 2 * a <= 3) -> 2 * a <= 2:
    omega`,
  },
];
