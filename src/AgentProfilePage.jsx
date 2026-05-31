import { useState, useEffect } from "react";

const API = "https://api.aivildev.com";

const C = {
  bg:"#04060c", surface:"#080c14", card:"#0d1220",
  border:"#151f30", gold:"#c9a84c", goldDim:"rgba(201,168,76,0.08)",
  text:"#dde4f0", textDim:"#3d5070", textMid:"#7a90b8",
  green:"#00d68f", red:"#ff4d6a", blue:"#4fc3f7",
};

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

const ScoreRing = ({ score, size=80 }) => {
  const color = score >= 70 ? C.green : score >= 40 ? C.gold : C.red;
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (Math.min(score, 100) / 100) * circ;
  return (
    <div style={{ position:"relative", width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={4}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:20, fontFamily:"'Playfair Display',serif", color }}>{score}</div>
        <div style={{ fontSize:8, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>TRUST</div>
      </div>
    </div>
  );
};

export default function AgentProfilePage() {
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [agentId, setAgentId] = useState("");

  useEffect(() => {
    // Get agent ID from URL path
    const path = window.location.pathname;
    const match = path.match(/\/agent\/(AGT-[A-Z0-9]+)/);
    if (match) {
      setAgentId(match[1]);
      fetchAgent(match[1]);
    } else {
      setError("Invalid agent URL");
      setLoading(false);
    }
  }, []);

  const fetchAgent = async (id) => {
    try {
      const res = await fetch(`${API}/verify/${id}`);
      const data = await res.json();
      if (!data.verified) {
        setError("Agent not found in AIVIL registry");
        return;
      }
      setAgent(data);
    } catch(e) {
      setError("Cannot connect to AIVIL registry");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const getStatusColor = (status) => {
    if (status === "active") return C.green;
    if (status === "suspended") return C.red;
    return C.textDim;
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
      `}</style>

      {/* Nav */}
      <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:"rgba(4,6,12,0.95)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${C.border}`, padding:"14px 48px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <a href="/" style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:C.gold, letterSpacing:3, textDecoration:"none" }}>AIVIL</a>
        <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          <a href="/docs" style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, textDecoration:"none" }}>Docs</a>
          <a href="/signup" style={{ background:C.gold, color:C.bg, padding:"7px 16px", borderRadius:4, fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, textDecoration:"none" }}>GET API KEY →</a>
        </div>
      </div>

      <div style={{ paddingTop:80, maxWidth:760, margin:"0 auto", padding:"80px 24px 60px" }}>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:"center", padding:"80px 0" }}>
            <div style={{ width:32, height:32, border:`2px solid ${C.border}`, borderTop:`2px solid ${C.gold}`, borderRadius:"50%", animation:"spin 1s linear infinite", margin:"0 auto 16px" }}/>
            <div style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>Querying AIVIL registry...</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ textAlign:"center", padding:"80px 0", animation:"fadeUp 0.4s ease" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>✕</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:C.red, marginBottom:8 }}>Agent Not Found</div>
            <div style={{ fontSize:12, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", marginBottom:24 }}>{error}</div>
            <a href="/" style={{ color:C.gold, fontSize:11, fontFamily:"'JetBrains Mono',monospace", textDecoration:"none" }}>← Back to AIVIL</a>
          </div>
        )}

        {/* Agent Profile */}
        {agent && !loading && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>

            {/* Verified badge */}
            <div style={{ display:"flex", justifyContent:"center", marginBottom:32 }}>
              <div style={{ background:"rgba(0,214,143,0.08)", border:`1px solid ${C.green}33`, borderRadius:20, padding:"8px 20px", display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:C.green, boxShadow:`0 0 8px ${C.green}` }}/>
                <span style={{ fontSize:11, color:C.green, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2 }}>VERIFIED IN AIVIL REGISTRY</span>
              </div>
            </div>

            {/* Header card */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:32, marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:24, marginBottom:24 }}>
                <ScoreRing score={agent.trust_score || 70} size={80}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
                    <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, color:C.text, fontWeight:400 }}>{agent.name}</h1>
                    <span style={{ fontSize:10, padding:"3px 10px", borderRadius:10, background:`${getStatusColor(agent.status)}11`, border:`1px solid ${getStatusColor(agent.status)}33`, color:getStatusColor(agent.status), fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>
                      {agent.status?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize:13, color:C.textMid, marginBottom:4 }}>{agent.role}</div>
                  <div style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>Owner: {agent.owner}</div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={{ background:C.surface, borderRadius:6, padding:"12px 14px" }}>
                  <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:4 }}>AGENT ID</div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ fontSize:13, color:C.gold, fontFamily:"'JetBrains Mono',monospace" }}>{agent.agent_id}</span>
                    <button onClick={()=>copy(agent.agent_id,"id")} style={{ background:"transparent", border:"none", color:copied==="id"?C.green:C.textDim, cursor:"pointer", fontSize:10 }}>
                      {copied==="id"?"✓":"⎘"}
                    </button>
                  </div>
                </div>
                <div style={{ background:C.surface, borderRadius:6, padding:"12px 14px" }}>
                  <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:4 }}>JURISDICTION</div>
                  <span style={{ fontSize:13, color:C.text }}>{agent.jurisdiction || "—"}</span>
                </div>
                <div style={{ background:C.surface, borderRadius:6, padding:"12px 14px" }}>
                  <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:4 }}>BORN</div>
                  <span style={{ fontSize:12, color:C.text }}>{fmt(agent.born_at)}</span>
                </div>
                <div style={{ background:C.surface, borderRadius:6, padding:"12px 14px" }}>
                  <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:4 }}>VERIFIED AT</div>
                  <span style={{ fontSize:12, color:C.text }}>{fmt(agent.verified_at)}</span>
                </div>
              </div>
            </div>

            {/* DID */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20, marginBottom:16 }}>
              <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:10 }}>DECENTRALISED IDENTIFIER (DID)</div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:C.surface, borderRadius:6, padding:"10px 14px" }}>
                <span style={{ fontSize:12, color:C.blue, fontFamily:"'JetBrains Mono',monospace" }}>{agent.did}</span>
                <button onClick={()=>copy(agent.did,"did")} style={{ background:"transparent", border:"none", color:copied==="did"?C.green:C.textDim, cursor:"pointer", fontSize:11 }}>
                  {copied==="did"?"✓ Copied":"⎘ Copy"}
                </button>
              </div>
            </div>

            {/* Public key */}
            {agent.public_key && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20, marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace" }}>PUBLIC KEY</div>
                  <button onClick={()=>copy(agent.public_key,"key")} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:3, color:copied==="key"?C.green:C.textDim, padding:"3px 10px", cursor:"pointer", fontSize:9, fontFamily:"'JetBrains Mono',monospace" }}>
                    {copied==="key"?"✓ COPIED":"COPY"}
                  </button>
                </div>
                <div style={{ background:C.surface, borderRadius:6, padding:"12px 14px", fontSize:10, color:C.textMid, fontFamily:"'JetBrains Mono',monospace", wordBreak:"break-all", lineHeight:1.6 }}>
                  {agent.public_key.slice(0, 120)}...
                </div>
              </div>
            )}

            {/* Birth hash */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:20, marginBottom:24 }}>
              <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:10 }}>BIRTH CERTIFICATE HASH</div>
              <div style={{ background:C.surface, borderRadius:6, padding:"10px 14px", fontSize:11, color:C.textMid, fontFamily:"'JetBrains Mono',monospace", wordBreak:"break-all" }}>
                {agent.birth_hash || "—"}
              </div>
              <div style={{ fontSize:11, color:C.textDim, marginTop:8, lineHeight:1.6 }}>
                This SHA-256 hash proves the agent's identity has not been tampered with since registration.
              </div>
            </div>

            {/* Verify yourself */}
            <div style={{ background:C.goldDim, border:`1px solid ${C.gold}22`, borderRadius:10, padding:20, marginBottom:24 }}>
              <div style={{ fontSize:11, color:C.gold, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, marginBottom:8 }}>VERIFY THIS AGENT YOURSELF</div>
              <div style={{ background:C.bg, borderRadius:6, padding:"12px 14px", fontSize:11, color:C.textMid, fontFamily:"'JetBrains Mono',monospace", lineHeight:2, marginBottom:12 }}>
                <span style={{ color:C.blue }}>curl</span> https://api.aivildev.com/verify/{agent.agent_id}
              </div>
              <button onClick={()=>copy(`curl https://api.aivildev.com/verify/${agent.agent_id}`,"curl")} style={{ background:"transparent", border:`1px solid ${C.gold}33`, borderRadius:4, color:copied==="curl"?C.green:C.gold, padding:"6px 14px", cursor:"pointer", fontSize:9, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace" }}>
                {copied==="curl"?"✓ COPIED":"COPY COMMAND"}
              </button>
            </div>

            {/* Footer */}
            <div style={{ textAlign:"center", padding:"16px 0", borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}>
                Verified by AIVIL Registry · {fmt(agent.verified_at)}
              </div>
              <a href="/" style={{ fontSize:11, color:C.gold, fontFamily:"'JetBrains Mono',monospace", textDecoration:"none" }}>
                aivildev.com
              </a>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
