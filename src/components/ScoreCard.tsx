"use client";
import { useState, useEffect } from "react";

type Dimension = {
  label: string;
  desc: string;
  score: number;
  max: number;
  icon: string;
};

type UserInfo = {
  username: string;
  displayName: string;
  avatar: string;
  fid: number;
  followers: number;
  following: number;
};

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <>{display}</>;
}

function ScoreRing({ score, max = 1000 }: { score: number; max?: number }) {
  const pct = score / max;
  const r = 80;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);
  useEffect(() => {
    setTimeout(() => setOffset(circ * (1 - pct)), 100);
  }, [score, circ, pct]);

  return (
    <svg width="200" height="200" className="rotate-[-90deg]">
      <circle cx="100" cy="100" r={r} fill="none" stroke="#1a1a14" strokeWidth="12" />
      <circle
        cx="100" cy="100" r={r} fill="none"
        stroke="#CCFF00" strokeWidth="12"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      />
    </svg>
  );
}

export default function ScoreCard() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<Dimension[] | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const total = scores ? scores.reduce((a, b) => a + b.score, 0) : 0;

  const handleScore = async () => {
    if (!address) return;
    setLoading(true);
    setScores(null);
    setUserInfo(null);
    setError(null);
    setVisible(false);

    try {
      const res = await fetch(`/api/score?username=${encodeURIComponent(address)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setScores(data.scores);
        setUserInfo(data.user);
        setTimeout(() => setVisible(true), 100);
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  const getGrade = (score: number) => {
    if (score >= 850) return "LEGENDARY";
    if (score >= 700) return "ELITE";
    if (score >= 500) return "CREDIBLE";
    if (score >= 300) return "EMERGING";
    return "ANON";
  };

  return (
    <div className="w-full min-h-screen bg-[#0E0D09] flex flex-col items-center justify-start py-16 px-4">
      <div className="w-full max-w-xl relative z-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-[#CCFF00]" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-[#CCFF00] uppercase">BaseCred Protocol</span>
          </div>
          <h1 className="text-[clamp(2.8rem,8vw,5rem)] font-black leading-[0.9] tracking-tighter text-[#F0EDE6] mb-3">
            ONCHAIN<br />
            <span style={{ WebkitTextStroke: "1px #CCFF00", color: "transparent" }}>
              CREDIBILITY
            </span>
          </h1>
          <p className="text-[#4a4a3a] font-mono text-xs tracking-widest">
            TRANSPARENT · COMPOSABLE · EARNED
          </p>
        </div>

        {/* Input */}
        <div className="relative mb-6 group">
          <div className="flex border border-[#222218] group-focus-within:border-[#CCFF00] transition-colors">
            <span className="font-mono text-[#CCFF00] text-sm px-4 flex items-center border-r border-[#222218] bg-[#0E0D09] select-none">
              @
            </span>
            <input
              type="text"
              placeholder="farcaster username"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScore()}
              className="flex-1 bg-transparent text-[#F0EDE6] font-mono text-sm px-4 py-4 outline-none placeholder:text-[#2a2a20]"
            />
            <button
              onClick={handleScore}
              disabled={loading || !address}
              className="bg-[#CCFF00] text-[#0E0D09] font-mono text-[10px] tracking-[0.2em] uppercase font-black px-6 hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? (
                <span className="inline-flex gap-1">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>·</span>
                </span>
              ) : "SCORE →"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="border border-red-900 bg-red-950/30 text-red-400 font-mono text-xs p-3 mb-6">
            ✗ {error}
          </div>
        )}

        {/* Results */}
        {scores && userInfo && (
          <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

            {/* User + Score Ring */}
            <div className="flex items-center gap-6 mb-6 p-6 border border-[#222218] bg-[#0a0a08]">
              <div className="relative flex-shrink-0">
                <ScoreRing score={total} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-black text-4xl text-[#F0EDE6] leading-none">
                    <AnimatedNumber value={total} />
                  </span>
                  <span className="font-mono text-[10px] text-[#4a4a3a] tracking-widest mt-1">/ 1000</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  {userInfo.avatar && (
                    <img src={userInfo.avatar} alt={userInfo.username} className="w-10 h-10 rounded-full border border-[#222218]" />
                  )}
                  <div>
                    <p className="font-bold text-[#F0EDE6] text-sm">{userInfo.displayName}</p>
                    <p className="font-mono text-[10px] text-[#4a4a3a]">@{userInfo.username} · FID {userInfo.fid}</p>
                  </div>
                </div>
                <p className="font-black text-2xl tracking-tight text-[#CCFF00] mb-2">
                  {getGrade(total)}
                </p>
                <div className="flex gap-4">
                  <span className="font-mono text-[10px] text-[#4a4a3a]">
                    <span className="text-[#F0EDE6]">{userInfo.followers.toLocaleString()}</span> followers
                  </span>
                  <span className="font-mono text-[10px] text-[#4a4a3a]">
                    <span className="text-[#F0EDE6]">{userInfo.following.toLocaleString()}</span> following
                  </span>
                </div>
              </div>
            </div>

            {/* Dimensions */}
            <div className="border border-[#222218] divide-y divide-[#222218] mb-4">
              {scores.map((d, i) => (
                <div key={i} className="p-4 hover:bg-[#0a0a08] transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[#CCFF00] text-xs font-mono">{d.icon}</span>
                      <div>
                        <p className="text-[#F0EDE6] text-sm font-semibold tracking-tight">{d.label}</p>
                        <p className="text-[#3a3a2a] font-mono text-[10px] tracking-wider">{d.desc}</p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <span className="font-black text-xl text-[#CCFF00]">
                        <AnimatedNumber value={d.score} duration={800 + i * 150} />
                      </span>
                      <span className="font-mono text-[10px] text-[#3a3a2a]">/{d.max}</span>
                    </div>
                  </div>
                  <div className="h-[1px] bg-[#1a1a14]">
                    <div
                      className="h-full bg-[#CCFF00] transition-all duration-1000"
                      style={{
                        width: `${(d.score / d.max) * 100}%`,
                        transitionDelay: `${200 + i * 100}ms`,
                        boxShadow: "0 0 8px #CCFF00"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button className="border border-[#222218] text-[#4a4a3a] font-mono text-[10px] tracking-[0.2em] uppercase py-4 hover:border-[#CCFF00] hover:text-[#CCFF00] transition-all hover:bg-[#CCFF00]/5">
                SHARE CAST →
              </button>
              <button className="border border-[#CCFF00] text-[#CCFF00] font-mono text-[10px] tracking-[0.2em] uppercase py-4 hover:bg-[#CCFF00] hover:text-[#0E0D09] transition-all font-black">
                MINT NFT →
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}