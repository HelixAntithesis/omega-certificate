# Forking synopsis

Public source for [HelixAntithesis/omega-certificate](https://github.com/HelixAntithesis/omega-certificate). Forks are allowed. A fork copies this verifier. It does not copy a certification from efran, and it does not make a new theorem true.

## What you get

Omega certificate is a dual-kernel checker for integer linear arithmetic, plus Cantor normal forms below ε₀. The omega tactic is untrusted. A declaration is a theorem only when **nanoda-js** and **lean4lean-js** both replay an exported Farkas certificate and `sorry` is absent.

Handshake order:

1. efran — priority, no file, not called
2. nanoda-js — `src/lib/omega/handshake/nanoda-js.ts`
3. lean4lean-js — `src/lib/omega/handshake/lean4lean-js.ts`

## Availability

Checked before this note was written. Every surface below was present and passed.

| Surface | Available |
|---|---|
| Applications, Studio, Omega, Kernel, Peer review, All ω | yes |
| Kingdoms fauna, biome, particle, system, plant, insect, microbe | 10 subjects each, 70/70 certified |
| Library samples (Lean and Python, including `sorry`) | 8/8 matched their expected verdict |
| Handshake files for both kernels | yes |
| Fixed ordinal identities (`ω + 1 ≠ 1 + ω`, `2 · ω = ω`, `ω + ω = ω · 2`, `ω² > ω · 9`) | yes |

## Dynamic examples

Seed `20260928`. 100,000 generated problems, both kernels on every one. 3.7s.

| Family | Count | Result |
|---|---|---|
| Entailed sums (`x ≥ a`, `y ≥ b` ⇒ `x + y ≥ a + b`) | 40,000 | 40,000 certified, 0 bad |
| Refuted goals with a known countermodel | 30,000 | 30,000 witnesses, 0 certified, 0 bad |
| Random inequalities and equalities | 30,000 | 10,765 certified, 18,942 witnesses, 293 left open, 0 bad |

Certified cases were searched for a small countermodel. None was found. Every witness satisfied the hypotheses and broke the goal. The two kernels never disagreed. A further 10,000 random ordinal-law checks (additive identity, multiplicative identity, antisymmetry) had 0 failures. Open random cases mean the solver stopped without a certificate or a small witness. They were not marked theorems.

## Run

```bash
npm install
npm run dev
```

Verify a subject or a library statement. Peer review shows the handshake and the standards checklist.
