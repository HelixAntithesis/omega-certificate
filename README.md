# Omega certificate

Dual-kernel verifier for integer linear arithmetic and ordinals.

The omega tactic is untrusted. A declaration is a theorem only when two independent kernels replay an exported certificate and `sorry` is absent.

## Surfaces

- Lean-style: `theorem add_pos (a b : Int) (ha : a ≥ 1) (hb : b ≥ 1) : a + b ≥ 2 := by omega`
- Python-style: `def add_pos(a: Int, b: Int, ha: a >= 1, hb: b >= 1) -> a + b >= 2:`

## Run

```bash
npm install
npm run dev
```

Open the app and choose a library theorem, then **Verify**. **Peer review** shows the standards checklist. **All ω** compares Cantor normal forms such as `ω + 1` and `1 + ω`.

Fork notes, availability, and the 100,000-iteration check are in [FORKING.md](FORKING.md).
