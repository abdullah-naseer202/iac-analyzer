import { useState } from "react";

const API = "http://localhost:3000";

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleScan() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API}/api/scan`, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Scan failed");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Backend se connect nahi ho saka. Kya backend chal raha hai?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-emerald-400 mb-2">
          IaC Analyzer
        </h1>
        <p className="text-slate-400 mb-8">
          Terraform ya CloudFormation file upload karein aur security scan chalayein.
        </p>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <input
            type="file"
            accept=".tf,.yaml,.yml"
            onChange={(e) => setFile(e.target.files[0] || null)}
            className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-white hover:file:bg-emerald-600"
          />
          <button
            onClick={handleScan}
            disabled={!file || loading}
            className="mt-4 rounded-lg bg-emerald-500 px-5 py-2 font-semibold text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Scanning..." : "Scan"}
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500 bg-red-950 p-4 text-red-300">
            {error}
          </div>
        )}

        {result && (
          <pre className="mt-6 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-emerald-300">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}