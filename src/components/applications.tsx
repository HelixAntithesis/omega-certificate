import { HANDSHAKE_FILES } from "@/lib/omega/handshake";
import { KINGDOMS, SUBJECTS, subjectsIn, type Kingdom } from "@/lib/omega/subjects";
import { useOmega } from "@/lib/omega/store";
import { cn } from "@/lib/utils";

const LABELS: Record<Kingdom | "all", string> = {
  all: "All",
  fauna: "Fauna",
  biome: "Biome",
  particle: "Particle",
  system: "System",
  plant: "Plant",
  insect: "Insect",
  microbe: "Microbe",
};

export function Applications() {
  const { kingdom, setKingdom, subjectId, loadSubject, certifyKingdom, verdicts, result } =
    useOmega();
  const list = subjectsIn(kingdom);
  const active = SUBJECTS.find((s) => s.id === subjectId) ?? null;
  const certifiedHere = list.filter((s) => verdicts[s.id]).length;

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
      <section className="min-w-0 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Named applications</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              One Omega certificate per subject. Handshake order is fixed: efran, then the two
              kernels. This registry is the named set, not every organism on Earth.
            </p>
          </div>
          <button
            type="button"
            onClick={certifyKingdom}
            className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg"
          >
            Certify {LABELS[kingdom].toLowerCase()}
          </button>
        </div>
        <div className="mt-4 flex w-full min-w-0 gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Kingdom">
          {(["all", ...KINGDOMS] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kingdom === k}
              onClick={() => setKingdom(k)}
              className={cn(
                "min-h-11 shrink-0 rounded-md px-3 text-sm",
                kingdom === k ? "bg-raised text-fg" : "text-muted hover:bg-raised hover:text-fg",
              )}
            >
              {LABELS[k]}
            </button>
          ))}
        </div>
        <p className="mt-3 font-mono text-xs text-faint tabular-nums">
          {list.length} applications · {certifiedHere} certified in this view
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {list.map((s) => {
            const on = s.id === subjectId;
            const v = verdicts[s.id];
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => loadSubject(s.id)}
                  className={cn(
                    "flex min-h-11 w-full min-w-0 flex-col items-start rounded-lg px-3 py-3 text-left",
                    on ? "bg-raised" : "hover:bg-raised",
                  )}
                >
                  <span className="flex w-full min-w-0 items-center justify-between gap-2">
                    <span className="truncate font-medium">{s.name}</span>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-[10px] tracking-wider uppercase",
                        v === undefined ? "text-faint" : v ? "text-pass" : "text-fail",
                      )}
                    >
                      {v === undefined ? "open" : v ? "certified" : "rejected"}
                    </span>
                  </span>
                  <span className="mt-1 w-full truncate font-mono text-[11px] text-muted">{s.repo}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="min-w-0 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        {active ? (
          <>
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
              {active.kingdom}
            </p>
            <h2 className="mt-1 font-display text-2xl tracking-tight">{active.name}</h2>
            <p className="mt-2 text-sm text-muted">{active.note}</p>
            <h3 className="mt-6 font-display text-lg">Handshake</h3>
            <p className="mt-1 text-sm text-muted">Priority is efran. Kernels still decide.</p>
            <ol className="mt-3 space-y-3">
              {active.handshake.map((peer, i) => (
                <li key={peer} className="text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      <span className="mr-2 font-mono text-xs text-faint tabular-nums">{i + 1}</span>
                      {peer}
                    </span>
                    <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
                      {i === 0 ? "priority" : "kernel"}
                    </span>
                  </div>
                  <p className="mt-1 break-all pl-5 font-mono text-[11px] text-faint">
                    {HANDSHAKE_FILES[peer] ?? "no file"}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-6 font-mono text-[11px] tracking-wider text-muted uppercase">
              Application name
            </p>
            <p className="mt-1 max-w-full break-all font-mono text-sm">{active.repo}</p>
            <p className="mt-4 text-sm text-muted">
              {result && subjectId === active.id
                ? result.review?.certified
                  ? "Both kernels accepted. Handshake may proceed to efran."
                  : "Kernels rejected this declaration. Handshake stays held."
                : "Open the subject to run the certificate."}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">Select a subject application.</p>
        )}
      </aside>
    </div>
  );
}
