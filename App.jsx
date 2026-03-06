import { useState, useRef } from "react";

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });

const fetchJobs = async (query, location) => {
  const res = await fetch(`/api/jobs?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`);
  if (!res.ok) throw new Error("Failed to fetch jobs");
  return res.json();
};

const scoreJob = async (cvText, cvBase64, job) => {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cvText, cvBase64: cvBase64 || null, job }),
  });
  if (!res.ok) throw new Error("Score failed");
  return res.json();
};

const ScoreBadge = ({ score }) => {
  const color = score >= 75 ? "#00e5a0" : score >= 55 ? "#f5c842" : "#ff6b6b";
  return (
    <div style={{ width: "54px", height: "54px", borderRadius: "50%", border: `3px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: color + "15" }}>
      <span style={{ fontSize: "1rem", fontWeight: "800", color, fontFamily: "'DM Mono', monospace" }}>{score}</span>
    </div>
  );
};

const Tag = ({ text, color }) => (
  <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: "600", background: color + "18", color, border: `1px solid ${color}33`, marginBottom: "4px", marginRight: "4px" }}>{text}</span>
);

const Spinner = () => (
  <div style={{ width: "54px", height: "54px", borderRadius: "50%", border: "3px solid #1e3048", borderTop: "3px solid #00b8d9", flexShrink: 0, animation: "spin 0.8s linear infinite" }} />
);

const JobCard = ({ job, result, loading }) => {
  const [expanded, setExpanded] = useState(false);
  const color = result ? (result.score >= 75 ? "#00e5a0" : result.score >= 55 ? "#f5c842" : "#ff6b6b") : "#1e3048";

  return (
    <div style={{ background: "#101e2e", border: "1px solid #1e3048", borderLeft: `4px solid ${color}`, borderRadius: "14px", padding: "20px", transition: "border-color 0.3s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {loading ? <Spinner /> : result ? <ScoreBadge score={result.score} /> : <div style={{ width: "54px", height: "54px", borderRadius: "50%", border: "3px solid #1e3048", flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: "700", color: "#e8f4ff", fontSize: "0.95rem", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{job.title}</div>
          <div style={{ fontSize: "0.8rem", color: "#5a7a9a" }}>{job.company?.display_name || "Company N/A"} · {job.location?.display_name || "South Africa"}</div>
          {job.salary_min && <div style={{ fontSize: "0.75rem", color: "#00e5a0", marginTop: "2px" }}>R{Math.round(job.salary_min).toLocaleString()} – R{Math.round(job.salary_max).toLocaleString()} /yr</div>}
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <a href={job.redirect_url} target="_blank" rel="noreferrer" style={{ padding: "6px 14px", borderRadius: "8px", background: "#1e3048", color: "#c8d8e8", fontSize: "0.75rem", fontWeight: "600", textDecoration: "none", border: "1px solid #2e4060" }}>Apply ↗</a>
          {result && <button onClick={() => setExpanded(!expanded)} style={{ padding: "6px 14px", borderRadius: "8px", background: "transparent", color: "#4a7a9a", fontSize: "0.75rem", fontWeight: "600", border: "1px solid #1e3048", cursor: "pointer" }}>{expanded ? "Less ▲" : "Details ▼"}</button>}
        </div>
      </div>
      {expanded && result && (
        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #1e3048" }}>
          <div style={{ fontSize: "0.82rem", color: "#a0b8cc", lineHeight: "1.6", marginBottom: "12px", background: "#0d1928", padding: "12px", borderRadius: "8px", borderLeft: "3px solid #00e5a0" }}>{result.summary}</div>
          <div style={{ marginBottom: "8px" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", color: "#4a7a9a", marginBottom: "6px" }}>✅ Strengths</div>
            {result.strengths?.map((s, i) => <Tag key={i} text={s} color="#00e5a0" />)}
          </div>
          <div style={{ marginBottom: "8px" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", color: "#4a7a9a", marginBottom: "6px" }}>⚠️ Gaps</div>
            {result.gaps?.map((g, i) => <Tag key={i} text={g} color="#f5c842" />)}
          </div>
          <div>
            <div style={{ fontSize: "0.65rem", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", color: "#4a7a9a", marginBottom: "6px" }}>💬 Talking Points</div>
            {result.talkingPoints?.map((tp, i) => <div key={i} style={{ background: "#0d1928", borderRadius: "6px", padding: "8px 12px", marginBottom: "6px", fontSize: "0.8rem", color: "#c8d8e8", borderLeft: "2px solid #00b8d9" }}>→ {tp}</div>)}
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [cvFile, setCvFile] = useState(null);
  const [cvBase64, setCvBase64] = useState(null);
  const [cvText, setCvText] = useState("");
  const [cvMode, setCvMode] = useState("upload");
  const [dragging, setDragging] = useState(false);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("Johannesburg");
  const [jobs, setJobs] = useState([]);
  const [scores, setScores] = useState({});
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [scoringIds, setScoringIds] = useState(new Set());
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") { setError("Please upload a PDF file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File too large. Max 10MB."); return; }
    setError(null);
    setCvFile(file);
    const b64 = await fileToBase64(file);
    setCvBase64(b64);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    const hasCv = cvMode === "upload" ? cvBase64 : cvText.trim();
    if (!hasCv) { setError("Please provide your CV or profile first."); return; }
    setError(null);
    setJobs([]);
    setScores({});
    setLoadingJobs(true);
    try {
      const results = await fetchJobs(query, location);
      if (results.length === 0) { setError("No jobs found. Try different keywords or location."); setLoadingJobs(false); return; }
      setJobs(results);
      setLoadingJobs(false);
      const ids = new Set(results.map((_, i) => i));
      setScoringIds(ids);
      await Promise.all(results.map(async (job, i) => {
        try {
          const result = await scoreJob(cvText, cvMode === "upload" ? cvBase64 : null, job);
          setScores(prev => ({ ...prev, [i]: result }));
        } catch {
          setScores(prev => ({ ...prev, [i]: { error: true } }));
        } finally {
          setScoringIds(prev => { const next = new Set(prev); next.delete(i); return next; });
        }
      }));
    } catch (e) {
      setError("Could not fetch jobs. Please try again.");
      setLoadingJobs(false);
    }
  };

  const sortedJobs = [...jobs].map((job, i) => ({ job, i, score: scores[i]?.score ?? -1 })).sort((a, b) => b.score - a.score);
  const hasCv = cvMode === "upload" ? cvBase64 : cvText.trim();

  const s = {
    app: { minHeight: "100vh", background: "#0b1320", fontFamily: "'IBM Plex Sans', sans-serif", color: "#c8d8e8" },
    header: { padding: "36px 40px 28px", borderBottom: "1px solid #1a2b3c", background: "linear-gradient(180deg, #0d1a2b 0%, #0b1320 100%)" },
    title: { fontSize: "2rem", fontWeight: "800", color: "#e8f4ff", letterSpacing: "-1px", marginBottom: "4px", fontFamily: "'DM Mono', monospace" },
    accent: { color: "#00e5a0" },
    subtitle: { fontSize: "0.85rem", color: "#5a7a9a" },
    main: { maxWidth: "1000px", margin: "0 auto", padding: "36px 40px" },
    section: { marginBottom: "28px" },
    sectionLabel: { fontSize: "0.68rem", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", color: "#4a7a9a", marginBottom: "12px", display: "block" },
    card: { background: "#101e2e", border: "1px solid #1e3048", borderRadius: "16px", padding: "24px" },
    tabBar: { display: "flex", gap: "8px", marginBottom: "14px" },
    tab: (a) => ({ padding: "6px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", background: a ? "#00e5a020" : "transparent", color: a ? "#00e5a0" : "#4a7a9a", borderBottom: a ? "2px solid #00e5a0" : "2px solid transparent", transition: "all 0.15s", fontFamily: "'DM Mono', monospace" }),
    textarea: { width: "100%", minHeight: "140px", background: "#0d1928", border: "1px solid #1e3048", borderRadius: "10px", padding: "14px", color: "#c8d8e8", fontSize: "0.88rem", lineHeight: "1.6", resize: "vertical", fontFamily: "'IBM Plex Sans', sans-serif", outline: "none", boxSizing: "border-box" },
    dropZone: (a) => ({ width: "100%", minHeight: "120px", boxSizing: "border-box", border: `2px dashed ${a ? "#00e5a0" : "#1e3048"}`, borderRadius: "10px", background: a ? "#00e5a008" : "#0d1928", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", gap: "8px", color: a ? "#00e5a0" : "#4a7a9a" }),
    fileChip: { display: "flex", alignItems: "center", gap: "10px", background: "#00e5a012", border: "1px solid #00e5a033", borderRadius: "10px", padding: "12px 16px", marginTop: "10px" },
    searchRow: { display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "12px", alignItems: "end" },
    input: { width: "100%", background: "#0d1928", border: "1px solid #1e3048", borderRadius: "10px", padding: "12px 16px", color: "#c8d8e8", fontSize: "0.88rem", fontFamily: "'IBM Plex Sans', sans-serif", outline: "none", boxSizing: "border-box" },
    btn: (active) => ({ padding: "12px 28px", borderRadius: "10px", border: "none", cursor: active ? "pointer" : "not-allowed", fontSize: "0.9rem", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase", background: active ? "linear-gradient(135deg, #00e5a0, #00b8d9)" : "#1e3048", color: active ? "#0b1320" : "#4a7a9a", fontFamily: "'DM Mono', monospace", whiteSpace: "nowrap", transition: "all 0.2s" }),
    errorBox: { background: "#ff6b6b18", border: "1px solid #ff6b6b44", borderRadius: "10px", padding: "12px 16px", color: "#ff6b6b", fontSize: "0.85rem", marginTop: "12px" },
  };

  return (
    <div style={s.app}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <header style={s.header}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={s.title}>Job<span style={s.accent}>Hunt</span>.ai</div>
          <div style={s.subtitle}>Upload your CV → search real SA jobs → get AI-scored matches instantly</div>
        </div>
      </header>

      <main style={s.main}>
        {/* Step 1 - CV */}
        <div style={s.section}>
          <div style={s.card}>
            <span style={s.sectionLabel}>Step 1 — Your CV</span>
            <div style={s.tabBar}>
              <button style={s.tab(cvMode === "upload")} onClick={() => setCvMode("upload")}>📄 Upload PDF</button>
              <button style={s.tab(cvMode === "text")} onClick={() => setCvMode("text")}>✏️ Paste Text</button>
            </div>
            {cvMode === "upload" ? (
              <div>
                <div style={s.dropZone(dragging)}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); handleFileSelect(e.dataTransfer.files[0]); }}>
                  <div style={{ fontSize: "1.8rem" }}>📄</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "600" }}>{dragging ? "Drop your CV here" : "Click or drag & drop your CV"}</div>
                  <div style={{ fontSize: "0.72rem", color: "#3a5a7a" }}>PDF only · max 10MB</div>
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => handleFileSelect(e.target.files[0])} />
                {cvFile && (
                  <div style={s.fileChip}>
                    <span>✅</span>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#00e5a0" }}>{cvFile.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#4a7a9a" }}>{(cvFile.size / 1024).toFixed(0)} KB · Ready</div>
                    </div>
                    <button onClick={() => { setCvFile(null); setCvBase64(null); }} style={{ marginLeft: "auto", background: "none", border: "none", color: "#4a7a9a", cursor: "pointer", fontSize: "1rem" }}>✕</button>
                  </div>
                )}
              </div>
            ) : (
              <textarea style={s.textarea} placeholder="Paste your skills, experience, education..." value={cvText} onChange={e => setCvText(e.target.value)} />
            )}
          </div>
        </div>

        {/* Step 2 - Search */}
        <div style={s.section}>
          <div style={s.card}>
            <span style={s.sectionLabel}>Step 2 — Search Jobs</span>
            <div style={s.searchRow}>
              <div>
                <div style={{ fontSize: "0.7rem", color: "#4a7a9a", marginBottom: "6px", letterSpacing: "1px", textTransform: "uppercase" }}>Job Title / Keywords</div>
                <input style={s.input} placeholder="e.g. Software Developer, Accountant..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "#4a7a9a", marginBottom: "6px", letterSpacing: "1px", textTransform: "uppercase" }}>Location</div>
                <input style={s.input} placeholder="e.g. Johannesburg, Cape Town..." value={location} onChange={e => setLocation(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
              </div>
              <button style={s.btn(!!hasCv && !!query.trim() && !loadingJobs)} onClick={handleSearch} disabled={!hasCv || !query.trim() || loadingJobs}>
                {loadingJobs ? "Searching..." : "🔍 Find Jobs"}
              </button>
            </div>
            {error && <div style={s.errorBox}>{error}</div>}
          </div>
        </div>

        {/* Step 3 - Results */}
        {jobs.length > 0 && (
          <div style={s.section}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ ...s.sectionLabel, marginBottom: 0 }}>Step 3 — Your Matches ({jobs.length} jobs found)</span>
              {scoringIds.size > 0 && <span style={{ fontSize: "0.75rem", color: "#4a7a9a" }}>⏳ Scoring {scoringIds.size} remaining...</span>}
              {scoringIds.size === 0 && <span style={{ fontSize: "0.75rem", color: "#00e5a0" }}>✅ All scored · sorted by best match</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {sortedJobs.map(({ job, i }) => (
                <JobCard key={i} job={job} result={scores[i]} loading={scoringIds.has(i)} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
