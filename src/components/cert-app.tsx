import { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  CircleAlert,
  FlaskConical,
  Gauge,
  Hash,
  Layers,
  Play,
  Scale,
  Shield,
  ShieldCheck,
  ShieldX,
  Sigma,
} from "lucide-react";
import { Applications } from "@/components/applications";
import { decideOrd, formatCnf, parseOrd, evalOrd } from "@/lib/omega/ordinals";
import { emulateAgents } from "@/lib/omega/agents";
import { HANDSHAKE_FILES } from "@/lib/omega/handshake";
import { LIBRARY } from "@/lib/omega/library";
import { SUBJECTS } from "@/lib/omega/subjects";
import { useOmega, type Tab } from "@/lib/omega/store";
import { describeDraft } from "@/lib/omega/verify";
import { formatAtom, formatConstraint } from "@/lib/omega/lin";
import { cn } from "@/lib/utils";

const TABS: { id: Tab; label: string; icon: typeof Play }[] = [
  { id: "applications", label: "Applications", icon: Layers },
  { id: "studio", label: "Studio", icon: FlaskConical },
  { id: "omega", label: "Omega", icon: Sigma },
  { id: "kernel", label: "Kernel", icon: Shield },
  { id: "review", label: "Peer review", icon: Scale },
  { id: "ordinals", label: "All ω", icon: Hash },
];

