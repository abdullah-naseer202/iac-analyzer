import { useEffect, useState } from "react";

const API = "http://localhost:3000";

function levelColor(level) {
  switch (level) {
    case "Critical":
      return "text-red-400";
    case "High":
      return "text-orange-400";
    case "Medium":
      return "text-yellow-400";
    default:
      return "text-emerald-400";
  }
}

export default function History({ refreshKey, onSelect }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/api/scans`);
        if (!res.ok) throw new Error("bad response");
        const data = await res.json();
        if (!cancelled) setScans(data);
      } catch {
        if (!cancelled) setError("History load nahi ho saki.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <div className="mt-10">
      <h2 className="mb-3 text-lg font-semibold">Scan history</h2>

      {loading && <div className="text-sm text-slate-400">Loading...</div>}
      {error && <div className="text-sm text-red-400">{error}</div>}
      {!loading && !error && scans.length === 0 && (
        <div className="text-sm text-slate-400">Abhi koi scan nahi hua.</div>
      )}

      <div className="space-y-2">
        {scans.map((s) => (
          <button
            key={s._id}
            onClick={() => onSelect(s._id)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-left hover:border-emerald-500"
          >
            <div>
              <div className="text-sm font-semibold">{s.file}</div>
              <div className="text-xs text-slate-400">
                {s.type} | {new Date(s.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${levelColor(s.risk?.level)}`}>
                {s.risk?.score}
              </div>
              <div className="text-xs text-slate-400">
                {s.summary?.total} findings
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}