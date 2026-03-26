"use client";
import { useState, useEffect } from "react";

type Dimension = { label: string; desc: string; score: number; max: number; icon: string; };
type UserInfo = { username: string; displayName: string; avatar: string; fid: number; followers: number; following: number; };

function useCountUp(target: number, duration = 1400, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration, active]);
  return val;
}

function Ring({ score, max = 1000, active }: { score: number; max?: number; active: boolean }) {
  const r = 90;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);
  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setOffset(circ * (1 - score / max)), 200);
    return () => clearTimeout(id);
  }, [score, active, circ, max]);
  const display = useCountUp(score, 1600, active);
  const pct = score / max;
  const ringColor = pct >= 0.7 ? "#CCFF00" : pct >= 0.5 ? "#00E5FF" : "#9B6DFF";
  return (
    <div style={{ position: "relative", width: 200, height: 200, flexShrink: 0 }}>
      <svg width="200" height="200" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8"/>
        <circle cx="100" cy="100" r={r} fill="none" stroke={ringColor} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          filter="url(#glow)"
          style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(0.16,1,0.3,1), stroke 0.5s ease" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "2.8rem", fontWeight: 900, fontFamily: "'Arial Black', sans-serif", color: "#fff", lineHeight: 1 }}>{display}</span>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", marginTop: 4 }}>/ 1000</span>
      </div>
    </div>
  );
}

function Bar({ score, max, delay, color }: { score: number; max: number; delay: number; color: string }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setW((score / max) * 100), delay);
    return () => clearTimeout(id);
  }, [score, max, delay]);
  return (
    <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", marginTop: 10 }}>
      <div style={{ height: "100%", width: `${w}%`, borderRadius: 99, background: color, transition: "width 1.4s cubic-bezier(0.16,1,0.3,1)", boxShadow: `0 0 10px ${color}88` }} />
    </div>
  );
}

const DIM_COLORS = ["#CCFF00", "#00E5FF", "#9B6DFF", "#FF6B9D", "#00FFB3"];

function getGrade(score: number) {
  if (score >= 850) return { label: "LEGENDARY", color: "#CCFF00" };
  if (score >= 700) return { label: "ELITE", color: "#00E5FF" };
  if (score >= 500) return { label: "CREDIBLE", color: "#9B6DFF" };
  if (score >= 300) return { label: "EMERGING", color: "#FF6B9D" };
  return { label: "ANON", color: "#555" };
}

