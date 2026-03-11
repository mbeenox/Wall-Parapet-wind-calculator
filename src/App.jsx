import { useState, useRef, useCallback, useEffect } from "react";

/* ── Palette ── */
const C = {
  sky: "#0284c7", skyDark: "#0369a1", skyLight: "#e0f2fe", skyGlow: "rgba(2,132,199,.10)",
  violet: "#7c3aed", violetLight: "#ede9fe", violetGlow: "rgba(124,58,237,.08)",
  green: "#059669", greenLight: "#d1fae5",
  slate: "#475569", slateLight: "#94a3b8", slateFaint: "#f1f5f9",
  text: "#0f172a", textSoft: "#64748b",
  card: "#ffffff", bg: "#f8fafc",
  border: "rgba(15,23,42,.07)", borderHover: "rgba(15,23,42,.18)",
};

const defaultState = {
  projectName: "Untitled Project",
  section: "S-1",
  H: 15, pw: 15, hL: 5, qL: 35, hR: 4, qR: 19,
};

export default function App() {
  const [s, setS] = useState({ ...defaultState });
  const [toast, setToast] = useState(null);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef(null);

  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2400); };

  const set = (key, raw) => {
    const v = key === "projectName" || key === "section" ? raw : Math.max(0, parseFloat(raw) || 0);
    setS((prev) => ({ ...prev, [key]: v }));
    setDirty(true);
  };

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveFile(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "o") { e.preventDefault(); fileRef.current?.click(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [s]);

  /* ── File I/O ── */
  const saveFile = () => {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${s.projectName.replace(/\s+/g, "_")}.parapet.json`;
    a.click(); URL.revokeObjectURL(url);
    setDirty(false); showToast(`Saved "${a.download}"`);
  };
  const openFile = () => fileRef.current?.click();
  const handleOpen = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setS({ ...defaultState, ...data }); setDirty(false);
        showToast(`Opened "${data.projectName || file.name}"`);
      } catch { showToast("Invalid project file", "warn"); }
    };
    reader.readAsText(file); e.target.value = "";
  };

  /* ── Compute ── */
  const { H, pw, hL, qL, hR, qR } = s;
  const wallRes = 0.5 * H * pw;
  const leftRes = hL * qL;
  const rightRes = hR * qR;
  const total = wallRes + leftRes + rightRes;
  const fmt = (n) => (Math.round(n * 10) / 10).toLocaleString(undefined, { maximumFractionDigits: 1 });

  /* ── Breakdown items ── */
  const breakdown = [
    { label: "Wall", formula: `${fmt(H)}/2 × ${fmt(pw)}`, value: wallRes, color: C.sky, active: H > 0 && pw > 0 },
    { label: "Windward Parapet", formula: `${fmt(hL)} × ${fmt(qL)}`, value: leftRes, color: C.violet, active: hL > 0 && qL > 0 },
    { label: "Leeward Parapet", formula: `${fmt(hR)} × ${fmt(qR)}`, value: rightRes, color: C.violet, active: hR > 0 && qR > 0 },
  ].filter((b) => b.active);

  return (
    <div style={{ fontFamily: "'Instrument Sans', 'DM Sans', system-ui, sans-serif", background: C.bg, minHeight: "100vh", padding: "16px 20px", boxSizing: "border-box" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <input type="file" ref={fileRef} accept=".json" style={{ display: "none" }} onChange={handleOpen} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 999,
          padding: "10px 22px", borderRadius: 100,
          background: toast.type === "warn" ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${toast.type === "warn" ? "#fca5a5" : "#86efac"}`,
          color: toast.type === "warn" ? "#b91c1c" : "#166534",
          fontWeight: 600, fontSize: 13, boxShadow: "0 12px 40px rgba(0,0,0,.12)",
          animation: "toastIn .28s cubic-bezier(.22,1,.36,1)",
        }}>{toast.msg}</div>
      )}

      <style>{`
        @keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(-10px) scale(.96); } to { opacity:1; transform:translateX(-50%) translateY(0) scale(1); } }
        * { box-sizing: border-box; }
        input[type="number"]:focus, input[type="text"]:focus { border-color: ${C.sky} !important; box-shadow: 0 0 0 3px ${C.skyGlow} !important; }
        button { transition: all .15s ease; }
        button:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
        button:active { transform: translateY(0); }
        .input-group { position: relative; }
        .input-group .unit-badge {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          font-size: 11px; font-weight: 600; color: ${C.slateLight}; pointer-events: none;
          background: ${C.slateFaint}; padding: 2px 7px; border-radius: 6px;
        }
        .input-group input { padding-right: 50px !important; }
        @media (max-width: 860px) {
          .main-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        maxWidth: 1200, margin: "0 auto 14px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 260 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.sky}, ${C.violet})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 14px rgba(2,132,199,.25)`,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M9 21v-6h6v6"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <input
              type="text" value={s.projectName}
              onChange={(e) => set("projectName", e.target.value)}
              placeholder="Project name…"
              style={{
                fontSize: 19, fontWeight: 700, border: "none", background: "transparent",
                outline: "none", color: C.text, width: "100%",
                borderBottom: `2px dashed ${dirty ? C.sky : "rgba(0,0,0,.08)"}`, paddingBottom: 2,
                fontFamily: "inherit", transition: "border-color .2s",
              }}
            />
            <div style={{ fontSize: 11, color: C.textSoft, marginTop: 2 }}>
              Wind Line Load Calculator{dirty ? <span style={{ color: C.sky, marginLeft: 6 }}>● unsaved</span> : ""}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <HeaderBtn onClick={openFile} icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" label="Open" hint="Ctrl+O" />
          <HeaderBtn onClick={saveFile} icon="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z M17 21v-8H7v8 M7 3v5h8" label="Save" hint="Ctrl+S" primary />
        </div>
      </header>

      {/* ── Main Grid ── */}
      <div className="main-grid" style={{
        maxWidth: 1200, margin: "0 auto", display: "grid",
        gridTemplateColumns: "400px 1fr", gap: 16, alignItems: "start",
      }}>
        {/* ── LEFT PANEL ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Section input */}
          <Card>
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: C.sky, textTransform: "uppercase", letterSpacing: ".05em",
                background: C.skyLight, padding: "4px 10px", borderRadius: 8, whiteSpace: "nowrap",
              }}>Section</span>
              <input type="text" value={s.section} onChange={(e) => set("section", e.target.value)}
                style={{
                  flex: 1, fontSize: 15, fontWeight: 600, padding: "8px 12px", borderRadius: 10,
                  border: `1px solid ${C.border}`, outline: "none", fontFamily: "'JetBrains Mono', monospace",
                  background: "#fff", color: C.text,
                }}
              />
            </div>
          </Card>

          {/* Wall inputs */}
          <Card>
            <SectionHeader icon={<WallIcon />} title="Wall" subtitle="Triangular distribution" color={C.sky} />
            <div style={{ padding: "12px 16px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <InputField label="Height, H" unit="ft" value={s.H} onChange={(v) => set("H", v)} />
              <InputField label="Pressure, pꞷ" unit="psf" value={s.pw} onChange={(v) => set("pw", v)} />
            </div>
            <div style={{ padding: "0 16px 12px", fontSize: 11, color: C.textSoft }}>
              Resultant = H/2 · p<sub>w</sub> = <strong style={{ color: C.sky }}>{fmt(wallRes)} plf</strong>
            </div>
          </Card>

          {/* Windward parapet */}
          <Card>
            <SectionHeader icon={<ParapetIcon flip={false} />} title="Windward Parapet" subtitle="Uniform distribution" color={C.violet} />
            <div style={{ padding: "12px 16px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <InputField label="Height, hₗ" unit="ft" value={s.hL} onChange={(v) => set("hL", v)} />
              <InputField label="Pressure, qₗ" unit="psf" value={s.qL} onChange={(v) => set("qL", v)} />
            </div>
            <div style={{ padding: "0 16px 12px", fontSize: 11, color: C.textSoft }}>
              Resultant = h<sub>L</sub> · q<sub>L</sub> = <strong style={{ color: C.violet }}>{fmt(leftRes)} plf</strong>
            </div>
          </Card>

          {/* Leeward parapet */}
          <Card>
            <SectionHeader icon={<ParapetIcon flip={true} />} title="Leeward Parapet" subtitle="Uniform distribution" color={C.violet} />
            <div style={{ padding: "12px 16px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <InputField label="Height, hᵣ" unit="ft" value={s.hR} onChange={(v) => set("hR", v)} />
              <InputField label="Pressure, qᵣ" unit="psf" value={s.qR} onChange={(v) => set("qR", v)} />
            </div>
            <div style={{ padding: "0 16px 12px", fontSize: 11, color: C.textSoft }}>
              Resultant = h<sub>R</sub> · q<sub>R</sub> = <strong style={{ color: C.violet }}>{fmt(rightRes)} plf</strong>
            </div>
          </Card>

          {/* Result */}
          <Card style={{ background: `linear-gradient(135deg, ${C.text} 0%, #1e293b 100%)` }}>
            <div style={{ padding: "20px 20px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>
                Total Line Load
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 38, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                {breakdown.length ? `${fmt(total)}` : "—"} <span style={{ fontSize: 18, fontWeight: 500, opacity: .6 }}>plf</span>
              </div>
            </div>
            {breakdown.length > 0 && (
              <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                {breakdown.map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,.65)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: b.color, display: "inline-block" }} />
                      {b.label}
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,.85)" }}>
                      {b.formula} = {fmt(b.value)}
                    </span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", marginTop: 4, paddingTop: 6, display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: C.green, fontWeight: 700 }}>
                    Σ = {fmt(total)} plf
                  </span>
                </div>
              </div>
            )}
          </Card>

          <button onClick={() => { setS({ ...defaultState }); setDirty(false); }}
            style={{
              cursor: "pointer", border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 16px",
              background: "#fff", color: C.textSoft, fontWeight: 600, fontSize: 13, fontFamily: "inherit", width: "100%",
            }}>
            Reset to defaults
          </button>
        </div>

        {/* ── RIGHT PANEL — SVG ── */}
        <Card style={{ position: "sticky", top: 16 }}>
          <div style={{
            padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
            borderBottom: `1px solid ${C.border}`, background: "rgba(0,0,0,.015)",
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Schematic</span>
            <div style={{ display: "flex", gap: 14, fontSize: 11, color: C.textSoft }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: C.sky }} /> Wall
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: C.violet }} /> Parapet
              </span>
            </div>
          </div>
          <div style={{ padding: 8 }}>
            <Diagram H={H} pw={pw} hL={hL} qL={qL} hR={hR} qR={qR} fmt={fmt} />
          </div>
        </Card>
      </div>

      <footer style={{ textAlign: "center", fontSize: 11, color: C.textSoft, maxWidth: 1200, margin: "14px auto 0" }}>
        All inputs per foot of building length · Result is a line load in pounds per linear foot (plf) · Set parapet height to 0 if not present
      </footer>
    </div>
  );
}

/* ═══════════════════════════ SVG DIAGRAM ═══════════════════════════ */
function Diagram({ H: h, pw: pwv, hL: hl, qL: qlv, hR: hr, qR: qrv, fmt }) {
  const baseY = 460, maxH = Math.max(h + Math.max(hl, hr), 1), scale = 340 / maxH;
  const wallW = 240, wallX = 250, wallTop = baseY - h * scale;
  const pW = 50;
  const lx = wallX - pW - 20, rx = wallX + wallW + 20;
  const lTop = wallTop - hl * scale, rTop = wallTop - hr * scale;

  return (
    <svg viewBox="0 0 740 510" style={{ width: "100%", height: "100%", display: "block", minHeight: 420 }}>
      <defs>
        <marker id="arw" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="currentColor" />
        </marker>
        <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0,0,0,.08)" strokeWidth="1.5" />
        </pattern>
        <linearGradient id="groundGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#334155" /><stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>

      {/* Ground */}
      <rect x={50} y={baseY} width={640} height={10} rx={5} fill="url(#groundGrad)" />
      {Array.from({ length: 20 }, (_, i) => (
        <line key={i} x1={80 + i * 30} y1={baseY + 10} x2={65 + i * 30} y2={baseY + 22} stroke="rgba(0,0,0,.15)" strokeWidth={1} />
      ))}

      {/* Wall body */}
      {h > 0 && <>
        <rect x={wallX} y={wallTop} width={wallW} height={h * scale} rx={4}
          fill="url(#hatch)" stroke="rgba(0,0,0,.2)" strokeWidth={1.5} />
        <rect x={wallX} y={wallTop} width={wallW} height={h * scale} rx={4}
          fill="rgba(2,132,199,.04)" />
      </>}

      {/* Roof line — dashed */}
      <line x1={wallX - 40} y1={wallTop} x2={wallX + wallW + 40} y2={wallTop}
        stroke="rgba(0,0,0,.25)" strokeWidth={1.5} strokeDasharray="8,4" />
      <text x={wallX + wallW + 45} y={wallTop + 4} fill={C.textSoft} fontSize={10} fontWeight={500}>Roof line</text>

      {/* Left parapet */}
      {hl > 0 && <rect x={lx} y={lTop} width={pW} height={hl * scale} rx={4}
        fill={C.violetGlow} stroke={C.violet} strokeWidth={1.2} strokeDasharray="4,3" />}

      {/* Right parapet */}
      {hr > 0 && <rect x={rx} y={rTop} width={pW} height={hr * scale} rx={4}
        fill={C.violetGlow} stroke={C.violet} strokeWidth={1.2} strokeDasharray="4,3" />}

      {/* Dimension lines */}
      {h > 0 && <DimLine x={wallX + wallW + 16} top={wallTop} bot={baseY} label={`${fmt(h)} ft`} />}
      {hl > 0 && <DimLine x={lx - 16} top={lTop} bot={wallTop} label={`${fmt(hl)} ft`} align="end" />}
      {hr > 0 && <DimLine x={rx + pW + 16} top={rTop} bot={wallTop} label={`${fmt(hr)} ft`} />}

      {/* Wind arrows — Wall */}
      {h > 0 && pwv > 0 && <WindArrows x1={wallX - 80} x2={wallX - 6} yTop={wallTop + 10} yBot={baseY - 10}
        count={Math.max(3, Math.floor(h / 2.5))} color={C.sky} label={`${fmt(pwv)} psf`} />}

      {/* Wind arrows — Left parapet */}
      {hl > 0 && qlv > 0 && <WindArrows x1={lx - 60} x2={lx - 4} yTop={lTop + 6} yBot={wallTop - 6}
        count={Math.max(2, Math.floor(hl / 2))} color={C.violet} label={`${fmt(qlv)} psf`} />}

      {/* Wind arrows — Right parapet */}
      {hr > 0 && qrv > 0 && <WindArrows x1={rx + pW + 4} x2={rx + pW + 60} yTop={rTop + 6} yBot={wallTop - 6}
        count={Math.max(2, Math.floor(hr / 2))} color={C.violet} label={`${fmt(qrv)} psf`} swap />}

      {/* Labels */}
      {h > 0 && <text x={wallX + wallW / 2} y={wallTop + h * scale / 2} fill="rgba(0,0,0,.3)" fontSize={13}
        fontWeight={700} textAnchor="middle" dominantBaseline="middle" letterSpacing=".08em">WALL</text>}
      {hl > 0 && <text x={lx + pW / 2} y={lTop - 12} fill={C.violet} fontSize={11} fontWeight={600} textAnchor="middle">Windward</text>}
      {hr > 0 && <text x={rx + pW / 2} y={rTop - 12} fill={C.violet} fontSize={11} fontWeight={600} textAnchor="middle">Leeward</text>}
    </svg>
  );
}

function DimLine({ x, top, bot, label, align = "start" }) {
  const dx = align === "end" ? -10 : 10;
  const anchor = align === "end" ? "end" : "start";
  return (
    <g>
      <line x1={x} y1={top} x2={x} y2={bot} stroke="rgba(0,0,0,.35)" strokeWidth={1} />
      <line x1={x - 5} y1={top} x2={x + 5} y2={top} stroke="rgba(0,0,0,.35)" strokeWidth={1} />
      <line x1={x - 5} y1={bot} x2={x + 5} y2={bot} stroke="rgba(0,0,0,.35)" strokeWidth={1} />
      <text x={x + dx} y={top + (bot - top) / 2} fill={C.textSoft} fontSize={11} fontWeight={500}
        dominantBaseline="middle" textAnchor={anchor}>{label}</text>
    </g>
  );
}

function WindArrows({ x1, x2, yTop, yBot, count, color, label, swap }) {
  const n = Math.max(count, 1);
  const dy = (yBot - yTop) / Math.max(n - 1, 1);
  const startX = swap ? x2 : x1, endX = swap ? x1 : x2;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const y = yTop + dy * i;
        return <line key={i} x1={startX} y1={y} x2={endX} y2={y} stroke={color} strokeWidth={1.8}
          markerEnd="url(#arw)" opacity={.75} />;
      })}
      <text x={(x1 + x2) / 2} y={yTop - 10} fill={color} fontSize={11} fontWeight={700} textAnchor="middle">{label}</text>
    </g>
  );
}

