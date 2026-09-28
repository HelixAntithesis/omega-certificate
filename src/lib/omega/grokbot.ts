/** Emulated Grokbot. It does not call GitHub and it does not certify. */

export const PARENT_REPO = "HelixAntithesis/omega-certificate";
export const PARENT_URL = "https://github.com/HelixAntithesis/omega-certificate";
export const CALLER = "HelixAntithesis";
export const EMULATED_DESTINATION = "grokbot/omega-certificate";

export type ForkStepStatus = "done" | "blocked" | "note";

export type ForkStep = {
  id: string;
  label: string;
  detail: string;
  status: ForkStepStatus;
};

export type ForkReport = {
  bot: "emulated-grokbot";
  parent: typeof PARENT_REPO;
  caller: typeof CALLER;
  destination: typeof EMULATED_DESTINATION;
  created: false;
  reason: string;
  steps: ForkStep[];
};

export function planGrokbotFork(): ForkReport {
  const sameOwner = CALLER === PARENT_REPO.split("/")[0];
  const reason = sameOwner
    ? "GitHub will not fork a repository onto the account that owns it."
    : "No second account is connected, so no fork was created.";
  return {
    bot: "emulated-grokbot",
    parent: PARENT_REPO,
    caller: CALLER,
    destination: EMULATED_DESTINATION,
    created: false,
    reason,
    steps: [
      {
        id: "parent",
        label: "Read parent",
        detail: `${PARENT_REPO} on main. Public, forks allowed.`,
        status: "done",
      },
      {
        id: "caller",
        label: "Read caller",
        detail: `Connected account is ${CALLER}.`,
        status: "done",
      },
      {
        id: "compare",
        label: "Compare owner",
        detail: sameOwner
          ? "Caller and parent owner are the same account."
          : "Caller is a different account.",
        status: sameOwner ? "blocked" : "note",
      },
      {
        id: "fork",
        label: "Create fork",
        detail: `No repository was created at ${EMULATED_DESTINATION}. ${reason}`,
        status: "blocked",
      },
      {
        id: "record",
        label: "Write local record",
        detail: "This panel is the emulated fork application. It is not a GitHub fork.",
        status: "note",
      },
      {
        id: "kernels",
        label: "Leave certification alone",
        detail: "nanoda-js and lean4lean-js still decide. Grokbot does not.",
        status: "note",
      },
    ],
  };
}