export default function ScoreCard() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<Dimension[] | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const total = scores ? scores.reduce((a, b) => a + b.score, 0) : 0;
  const grade = scores ? getGrade(total) : null;

  const run = async (override?: string | React.MouseEvent) => {
    const q = typeof override === "string" ? override : query;
    if (!q.trim() || loading) return;
    setQuery(q);
    setLoading(true); setScores(null); setUser(null); setError(null); setReady(false);
    try {
      const res = await fetch(`/api/score?username=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (!res.ok) setError(data.error || "Not found");
      else { setScores(data.scores); setUser(data.user); setTimeout(() => setReady(true), 100); }
    } catch { setError("Network error — try again"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060608", color: "#F0EDE6", fontFamily: "system-ui, sans-serif", overflowX: "hidden" }}>

      {/* Animated orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        {[
          { w:700, h:700, bg:"rgba(155,109,255,0.18)", top:"-20%", left:"-15%", anim:"float1 9s ease-in-out infinite" },
          { w:600, h:600, bg:"rgba(0,229,255,0.13)", top:"10%", right:"-10%", anim:"float2 11s ease-in-out infinite" },
          { w:500, h:500, bg:"rgba(204,255,0,0.1)", bottom:"-5%", left:"30%", anim:"float3 13s ease-in-out infinite" },
          { w:400, h:400, bg:"rgba(255,107,157,0.1)", top:"40%", left:"-10%", anim:"float4 15s ease-in-out infinite" },
          { w:350, h:350, bg:"rgba(0,255,179,0.08)", bottom:"10%", right:"5%", anim:"float5 10s ease-in-out infinite" },
        ].map((o, i) => (
          <div key={i} style={{
            position: "absolute",
            width: o.w, height: o.h,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${o.bg} 0%, transparent 70%)`,
            top: o.top, left: o.left, right: o.right, bottom: o.bottom,
            animation: o.anim,
          }} />
        ))}
        {/* Subtle grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "48px 24px 100px" }}>

        {/* Nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 80 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, background: "#CCFF00", borderRadius: "50%", boxShadow: "0 0 10px #CCFF00" }} />
            <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.3em", color: "#CCFF00", fontWeight: 700 }}>BASECRED</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["BASE", "FARCASTER"].map(tag => (
              <span key={tag} style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.2em", padding: "4px 10px", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)", borderRadius: 99 }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Hero */}
        {!scores && (
          <div style={{ marginBottom: 64, textAlign: "center" }}>
            <h1 style={{
              fontFamily: "'Arial Black', sans-serif", fontWeight: 900,
              fontSize: "clamp(3rem, 11vw, 6.5rem)",
              lineHeight: 0.88, letterSpacing: "-0.04em",
              color: "#ffffff", margin: "0 0 6px",
              textShadow: "0 0 80px rgba(255,255,255,0.12)",
            }}>ONCHAIN</h1>
            <h1 style={{
              fontFamily: "'Arial Black', sans-serif", fontWeight: 900,
              fontSize: "clamp(2.4rem, 9vw, 5.5rem)",
              lineHeight: 0.88, letterSpacing: "-0.04em",
              background: "linear-gradient(135deg, #CCFF00 0%, #00E5FF 40%, #9B6DFF 70%, #FF6B9D 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text", margin: "0 0 24px",
              display: "block",
              padding: "0 4px 8px",
            }}>CREDIBILITY</h1>
            <p style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.3em" }}>
              TRANSPARENT · COMPOSABLE · EARNED
            </p>
          </div>
        )}

        {/* Input */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 99,
          padding: "6px 6px 6px 24px",
          display: "flex", alignItems: "center",
          marginBottom: error ? 16 : 32,
          backdropFilter: "blur(20px)",
        }}>
          <span style={{ fontFamily: "monospace", fontSize: 14, color: "#CCFF00", marginRight: 10, userSelect: "none" }}>@</span>
          <input
            type="text"
            placeholder="input farcaster username/UID"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && run()}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontFamily: "monospace", fontSize: 15, color: "#fff",
              padding: "10px 0", caretColor: "#CCFF00",
            }}
          />
          <button
            onClick={run}
            disabled={loading || !query.trim()}
            style={{
              background: loading || !query.trim() ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #CCFF00, #00E5FF)",
              border: "none", borderRadius: 99, cursor: "pointer",
              fontFamily: "monospace", fontSize: 11, letterSpacing: "0.2em",
              color: "#060608", fontWeight: 900,
              padding: "12px 24px", transition: "all 0.3s",
              opacity: loading || !query.trim() ? 0.4 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "···" : "SCORE →"}
          </button>
        </div>

        {/* Quick picks */}
        {!scores && !error && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 16 }}>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em", alignSelf: "center" }}>TRY →</span>
            {["dwr", "jessepollak", "vitalik.eth"].map((u, i) => (
              <button key={u} onClick={() => run(u)}
                style={{
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${DIM_COLORS[i]}33`,
                  borderRadius: 99, fontFamily: "monospace", fontSize: 11,
                  color: DIM_COLORS[i] + "99", padding: "6px 14px", cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = DIM_COLORS[i]; (e.target as HTMLElement).style.color = DIM_COLORS[i]; (e.target as HTMLElement).style.boxShadow = `0 0 12px ${DIM_COLORS[i]}44`; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = DIM_COLORS[i] + "33"; (e.target as HTMLElement).style.color = DIM_COLORS[i] + "99"; (e.target as HTMLElement).style.boxShadow = "none"; }}
              >@{u}</button>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#ff6b6b", padding: "12px 16px", marginBottom: 24, background: "rgba(255,100,100,0.08)", borderRadius: 16, border: "1px solid rgba(255,100,100,0.15)" }}>
            ✗ {error}
          </div>
        )}

        {/* Results */}
        {scores && user && grade && (
          <div style={{ opacity: ready ? 1 : 0, transform: ready ? "none" : "translateY(20px)", transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)" }}>

            {/* Score card */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 28, padding: "32px",
              marginBottom: 12, backdropFilter: "blur(20px)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", inset: 0, borderRadius: 28, pointerEvents: "none",
                background: `radial-gradient(ellipse at 20% 50%, ${grade.color}12 0%, transparent 60%)`,
              }} />
              <div style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
                <Ring score={total} active={ready} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <span style={{
                    fontFamily: "monospace", fontSize: 10, letterSpacing: "0.25em", fontWeight: 700,
                    color: grade.color, padding: "5px 14px",
                    border: `1px solid ${grade.color}44`, borderRadius: 99,
                    display: "inline-block", marginBottom: 16,
                    boxShadow: `0 0 16px ${grade.color}22`,
                  }}>{grade.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    {user.avatar && <img src={user.avatar} alt={user.username} style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)" }} />}
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#fff" }}>{user.displayName}</p>
                      <p style={{ margin: 0, fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>@{user.username} · FID {user.fid}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 24 }}>
                    {[{ label: "followers", val: user.followers.toLocaleString() }, { label: "following", val: user.following.toLocaleString() }].map(s => (
                      <div key={s.label}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 18, color: "#fff" }}>{s.val}</p>
                        <p style={{ margin: 0, fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Dimensions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {scores.map((d, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.025)",
                  border: `1px solid ${DIM_COLORS[i]}22`,
                  borderRadius: 20, padding: "18px 22px",
                  opacity: ready ? 1 : 0,
                  transform: ready ? "none" : "translateX(-16px)",
                  transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms`,
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: 20, pointerEvents: "none",
                    background: `linear-gradient(90deg, ${DIM_COLORS[i]}0a 0%, transparent 50%)`,
                    borderLeft: `2px solid ${DIM_COLORS[i]}55`,
                  }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ fontSize: 16, color: DIM_COLORS[i] }}>{d.icon}</span>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{d.label}</p>
                        <p style={{ margin: 0, fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", marginTop: 2 }}>{d.desc}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontFamily: "'Arial Black', sans-serif", fontWeight: 900, fontSize: 24, color: DIM_COLORS[i] }}>{d.score}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>/{d.max}</span>
                    </div>
                  </div>
                  <Bar score={d.score} max={d.max} delay={300 + i * 100} color={DIM_COLORS[i]} />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
  onClick={() => {
    const text = `my basecred score: ${total}/1000 — ${grade.label}\n\ncast quality: ${scores[0].score}/200\nonchain activity: ${scores[1].score}/200\nsocial consistency: ${scores[2].score}/200\ncommunity contribution: ${scores[3].score}/200\nbuilder signal: ${scores[4].score}/200\n\ncheck yours 👇\nbasecred-phi.vercel.app`;
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }}
  style={{
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 99, color: "rgba(255,255,255,0.5)",
    fontFamily: "monospace", fontSize: 10,
    letterSpacing: "0.2em", padding: "16px",
    cursor: "pointer", transition: "all 0.2s",
  }}
  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = "#00E5FF"; (e.target as HTMLElement).style.color = "#00E5FF"; (e.target as HTMLElement).style.boxShadow = "0 0 16px #00E5FF22"; }}
  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)"; (e.target as HTMLElement).style.boxShadow = "none"; }}
>SHARE CAST →</button>
              <button style={{
                background: "linear-gradient(135deg, #CCFF00, #00E5FF)",
                border: "none", borderRadius: 99,
                color: "#060608", fontFamily: "monospace", fontSize: 10,
                fontWeight: 900, letterSpacing: "0.2em", padding: "16px",
                cursor: "pointer", transition: "opacity 0.2s",
              }}
              onMouseEnter={e => (e.target as HTMLElement).style.opacity = "0.85"}
              onMouseLeave={e => (e.target as HTMLElement).style.opacity = "1"}
              >MINT NFT →</button>
            </div>

          </div>
        )}
      </div>

      <style>{`
        @keyframes float1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,30px) scale(1.05)}}
        @keyframes float2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-30px,40px) scale(0.95)}}
        @keyframes float3{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-30px) scale(1.08)}}
        @keyframes float4{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(20px,40px) scale(1.03)}66%{transform:translate(-10px,20px) scale(0.97)}}
        @keyframes float5{0%,100%{transform:translate(0,0)}50%{transform:translate(-20px,-30px)}}
        input::placeholder{color:rgba(255,255,255,0.15);}
        *{box-sizing:border-box;}
      `}</style>
    </div>
  );
}