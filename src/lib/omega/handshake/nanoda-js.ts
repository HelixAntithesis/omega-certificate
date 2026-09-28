import type { FarkasCert, KernelVerdict, TheoremDraft } from "../types";
import { reviewCert } from "../replay";

export const id = "nanoda-js" as const;
export const file = "src/lib/omega/handshake/nanoda-js.ts";

/** Primary trusted kernel. Handshake slot 2. */
export function nanodaCheck(cert: FarkasCert | null, draft: TheoremDraft): KernelVerdict {
  return reviewCert(cert, draft, id);
}