/* ═══════════════════════════ UI COMPONENTS ═══════════════════════════ */
function Card({ children, style: extra }) {
  return (
    <div style={{
      background: C.card, borderRadius: 14, border: `1px solid ${C.border}`,
      boxShadow: "0 1px 3px rgba(0,0,0,.04), 0 6px 20px rgba(0,0,0,.03)", overflow: "hidden", ...extra,
    }}>{children}</div>
  );
}

function SectionHeader({ icon, title, subtitle, color }) {
  return (
    <div style={{
      padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
      borderBottom: `1px solid ${C.border}`, background: `linear-gradient(90deg, ${color}06, transparent)`,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8, background: `${color}12`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{title}</div>
        <div style={{ fontSize: 10, color: C.textSoft }}>{subtitle}</div>
      </div>
    </div>
  );
}

function InputField({ label, unit, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: C.textSoft }}>{label}</label>
      <div className="input-group" style={{ position: "relative" }}>
        <input type="number" step="0.1" min="0" value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%", padding: "9px 50px 9px 12px", borderRadius: 10,
            border: `1px solid ${C.border}`, outline: "none", fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: C.text,
            background: "#fff",
          }}
        />
        <span className="unit-badge">{unit}</span>
      </div>
    </div>
  );
}

function HeaderBtn({ onClick, icon, label, hint, primary }) {
  return (
    <button onClick={onClick}
      style={{
        cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
        border: primary ? "none" : `1px solid ${C.borderHover}`,
        borderRadius: 11, padding: "8px 14px",
        background: primary ? `linear-gradient(135deg, ${C.sky}, ${C.skyDark})` : "#fff",
        color: primary ? "#fff" : C.slate, fontWeight: 600, fontSize: 13, fontFamily: "inherit",
        boxShadow: primary ? `0 4px 14px rgba(2,132,199,.2)` : "none",
      }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={icon} />
      </svg>
      {label}
      {hint && <span style={{ fontSize: 10, opacity: .5, marginLeft: 2 }}>{hint}</span>}
    </button>
  );
}

function WallIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.sky} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="9" /><line x1="15" y1="9" x2="15" y2="15" /><line x1="9" y1="15" x2="9" y2="21" />
    </svg>
  );
}

function ParapetIcon({ flip }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.violet} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M4 21V11h4V7h4v4h4v4h4v6" /><line x1="2" y1="21" x2="22" y2="21" />
    </svg>
  );
}
