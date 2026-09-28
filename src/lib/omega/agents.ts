import type { VerifyResult } from "./types";

/** Local stand-ins. Not the vendors, and not a certification. */
export type AgentEmulation = {
  id: string;
  name: string;
  checks: string;
  agrees: boolean;
  note: string;
};

const AGENTS = [
  { id: "grok", name: "Emulated Grok", checks: "Handshake order" },
  { id: "claude", name: "Emulated Claude", checks: "Standards and sorry" },
  { id: "gpt", name: "Emulated GPT", checks: "Exported certificate" },
  { id: "gemini", name: "Emulated Gemini", checks: "Integer cuts" },
  { id: "deepseek", name: "Emulated DeepSeek", checks: "Both kernel verdicts" },
  { id: "qwen", name: "Emulated Qwen", checks: "Goal and binders" },
] as const;

export function emulateAgents(result: VerifyResult | null): AgentEmulation[] {
  const review = result?.review ?? null;
  const agrees = !!review?.certified;
  return AGENTS.map((agent) => ({
    id: agent.id,
    name: agent.name,
    checks: agent.checks,
    agrees,
    note: review && result ? noteFor(agent.id, result) : "No kernel run to emulate.",
  }));
}

function noteFor(id: (typeof AGENTS)[number]["id"], result: VerifyResult): string {
  const review = result.review!;
  const cert = result.certificate;
  const standards = review.standards;
  const failed = standards.filter((s) => !s.pass).map((s) => s.id);
  switch (id) {
    case "grok":
      return `Order is efran, then ${review.primary.kernel}, then ${review.independent.kernel}. ${
        review.certified ? "Both kernels accepted." : "Handshake stays held."
      }`;
    case "claude":
      return review.sorryUsed
        ? "sorry is present. Withhold."
        : failed.length
          ? `Standards failed: ${failed.join(", ")}.`
          : "TCB, NOSORRY, EXPORT, DUAL, INT, and GOAL all passed.";
    case "gpt":
      return cert
        ? `Farkas vector length ${cert.multipliers.length}${cert.also ? ", equality has both directions" : ""}.`
        : "No exported certificate to replay.";
    case "gemini":
      return cert
        ? `Replayed ${cert.cuts.length} integer cut${cert.cuts.length === 1 ? "" : "s"}.`
        : "No cut list, because there is no certificate.";
    case "deepseek":
      return `nanoda-js ${review.primary.accepted ? "accepted" : "rejected"}. lean4lean-js ${
        review.independent.accepted ? "accepted" : "rejected"
      }.`;
    case "qwen":
      return `Tactic ${result.draft.tactic}. Goal is ${result.draft.goal.cmp}. ${result.draft.params.length} binder${
        result.draft.params.length === 1 ? "" : "s"
      }.`;
  }
}