export function CertApp() {
  const { tab, setTab, result } = useOmega();
  const certified = result?.review?.certified;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-xs tracking-[0.22em] text-muted uppercase">
                Dual-kernel verifier
              </p>
              <h1 className="mt-1 font-display text-3xl tracking-tight text-fg sm:text-4xl">
                Omega certificate
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted">
                Lean-standard peer review for named subject certificates. Handshake
                priority is efran. Only the two kernels may certify.
              </p>
            </div>
            <StatusMark certified={certified} empty={!result} />
          </div>
          <nav className="-mx-1 flex w-full min-w-0 gap-1 overflow-x-auto pb-1" aria-label="Sections">
            {TABS.map((t) => {
              const Icon = t.icon;
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm transition-colors duration-150",
                    on ? "bg-raised text-fg" : "text-muted hover:bg-surface hover:text-fg",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {tab === "applications" && <Applications />}
        {tab === "studio" && <Studio />}
        {tab === "omega" && <OmegaPane />}
        {tab === "kernel" && <KernelPane />}
        {tab === "review" && <ReviewPane />}
        {tab === "ordinals" && <OrdinalPane />}
      </main>
    </div>
  );
}

function StatusMark({ certified, empty }: { certified?: boolean; empty: boolean }) {
  if (empty) {
    return (
      <div className="hidden rounded-lg border border-line px-3 py-2 text-right sm:block">
        <p className="font-mono text-[11px] tracking-widest text-muted uppercase">Status</p>
        <p className="text-sm text-muted">Unchecked</p>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "hidden rounded-lg border px-3 py-2 text-right sm:block",
        certified ? "border-pass/40" : "border-fail/40",
      )}
    >
      <p className="font-mono text-[11px] tracking-widest text-muted uppercase">Status</p>
      <p className={cn("text-sm", certified ? "text-pass" : "text-fail")}>
        {certified ? "Certified" : "Rejected"}
      </p>
    </div>
  );
}

function Studio() {
  const { source, setSource, run, loadSample, result, history } = useOmega();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)] sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl">Declaration</h2>
          <button
            type="button"
            onClick={run}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity duration-150 hover:opacity-90"
          >
            <Play className="size-4" strokeWidth={1.75} />
            Verify
          </button>
        </div>
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          spellCheck={false}
          aria-label="Theorem source"
          className="min-h-56 w-full resize-y rounded-lg bg-raised p-4 font-mono text-sm leading-relaxed text-fg outline-none ring-line-strong focus:ring-1"
        />
        <p className="mt-3 text-xs text-faint">
          Lean 4 or Python omega surface. Tactic output is discarded unless both kernels
          replay the certificate.
        </p>
        {result?.error && (
          <p className="mt-3 text-sm text-fail" role="alert">
            {result.error}
          </p>
        )}
        {result && !result.error && (
          <div className="mt-4 rounded-lg bg-raised p-4">
            <p className="font-mono text-[11px] tracking-widest text-muted uppercase">
              Elaborated
            </p>
            <p className="mt-1 font-mono text-sm text-fg">{describeDraft(result.draft)}</p>
            <p className="mt-2 text-sm text-muted">
              {result.review?.certified
                ? "Both kernels accepted the Farkas certificate."
                : result.witness
                  ? `Countermodel ${formatObj(result.witness)}.`
                  : "Not certified."}
            </p>
          </div>
        )}
      </section>

      <aside className="flex flex-col gap-6">
        <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-xl">Library</h2>
          <ul className="mt-3 flex flex-col gap-1">
            {LIBRARY.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => loadSample(s.id)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 text-left transition-colors duration-150 hover:bg-raised"
                >
                  <span>
                    <span className="block font-mono text-sm">{s.title}</span>
                    <span className="block text-xs text-muted">{s.blurb}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-[10px] tracking-wider uppercase",
                      s.expect === "certify" ? "text-pass" : "text-fail",
                    )}
                  >
                    {s.expect}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <h2 className="font-display text-xl">Session</h2>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No checks yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {history.map((h, i) => (
                <li key={`${h.at}-${i}`} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-mono truncate">{h.name}</span>
                  <span className={h.certified ? "text-pass" : "text-fail"}>
                    {h.certified ? "certified" : "rejected"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}

function OmegaPane() {
  const { result, run } = useOmega();
  if (!result) return <EmptyRun onRun={run} label="Run omega to project Ax ≤ b." />;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Constraint matrix</h2>
        <p className="mt-1 text-sm text-muted">Integer rows after normalization.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-72 text-left font-mono text-xs">
            <thead className="text-muted">
              <tr>
                <th className="pb-2 pr-3 font-medium">Row</th>
                <th className="pb-2 font-medium">Ax ≤ b</th>
              </tr>
            </thead>
            <tbody>
              {result.steps
                .find((s) => s.kind === "normalize")
                ?.kind === "normalize"
                ? result.steps
                    .filter((s) => s.kind === "normalize")
                    .flatMap((s) => (s.kind === "normalize" ? s.constraints : []))
                    .map((c, i) => (
                      <tr key={i} className="border-t border-line">
                        <td className="py-2 pr-3 text-muted">{c.label}</td>
                        <td className="py-2">{formatConstraint(c)}</td>
                      </tr>
                    ))
                : null}
            </tbody>
          </table>
        </div>
      </section>
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Projection trace</h2>
        <ol className="mt-4 space-y-3">
          {result.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="mt-0.5 font-mono text-xs text-faint tabular-nums">{i + 1}</span>
              <span>
                <span className="block font-mono text-[11px] tracking-wider text-muted uppercase">
                  {s.kind}
                </span>
                <span className="text-fg">{s.text}</span>
                {s.kind === "sat" && (
                  <span className="mt-1 block font-mono text-xs text-fail">
                    {formatObj(s.witness)}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function KernelPane() {
  const { result, run } = useOmega();
  if (!result?.review) return <EmptyRun onRun={run} label="Kernels have nothing to replay yet." />;
  const { primary, independent } = result.review;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <KernelCard
        title="nanoda-js"
        subtitle="Primary trusted kernel"
        verdict={primary}
      />
      <KernelCard
        title="lean4lean-js"
        subtitle="Independent replay kernel"
        verdict={independent}
      />
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] lg:col-span-2">
        <h2 className="font-display text-xl">Certificate</h2>
        {result.certificate ? (
          <div className="mt-3 overflow-x-auto font-mono text-sm">
            <p className="mt-2 text-muted">
              λ_orig = ⟨{(result.certificate.multipliers ?? []).join(", ")}⟩
              {result.certificate.cuts.length
                ? ` · λ_cut = ⟨${result.certificate.cutMultipliers.join(", ")}⟩`
                : ""}
            </p>
            <p className="mt-2 text-fg">
              Combined row {formatConstraint(result.certificate.derived)}
            </p>
            <ul className="mt-4 space-y-1 text-xs text-muted">
              {result.certificate.originals.map((r, i) => (
                <li key={i}>
                  λ{i}={result.certificate!.multipliers[i]} · {r.label}: {formatConstraint(r)}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">No exportable certificate.</p>
        )}
      </section>
    </div>
  );
}

function KernelCard({
  title,
  subtitle,
  verdict,
}: {
  title: string;
  subtitle: string;
  verdict: { accepted: boolean; reasons: string[]; steps: number; kernel: string };
}) {
  return (
    <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">{title}</h2>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        {verdict.accepted ? (
          <ShieldCheck className="size-5 text-pass" strokeWidth={1.75} />
        ) : (
          <ShieldX className="size-5 text-fail" strokeWidth={1.75} />
        )}
      </div>
      <p className={cn("mt-4 font-mono text-sm", verdict.accepted ? "text-pass" : "text-fail")}>
        {verdict.accepted ? "ACCEPT" : "REJECT"}
      </p>
      <p className="mt-1 font-mono text-xs text-faint tabular-nums">{verdict.steps} kernel steps</p>
      <ul className="mt-4 space-y-2">
        {verdict.reasons.map((r) => (
          <li key={r} className="text-sm text-muted">
            {r}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReviewPane() {
  const { result, run, subjectId } = useOmega();
  const subject = SUBJECTS.find((s) => s.id === subjectId) ?? null;
  if (!result?.review) return <EmptyRun onRun={run} label="Peer review waits on a kernel run." />;
  const r = result.review;
  return (
    <div className="grid gap-6">
      <section className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">
          Comparator verdict
        </p>
        <h2 className="mt-2 font-display text-3xl tracking-tight">
          {subject ? subject.name : r.certified ? "Certified theorem" : "Not certified"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {r.certified ? "Kernels accepted." : "Not certified."} Handshake priority is efran.
          A declaration is a theorem only if both kernels accept and sorry is absent.
        </p>
      </section>
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h3 className="font-display text-xl">Handshake order</h3>
        <ol className="mt-3 space-y-3">
          {(subject?.handshake ?? (["efran", "nanoda-js", "lean4lean-js"] as const)).map((peer, i) => (
            <li key={peer} className="text-sm">
              <div className="flex items-center justify-between">
                <span>
                  <span className="mr-2 font-mono text-xs text-faint tabular-nums">{i + 1}</span>
                  {peer}
                </span>
                <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
                  {i === 0 ? "priority" : r.certified ? "accepted" : "held"}
                </span>
              </div>
              <p className="mt-1 break-all pl-5 font-mono text-[11px] text-faint">
                {HANDSHAKE_FILES[peer] ?? "no file"}
              </p>
            </li>
          ))}
        </ol>
      </section>
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h3 className="font-display text-xl">Emulated agents</h3>
        <p className="mt-1 text-sm text-muted">
          Local stand-ins for Grok, Claude, GPT, Gemini, DeepSeek, and Qwen. Not those vendors.
          They do not certify. Kernels do.
        </p>
        <ul className="mt-4 divide-y divide-line">
          {emulateAgents(result).map((agent) => (
            <li key={agent.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-sm">{agent.name}</p>
                <span className="font-mono text-[10px] tracking-wider text-muted uppercase">
                  {agent.agrees ? "agrees" : "withholds"}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{agent.checks}</p>
              <p className="mt-1 text-sm">{agent.note}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h3 className="font-display text-xl">Standards checklist</h3>
        <ul className="mt-4 divide-y divide-line">
          {r.standards.map((s) => (
            <li key={s.id} className="flex items-start gap-3 py-3">
              {s.pass ? (
                <Check className="mt-0.5 size-4 shrink-0 text-pass" strokeWidth={1.75} />
              ) : (
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-fail" strokeWidth={1.75} />
              )}
              <div className="min-w-0">
                <p className="font-mono text-sm">
                  {s.id}
                  <span className="ml-2 text-muted">{s.title}</span>
                </p>
                <p className="text-sm text-muted">{s.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      {result.draft && (
        <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <h3 className="font-display text-xl">Statement</h3>
          <p className="mt-3 font-mono text-sm leading-relaxed">
            {describeDraft(result.draft)}
          </p>
          <p className="mt-2 text-sm text-muted">
            Goal {formatAtom(result.draft.goal)} · tactic {result.draft.tactic}
          </p>
        </section>
      )}
    </div>
  );
}

function OrdinalPane() {
  const [left, setLeft] = useState("w + 1");
  const [right, setRight] = useState("1 + w");
  const [cmp, setCmp] = useState<"<" | ">" | "=" | "≠">("≠");
  const [out, setOut] = useState<ReturnType<typeof decideOrd> | null>(null);
  const samples = useMemo(
    () => [
      { l: "w + 1", c: "≠" as const, r: "1 + w" },
      { l: "w * 2", c: ">" as const, r: "w + 3" },
      { l: "w + w", c: "=" as const, r: "w * 2" },
      { l: "2 * w", c: "=" as const, r: "w" },
    ],
    [],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Cantor normal form</h2>
        <p className="mt-1 text-sm text-muted">
          All omegas: addition is not commutative. Comparison is by CNF, independently of
          the arithmetic kernel.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <label className="block">
            <span className="font-mono text-[11px] tracking-wider text-muted uppercase">Left</span>
            <input
              value={left}
              onChange={(e) => setLeft(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-md bg-raised px-3 font-mono text-sm outline-none ring-line-strong focus:ring-1"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[11px] tracking-wider text-muted uppercase">Cmp</span>
            <select
              value={cmp}
              onChange={(e) => setCmp(e.target.value as typeof cmp)}
              className="mt-1 min-h-11 w-full rounded-md bg-raised px-2 font-mono text-sm outline-none"
            >
              <option value="≠">≠</option>
              <option value="<">{'<'}</option>
              <option value=">">{'>'}</option>
              <option value="=">=</option>
            </select>
          </label>
          <label className="block">
            <span className="font-mono text-[11px] tracking-wider text-muted uppercase">Right</span>
            <input
              value={right}
              onChange={(e) => setRight(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-md bg-raised px-3 font-mono text-sm outline-none ring-line-strong focus:ring-1"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              setOut(decideOrd({ left, cmp, right }));
            } catch (e) {
              setOut({
                ok: false,
                left: [],
                right: [],
                cmp: 0,
                text: e instanceof Error ? e.message : "Parse error",
              });
            }
          }}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-fg"
        >
          Decide
          <ChevronRight className="size-4" strokeWidth={1.75} />
        </button>
        {out && (
          <div className="mt-5 rounded-lg bg-raised p-4">
            <p className={cn("font-mono text-sm", out.ok ? "text-pass" : "text-fail")}>
              {out.ok ? "Holds" : "Fails"}
            </p>
            <p className="mt-2 font-mono text-sm">
              {formatCnf(out.left)}  vs  {formatCnf(out.right)}
            </p>
            <p className="mt-2 text-sm text-muted">{out.text}</p>
          </div>
        )}
      </section>
      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-xl">Classic identities</h2>
        <ul className="mt-3 space-y-1">
          {samples.map((s) => (
            <li key={`${s.l}${s.c}${s.r}`}>
              <button
                type="button"
                onClick={() => {
                  setLeft(s.l);
                  setRight(s.r);
                  setCmp(s.c);
                  try {
                    setOut(decideOrd({ left: s.l, cmp: s.c, right: s.r }));
                  } catch {
                    setOut(null);
                  }
                }}
                className="flex min-h-11 w-full items-center justify-between rounded-md px-3 text-left font-mono text-sm hover:bg-raised"
              >
                <span>
                  {s.l} {s.c} {s.r}
                </span>
                <Gauge className="size-4 text-muted" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-lg bg-raised p-4">
          <p className="font-mono text-[11px] tracking-wider text-muted uppercase">Live CNF</p>
          <p className="mt-2 font-mono text-sm">
            {safeCnf(left)}
          </p>
        </div>
      </section>
    </div>
  );
}

function safeCnf(src: string): string {
  try {
    return formatCnf(evalOrd(parseOrd(src)));
  } catch {
    return "—";
  }
}

function EmptyRun({ onRun, label }: { onRun: () => void; label: string }) {
  return (
    <div className="rounded-xl bg-surface p-8 text-center shadow-[var(--shadow-border)]">
      <p className="text-sm text-muted">{label}</p>
      <button
        type="button"
        onClick={onRun}
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-fg"
      >
        <Play className="size-4" strokeWidth={1.75} />
        Verify current declaration
      </button>
    </div>
  );
}

function formatObj(w: Record<string, number>): string {
  return `{ ${Object.entries(w)
    .map(([k, v]) => `${k} ↦ ${v}`)
    .join(", ")} }`;
}
