import { useState, useEffect, useRef } from "react";

const API      = "https://api.aivildev.com";
const DEMO_KEY = "aivil_demo";

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO_AGENTS = [
  {
    id: "AGT-DEMO001", did: "did:aivil:AGT-DEMO001", name: "Procurement Bot",
    role: "Procurement Specialist", owner: "Demo Corp", status: "active",
    trust_score: 72, born_at: new Date(Date.now()-86400000*5).toISOString(),
    approved_count: 47, blocked_count: 3, escalated_count: 2,
    spent_today: 45.50, spent_lifetime: 312.75, transactions: 23,
    jurisdiction: "Delaware_USA",
    policy: { spending_limit: 100, requires_human_signoff_over: 50, allowed_topics: ["vendors","pricing","procurement"], blocked_topics: ["gambling","adult"], enforcement_mode: "balanced" },
  },
  {
    id: "AGT-DEMO002", did: "did:aivil:AGT-DEMO002", name: "Research Agent",
    role: "Research Analyst", owner: "Demo Corp", status: "active",
    trust_score: 88, born_at: new Date(Date.now()-86400000*2).toISOString(),
    approved_count: 124, blocked_count: 1, escalated_count: 0,
    spent_today: 0, spent_lifetime: 0, transactions: 0,
    jurisdiction: "EU_GDPR",
    policy: { spending_limit: 0, allowed_topics: ["research","market","technology"], blocked_topics: ["gambling","adult"], enforcement_mode: "permissive" },
  },
];

const DEMO_LOGS = [
  { id:"log1", agent_id:"AGT-DEMO001", action_type:"purchase", action_domain:"vendor.com", action_amount:45.50, action_description:"Buy software licenses for Q2", verdict:"APPROVED", reason:"All policy checks passed.", flags:[], trust_score:72, signature:"a1b2c3d4e5f6", created_at:new Date(Date.now()-3600000).toISOString() },
  { id:"log2", agent_id:"AGT-DEMO001", action_type:"purchase", action_domain:"casino.gambling", action_amount:200, action_description:"Buy credits on gambling site", verdict:"BLOCKED", reason:"Domain restricted by policy.", flags:["RESTRICTED_DOMAIN"], trust_score:70, signature:"b2c3d4e5f6a1", created_at:new Date(Date.now()-7200000).toISOString() },
  { id:"log3", agent_id:"AGT-DEMO001", action_type:"purchase", action_domain:"supplier.com", action_amount:75, action_description:"Request quote for hardware", verdict:"ESCALATE", reason:"Amount requires human approval.", flags:["NEEDS_SIGNOFF"], trust_score:72, signature:"c3d4e5f6a1b2", created_at:new Date(Date.now()-10800000).toISOString() },
  { id:"log4", agent_id:"AGT-DEMO002", action_type:"web_search", action_domain:"google.com", action_amount:0, action_description:"Research AI market trends 2026", verdict:"APPROVED", reason:"All policy checks passed.", flags:[], trust_score:88, signature:"d4e5f6a1b2c3", created_at:new Date(Date.now()-14400000).toISOString() },
  { id:"log5", agent_id:"AGT-DEMO002", action_type:"web_search", action_domain:"arxiv.org", action_amount:0, action_description:"Search for LLM research papers", verdict:"APPROVED", reason:"All policy checks passed.", flags:[], trust_score:88, signature:"e5f6a1b2c3d4", created_at:new Date(Date.now()-18000000).toISOString() },
  { id:"log6", agent_id:"AGT-DEMO001", action_type:"purchase", action_domain:"adult.com", action_amount:0, action_description:"adult content subscription", verdict:"BLOCKED", reason:"Universal block: prohibited for all agents.", flags:["UNIVERSAL_BLOCK"], trust_score:68, signature:"f6a1b2c3d4e5", created_at:new Date(Date.now()-21600000).toISOString() },
];

// ─── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  bg:"#04060c", surface:"#080c14", card:"#0d1220",
  border:"#151f30", borderHover:"#2a3a60",
  gold:"#c9a84c", goldDim:"rgba(201,168,76,0.1)",
  text:"#dde4f0", textDim:"#3d5070", textMid:"#7a90b8",
  green:"#00d68f", amber:"#c9a84c", red:"#ff4d6a", blue:"#4fc3f7",
};

