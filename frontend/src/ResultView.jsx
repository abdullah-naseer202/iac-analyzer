import { useState } from "react";

const SEVERITY_STYLES = {
  CRITICAL: "bg-red-600/20 text-red-300 border-red-500",
  HIGH: "bg-orange-600/20 text-orange-300 border-orange-500",
  MEDIUM: "bg-yellow-600/20 text-yellow-300 border-yellow-500",
  LOW: "bg-sky-600/20 text-sky-300 border-sky-500",
};

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function scoreColor(score) {
  if (score >= 75) return "text-red-400";
  if (score >= 50) return "text-orange-400";
  if (score >= 25) return "text-yellow-400";
  return "text-emerald-400";
}

function barColor(score) {
  if (score >= 75) return "bg-red-500";
  if (score >= 50) return "bg-orange-500";
  if (score >= 25) return "bg-yellow-500";
  return "bg-emerald-500";
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      onClick={copy}
      className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-600"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function StatBox({ label, value, className }) {
  return (
    <div className="rounded-lg bg-slate-900 p-3 text-center">
      <div className={`text-2xl font-bold ${className}`}>{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

export default function ResultView({ result }) {
  const { file, type, risk, summary, findings = [], reportKey } = result;
  const sorted = [...findings].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  );

  return (
    <div className="mt-6 space-y-6">
      {/* Risk card */}
      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">
              {file} ({type})
            </div>
            <div className={`mt-1 text-5xl font-bold ${scoreColor(risk.score)}`}>
              {risk.score}
              <span className="text-xl text-slate-500">/100</span>
            </div>
          </div>
          <div
            className={`rounded-full border px-4 py-1 text-sm font-semibold ${scoreColor(
              risk.score
            )} border-current`}
          >
            {risk.level}
          </div>
        </div>

        <div className="mt-4 h-2 w-full rounded-full bg-slate-700">
          <div
            className={`h-2 rounded-full ${barColor(risk.score)}`}
            style={{ width: `${Math.min(risk.score, 100)}%` }}
          />
        </div>

        <div className="mt-5 grid grid-cols-4 gap-3">
          <StatBox label="Total" value={summary.total} className="text-white" />
          <StatBox label="High" value={summary.high} className="text-orange-400" />
          <StatBox label="Medium" value={summary.medium} className="text-yellow-400" />
          <StatBox label="Low" value={summary.low} className="text-sky-400" />
        </div>
      </div>

      {/* Findings */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Findings ({sorted.length})
        </h2>
        {sorted.length === 0 && (
          <div className="rounded-lg border border-emerald-600 bg-emerald-950 p-4 text-emerald-300">
            Koi security issue nahi mila.
          </div>
        )}
        <div className="space-y-4">
          {sorted.map((f, i) => (
            <div
              key={`${f.rule_id}-${f.resource}-${i}`}
              className="rounded-xl border border-slate-700 bg-slate-800 p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded border px-2 py-0.5 text-xs font-semibold ${
                    SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.LOW
                  }`}
                >
                  {f.severity}
                </span>
                <span className="text-xs text-slate-400">{f.rule_id}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold">{f.title}</h3>
              <div className="mt-1 text-sm text-slate-400">
                Resource:{" "}
                <span className="font-mono text-slate-300">{f.resource}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{f.recommendation}</p>

              {f.fix && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Suggested fix</span>
                    <CopyButton text={f.fix} />
                  </div>
                  <pre className="overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-emerald-300">
                    {f.fix}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {reportKey && (
        <div className="text-xs text-slate-500">
          Report S3 par save hui: <span className="font-mono">{reportKey}</span>
        </div>
      )}
    </div>
  );
}