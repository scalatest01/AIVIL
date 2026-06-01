import { useState, useEffect, useRef } from "react";
import VulnerabilityScanner from "./VulnerabilityScanner";
const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false); 
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
};

const Reveal = ({ children, delay = 0, style = {} }) => {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
      ...style
    }}>
      {children}
    </div>
  );
};

const PROBLEMS = [
  { icon: "?", title: "No Identity", desc: "Nobody knows who sent this agent request or who is responsible for its actions." },
  { icon: "×", title: "No Accountability", desc: "When an agent makes a mistake costing thousands — there is no record. No proof. No answer." },
  { icon: "∅", title: "No History", desc: "Has this agent behaved well before? Has it committed fraud? Zero information exists." },
  { icon: "!", title: "No Control", desc: "Agents can spend, delete, and act without limits. No parent. No rules. No oversight." },
];

const FEATURES = [
  { icon: "⬡", label: "Birth Certificate", desc: "Permanent cryptographic ID from the moment of creation." },
  { icon: "⊟", label: "Policy Engine", desc: "Spending limits, restricted domains, allowed actions." },
  { icon: "◈", label: "Financial Passport", desc: "Every penny tracked. ROI proven. Value measured." },
  { icon: "⊠", label: "Legal Audit Trail", desc: "Tamper-proof. Signed. Defensible in court." },
  { icon: "◉", label: "Trust Score", desc: "0-100 reputation built from real behavior over time." },
  { icon: "⊞", label: "Life Record", desc: "Birth to retirement. Complete. Permanent. Immutable." },
];

const CODE = `const AIVIL = require('aivil')
const aivil = new AIVIL({ apiKey: process.env.AIVIL_API_KEY })

// Give your agent a verified identity
const { agent } = await aivil.getOrCreate({
  name: "Procurement Agent",
  role: "Procurement Specialist",
  owner: "Acme Corp",
  jurisdiction: "Delaware_USA",
  policy: {
    spending_limit: 100,
    allowed_topics: ["vendors", "pricing"],
    blocked_topics: ["gambling", "adult"],
  }
})

// Audit every action before execution
const verdict = await aivil.audit(agent.id, {
  type: "purchase",
  amount: 30,
  domain: "openai.com",
  description: "Buy API credits for data processing"
})

console.log(verdict.status)         // APPROVED
console.log(verdict.agent_registry) // https://aivildev.com/agent/AGT-A3F8C2E1`;

const TERMINAL_STEPS = [
  { delay: 500,  type: "cmd",     text: "const aivil = new AIVIL({ apiKey: 'aivil_...' })" },
  { delay: 1200, type: "cmd",     text: "await aivil.createAgent({ name: 'Prometheus', role: 'Procurement' })" },
  { delay: 2000, type: "success", text: "✓ AGT-A3F8C2E1 registered — did:aivil:AGT-A3F8C2E1" },
  { delay: 2800, type: "cmd",     text: "await aivil.audit(agent.id, { type: 'purchase', amount: 30, domain: 'openai.com', description: 'Buy API credits' })" },
  { delay: 3800, type: "approved",text: "✓ APPROVED — All policy checks passed" },
  { delay: 4600, type: "cmd",     text: "await aivil.audit(agent.id, { type: 'purchase', amount: 30, domain: 'casino.gambling', description: 'Buy casino credits' })" },
  { delay: 5600, type: "blocked", text: "✕ BLOCKED — Domain '*.gambling' restricted by policy" },
  { delay: 6400, type: "cmd",     text: "await aivil.audit(agent.id, { type: 'transfer', amount: 50000, description: 'Wire transfer' })" },
  { delay: 7400, type: "blocked", text: "✕ BLOCKED — $50,000 exceeds spending limit of $100" },
  { delay: 8200, type: "cmd",     text: "await aivil.getAuditLog(agent.id)" },
  { delay: 9000, type: "success", text: "✓ 3 decisions logged — cryptographically signed — immutable" },
];