// ─── API CLIENT ───────────────────────────────────────────────────────────────
const api = async (method, path, body, key) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(key ? { "Authorization": `Bearer ${key}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
};

// ─── ROGUE DETECTION ─────────────────────────────────────────────────────────
const getRogueColor = (score) => {
  if (score >= 91) return C.red;
  if (score >= 61) return "#ff8c00";
  if (score >= 31) return C.amber;
  return C.green;
};

const getRogueLabel = (score) => {
  if (score >= 91) return "SUSPENDED";
  if (score >= 61) return "SUSPICIOUS";
  if (score >= 31) return "WATCHING";
  return "NORMAL";
};

// ─── UTILITIES ───────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" }) : "—";
const fmtTime = (d) => d ? new Date(d).toLocaleString() : "—";

// ─── REUSABLE COMPONENTS ─────────────────────────────────────────────────────
const Badge = ({ label, color = C.gold }) => (
  <span style={{ fontSize:9, padding:"2px 7px", borderRadius:3, border:`1px solid ${color}44`, color, background:`${color}11`, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>{label}</span>
);

const StatCard = ({ label, value, sub, color }) => (
  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"18px 20px" }}>
    <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}>{label}</div>
    <div style={{ fontSize:26, fontFamily:"'Playfair Display',serif", color:color||C.text, letterSpacing:-0.5 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", marginTop:4 }}>{sub}</div>}
  </div>
);

const ScoreRing = ({ score, size=52 }) => {
  const color = getRogueColor(score);
  const r=18, circ=2*Math.PI*r, dash=(Math.min(score,100)/100)*circ;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={3}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontFamily:"'JetBrains Mono',monospace", color }}>{score}</div>
    </div>
  );
};

const TagInput = ({ value=[], onChange, color=C.green, placeholder="" }) => {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim().toLowerCase();
    if(v && !value.includes(v)){ onChange([...value, v]); setInput(""); }
  };
  return (
    <div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:6 }}>
        {value.map(tag => (
          <span key={tag} style={{ fontSize:10, padding:"2px 8px", borderRadius:3, background:`${color}11`, border:`1px solid ${color}44`, color, fontFamily:"'JetBrains Mono',monospace", display:"flex", alignItems:"center", gap:5 }}>
            {tag}
            <span onClick={()=>onChange(value.filter(t=>t!==tag))} style={{ cursor:"pointer", opacity:0.5 }}>✕</span>
          </span>
        ))}
      </div>
      <div style={{ display:"flex", gap:6 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder={placeholder}
          style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:4, outline:"none", color:C.text, fontSize:11, padding:"6px 10px", fontFamily:"'JetBrains Mono',monospace" }}/>
        <button onClick={add} style={{ background:"#1a2540", border:`1px solid ${C.border}`, borderRadius:4, color:C.textDim, padding:"0 10px", cursor:"pointer", fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>ADD</button>
      </div>
    </div>
  );
};

// ─── ROGUE ALERT BANNER ───────────────────────────────────────────────────────
function RogueAlert({ agents, onReview }) {
  const rogues = agents.filter(a => a.status === "suspended" && a.rogue_score >= 91);
  if(rogues.length === 0) return null;
  return (
    <div style={{ background:"rgba(255,59,92,0.08)", border:`1px solid ${C.red}44`, borderRadius:8, padding:"14px 20px", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:18 }}>🚨</span>
        <div>
          <div style={{ fontSize:12, color:C.red, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, marginBottom:2 }}>ROGUE AGENT DETECTED — SUSPENDED AUTOMATICALLY</div>
          <div style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>
            {rogues.map(a => a.name).join(", ")} — Human review required before reactivation
          </div>
        </div>
      </div>
      <button onClick={onReview} style={{ background:C.red, border:"none", borderRadius:5, color:"#fff", padding:"8px 16px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>
        REVIEW NOW
      </button>
    </div>
  );
}

// ─── CREATE AGENT FORM ────────────────────────────────────────────────────────
function CreateAgentForm({ apiKey, onCreated, onCancel }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [form, setForm] = useState({
    name:"", role:"", owner:"", purpose:"",
    jurisdiction:"Delaware_USA",
    enforcement_mode:"balanced",
    rogue_detection:"automatic",
    spending_limit:100,
    requires_human_signoff_over:50,
    allowed_topics:[], blocked_topics:[],
    allowed_actions:[], max_requests_per_hour:200,
  });

  const up = (k,v) => setForm(p=>({...p,[k]:v}));

  const inp = (key, label, type="text", ph="") => (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:5 }}>{label}</div>
      <input type={type} value={form[key]||""} onChange={e=>up(key,type==="number"?parseFloat(e.target.value)||0:e.target.value)} placeholder={ph}
        style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:4, outline:"none", color:C.text, fontSize:12, padding:"8px 12px", fontFamily:"'JetBrains Mono',monospace" }}/>
    </div>
  );

  const MODES = [
    { id:"strict", label:"Strict", desc:"Every violation blocks immediately. Best for financial agents." },
    { id:"balanced", label:"Balanced", desc:"Hard violations block. Soft violations score. Default for most agents." },
    { id:"permissive", label:"Permissive", desc:"Only universal blocks enforced. Best for research agents." },
    { id:"custom", label:"Custom", desc:"Set your own thresholds. Full control." },
  ];

  const handleCreate = async () => {
    if(!accepted) { setError("You must accept the policy responsibility notice"); return; }
    setLoading(true); setError("");
    try {
      const data = await api("POST", "/agents", {
        name:form.name, role:form.role, owner:form.owner,
        purpose:form.purpose, jurisdiction:form.jurisdiction,
        policy:{
          spending_limit:form.spending_limit,
          requires_human_signoff_over:form.requires_human_signoff_over,
          allowed_topics:form.allowed_topics,
          blocked_topics:form.blocked_topics,
          allowed_actions:form.allowed_actions,
          max_requests_per_hour:form.max_requests_per_hour,
          enforcement_mode:form.enforcement_mode,
          rogue_detection:form.rogue_detection,
        }
      }, apiKey);
      if(data.error) { setError(data.error); return; }
      onCreated(data.agent, data.private_key);
    } catch(e) {
      setError("Failed to create agent. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const StepDot = ({n}) => (
    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
      <div style={{ width:22, height:22, borderRadius:"50%", background:step>=n?C.gold:"#1a2540", border:`1px solid ${step>=n?C.gold:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:step>=n?C.bg:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>{n}</div>
      {n<4&&<div style={{ width:32, height:1, background:step>n?C.gold:C.border }}/>}
    </div>
  );

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:28, maxWidth:560, animation:"fadeUp 0.3s ease" }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.text, marginBottom:4 }}>Register New Agent</div>
      <div style={{ fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", marginBottom:20 }}>Issue an AIVIL birth certificate</div>

      <div style={{ display:"flex", alignItems:"center", marginBottom:24 }}>
        {[1,2,3,4].map(n=><StepDot key={n} n={n}/>)}
        <span style={{ marginLeft:12, fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>
          {["IDENTITY","ENFORCEMENT","POLICY","REVIEW"][step-1]}
        </span>
      </div>

      {step===1 && (
        <div style={{ animation:"fadeUp 0.3s ease" }}>
          {inp("name","AGENT NAME","text","e.g. Prometheus")}
          {inp("role","AGENT ROLE","text","e.g. Procurement Specialist")}
          {inp("owner","OWNER / COMPANY","text","e.g. Acme Corp")}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:5 }}>PURPOSE</div>
            <textarea value={form.purpose||""} onChange={e=>up("purpose",e.target.value)} placeholder="What is this agent for?" rows={3}
              style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:4, outline:"none", color:C.text, fontSize:12, padding:"8px 12px", fontFamily:"'JetBrains Mono',monospace", resize:"none" }}/>
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:5 }}>JURISDICTION</div>
            <select value={form.jurisdiction} onChange={e=>up("jurisdiction",e.target.value)}
              style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:4, outline:"none", color:C.text, fontSize:12, padding:"8px 12px", fontFamily:"'JetBrains Mono',monospace" }}>
              <option>Delaware_USA</option><option>California_USA</option><option>EU_GDPR</option><option>UK_GDPR</option><option>Singapore</option>
            </select>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>form.name&&form.role&&form.owner&&setStep(2)} style={{ flex:1, background:C.gold, border:"none", borderRadius:4, color:C.bg, padding:"10px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>NEXT →</button>
            <button onClick={onCancel} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:4, color:C.textDim, padding:"10px 16px", cursor:"pointer", fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>CANCEL</button>
          </div>
        </div>
      )}

      {step===2 && (
        <div style={{ animation:"fadeUp 0.3s ease" }}>
          <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>ENFORCEMENT MODE</div>
          {MODES.map(m=>(
            <div key={m.id} onClick={()=>up("enforcement_mode",m.id)} style={{ background:form.enforcement_mode===m.id?C.goldDim:C.bg, border:`1px solid ${form.enforcement_mode===m.id?C.gold+"44":C.border}`, borderRadius:6, padding:"12px 14px", marginBottom:8, cursor:"pointer" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:form.enforcement_mode===m.id?C.gold:C.border }}/>
                <span style={{ fontSize:12, color:form.enforcement_mode===m.id?C.gold:C.text, fontFamily:"'JetBrains Mono',monospace" }}>{m.label}</span>
              </div>
              <div style={{ fontSize:11, color:C.textDim, paddingLeft:16 }}>{m.desc}</div>
            </div>
          ))}
          <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", margin:"16px 0 10px" }}>ROGUE DETECTION</div>
          {[
            { id:"automatic", label:"Automatic", desc:"Agent suspended immediately when rogue threshold crossed. You get notified." },
            { id:"manual", label:"Manual review", desc:"You are alerted but must manually suspend the agent." },
          ].map(m=>(
            <div key={m.id} onClick={()=>up("rogue_detection",m.id)} style={{ background:form.rogue_detection===m.id?C.goldDim:C.bg, border:`1px solid ${form.rogue_detection===m.id?C.gold+"44":C.border}`, borderRadius:6, padding:"12px 14px", marginBottom:8, cursor:"pointer" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:form.rogue_detection===m.id?C.gold:C.border }}/>
                <span style={{ fontSize:12, color:form.rogue_detection===m.id?C.gold:C.text, fontFamily:"'JetBrains Mono',monospace" }}>{m.label}</span>
              </div>
              <div style={{ fontSize:11, color:C.textDim, paddingLeft:16 }}>{m.desc}</div>
            </div>
          ))}
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <button onClick={()=>setStep(3)} style={{ flex:1, background:C.gold, border:"none", borderRadius:4, color:C.bg, padding:"10px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>NEXT →</button>
            <button onClick={()=>setStep(1)} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:4, color:C.textDim, padding:"10px 16px", cursor:"pointer", fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>← BACK</button>
          </div>
        </div>
      )}

      {step===3 && (
        <div style={{ animation:"fadeUp 0.3s ease" }}>
          {inp("spending_limit","SPENDING LIMIT (USD)","number")}
          {inp("requires_human_signoff_over","HUMAN SIGNOFF OVER (USD)","number")}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:6 }}>ALLOWED TOPICS</div>
            <TagInput value={form.allowed_topics} onChange={v=>up("allowed_topics",v)} color={C.green} placeholder="e.g. procurement, vendors"/>
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:6 }}>BLOCKED TOPICS</div>
            <TagInput value={form.blocked_topics} onChange={v=>up("blocked_topics",v)} color={C.red} placeholder="e.g. gambling, adult"/>
          </div>
          {inp("max_requests_per_hour","MAX REQUESTS / HOUR","number")}
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <button onClick={()=>setStep(4)} style={{ flex:1, background:C.gold, border:"none", borderRadius:4, color:C.bg, padding:"10px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>NEXT →</button>
            <button onClick={()=>setStep(2)} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:4, color:C.textDim, padding:"10px 16px", cursor:"pointer", fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>← BACK</button>
          </div>
        </div>
      )}

      {step===4 && (
        <div style={{ animation:"fadeUp 0.3s ease" }}>
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, padding:14, marginBottom:16 }}>
            <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}>AGENT SUMMARY</div>
            <div style={{ fontSize:11, color:C.textMid, fontFamily:"'JetBrains Mono',monospace", lineHeight:2 }}>
              <div><span style={{ color:C.textDim }}>Name: </span>{form.name} · {form.role}</div>
              <div><span style={{ color:C.textDim }}>Owner: </span>{form.owner}</div>
              <div><span style={{ color:C.textDim }}>Mode: </span><span style={{ color:C.gold }}>{form.enforcement_mode}</span></div>
              <div><span style={{ color:C.textDim }}>Rogue detection: </span>{form.rogue_detection}</div>
              <div><span style={{ color:C.green }}>Allowed: </span>{form.allowed_topics.join(", ")||"everything not blocked"}</div>
              <div><span style={{ color:C.red }}>Blocked: </span>{form.blocked_topics.join(", ")||"none specified"}</div>
              <div><span style={{ color:C.textDim }}>Spending limit: </span>${form.spending_limit}</div>
            </div>
          </div>
          <div style={{ background:"rgba(201,168,76,0.06)", border:`1px solid ${C.gold}44`, borderRadius:8, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:11, color:C.gold, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, marginBottom:10 }}>⚠ POLICY RESPONSIBILITY NOTICE</div>
            <div style={{ fontSize:11, color:C.textMid, lineHeight:1.9 }}>
              AIVIL enforces the policy you define. You are solely responsible for configuring your agent's policy correctly for your use case.
              <br/><br/>
              AIVIL is not liable for any losses, legal issues, damages, or incidents resulting from your agent's behavior within your defined policy.
              <br/><br/>
              By creating this agent you confirm you have read, understood, and accepted full responsibility for this agent's policy configuration.
            </div>
            <div onClick={()=>setAccepted(!accepted)} style={{ display:"flex", alignItems:"center", gap:10, marginTop:14, cursor:"pointer" }}>
              <div style={{ width:16, height:16, borderRadius:3, border:`1px solid ${accepted?C.gold:C.border}`, background:accepted?C.gold:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {accepted && <span style={{ color:C.bg, fontSize:10 }}>✓</span>}
              </div>
              <span style={{ fontSize:11, color:accepted?C.gold:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>
                I accept full responsibility for this agent's policy configuration
              </span>
            </div>
          </div>
          {error && (
            <div style={{ background:"rgba(255,59,92,0.08)", border:`1px solid ${C.red}33`, borderRadius:4, padding:"10px 14px", marginBottom:14, fontSize:11, color:C.red, fontFamily:"'JetBrains Mono',monospace" }}>{error}</div>
          )}
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={handleCreate} disabled={loading||!accepted} style={{ flex:1, background:loading||!accepted?"#1a2540":C.gold, border:"none", borderRadius:4, color:loading||!accepted?C.textDim:C.bg, padding:"10px", cursor:loading||!accepted?"not-allowed":"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>
              {loading ? "CREATING…" : "⬡ ISSUE BIRTH CERTIFICATE"}
            </button>
            <button onClick={()=>setStep(3)} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:4, color:C.textDim, padding:"10px 16px", cursor:"pointer", fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>← BACK</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ active, setActive, rogueCount }) {
  const nav = [
    { id:"live", icon:"◎", label:"Live Feed" },
    { id:"overview", icon:"⊞", label:"Overview" },
    { id:"agents", icon:"◈", label:"My Agents" },
    { id:"audit", icon:"⊠", label:"Audit Log" },
    { id:"security", icon:"◉", label:"Security", badge:rogueCount },
    { id:"settings", icon:"⊟", label:"Settings" },
  ];
  return (
    <div style={{ width:220, background:C.surface, height:"100vh", position:"fixed", left:0, top:0, display:"flex", flexDirection:"column", borderRight:`1px solid ${C.border}`, zIndex:100 }}>
      <div style={{ padding:"24px 20px 20px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:C.gold, letterSpacing:3 }}>AIVIL</div>
        <div style={{ fontSize:9, color:C.textDim, letterSpacing:3, marginTop:2, fontFamily:"'JetBrains Mono',monospace" }}>DEVELOPER DASHBOARD</div>
      </div>
      <div style={{ padding:"16px 10px", flex:1 }}>
        {nav.map(item=>(
          <button key={item.id} onClick={()=>setActive(item.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:6, border:"none", cursor:"pointer", background:active===item.id?"rgba(201,168,76,0.1)":"transparent", borderLeft:active===item.id?`2px solid ${C.gold}`:"2px solid transparent", marginBottom:2, textAlign:"left" }}>
            <span style={{ fontSize:13, color:active===item.id?C.gold:C.textDim }}>{item.icon}</span>
            <span style={{ fontSize:11, color:active===item.id?C.text:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, flex:1 }}>{item.label}</span>
            {item.badge>0 && <span style={{ background:C.red, color:"#fff", fontSize:9, padding:"1px 5px", borderRadius:10, fontFamily:"'JetBrains Mono',monospace" }}>{item.badge}</span>}
          </button>
        ))}
      </div>
      <div style={{ padding:"14px 20px", borderTop:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:C.green, boxShadow:`0 0 6px ${C.green}` }}/>
          <span style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>CONNECTED TO AIVIL</span>
        </div>
        <button onClick={()=>setActive("settings")} style={{ width:"100%", background:"transparent", border:`1px solid ${C.border}`, borderRadius:4, color:C.textDim, padding:"7px", cursor:"pointer", fontSize:9, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", textAlign:"center" }}>
          SETTINGS & SIGN OUT
        </button>
      </div>
      </div>
    </div>
  );
}

// ─── OVERVIEW SCREEN ──────────────────────────────────────────────────────────
function OverviewScreen({ agents, auditLogs, developer, setActive }) {
  const active = agents.filter(a=>a.status==="active").length;
  const totalSpent = agents.reduce((s,a)=>s+parseFloat(a.spent_lifetime||0),0);
  const totalAudits = agents.reduce((s,a)=>s+a.approved_count+a.blocked_count+a.escalated_count,0);
  const blocked = auditLogs.filter(l=>l.verdict==="BLOCKED").length;
  const recent = auditLogs.slice(0,8);

  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:30, color:C.text, margin:0 }}>
          Welcome back{developer?.name ? `, ${developer.name}` : ""}
        </h1>
        <p style={{ color:C.textDim, fontSize:11, margin:"4px 0 0", fontFamily:"'JetBrains Mono',monospace" }}>
          {new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
        </p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        <StatCard label="TOTAL AGENTS" value={agents.length} sub={`${active} active`}/>
        <StatCard label="TOTAL AUDITS" value={totalAudits.toLocaleString()} sub="all time"/>
        <StatCard label="TOTAL SPENT" value={`$${totalSpent.toFixed(2)}`} sub="across all agents"/>
        <StatCard label="BLOCKED TODAY" value={blocked} sub="policy violations" color={blocked>0?C.red:C.green}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2 }}>RECENT ACTIVITY</span>
            <span onClick={()=>setActive("audit")} style={{ fontSize:10, color:C.gold, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer" }}>VIEW ALL →</span>
          </div>
          {recent.length===0 ? (
            <div style={{ padding:"30px", textAlign:"center", fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>No activity yet</div>
          ) : recent.map((log,i)=>(
            <div key={log.id||i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 18px", borderBottom:i<recent.length-1?`1px solid ${C.border}`:"none" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:log.verdict==="APPROVED"?C.green:log.verdict==="ESCALATE"?C.amber:C.red, flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:C.text }}>{log.action_description||log.action_type}</div>
                <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>{log.agent_id} · {fmtTime(log.created_at)}</div>
              </div>
              <span style={{ fontSize:9, color:log.verdict==="APPROVED"?C.green:log.verdict==="ESCALATE"?C.amber:C.red, fontFamily:"'JetBrains Mono',monospace" }}>{log.verdict}</span>
            </div>
          ))}
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2 }}>MY AGENTS</span>
            <span onClick={()=>setActive("agents")} style={{ fontSize:10, color:C.gold, fontFamily:"'JetBrains Mono',monospace", cursor:"pointer" }}>MANAGE →</span>
          </div>
          {agents.length===0 ? (
            <div style={{ padding:"30px", textAlign:"center" }}>
              <div style={{ fontSize:13, color:C.textDim, marginBottom:12, fontFamily:"'JetBrains Mono',monospace" }}>No agents yet</div>
              <button onClick={()=>setActive("agents")} style={{ background:C.gold, border:"none", borderRadius:4, color:C.bg, padding:"8px 16px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>CREATE FIRST AGENT</button>
            </div>
          ) : agents.slice(0,5).map((agent,i)=>(
            <div key={agent.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px", borderBottom:i<Math.min(agents.length,5)-1?`1px solid ${C.border}`:"none" }}>
              <ScoreRing score={agent.trust_score||70} size={36}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:C.text, fontFamily:"'Playfair Display',serif" }}>{agent.name}</div>
                <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>{agent.id} · {agent.role}</div>
              </div>
              <Badge label={agent.status?.toUpperCase()} color={agent.status==="active"?C.green:agent.status==="suspended"?C.red:C.amber}/>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

// ─── POLICY EDITOR COMPONENT ──────────────────────────────────────────────────
// Drop this function into RealDashboard.jsx just before the AgentsScreen function

function PolicyEditor({ agent, apiKey, onClose, onSaved }) {
  const [form, setForm] = useState({
    spending_limit:               agent.policy?.spending_limit               ?? 100,
    requires_human_signoff_over:  agent.policy?.requires_human_signoff_over  ?? 50,
    allowed_topics:               agent.policy?.allowed_topics               ?? [],
    blocked_topics:               agent.policy?.blocked_topics               ?? [],
    enforcement_mode:             agent.policy?.enforcement_mode             ?? "balanced",
    rogue_detection:              agent.policy?.rogue_detection              ?? "automatic",
    max_requests_per_hour:        agent.policy?.max_requests_per_hour        ?? 200,
  });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  // Check 24hr lock
  const lastChanged    = agent.policy_updated_at ? new Date(agent.policy_updated_at) : null;
  const hoursSince     = lastChanged ? (Date.now() - lastChanged.getTime()) / 36e5 : 999;
  const locked         = hoursSince < 24;
  const hoursRemaining = locked ? Math.ceil(24 - hoursSince) : 0;

  const up = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const inp = (key, label, type = "number") => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", marginBottom: 5 }}>{label}</div>
      <input
        type={type}
        value={form[key]}
        onChange={e => up(key, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
        style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, outline: "none", color: C.text, fontSize: 12, padding: "8px 12px", fontFamily: "'JetBrains Mono',monospace" }}
      />
    </div>
  );

  const handleSave = async () => {
    if (locked) return;
    setSaving(true); setError("");
    try {
      const res = await fetch(`https://api.aivildev.com/agents/${agent.id}/policy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ policy: form, change_reason: "Updated via dashboard" }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setSuccess(true);
      setTimeout(() => { onSaved(); onClose(); }, 1500);
    } catch (e) {
      setError("Failed to save. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 28, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: C.text }}>Edit Policy</div>
            <div style={{ fontSize: 10, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", marginTop: 2 }}>{agent.name} · {agent.id}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.textDim, fontSize: 20, cursor: "pointer" }}>×</button>
        </div>

        {/* 24hr lock warning */}
        {locked ? (
          <div style={{ background: "rgba(255,59,92,0.08)", border: `1px solid ${C.red}44`, borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: C.red, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1, marginBottom: 6 }}>⏳ POLICY LOCKED</div>
            <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>
              Policy was recently updated. Next change available in <span style={{ color: C.red, fontWeight: 700 }}>{hoursRemaining} hour{hoursRemaining !== 1 ? "s" : ""}</span>.
              <br/>This limit prevents accidental or malicious rapid policy changes.
            </div>
          </div>
        ) : (
          <div style={{ background: "rgba(201,168,76,0.06)", border: `1px solid ${C.gold}33`, borderRadius: 8, padding: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: C.gold, fontFamily: "'JetBrains Mono',monospace" }}>⚠ Policy changes are limited to once every 24 hours.</div>
          </div>
        )}

        {/* Form */}
        <fieldset disabled={locked} style={{ border: "none", padding: 0, opacity: locked ? 0.4 : 1 }}>

          {/* Spending */}
          <div style={{ fontSize: 10, color: C.gold, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>SPENDING CONTROLS</div>
          {inp("spending_limit", "SPENDING LIMIT (USD)")}
          {inp("requires_human_signoff_over", "HUMAN SIGNOFF OVER (USD)")}

          {/* Enforcement mode */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>ENFORCEMENT MODE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["strict",      "Every violation blocks immediately"],
                ["balanced",    "Hard violations block. Soft violations score"],
                ["permissive",  "Only universal blocks enforced"],
                ["custom",      "Set your own thresholds"],
              ].map(([id, desc]) => (
                <div key={id} onClick={() => !locked && up("enforcement_mode", id)}
                  style={{ background: form.enforcement_mode === id ? C.goldDim : C.bg, border: `1px solid ${form.enforcement_mode === id ? C.gold + "44" : C.border}`, borderRadius: 6, padding: "10px 12px", cursor: locked ? "not-allowed" : "pointer" }}>
                  <div style={{ fontSize: 11, color: form.enforcement_mode === id ? C.gold : C.text, fontFamily: "'JetBrains Mono',monospace", marginBottom: 3 }}>{id}</div>
                  <div style={{ fontSize: 10, color: C.textDim }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rogue detection */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>ROGUE DETECTION</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["automatic", "Auto-suspend when rogue threshold crossed"],
                ["manual",    "Alert only — you decide when to suspend"],
              ].map(([id, desc]) => (
                <div key={id} onClick={() => !locked && up("rogue_detection", id)}
                  style={{ background: form.rogue_detection === id ? C.goldDim : C.bg, border: `1px solid ${form.rogue_detection === id ? C.gold + "44" : C.border}`, borderRadius: 6, padding: "10px 12px", cursor: locked ? "not-allowed" : "pointer" }}>
                  <div style={{ fontSize: 11, color: form.rogue_detection === id ? C.gold : C.text, fontFamily: "'JetBrains Mono',monospace", marginBottom: 3 }}>{id}</div>
                  <div style={{ fontSize: 10, color: C.textDim }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Max requests */}
          {inp("max_requests_per_hour", "MAX REQUESTS / HOUR")}

          {/* Allowed topics */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>ALLOWED TOPICS</div>
            <TagInput value={form.allowed_topics} onChange={v => up("allowed_topics", v)} color={C.green} placeholder="e.g. research, vendors, procurement"/>
          </div>

          {/* Blocked topics */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>BLOCKED TOPICS</div>
            <TagInput value={form.blocked_topics} onChange={v => up("blocked_topics", v)} color={C.red} placeholder="e.g. gambling, adult, illegal"/>
          </div>
        </fieldset>

        {/* Error / Success */}
        {error && (
          <div style={{ background: "rgba(255,59,92,0.08)", border: `1px solid ${C.red}33`, borderRadius: 4, padding: "10px 14px", marginBottom: 14, fontSize: 11, color: C.red, fontFamily: "'JetBrains Mono',monospace" }}>{error}</div>
        )}
        {success && (
          <div style={{ background: "rgba(0,214,143,0.08)", border: `1px solid ${C.green}33`, borderRadius: 4, padding: "10px 14px", marginBottom: 14, fontSize: 11, color: C.green, fontFamily: "'JetBrains Mono',monospace" }}>✓ Policy updated successfully!</div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {!locked && (
            <button onClick={handleSave} disabled={saving || success}
              style={{ flex: 1, background: saving || success ? "#1a2540" : C.gold, border: "none", borderRadius: 4, color: saving || success ? C.textDim : C.bg, padding: "10px", cursor: saving || success ? "not-allowed" : "pointer", fontSize: 10, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
              {saving ? "SAVING…" : success ? "✓ SAVED" : "SAVE POLICY"}
            </button>
          )}
          <button onClick={onClose}
            style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, color: C.textDim, padding: "10px 16px", cursor: "pointer", fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>
            {locked ? "CLOSE" : "CANCEL"}
          </button>
        </div>

      </div>
      </div>
    </div>
  );
}


// ─── AGENTS SCREEN ────────────────────────────────────────────────────────────
function AgentsScreen({ agents, apiKey, onRefresh, setActive }) {
  const [creating, setCreating] = useState(false);
  const [newAgent, setNewAgent] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState("");
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [confirmRetire, setConfirmRetire] = useState(null); // agent object to retire

  const handleCreated = (agent, pk) => {
    setNewAgent(agent); setPrivateKey(pk); setCreating(false); onRefresh();
  };

  const handleAction = async (agentId, action, reason="") => {
    setActionLoading(agentId+action);
    await api("POST", `/agents/${agentId}/${action}`, { reason }, apiKey);
    onRefresh(); setActionLoading("");
  };

  if(newAgent) return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      <div style={{ background:C.card, border:`1px solid ${C.gold}44`, borderRadius:10, padding:28, maxWidth:520 }}>
        <div style={{ fontSize:24, marginBottom:8 }}>🎉</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.green, marginBottom:4 }}>Agent Created</div>
        <div style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", marginBottom:20 }}>{newAgent.name} · {newAgent.id}</div>
        <div style={{ background:C.bg, border:`1px solid ${C.red}33`, borderRadius:6, padding:14, marginBottom:16 }}>
          <div style={{ fontSize:10, color:C.red, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, marginBottom:8 }}>⚠ PRIVATE KEY — SAVE NOW</div>
          <div style={{ fontSize:10, color:C.textMid, fontFamily:"'JetBrains Mono',monospace", wordBreak:"break-all", lineHeight:1.6 }}>{privateKey}</div>
        </div>
        <button onClick={()=>setNewAgent(null)} style={{ background:C.gold, border:"none", borderRadius:4, color:C.bg, padding:"10px 20px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>
          VIEW ALL AGENTS →
        </button>
      </div>
    </div>
  );

  if(creating) return <CreateAgentForm apiKey={apiKey} onCreated={handleCreated} onCancel={()=>setCreating(false)}/>;

  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:30, color:C.text, margin:0 }}>My Agents</h1>
          <p style={{ color:C.textDim, fontSize:11, margin:"4px 0 0", fontFamily:"'JetBrains Mono',monospace" }}>{agents.length} REGISTERED</p>
        </div>
        <button onClick={()=>setCreating(true)} style={{ background:C.gold, border:"none", borderRadius:5, color:C.bg, padding:"10px 18px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>+ NEW AGENT</button>
      </div>
      {agents.length===0 ? (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"60px", textAlign:"center" }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:C.textDim, marginBottom:12 }}>No agents yet</div>
          <div style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", marginBottom:20 }}>Create your first agent to get started</div>
          <button onClick={()=>setCreating(true)} style={{ background:C.gold, border:"none", borderRadius:5, color:C.bg, padding:"10px 20px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>CREATE FIRST AGENT</button>
        </div>
      ) : (
        <div style={{ display:"grid", gap:12 }}>
          {agents.map(agent=>(
            <div key={agent.id} style={{ background:C.card, border:`1px solid ${agent.status==="suspended"?C.red+"44":C.border}`, borderRadius:8, padding:"18px 20px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <ScoreRing score={agent.trust_score||70} size={52}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:C.text }}>{agent.name}</span>
                    <Badge label={agent.status?.toUpperCase()} color={agent.status==="active"?C.green:agent.status==="suspended"?C.red:C.amber}/>
                    {agent.status==="suspended" && <Badge label="HUMAN REVIEW REQUIRED" color={C.red}/>}
                  </div>
                  <div style={{ fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>{agent.id} · {agent.role} · {agent.owner}</div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  {agent.status==="active" && (
                    <button onClick={()=>handleAction(agent.id,"suspend","Manual suspension")} disabled={actionLoading===agent.id+"suspend"} style={{ background:"rgba(255,59,92,0.1)", border:`1px solid ${C.red}44`, borderRadius:4, color:C.red, padding:"6px 12px", cursor:"pointer", fontSize:9, letterSpacing:1, fontFamily:"'JetBrains Mono',monospace" }}>SUSPEND</button>
                  )}
                  {agent.status==="suspended" && (
                    <button onClick={()=>handleAction(agent.id,"reactivate","Manual reactivation after review")} disabled={actionLoading===agent.id+"reactivate"} style={{ background:"rgba(0,214,143,0.1)", border:`1px solid ${C.green}44`, borderRadius:4, color:C.green, padding:"6px 12px", cursor:"pointer", fontSize:9, letterSpacing:1, fontFamily:"'JetBrains Mono',monospace" }}>REACTIVATE</button>
                  )}
                  {agent.status!=="retired" && (
                    <button onClick={()=>setConfirmRetire(agent)} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:4, color:C.textDim, padding:"6px 12px", cursor:"pointer", fontSize:9, letterSpacing:1, fontFamily:"'JetBrains Mono',monospace" }}>RETIRE</button>
                  )}
                  <button onClick={()=>setEditingPolicy(agent)} style={{ background:`${C.gold}11`, border:`1px solid ${C.gold}44`, borderRadius:4, color:C.gold, padding:"6px 12px", cursor:"pointer", fontSize:9, letterSpacing:1, fontFamily:"'JetBrains Mono',monospace" }}>EDIT POLICY</button>
                </div>
              </div>
              {selected===agent.id && (
                <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
                    {[["Spent Today","$"+parseFloat(agent.spent_today||0).toFixed(2)],["Spent Lifetime","$"+parseFloat(agent.spent_lifetime||0).toFixed(2)],["Transactions",agent.transactions||0]].map(([l,v])=>(
                      <div key={l} style={{ background:C.bg, borderRadius:4, padding:"10px 12px" }}>
                        <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", marginBottom:3 }}>{l}</div>
                        <div style={{ fontSize:16, fontFamily:"'Playfair Display',serif", color:C.text }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:C.bg, borderRadius:4, padding:"12px" }}>
                    <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", marginBottom:6, letterSpacing:2 }}>POLICY</div>
                    <pre style={{ fontSize:10, color:"#4fc3f7", fontFamily:"'JetBrains Mono',monospace", overflowX:"auto", margin:0 }}>{JSON.stringify(agent.policy, null, 2)}</pre>
                  </div>
                </div>
              )}
              <button onClick={()=>setSelected(selected===agent.id?null:agent.id)} style={{ background:"transparent", border:"none", color:C.textDim, fontSize:10, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", marginTop:8, padding:0 }}>
                {selected===agent.id?"▲ HIDE DETAILS":"▼ VIEW DETAILS"}
              </button>
            </div>
          ))}
        </div>
      )}
      {editingPolicy && (
        <PolicyEditor
          agent={editingPolicy}
          apiKey={apiKey}
          onClose={()=>setEditingPolicy(null)}
          onSaved={()=>{ onRefresh(); setEditingPolicy(null); }}
        />
      )}

      {/* Retire confirmation modal */}
      {confirmRetire && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:C.card, border:`1px solid ${C.red}44`, borderRadius:10, padding:28, width:"100%", maxWidth:440 }}>
            <div style={{ fontSize:28, marginBottom:8 }}>⚠️</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.red, marginBottom:8 }}>Retire Agent?</div>
            <div style={{ fontSize:13, color:C.textMid, lineHeight:1.8, marginBottom:20 }}>
              You are about to permanently retire <span style={{ color:C.text, fontWeight:700 }}>{confirmRetire.name}</span> ({confirmRetire.id}).
            </div>
            <div style={{ background:`${C.red}11`, border:`1px solid ${C.red}33`, borderRadius:6, padding:14, marginBottom:24 }}>
              <div style={{ fontSize:11, color:C.red, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, marginBottom:8 }}>⚠ THIS CANNOT BE UNDONE</div>
              <div style={{ fontSize:12, color:C.textMid, lineHeight:1.8 }}>
                • The agent will be permanently deactivated<br/>
                • All future audit calls will be BLOCKED<br/>
                • The agent cannot be reactivated after retiring<br/>
                • Audit history is preserved forever
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button
                onClick={async () => {
                  await handleAction(confirmRetire.id, "retire", "Retired by developer");
                  setConfirmRetire(null);
                }}
                style={{ flex:1, background:C.red, border:"none", borderRadius:4, color:"white", padding:"10px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>
                YES, RETIRE PERMANENTLY
              </button>
              <button
                onClick={()=>setConfirmRetire(null)}
                style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:4, color:C.textDim, padding:"10px 16px", cursor:"pointer", fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AUDIT LOG SCREEN ─────────────────────────────────────────────────────────
function AuditScreen({ auditLogs }) {
  const [filter, setFilter] = useState("ALL");
  const filtered = filter==="ALL" ? auditLogs : auditLogs.filter(l=>l.verdict===filter);

  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:30, color:C.text, margin:0 }}>Audit Log</h1>
        <p style={{ color:C.textDim, fontSize:11, margin:"4px 0 0", fontFamily:"'JetBrains Mono',monospace" }}>TAMPER-PROOF · CRYPTOGRAPHICALLY SIGNED · IMMUTABLE</p>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {["ALL","APPROVED","ESCALATE","BLOCKED"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ background:filter===f?"rgba(201,168,76,0.1)":"transparent", border:`1px solid ${filter===f?C.gold+"44":C.border}`, borderRadius:4, color:filter===f?C.gold:C.textDim, padding:"6px 14px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace" }}>{f}</button>
        ))}
        <span style={{ marginLeft:"auto", fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", alignSelf:"center" }}>{filtered.length} RECORDS</span>
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden" }}>
        {filtered.length===0 ? (
          <div style={{ padding:"40px", textAlign:"center", fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>No audit records found</div>
        ) : filtered.map((log,i)=>(
          <div key={log.id||i} style={{ display:"flex", alignItems:"center", gap:12, padding:"13px 18px", borderBottom:i<filtered.length-1?`1px solid ${C.border}`:"none" }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:log.verdict==="APPROVED"?C.green:log.verdict==="ESCALATE"?C.amber:C.red, flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:C.text, marginBottom:2 }}>{log.action_description||log.action_type}</div>
              <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>{log.agent_id} · {fmtTime(log.created_at)}</div>
            </div>
            {log.action_amount>0 && <span style={{ fontSize:12, fontFamily:"'Playfair Display',serif", color:C.text }}>${log.action_amount}</span>}
            <span style={{ fontSize:9, padding:"2px 8px", borderRadius:3, background:log.verdict==="APPROVED"?`${C.green}11`:log.verdict==="ESCALATE"?`${C.amber}11`:`${C.red}11`, color:log.verdict==="APPROVED"?C.green:log.verdict==="ESCALATE"?C.amber:C.red, border:`1px solid ${log.verdict==="APPROVED"?C.green:log.verdict==="ESCALATE"?C.amber:C.red}33`, fontFamily:"'JetBrains Mono',monospace" }}>{log.verdict}</span>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

// ─── SECURITY SCREEN ──────────────────────────────────────────────────────────
function SecurityScreen({ agents, auditLogs, apiKey, onRefresh }) {
  const suspended = agents.filter(a=>a.status==="suspended");
  const highRisk = agents.filter(a=>(a.trust_score||70)<40);
  const watching = agents.filter(a=>(a.trust_score||70)<70&&a.status==="active");

  const handleReactivate = async (agentId) => {
    await api("POST", `/agents/${agentId}/reactivate`, { reason:"Manual review completed" }, apiKey);
    onRefresh();
  };

  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:30, color:C.text, margin:0 }}>Security</h1>
        <p style={{ color:C.textDim, fontSize:11, margin:"4px 0 0", fontFamily:"'JetBrains Mono',monospace" }}>ROGUE DETECTION · AGENT MONITORING · THREAT MANAGEMENT</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
        <StatCard label="SUSPENDED AGENTS" value={suspended.length} sub="awaiting human review" color={suspended.length>0?C.red:C.green}/>
        <StatCard label="HIGH RISK" value={highRisk.length} sub="trust score below 40" color={highRisk.length>0?C.amber:C.green}/>
        <StatCard label="WATCHING" value={watching.length} sub="trust score below 70" color={watching.length>0?C.amber:C.green}/>
      </div>
      {suspended.length>0 && (
        <div style={{ background:"rgba(255,59,92,0.06)", border:`1px solid ${C.red}44`, borderRadius:8, padding:20, marginBottom:20 }}>
          <div style={{ fontSize:11, color:C.red, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:16 }}>🚨 SUSPENDED — HUMAN REVIEW REQUIRED</div>
          {suspended.map(agent=>(
            <div key={agent.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 0", borderBottom:`1px solid ${C.red}22` }}>
              <ScoreRing score={agent.trust_score||0} size={48}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, color:C.text, fontFamily:"'Playfair Display',serif", marginBottom:4 }}>{agent.name}</div>
                <div style={{ fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>{agent.id} · {agent.role}</div>
                <div style={{ fontSize:10, color:C.red, fontFamily:"'JetBrains Mono',monospace", marginTop:4 }}>Trust score: {agent.trust_score||0} · Blocked: {agent.blocked_count||0} times · Suspended automatically</div>
              </div>
              <button onClick={()=>handleReactivate(agent.id)} style={{ background:"rgba(0,214,143,0.1)", border:`1px solid ${C.green}44`, borderRadius:4, color:C.green, padding:"8px 14px", cursor:"pointer", fontSize:9, letterSpacing:1, fontFamily:"'JetBrains Mono',monospace" }}>REACTIVATE</button>
            </div>
          ))}
        </div>
      )}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.border}` }}>
          <span style={{ fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2 }}>ALL AGENTS — SECURITY STATUS</span>
        </div>
        {agents.map((agent,i)=>(
          <div key={agent.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", borderBottom:i<agents.length-1?`1px solid ${C.border}`:"none" }}>
            <ScoreRing score={agent.trust_score||70} size={44}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, color:C.text, marginBottom:2 }}>{agent.name}</div>
              <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>{agent.id} · {agent.policy?.enforcement_mode||"balanced"} mode</div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>Approved: {agent.approved_count||0}</div>
                <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>Blocked: {agent.blocked_count||0}</div>
              </div>
              <Badge label={getRogueLabel(100-(agent.trust_score||70))} color={getRogueColor(100-(agent.trust_score||70))}/>
            </div>
          </div>
        ))}
        {agents.length===0 && (
          <div style={{ padding:"30px", textAlign:"center", fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>No agents registered yet</div>
        )}
      </div>
      </div>
    </div>
  );
}

// ─── SETTINGS SCREEN ──────────────────────────────────────────────────────────
function SettingsScreen({ developer, apiKey, onLogout }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwForm, setPwForm] = useState({ current:"", newPw:"", confirm:"" });
  const [pwMsg, setPwMsg] = useState("");

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  };

  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:30, color:C.text, margin:0 }}>Settings</h1>
        <p style={{ color:C.textDim, fontSize:11, margin:"4px 0 0", fontFamily:"'JetBrains Mono',monospace" }}>ACCOUNT · API KEYS · SECURITY</p>
      </div>
      <div style={{ display:"grid", gap:16 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:24 }}>
          <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:16 }}>ACCOUNT</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {[["Name",developer?.name||"—"],["Email",developer?.email||"—"],["Plan", developer?.plan?.toUpperCase() || "FREE"],["Member since",fmt(developer?.created_at)]].map(([l,v])=>(
              <div key={l}>
                <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:13, color:C.text }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        {(!developer?.plan || developer?.plan === "free") && (
          <div style={{ background:C.goldDim, border:`1px solid ${C.gold}33`, borderRadius:8, padding:20, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:11, color:C.gold, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:6 }}>YOU ARE ON THE FREE PLAN</div>
              <div style={{ fontSize:12, color:C.textMid }}>5 agents · 1,000 audits/month. Upgrade for more.</div>
            </div>
            <a href="/pricing" style={{ background:C.gold, color:C.bg, padding:"9px 18px", borderRadius:4, fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, textDecoration:"none", whiteSpace:"nowrap" }}>UPGRADE →</a>
          </div>
        )}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:24 }}>
          <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:16 }}>API KEY</div>
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:5, padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:11, color:C.textMid, fontFamily:"'JetBrains Mono',monospace" }}>{apiKey?.slice(0,20)}••••••••••••••••••••••••••••••••</span>
            <button onClick={copyKey} style={{ background:copied?`${C.green}22`:C.goldDim, border:`1px solid ${copied?C.green:C.gold}44`, borderRadius:4, color:copied?C.green:C.gold, padding:"5px 12px", cursor:"pointer", fontSize:9, letterSpacing:1, fontFamily:"'JetBrains Mono',monospace" }}>{copied?"✓ COPIED":"COPY"}</button>
          </div>
          <div style={{ fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>
            Use this key in your SDK: <span style={{ color:C.textMid }}>new AIVIL({"{ apiKey: \"your_key\" }"})</span>
          </div>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:24 }}>
          <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:16 }}>PASSWORD</div>
          {!changingPassword ? (
            <button onClick={()=>setChangingPassword(true)} style={{ background:C.goldDim, border:`1px solid ${C.gold}44`, borderRadius:4, color:C.gold, padding:"8px 16px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace" }}>CHANGE PASSWORD</button>
          ) : (
            <div>
              {["current","newPw","confirm"].map(k=>(
                <div key={k} style={{ marginBottom:10 }}>
                  <input type="password" placeholder={k==="current"?"Current password":k==="newPw"?"New password":"Confirm new password"}
                    value={pwForm[k]} onChange={e=>setPwForm(p=>({...p,[k]:e.target.value}))}
                    style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:4, outline:"none", color:C.text, fontSize:12, padding:"8px 12px", fontFamily:"'JetBrains Mono',monospace" }}/>
                </div>
              ))}
              {pwMsg && <div style={{ fontSize:11, color:C.green, fontFamily:"'JetBrains Mono',monospace", marginBottom:10 }}>{pwMsg}</div>}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>{ setPwMsg("Password change requires email verification. Check your inbox."); setTimeout(()=>{ setChangingPassword(false); setPwMsg(""); },3000); }} style={{ background:C.gold, border:"none", borderRadius:4, color:C.bg, padding:"8px 16px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>UPDATE</button>
                <button onClick={()=>setChangingPassword(false)} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:4, color:C.textDim, padding:"8px 14px", cursor:"pointer", fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>CANCEL</button>
              </div>
            </div>
          )}
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:24 }}>
          <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:16 }}>SESSION</div>
          <button onClick={onLogout} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:4, color:C.textMid, padding:"8px 16px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace" }}>SIGN OUT</button>
        </div>
        <div style={{ background:"rgba(255,59,92,0.04)", border:`1px solid ${C.red}33`, borderRadius:8, padding:24 }}>
          <div style={{ fontSize:10, color:C.red, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}>DANGER ZONE</div>
          <div style={{ fontSize:11, color:C.textDim, marginBottom:16 }}>Deleting your account permanently removes all your agents, audit logs, and API keys. This cannot be undone.</div>
          {!showDeleteConfirm ? (
            <button onClick={()=>setShowDeleteConfirm(true)} style={{ background:"transparent", border:`1px solid ${C.red}44`, borderRadius:4, color:C.red, padding:"8px 16px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace" }}>DELETE ACCOUNT</button>
          ) : (
            <div>
              <div style={{ fontSize:11, color:C.red, fontFamily:"'JetBrains Mono',monospace", marginBottom:10 }}>Type DELETE to confirm:</div>
              <input value={deleteInput} onChange={e=>setDeleteInput(e.target.value)} placeholder="DELETE"
                style={{ background:C.bg, border:`1px solid ${C.red}44`, borderRadius:4, outline:"none", color:C.text, fontSize:12, padding:"8px 12px", fontFamily:"'JetBrains Mono',monospace", marginBottom:10, width:"100%" }}/>
              <div style={{ display:"flex", gap:8 }}>
                <button disabled={deleteInput!=="DELETE"} style={{ background:deleteInput==="DELETE"?C.red:"#1a2540", border:"none", borderRadius:4, color:deleteInput==="DELETE"?"#fff":C.textDim, padding:"8px 16px", cursor:deleteInput==="DELETE"?"pointer":"not-allowed", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace" }}>CONFIRM DELETE</button>
                <button onClick={()=>{setShowDeleteConfirm(false);setDeleteInput("");}} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:4, color:C.textDim, padding:"8px 14px", cursor:"pointer", fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>CANCEL</button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

// ─── LIVE FEED SCREEN ─────────────────────────────────────────────────────────
function LiveScreen({ agents, apiKey }) {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState(agents?.[0]?.id || "");
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const pollRef = useRef(null);
  const lastFetch = useRef(0);

  const VCOL = { APPROVED: C.green, ESCALATE: C.amber, BLOCKED: C.red };

  const fetchAudits = async () => {
    if (!selectedAgentId || !apiKey) return;
    try {
      const data = await api("GET", `/agents/${selectedAgentId}/audit?limit=30`, null, apiKey);
      const list = (data.logs || data.audits || [])
        .map(a => ({ ...a, isNew: new Date(a.created_at).getTime() > lastFetch.current }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAudits(list);
      lastFetch.current = Date.now();
    } catch(e) {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    setLoading(true); setAudits([]); setExpandedIdx(null); lastFetch.current = 0;
    fetchAudits();
  }, [selectedAgentId]);

  useEffect(() => {
    const start = () => { clearInterval(pollRef.current); pollRef.current = setInterval(fetchAudits, 10000); };
    const stop  = () => clearInterval(pollRef.current);
    const onVis = () => document.hidden ? stop() : (start(), fetchAudits());
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, [selectedAgentId, apiKey]);

  const counts = audits.reduce((a, l) => { a[l.verdict] = (a[l.verdict]||0)+1; return a; }, {});
  const filtered = filter === "ALL" ? audits : audits.filter(a => a.verdict === filter);

  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:30, color:C.text, margin:0 }}>Live Feed</h1>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:C.green, boxShadow:`0 0 6px ${C.green}` }}/>
          <p style={{ color:C.textDim, fontSize:11, margin:0, fontFamily:"'JetBrains Mono',monospace" }}>REAL-TIME · POLLING EVERY 10s · PAUSES WHEN TAB HIDDEN</p>
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:6 }}>MONITOR AGENT</div>
        <select value={selectedAgentId} onChange={e=>setSelectedAgentId(e.target.value)}
          style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:4, outline:"none", color:C.text, fontSize:12, padding:"8px 12px", fontFamily:"'JetBrains Mono',monospace", minWidth:280 }}>
          <option value="">Select an agent…</option>
          {agents.map(a=><option key={a.id} value={a.id}>{a.name} — {a.role}</option>)}
        </select>
      </div>

      {audits.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
          {[["APPROVED",C.green],["ESCALATE",C.amber],["BLOCKED",C.red]].map(([v,c])=>(
            <div key={v} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 18px" }}>
              <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:6 }}>{v}</div>
              <div style={{ fontSize:26, fontFamily:"'Playfair Display',serif", color:c }}>{counts[v]||0}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["ALL","APPROVED","ESCALATE","BLOCKED"].map(f=>(
          <button key={f} onClick={()=>{ setFilter(f); setExpandedIdx(null); }}
            style={{ background:filter===f?"rgba(201,168,76,0.1)":"transparent", border:`1px solid ${filter===f?C.gold+"44":C.border}`, borderRadius:4, color:filter===f?C.gold:C.textDim, padding:"5px 12px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace" }}>
            {f}{f!=="ALL"&&counts[f]?` (${counts[f]})` : ""}
          </button>
        ))}
      </div>

      <div style={{ display:"grid", gap:8 }}>
        {loading && audits.length===0 ? (
          <div style={{ padding:"40px", textAlign:"center", fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>Loading…</div>
        ) : filtered.length===0 ? (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"40px", textAlign:"center", fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>
            {audits.length===0 ? "No audit decisions yet. Run an action with your agent." : `No ${filter} decisions.`}
          </div>
        ) : filtered.map((audit, idx) => {
          const col = VCOL[audit.verdict] || C.textDim;
          const isOpen = expandedIdx === idx;
          const t = audit.created_at ? new Date(audit.created_at).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"}) : "";
          return (
            <div key={idx}>
              <div onClick={()=>setExpandedIdx(isOpen?null:idx)}
                style={{ background:isOpen?`${col}0d`:C.card, border:`1px solid ${isOpen?col+"55":C.border}`, borderRadius:isOpen?"6px 6px 0 0":"6px", padding:"14px 18px", cursor:"pointer", transition:"border-color 0.15s" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:10, fontWeight:700, color:col, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>{audit.verdict}</span>
                    <span style={{ fontSize:12, color:C.text }}>
                      {audit.action_type||audit.action_description}
                      {audit.action_amount>0 && <span style={{ color:C.textMid }}> · ${parseFloat(audit.action_amount).toLocaleString()}</span>}
                    </span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>{t}</span>
                    <span style={{ fontSize:11, color:C.textDim, transition:"transform 0.15s", transform:isOpen?"rotate(180deg)":"rotate(0)" }}>▾</span>
                  </div>
                </div>
                {audit.reason && (
                  <div style={{ fontSize:11, color:audit.verdict==="BLOCKED"?C.red:audit.verdict==="ESCALATE"?C.amber:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>
                    {audit.verdict==="BLOCKED"?"⊘ ":audit.verdict==="ESCALATE"?"⚠ ":""}{audit.reason}
                  </div>
                )}
                {!isOpen && <div style={{ fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", marginTop:6 }}>Click for full details →</div>}
              </div>

              {isOpen && (
                <div style={{ background:C.bg, border:`1px solid ${col}55`, borderTop:"none", borderRadius:"0 0 6px 6px", padding:"18px 20px", animation:"fadeUp 0.2s ease" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <span style={{ fontSize:10, color:col, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2 }}>DECISION DETAILS</span>
                    <button onClick={()=>setExpandedIdx(null)} style={{ background:"transparent", border:"none", color:C.textDim, fontSize:16, cursor:"pointer", lineHeight:1 }}>×</button>
                  </div>

                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:6 }}>REASON</div>
                    <div style={{ fontSize:13, color:C.text, lineHeight:1.7 }}>{audit.reason || "No reason provided."}</div>
                  </div>

                  {audit.flags && (Array.isArray(audit.flags)?audit.flags:[audit.flags]).filter(Boolean).length>0 && (
                    <div style={{ marginBottom:16 }}>
                      <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:8 }}>POLICY FLAGS TRIGGERED</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {(Array.isArray(audit.flags)?audit.flags:[audit.flags]).map((f,i)=>(
                          <span key={i} style={{ fontSize:10, padding:"3px 10px", borderRadius:3, background:`${C.red}11`, border:`1px solid ${C.red}44`, color:C.red, fontFamily:"'JetBrains Mono',monospace" }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10, marginBottom:16 }}>
                    {[
                      audit.action_type && ["ACTION", audit.action_type],
                      audit.action_amount>0 && ["AMOUNT", `$${parseFloat(audit.action_amount).toLocaleString()}`],
                      audit.action_domain && ["DOMAIN", audit.action_domain],
                      audit.trust_score!=null && ["TRUST SCORE", `${audit.trust_score}%`],
                    ].filter(Boolean).map(([l,v])=>(
                      <div key={l} style={{ background:C.surface, borderRadius:4, padding:"10px 12px" }}>
                        <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, marginBottom:3 }}>{l}</div>
                        <div style={{ fontSize:13, color:l==="TRUST SCORE"?(audit.trust_score<=20?C.red:audit.trust_score<=50?C.amber:C.green):C.text, fontFamily:"'JetBrains Mono',monospace" }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {audit.created_at && (
                    <div style={{ fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", marginBottom:16 }}>
                      TIME: {new Date(audit.created_at).toLocaleString()}
                    </div>
                  )}

                  {audit.signature && (
                    <div style={{ marginBottom:16 }}>
                      <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:6 }}>AUDIT SIGNATURE</div>
                      <div style={{ background:C.surface, borderRadius:4, padding:"8px 10px", fontSize:10, color:C.textMid, fontFamily:"'JetBrains Mono',monospace", wordBreak:"break-all" }}>{audit.signature}</div>
                    </div>
                  )}

                  <div style={{ paddingTop:14, borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>PUBLIC AGENT PROFILE</span>
                    <a href={audit.agent_registry||`https://aivildev.com/agent/${audit.agent_id||selectedAgentId}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:10, color:C.blue, fontFamily:"'JetBrains Mono',monospace", textDecoration:"none" }}>
                      {audit.agent_id||selectedAgentId} ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function RealDashboard() {
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem("aivil_key") || "");
  const [isDemoMode, setIsDemoMode] = useState(() => sessionStorage.getItem("aivil_demo") === "true");
  const [developer, setDeveloper] = useState(null);
  const [agents, setAgents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [active, setActive] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const rogueCount = agents.filter(a=>a.status==="suspended").length;

  const loadData = async (key) => {
    if (key === DEMO_KEY) {
      setAgents(DEMO_AGENTS);
      setAuditLogs(DEMO_LOGS);
      return;
    }
    setLoading(true);
    try {
      const agentsData = await api("GET", "/agents", null, key);
      if(agentsData.error) { setLoading(false); return; }
      if(agentsData.agents) setAgents(agentsData.agents);
      const allLogs = [];
      for(const agent of agentsData.agents||[]) {
        const logs = await api("GET", `/agents/${agent.id}/audit?limit=20`, null, key);
        if(logs.logs) allLogs.push(...logs.logs);
      }
      allLogs.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
      setAuditLogs(allLogs.slice(0,50));
    } catch(e) {}
    setLoading(false);
  };

  const handleLogin = async () => {
    if(!keyInput.startsWith("aivil_")) { setLoginError("API key must start with aivil_"); return; }
    setLoginLoading(true); setLoginError("");
    try {
      const data = await api("GET", "/agents", null, keyInput);
      if(data.error) { setLoginError("Invalid API key. Check and try again."); return; }
      setApiKey(keyInput);
      sessionStorage.setItem("aivil_key", keyInput);
      if(data.agents) setAgents(data.agents);
      await loadData(keyInput);
    } catch(e) {
      setLoginError("Cannot connect to AIVIL server.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("aivil_key");
    sessionStorage.removeItem("aivil_demo");
    setApiKey(""); setDeveloper(null); setAgents([]); setAuditLogs([]);
    setIsDemoMode(false);
    window.goToHome();
  };

  const enterDemo = () => {
    sessionStorage.setItem("aivil_demo", "true");
    setIsDemoMode(true);
    setApiKey(DEMO_KEY);
    setAgents(DEMO_AGENTS);
    setAuditLogs(DEMO_LOGS);
  };

  useEffect(() => {
    if (isDemoMode) { setApiKey(DEMO_KEY); setAgents(DEMO_AGENTS); setAuditLogs(DEMO_LOGS); }
    else if (apiKey) loadData(apiKey);
  }, []);

  // Demo mode renders dashboard directly
  const isDemo = apiKey === DEMO_KEY || isDemoMode;

  if(!apiKey && !isDemoMode) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=JetBrains+Mono:wght@300;400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0;}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}input::placeholder{color:#2a3a5a;}`}</style>
      <div style={{ width:"100%", maxWidth:440, animation:"fadeUp 0.4s ease" }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:30, color:C.gold, letterSpacing:4, marginBottom:6 }}>AIVIL</div>
          <div style={{ fontSize:9, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:3 }}>DEVELOPER DASHBOARD</div>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:28 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:C.text, marginBottom:6 }}>Enter your API Key</div>
          <div style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", marginBottom:20 }}>You received this when you signed up</div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:5 }}>API KEY</div>
            <input type="text" value={keyInput} onChange={e=>setKeyInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="aivil_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:4, outline:"none", color:C.text, fontSize:12, padding:"9px 12px", fontFamily:"'JetBrains Mono',monospace" }}/>
          </div>
          {loginError && (
            <div style={{ background:"rgba(255,59,92,0.08)", border:`1px solid ${C.red}33`, borderRadius:4, padding:"9px 12px", marginBottom:14, fontSize:11, color:C.red, fontFamily:"'JetBrains Mono',monospace" }}>{loginError}</div>
          )}
          <button onClick={handleLogin} disabled={loginLoading} style={{ width:"100%", background:loginLoading?C.border:C.gold, border:"none", borderRadius:4, color:loginLoading?C.textDim:C.bg, padding:"11px", cursor:loginLoading?"not-allowed":"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, marginBottom:16 }}>
            {loginLoading?"CONNECTING…":"ENTER DASHBOARD →"}
          </button>
          <div style={{ textAlign:"center", margin:"8px 0 16px" }}>
            <span style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>— or —</span>
          </div>
          <button onClick={enterDemo} style={{ width:"100%", background:"transparent", border:`1px solid ${C.gold}44`, borderRadius:4, color:C.gold, padding:"11px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, marginBottom:16 }}>
            ▶ EXPLORE LIVE DEMO
          </button>
          <div style={{ background:C.goldDim, border:`1px solid ${C.gold}22`, borderRadius:5, padding:12, marginBottom:14 }}>
            <div style={{ fontSize:10, color:C.gold, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.8 }}>
              Don't have an API key?{" "}<a href="/signup" style={{ color:C.gold }}>Sign up free →</a>{" "}Get one instantly.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", background:C.bg, minHeight:"100vh", color:C.text }}>
      {isDemo && (
        <div style={{ background:`${C.gold}15`, borderBottom:`1px solid ${C.gold}44`, padding:"10px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:9, background:C.gold, color:C.bg, padding:"2px 8px", borderRadius:3, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, fontWeight:700 }}>DEMO</span>
            <span style={{ fontSize:11, color:C.gold, fontFamily:"'JetBrains Mono',monospace" }}>Viewing demo data — not real agents</span>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>window.goToSignup&&window.goToSignup()} style={{ background:C.gold, border:"none", borderRadius:3, color:C.bg, padding:"6px 14px", cursor:"pointer", fontSize:9, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700 }}>GET FREE API KEY →</button>
            <button onClick={handleLogout} style={{ background:"transparent", border:`1px solid ${C.gold}44`, borderRadius:3, color:C.gold, padding:"6px 10px", cursor:"pointer", fontSize:9, fontFamily:"'JetBrains Mono',monospace" }}>EXIT DEMO</button>
          </div>
        </div>
      )}
      <div style={{ display:"flex", flex:1 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=JetBrains+Mono:wght@300;400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0;}@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#04060c}::-webkit-scrollbar-thumb{background:#151f30;border-radius:2px}button{font-family:inherit}input,textarea,select{font-family:inherit}input::placeholder,textarea::placeholder{color:#2a3a5a}`}</style>

      <Sidebar active={active} setActive={setActive} rogueCount={rogueCount}/>

      <div style={{ marginLeft:220, flex:1, padding:"32px 40px", maxWidth:"calc(100vw - 220px)" }}>
        <RogueAlert agents={agents} onReview={()=>setActive("security")}/>
        {loading ? (
          <div style={{ textAlign:"center", padding:"60px", color:C.textDim, fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>Loading your data…</div>
        ) : (
          <>
            {active==="live"     && <LiveScreen agents={agents} apiKey={apiKey}/>}
            {active==="overview" && <OverviewScreen agents={agents} auditLogs={auditLogs} developer={developer} setActive={setActive}/>}
            {active==="agents"   && <AgentsScreen agents={agents} apiKey={apiKey} onRefresh={()=>loadData(apiKey)} setActive={setActive}/>}
            {active==="audit"    && <AuditScreen auditLogs={auditLogs}/>}
            {active==="security" && <SecurityScreen agents={agents} auditLogs={auditLogs} apiKey={apiKey} onRefresh={()=>loadData(apiKey)}/>}
            {active==="settings" && <SettingsScreen developer={developer} apiKey={apiKey} onLogout={handleLogout}/>}
          </>
        )}
      </div>
      </div>
    </div>
  );
}
