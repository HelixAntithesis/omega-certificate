import { useEffect, useState } from "react";
import { planGrokbotFork, type ForkReport, type ForkStepStatus } from "@/lib/omega/grokbot";
import { cn } from "@/lib/utils";

const STATUS: Record<ForkStepStatus, string> = {
  done: "done",
  blocked: "blocked",
  note: "note",
};

export function GrokbotPane() {
  const [report, setReport] = useState<ForkReport | null>(null);
  const [shown, setShown] = useState(0);
  const [running, setRunning] = useState(false);

  const start = () => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = planGrokbotFork();
    setReport(next);
    setShown(reduce ? next.steps.length : 0);
    setRunning(!reduce);
  };

  useEffect(() => {
    start();
  }, []);

  useEffect(() => {
    if (!running || !report) return;
    if (shown >= report.steps.length) {
      setRunning(false);
      return;
    }
    const timer = window.setTimeout(() => setShown((n) => n + 1), 320);
    return () => window.clearTimeout(timer);
  }, [running, shown, report]);

  const visible = report?.steps.slice(0, shown) ?? [];
  const finished = !!report && shown >= report.steps.length;

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <section className="min-w-0 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">
          Emulated fork application
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-tight">Grokbot</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          One automated cycle. It reads the parent, compares the caller, and stops when GitHub
          would refuse the fork. This is not the Grok bot product, and it does not open a fork.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={start}
            disabled={running}
            className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg disabled:opacity-50"
          >
            {running ? "Running" : "Run cycle"}
          </button>
          <p className="font-mono text-xs text-muted">
            {running ? "Cycle in progress" : finished ? "Cycle finished" : "Waiting"}
          </p>
        </div>
        <ol className="mt-6 space-y-3" aria-live="polite">
          {visible.map((step, i) => (
            <li key={step.id} className="rounded-lg bg-raised px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">
                  <span className="mr-2 font-mono text-xs text-faint tabular-nums">{i + 1}</span>
                  {step.label}
                </p>
                <span
                  className={cn(
                    "font-mono text-[10px] tracking-wider uppercase",
                    step.status === "blocked" ? "text-fail" : "text-muted",
                  )}
                >
                  {STATUS[step.status]}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>
      <aside className="min-w-0 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
        <h3 className="font-display text-xl">Record</h3>
        {report ? (
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="font-mono text-[11px] tracking-wider text-muted uppercase">Parent</dt>
              <dd className="mt-1 break-all font-mono">{report.parent}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-wider text-muted uppercase">Caller</dt>
              <dd className="mt-1 font-mono">{report.caller}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-wider text-muted uppercase">
                Emulated destination
              </dt>
              <dd className="mt-1 break-all font-mono">{report.destination}</dd>
              <dd className="mt-1 text-muted">Not a GitHub repository.</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-wider text-muted uppercase">Fork created</dt>
              <dd className="mt-1 font-mono text-fail">no</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-wider text-muted uppercase">Why</dt>
              <dd className="mt-1 text-muted">{report.reason}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-muted">The cycle has not started.</p>
        )}
      </aside>
    </div>
  );
}