function LiveTerminal() {
  const [visibleSteps, setVisibleSteps] = useState([]);
  const [started, setStarted] = useState(false);
  const [ref, inView] = useInView(0.3);
  const terminalRef = useRef(null);

  useEffect(() => {
    if (!inView || started) return;
    setStarted(true);
    setVisibleSteps([]);
    TERMINAL_STEPS.forEach((step) => {
      setTimeout(() => {
        setVisibleSteps(prev => [...prev, step]);
        if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }, step.delay);
    });
    setTimeout(() => { setStarted(false); setVisibleSteps([]); }, 12000);
  }, [inView, started]);

  const getColor = (type) => {
    if (type === "approved") return "#00d68f";
    if (type === "blocked") return "#ff4d6a";
    if (type === "success") return "#c9a84c";
    return "#7a90b8";
  };

  return (
    <div ref={ref} style={{ width: "100%", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ background: "#030508", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ padding: "12px 16px", background: "#07090f", borderBottom: "1px solid rgba(201,168,76,0.1)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff4d6a" }}/>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#c9a84c" }}/>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00d68f" }}/>
          <span style={{ marginLeft: 8, fontSize: 11, color: "#3d5070", fontFamily: "'JetBrains Mono',monospace" }}>aivil — live demo</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d68f", boxShadow: "0 0 6px #00d68f", animation: "pulse 2s infinite" }}/>
            <span style={{ fontSize: 9, color: "#00d68f", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>LIVE</span>
          </div>
        </div>
        <div ref={terminalRef} style={{ padding: "20px", minHeight: 280, maxHeight: 320, overflowY: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, lineHeight: 2 }}>
          {visibleSteps.length === 0 && (
            <div style={{ color: "#3d5070", fontSize: 11 }}>
              <span style={{ color: "#c9a84c" }}>{">"} </span>
              <span style={{ animation: "blink 1s infinite" }}>_</span>
            </div>
          )}
          {visibleSteps.map((step, i) => (
            <div key={i} style={{ color: getColor(step.type), marginBottom: 2, wordBreak: "break-all" }}>
              {step.type === "cmd" ? <span style={{ color: "#c9a84c" }}>{">"} </span> : null}
              {step.text}
            </div>
          ))}
          {visibleSteps.length > 0 && visibleSteps.length < TERMINAL_STEPS.length && (
            <div style={{ color: "#3d5070" }}><span style={{ color: "#c9a84c" }}>{">"} </span><span>_</span></div>
          )}
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(201,168,76,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#3d5070", fontFamily: "'JetBrains Mono',monospace" }}>npm install aivil</span>
          <button onClick={() => window.goToSignup()} style={{ background: "#c9a84c", border: "none", borderRadius: 4, color: "#05080f", padding: "6px 14px", cursor: "pointer", fontSize: 10, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
            GET API KEY →
          </button>
        </div>
      </div>
    </div>
  );
}

function VerifySearch() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleVerify = () => {
    const id = input.trim().toUpperCase();
    if (!id.startsWith("AGT-")) {
      setError("Agent ID must start with AGT-");
      return;
    }
    window.history.pushState({}, "", `/agent/${id}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleVerify()}
          placeholder="AGT-A3F8C2E1"
          style={{ background: "#080c14", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 4, color: "#dde4f0", padding: "12px 16px", fontSize: 13, fontFamily: "'JetBrains Mono',monospace", width: 260, outline: "none" }}
        />
        <button onClick={handleVerify} style={{ background: "#c9a84c", border: "none", borderRadius: 4, color: "#05080f", padding: "12px 24px", fontSize: 11, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, cursor: "pointer" }}>
          VERIFY →
        </button>
      </div>
      {error && <div style={{ fontSize: 11, color: "#ff4d6a", fontFamily: "'JetBrains Mono',monospace", marginTop: 8 }}>{error}</div>}
      <div style={{ fontSize: 11, color: "#3d5070", fontFamily: "'JetBrains Mono',monospace", marginTop: 12 }}>
        Try: AGT-IEL8CMEM
      </div>
    </div>
  );
}

function LiveBoardDemo() {
  const [audits, setAudits] = useState([]);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [ref, inView] = useInView(0.2);
  const startedRef = useRef(false);

  const DEMO = [
    { verdict:"APPROVED", action:"Purchase API credits", amount:30,    domain:"openai.com",      reason:"Within spending limit. Domain approved.", flags:[] },
    { verdict:"BLOCKED",  action:"Wire transfer",        amount:50000, domain:"unknown.io",       reason:"Amount exceeds policy limit of $100.", flags:["AMOUNT_EXCEEDS_LIMIT","HIGH_VALUE_TRANSACTION"] },
    { verdict:"ESCALATE", action:"Vendor contract",      amount:8500,  domain:"vendor.acme.com",  reason:"Exceeds auto-approval threshold. Human review required.", flags:["REQUIRES_HUMAN_SIGNOFF"] },
    { verdict:"APPROVED", action:"Send notification",    amount:0,     domain:"sendgrid.com",     reason:"Policy compliant. Domain whitelisted.", flags:[] },
    { verdict:"BLOCKED",  action:"Access adult content", amount:0,     domain:"casino.gambling",  reason:"Domain blocked by policy.", flags:["BLOCKED_DOMAIN","POLICY_VIOLATION"] },
  ];

  const VCOL = { APPROVED:"#00d68f", ESCALATE:"#c9a84c", BLOCKED:"#ff4d6a" };

  useEffect(() => {
    if (!inView || startedRef.current) return;
    startedRef.current = true;
    setAudits([]);
    DEMO.forEach((item, i) => {
      setTimeout(() => {
        setAudits(prev => [{ ...item, time: new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"}), isNew: true }, ...prev]);
      }, i * 1800);
    });
    setTimeout(() => { startedRef.current = false; }, 14000);
  }, [inView]);

  return (
    <section ref={ref} style={{ padding:"80px 48px", background:"#030508", borderTop:"1px solid rgba(201,168,76,0.08)" }}>
      <div style={{ maxWidth:900, margin:"0 auto" }}>
        <Reveal>
          <div style={{ fontSize:10, color:"#c9a84c", letterSpacing:4, fontFamily:"'JetBrains Mono',monospace", marginBottom:16 }}>LIVE MONITORING</div>
          <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(32px,4vw,56px)", fontWeight:300, lineHeight:1.2, marginBottom:16 }}>
            Watch your agent decide.<br/>
            <span style={{ fontStyle:"italic", color:"#c9a84c" }}>In real time.</span>
          </h2>
          <p style={{ fontSize:15, color:"#6b7a9a", maxWidth:540, lineHeight:1.8, marginBottom:48, fontWeight:300 }}>
            Every action your agent takes shows up live on your dashboard. Click any decision to see exactly why it was approved, escalated, or blocked.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <div style={{ background:"#07090f", border:"1px solid rgba(201,168,76,0.15)", borderRadius:10, overflow:"hidden" }}>
            {/* Header */}
            <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(201,168,76,0.1)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#04060c" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#00d68f", boxShadow:"0 0 6px #00d68f", animation:"pulse 2s infinite" }}/>
                <span style={{ fontSize:10, color:"#00d68f", fontFamily:"'JetBrains Mono',monospace", letterSpacing:2 }}>LIVE FEED</span>
              </div>
              <div style={{ display:"flex", gap:16 }}>
                {[["APPROVED","#00d68f"],["ESCALATE","#c9a84c"],["BLOCKED","#ff4d6a"]].map(([v,c])=>(
                  <span key={v} style={{ fontSize:9, color:c, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>
                    {audits.filter(a=>a.verdict===v).length} {v}
                  </span>
                ))}
              </div>
            </div>

            {/* Feed */}
            <div style={{ padding:"16px 20px", minHeight:300, display:"flex", flexDirection:"column", gap:8 }}>
              {audits.length === 0 ? (
                <div style={{ textAlign:"center", padding:"60px 0", color:"#3d5070", fontSize:11, fontFamily:"'JetBrains Mono',monospace" }}>
                  Monitoring Prometheus — Procurement Specialist…
                </div>
              ) : audits.map((audit, idx) => {
                const col = VCOL[audit.verdict];
                const isOpen = expandedIdx === idx;
                return (
                  <div key={idx} style={{ animation:"fadeIn 0.4s ease" }}>
                    <div onClick={()=>setExpandedIdx(isOpen?null:idx)}
                      style={{ background:isOpen?`${col}08`:"#0d1220", border:`1px solid ${isOpen?col+"44":"#151f30"}`, borderRadius:isOpen?"6px 6px 0 0":"6px", padding:"12px 16px", cursor:"pointer", transition:"border-color 0.15s" }}
                      onMouseEnter={e=>{ if(!isOpen) e.currentTarget.style.borderColor=col+"44"; }}
                      onMouseLeave={e=>{ if(!isOpen) e.currentTarget.style.borderColor="#151f30"; }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:9, fontWeight:700, color:col, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>{audit.verdict}</span>
                          <span style={{ fontSize:12, color:"#dde4f0" }}>
                            {audit.action}
                            {audit.amount>0 && <span style={{ color:"#7a90b8" }}> · ${audit.amount.toLocaleString()}</span>}
                          </span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:10, color:"#3d5070", fontFamily:"'JetBrains Mono',monospace" }}>{audit.time}</span>
                          <span style={{ fontSize:10, color:"#3d5070", transition:"transform 0.15s", transform:isOpen?"rotate(180deg)":"none" }}>▾</span>
                        </div>
                      </div>
                      <div style={{ fontSize:11, color:audit.verdict==="BLOCKED"?"#ff4d6a":audit.verdict==="ESCALATE"?"#c9a84c":"#3d5070", fontFamily:"'JetBrains Mono',monospace" }}>
                        {audit.verdict==="BLOCKED"?"⊘ ":audit.verdict==="ESCALATE"?"⚠ ":""}{audit.reason}
                      </div>
                    </div>

                    {isOpen && (
                      <div style={{ background:"#04060c", border:`1px solid ${col}44`, borderTop:"none", borderRadius:"0 0 6px 6px", padding:"16px 18px", animation:"fadeUp 0.2s ease" }}>
                        <div style={{ fontSize:9, color:col, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:12 }}>DECISION DETAILS</div>

                        <div style={{ fontSize:12, color:"#dde4f0", lineHeight:1.7, marginBottom:12 }}>{audit.reason}</div>

                        {audit.flags.length > 0 && (
                          <div style={{ marginBottom:12 }}>
                            <div style={{ fontSize:9, color:"#3d5070", fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:6 }}>FLAGS TRIGGERED</div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                              {audit.flags.map((f,i)=>(
                                <span key={i} style={{ fontSize:9, padding:"2px 8px", borderRadius:3, background:"#ff4d6a11", border:"1px solid #ff4d6a33", color:"#ff4d6a", fontFamily:"'JetBrains Mono',monospace" }}>{f}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:8 }}>
                          {[
                            ["ACTION", audit.action],
                            audit.amount>0 && ["AMOUNT", `$${audit.amount.toLocaleString()}`],
                            ["DOMAIN", audit.domain],
                          ].filter(Boolean).map(([l,v])=>(
                            <div key={l} style={{ background:"#080c14", borderRadius:4, padding:"8px 10px" }}>
                              <div style={{ fontSize:8, color:"#3d5070", fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, marginBottom:3 }}>{l}</div>
                              <div style={{ fontSize:11, color:"#dde4f0", fontFamily:"'JetBrains Mono',monospace", wordBreak:"break-all" }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding:"12px 20px", borderTop:"1px solid rgba(201,168,76,0.08)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:10, color:"#3d5070", fontFamily:"'JetBrains Mono',monospace" }}>Prometheus · Procurement Specialist · AGT-IEL8CMEM</span>
              <button onClick={()=>window.goToSignup()} style={{ background:"#c9a84c", border:"none", borderRadius:4, color:"#05080f", padding:"6px 14px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>
                MONITOR YOUR AGENT →
              </button>
            </div>
          </div>
        </Reveal>
      </div>

      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }`}</style>
    </section>
  );
}

export default function Landing() {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const copy = (text, setter) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div style={{ background: "#05080f", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>
    
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #05080f; }
        ::-webkit-scrollbar-thumb { background: #c9a84c44; border-radius: 2px; }
        a { color: inherit; text-decoration: none; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes glow { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "18px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(5,8,15,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: "#c9a84c", letterSpacing: 4, fontWeight: 600 }}>AIVIL</div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <span onClick={() => window.goToDocs()} style={{ fontSize: 12, color: "#6b7a9a", letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}
            onMouseEnter={e => e.target.style.color = "#c9a84c"} onMouseLeave={e => e.target.style.color = "#6b7a9a"}>Docs</span>
          <span onClick={() => window.goToPricing()} style={{ fontSize: 12, color: "#6b7a9a", letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}
            onMouseEnter={e => e.target.style.color = "#c9a84c"} onMouseLeave={e => e.target.style.color = "#6b7a9a"}>Pricing</span>
          <a href="https://github.com/scalatest01/AIVIL" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#6b7a9a", letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace" }}
            onMouseEnter={e => e.target.style.color = "#c9a84c"} onMouseLeave={e => e.target.style.color = "#6b7a9a"}>GitHub</a>
          <a href="https://npmjs.com/package/aivil" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#6b7a9a", letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace" }}
            onMouseEnter={e => e.target.style.color = "#c9a84c"} onMouseLeave={e => e.target.style.color = "#6b7a9a"}>npm</a>
          <button onClick={() => window.goToApp()} style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.3)", color: "#c9a84c", padding: "7px 16px", borderRadius: 4, fontSize: 11, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", cursor: "pointer" }}>
            SIGN IN
          </button>
          <button onClick={() => window.goToSignup()} style={{ background: "#c9a84c", color: "#05080f", padding: "8px 20px", borderRadius: 4, fontSize: 11, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", fontWeight: 500, border: "none", cursor: "pointer" }}>
            GET API KEY →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 48px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(201,168,76,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 20, padding: "6px 16px", marginBottom: 40, animation: "float 4s ease infinite" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00d68f", animation: "glow 2s infinite" }} />
          <span style={{ fontSize: 11, color: "#c9a84c", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>v1.0 · LIVE · OPEN SOURCE</span>
        </div>

        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(48px,8vw,96px)", fontWeight: 300, textAlign: "center", lineHeight: 1.1, letterSpacing: -1, marginBottom: 24, maxWidth: 900 }}>
          Your AI agent is running.<br />
          <span style={{ fontStyle: "italic", color: "#c9a84c" }}>Do you know what it's doing?</span>
        </h1>

        <p style={{ fontSize: 18, color: "#6b7a9a", textAlign: "center", maxWidth: 580, lineHeight: 1.8, marginBottom: 24, fontWeight: 300 }}>
          Uncontrolled AI agents burn money in runaway loops, leak data through unchecked calls, and act without oversight. AIVIL stops this in 3 lines of code.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#ff4d6a", fontSize: 12 }}>✕</span>
            <span style={{ fontSize: 12, color: "#3d5070", fontFamily: "'JetBrains Mono',monospace" }}>Agent loops overnight → unexpected bill</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#ff4d6a", fontSize: 12 }}>✕</span>
            <span style={{ fontSize: 12, color: "#3d5070", fontFamily: "'JetBrains Mono',monospace" }}>No audit trail → zero legal protection</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#ff4d6a", fontSize: 12 }}>✕</span>
            <span style={{ fontSize: 12, color: "#3d5070", fontFamily: "'JetBrains Mono',monospace" }}>Agent acts unilaterally → data leak</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginBottom: 80, marginTop: 32 }}>
          <button onClick={() => window.goToSignup()} style={{ background: "#c9a84c", color: "#05080f", padding: "14px 32px", borderRadius: 4, fontSize: 13, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, border: "none", cursor: "pointer" }}>
            TRY FREE — NO CREDIT CARD →
          </button>
          <button onClick={() => {
  sessionStorage.setItem("aivil_demo", "true");
  window.goToApp && window.goToApp();
}} style={{ background:"transparent", border:"1px solid rgba(201,168,76,0.4)", color:"#c9a84c", padding:"14px 32px", borderRadius:4, fontSize:13, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer", fontWeight:500 }}>
  ▶ LIVE DEMO
</button>
        </div>

        <LiveTerminal />
      </section>

      {/* TICKER */}
      <div style={{ borderTop: "1px solid rgba(201,168,76,0.1)", borderBottom: "1px solid rgba(201,168,76,0.1)", padding: "12px 0", overflow: "hidden", background: "rgba(201,168,76,0.03)" }}>
        <div style={{ display: "flex", gap: 64, animation: "marquee 20s linear infinite", whiteSpace: "nowrap", width: "max-content" }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 40 }}>
              <span style={{ fontSize: 10, color: "#c9a84c", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 3 }}>✦ VERIFIED IDENTITY</span>
              <span style={{ fontSize: 10, color: "#3a4a6a", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>OPEN SOURCE FOREVER</span>
              <span style={{ fontSize: 10, color: "#c9a84c", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 3 }}>✦ BUILT FOR HUMANITY</span>
              <span style={{ fontSize: 10, color: "#3a4a6a", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2 }}>npm install aivil</span>
            </div>
          ))}
        </div>
      </div>

      {/* THE PROBLEM */}
      <section style={{ padding: "120px 48px", maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <div style={{ fontSize: 10, color: "#c9a84c", letterSpacing: 4, fontFamily: "'JetBrains Mono',monospace", marginBottom: 16 }}>THE PROBLEM</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(36px,5vw,64px)", fontWeight: 300, lineHeight: 1.2, marginBottom: 20, maxWidth: 700 }}>
            Millions of agents.<br />
            <span style={{ fontStyle: "italic", color: "#c9a84c" }}>Zero accountability.</span>
          </h2>
          <p style={{ fontSize: 16, color: "#6b7a9a", maxWidth: 560, lineHeight: 1.8, marginBottom: 64, fontWeight: 300 }}>
            AI agents are making decisions, spending money, and affecting lives right now. But nobody knows who they are, what they have done, or who is responsible when they go wrong.
          </p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 2 }}>
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1}>
              <div style={{ background: "#080c14", border: "1px solid #0d1525", padding: "32px", height: "100%" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#0d1525"}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 40, color: "#c9a84c22", marginBottom: 16, fontWeight: 300 }}>{p.icon}</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: "#e2e8f0", marginBottom: 10 }}>{p.title}</div>
                <div style={{ fontSize: 14, color: "#4a5a7a", lineHeight: 1.7, fontWeight: 300 }}>{p.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* THE SOLUTION */}
      <section style={{ padding: "120px 48px", maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <div style={{ fontSize: 10, color: "#c9a84c", letterSpacing: 4, fontFamily: "'JetBrains Mono',monospace", marginBottom: 16 }}>THE SOLUTION</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(36px,5vw,64px)", fontWeight: 300, lineHeight: 1.2, marginBottom: 20 }}>
            A complete life record<br />
            <span style={{ fontStyle: "italic", color: "#c9a84c" }}>for every agent.</span>
          </h2>
          <p style={{ fontSize: 16, color: "#6b7a9a", maxWidth: 560, lineHeight: 1.8, marginBottom: 64, fontWeight: 300 }}>
            From the moment an agent is born to the day it retires — AIVIL records everything. Identity, actions, spending, trust. Permanent. Immutable. Verifiable by anyone.
          </p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.label} delay={i * 0.08}>
              <div style={{ background: "#080c14", border: "1px solid #0d1525", borderRadius: 8, padding: "28px", display: "flex", gap: 16, transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)"; e.currentTarget.style.background = "#0a1020"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#0d1525"; e.currentTarget.style.background = "#080c14"; }}>
                <span style={{ fontSize: 22, color: "#c9a84c", flexShrink: 0, marginTop: 2 }}>{f.icon}</span>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: "#e2e8f0", marginBottom: 6 }}>{f.label}</div>
                  <div style={{ fontSize: 13, color: "#4a5a7a", lineHeight: 1.7, fontWeight: 300 }}>{f.desc}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CODE */}
      <section style={{ padding: "80px 48px", background: "#030508" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Reveal>
            <div style={{ fontSize: 10, color: "#c9a84c", letterSpacing: 4, fontFamily: "'JetBrains Mono',monospace", marginBottom: 16 }}>GET STARTED</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(32px,4vw,56px)", fontWeight: 300, marginBottom: 40 }}>
              Three lines of code.<br />
              <span style={{ fontStyle: "italic", color: "#c9a84c" }}>Your agent is identified.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <div style={{ background: "#080c14", border: "1px solid #1a2540", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #1a2540", background: "#0a0e18" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff4d6a22", border: "1px solid #ff4d6a44" }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#c9a84c22", border: "1px solid #c9a84c44" }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00d68f22", border: "1px solid #00d68f44" }} />
                </div>
                <span style={{ fontSize: 11, color: "#3a4a6a", fontFamily: "'JetBrains Mono',monospace" }}>agent.js</span>
                <button onClick={() => copy(CODE, setCodeCopied)} style={{ background: "transparent", border: "none", color: codeCopied ? "#00d68f" : "#3a4a6a", fontSize: 11, cursor: "pointer", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>
                  {codeCopied ? "✓ COPIED" : "COPY"}
                </button>
              </div>
              <pre style={{ padding: "28px", fontSize: 13, lineHeight: 1.9, overflowX: "auto", fontFamily: "'JetBrains Mono',monospace", color: "#6b8aaa" }}>
                {CODE.split("\n").map((line, i) => {
                  const colored = line
                    .replace(/(const|await|require)/g, '<k>$1</k>')
                    .replace(/('[^']*'|"[^"]*")/g, '<s>$1</s>')
                    .replace(/(\/\/.*)/g, '<c>$1</c>');
                  return <div key={i} dangerouslySetInnerHTML={{ __html: colored.replace(/<k>/g, '<span style="color:#c792ea">').replace(/<\/k>/g, '</span>').replace(/<s>/g, '<span style="color:#c3e88d">').replace(/<\/s>/g, '</span>').replace(/<c>/g, '<span style="color:#3a5a4a">').replace(/<\/c>/g, '</span>') }} />;
                })}
              </pre>
            </div>
          </Reveal>
        </div>
      </section>
      
      {/* LIVE BOARD DEMO */}
      <LiveBoardDemo />

      {/* VERIFY ANY AGENT */}
      <section style={{ padding: "80px 48px", textAlign: "center", borderTop: "1px solid rgba(201,168,76,0.08)", background: "rgba(201,168,76,0.02)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <Reveal>
            <div style={{ fontSize: 11, color: "#c9a84c", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 4, marginBottom: 16 }}>VERIFY ANY AGENT</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 42, color: "#e2e8f0", fontWeight: 300, marginBottom: 12 }}>
              Check if an agent is real.
            </h2>
            <p style={{ fontSize: 15, color: "#6b7a9a", marginBottom: 36, lineHeight: 1.8 }}>
              Enter any AIVIL agent ID to verify its identity, trust score, and authorization. No account needed.
            </p>
            <VerifySearch />
          </Reveal>
        </div>
      </section>

      {/* MISSION */}
      <section style={{ padding: "120px 48px", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Reveal>
            <div style={{ fontSize: 10, color: "#c9a84c", letterSpacing: 4, fontFamily: "'JetBrains Mono',monospace", marginBottom: 24 }}>THE MISSION</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(32px,5vw,64px)", fontWeight: 300, fontStyle: "italic", lineHeight: 1.3, marginBottom: 32, color: "#e2e8f0" }}>
              "Every intelligence deserves an identity. Every action deserves accountability."
            </h2>
            <p style={{ fontSize: 16, color: "#4a5a7a", lineHeight: 1.9, marginBottom: 48, fontWeight: 300 }}>
              We are building the civil registry for the second population on earth. Open source forever. Because the trust layer for AI should belong to everyone.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => window.goToSignup()} style={{ background: "#c9a84c", color: "#05080f", padding: "14px 36px", borderRadius: 4, fontSize: 12, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", fontWeight: 500, border: "none", cursor: "pointer" }}>
                GET API KEY →
              </button>
              <a href="https://github.com/scalatest01/AIVIL" target="_blank" rel="noreferrer" style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.3)", color: "#c9a84c", padding: "14px 36px", borderRadius: 4, fontSize: 12, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace" }}>
                STAR ON GITHUB
              </a>
              <a href="mailto:ihimanshu882@gmail.com" style={{ background: "transparent", border: "1px solid #1a2540", color: "#6b7a9a", padding: "14px 36px", borderRadius: 4, fontSize: 12, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace" }}>
                GET IN TOUCH
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* VULNERABILITY SCANNER */}
      <VulnerabilityScanner />

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #0d1525", padding: "40px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: "#c9a84c", letterSpacing: 3, marginBottom: 4 }}>AIVIL</div>
          <div style={{ fontSize: 11, color: "#2a3a5a", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>© 2026 · AGPL v3 License · Open source forever</div>
        </div>
        <div style={{ fontSize: 12, color: "#2a3a5a", fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, textAlign: "right" }}>
          Every agent. Verified. Accountable. Alive.
        </div>
      </footer>
    </div>
  );
}
