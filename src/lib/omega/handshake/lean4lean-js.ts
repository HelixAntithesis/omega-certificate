import type { FarkasCert, KernelVerdict, TheoremDraft } from "../types";
import { reviewCert } from "../replay";

export const id = "lean4lean-js" as const;
export const file = "src/lib/omega/handshake/lean4lean-js.ts";

/** Independent replay kernel. Handshake slot 3. */
export function lean4leanCheck(cert: FarkasCert | null, draft: TheoremDraft): KernelVerdict {
  return reviewCert(cert, draft, id);
}
