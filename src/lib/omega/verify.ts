import { peerReview } from "./kernel";
import { proveOmega } from "./omega";
import { parseTheorem } from "./parse";
import type { TheoremDraft, VerifyResult } from "./types";
import { formatAtom } from "./lin";

export function verifySource(source: string): VerifyResult {
  let draft: TheoremDraft;
  try {
    draft = parseTheorem(source);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Parse error";
    const fallback: TheoremDraft = {
      name: "unparsed",
      params: [],
      hyps: [],
      goal: { left: { coeff: {}, k: 0 }, cmp: "=", right: { coeff: {}, k: 0 } },
      tactic: "omega",
      source,
    };
    return {
      ok: false,
      unsat: false,
      steps: [],
      certificate: null,
      witness: null,
      review: null,
      error: msg,
      draft: fallback,
    };
  }
  return verifyDraft(draft);
}

export function verifyDraft(draft: TheoremDraft): VerifyResult {
  if (draft.tactic === "sorry") {
    const review = peerReview(draft, null);
    return {
      ok: false,
      unsat: false,
      steps: [{ kind: "reject", text: "sorry is not a proof. Lean kernel standard forbids admit." }],
      certificate: null,
      witness: null,
      review,
      draft,
    };
  }
  const { unsat, steps, certificate, witness } = proveOmega(draft);
  const review = peerReview(draft, certificate);
  return {
    ok: review.certified,
    unsat,
    steps,
    certificate,
    witness,
    review,
    draft,
  };
}

export function describeDraft(d: TheoremDraft): string {
  const binders = d.params.map((p) => `${p.name} : ${p.sort}`).join(", ");
  const hyps = d.hyps.map((h) => `${h.name} : ${formatAtom(h.atom)}`).join(", ");
  const goal = formatAtom(d.goal);
  return `${d.name} (${binders})${hyps ? ` (${hyps})` : ""} : ${goal}`;
}
