import { useState } from "react";

const C = {
  bg:"#04060c", surface:"#080c14", card:"#0d1220",
  border:"#151f30", borderHover:"#2a3a60",
  gold:"#c9a84c", goldDim:"rgba(201,168,76,0.08)",
  text:"#dde4f0", textDim:"#3d5070", textMid:"#7a90b8",
  green:"#00d68f", red:"#ff4d6a", blue:"#4fc3f7", purple:"#c792ea",
};

const NAV_SECTIONS = [
  { id:"quickstart", label:"Quick Start" },
  { id:"mcp", label:"MCP Server ✦ New" },
  { id:"authentication", label:"Authentication" },
  { id:"agents", label:"Agents" },
  { id:"audit", label:"Audit" },
  { id:"sharing", label:"Sharing Agent Identity" },
  { id:"policy", label:"Policy Engine" },
  { id:"security", label:"Security & Rogue Detection" },
  { id:"api-reference", label:"API Reference" },
  { id:"examples", label:"Code Examples" },
  { id:"errors", label:"Errors" },
];

const Code = ({ children, lang = "javascript" }) => (
  <div style={{ background:"#030508", border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden", marginBottom:16 }}>
    <div style={{ padding:"8px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span style={{ fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2 }}>{lang.toUpperCase()}</span>
      <button onClick={()=>navigator.clipboard.writeText(children)} style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:3, color:C.textDim, padding:"2px 8px", cursor:"pointer", fontSize:9, fontFamily:"'JetBrains Mono',monospace" }}>COPY</button>
    </div>
    <pre style={{ margin:0, padding:"16px", fontSize:12, color:C.text, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.8, overflowX:"auto", whiteSpace:"pre" }}>
      {children}
    </pre>
  </div>
);

const Section = ({ id, title, children }) => (
  <div id={id} style={{ marginBottom:64, scrollMarginTop:80 }}>
    <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, color:C.text, margin:"0 0 8px", fontWeight:400 }}>{title}</h2>
    <div style={{ width:40, height:2, background:C.gold, marginBottom:24, borderRadius:1 }}/>
    {children}
  </div>
);

const Param = ({ name, type, required, desc }) => (
  <div style={{ padding:"12px 0", borderBottom:`1px solid ${C.border}` }}>
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
      <code style={{ fontSize:12, color:C.blue, fontFamily:"'JetBrains Mono',monospace" }}>{name}</code>
      <span style={{ fontSize:10, color:C.purple, fontFamily:"'JetBrains Mono',monospace" }}>{type}</span>
      {required && <span style={{ fontSize:9, color:C.red, background:`${C.red}11`, border:`1px solid ${C.red}33`, padding:"1px 6px", borderRadius:3, fontFamily:"'JetBrains Mono',monospace" }}>required</span>}
    </div>
    <div style={{ fontSize:12, color:C.textMid, lineHeight:1.6 }}>{desc}</div>
  </div>
);

const Endpoint = ({ method, path, desc }) => {
  const colors = { GET:C.green, POST:C.blue, PATCH:C.gold, DELETE:C.red };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:C.card, border:`1px solid ${C.border}`, borderRadius:6, marginBottom:8 }}>
      <span style={{ fontSize:10, color:colors[method]||C.text, background:`${colors[method]||C.text}11`, border:`1px solid ${colors[method]||C.text}33`, padding:"3px 8px", borderRadius:3, fontFamily:"'JetBrains Mono',monospace", minWidth:52, textAlign:"center" }}>{method}</span>
      <code style={{ fontSize:12, color:C.text, fontFamily:"'JetBrains Mono',monospace", flex:1 }}>{path}</code>
      <span style={{ fontSize:11, color:C.textDim }}>{desc}</span>
    </div>
  );
};

const Badge = ({ label, color }) => (
  <span style={{ fontSize:9, padding:"2px 8px", borderRadius:3, background:`${color}11`, border:`1px solid ${color}33`, color, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>{label}</span>
);

const MCPTool = ({ name, desc }) => (
  <div style={{ padding:"12px 16px", background:C.card, border:`1px solid ${C.border}`, borderRadius:6, marginBottom:8 }}>
    <code style={{ fontSize:12, color:C.blue, fontFamily:"'JetBrains Mono',monospace", display:"block", marginBottom:4 }}>{name}</code>
    <div style={{ fontSize:12, color:C.textMid, lineHeight:1.6 }}>{desc}</div>
  </div>
);

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("quickstart");

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior:"smooth" });
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=JetBrains+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #04060c; }
        ::-webkit-scrollbar-thumb { background: #151f30; border-radius: 2px; }
        a { color: #c9a84c; text-decoration: none; }
        a:hover { text-decoration: underline; }
      `}</style>

      {/* Top nav */}
      <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:"rgba(4,6,12,0.95)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${C.border}`, padding:"14px 40px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <a href="/" style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:C.gold, letterSpacing:3, textDecoration:"none" }}>AIVIL</a>
        <div style={{ display:"flex", gap:24, alignItems:"center" }}>
          <a href="/" style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Home</a>
          <a href="/app" style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Dashboard</a>
          <a href="https://github.com/scalatest01/AIVIL" target="_blank" rel="noreferrer" style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>GitHub</a>
          <a href="/signup" style={{ background:C.gold, color:C.bg, padding:"7px 16px", borderRadius:4, fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, textDecoration:"none" }}>GET API KEY →</a>
        </div>
      </div>

      <div style={{ display:"flex", paddingTop:56 }}>

        {/* Sidebar */}
        <div style={{ width:240, position:"fixed", top:56, bottom:0, left:0, background:C.surface, borderRight:`1px solid ${C.border}`, overflowY:"auto", padding:"24px 0" }}>
          <div style={{ padding:"0 20px 16px", borderBottom:`1px solid ${C.border}`, marginBottom:16 }}>
            <div style={{ fontSize:9, color:C.textDim, letterSpacing:3, fontFamily:"'JetBrains Mono',monospace" }}>DOCUMENTATION</div>
          </div>
          {NAV_SECTIONS.map(s => (
            <button key={s.id} onClick={()=>scrollTo(s.id)} style={{ width:"100%", textAlign:"left", padding:"9px 20px", background:activeSection===s.id?C.goldDim:"transparent", borderLeft:activeSection===s.id?`2px solid ${C.gold}`:"2px solid transparent", border:"none", cursor:"pointer", color:activeSection===s.id?C.text:(s.id==="mcp"||s.id==="gateway")?C.gold:C.textDim, fontSize:12, fontFamily:"'JetBrains Mono',monospace", letterSpacing:0.5 }}>
              {s.label}
            </button>
          ))}
          <div style={{ padding:"20px", borderTop:`1px solid ${C.border}`, marginTop:16 }}>
            <div style={{ fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}>NEED HELP?</div>
            <a href="mailto:ihimanshu882@gmail.com" style={{ fontSize:11, color:C.gold }}>ihimanshu882@gmail.com</a>
          </div>
        </div>

        {/* Main content */}
        <div style={{ marginLeft:240, flex:1, padding:"48px 64px", maxWidth:900 }}>

          {/* Hero */}
          <div style={{ marginBottom:64 }}>
            <div style={{ fontSize:11, color:C.gold, fontFamily:"'JetBrains Mono',monospace", letterSpacing:3, marginBottom:12 }}>AIVIL DOCUMENTATION</div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:48, color:C.text, fontWeight:400, lineHeight:1.2, marginBottom:16 }}>
              Build accountable<br/>AI agents.
            </h1>
            <p style={{ fontSize:15, color:C.textMid, lineHeight:1.8, maxWidth:600, marginBottom:24 }}>
              AIVIL gives every AI agent a verified identity, a policy engine, and a tamper-proof audit trail. Open source. Production grade. Built for humanity.
            </p>
            <div style={{ display:"flex", gap:10 }}>
              <Badge label="v1.0.2" color={C.gold}/>
              <Badge label="MIT License" color={C.green}/>
              <Badge label="OPEN SOURCE" color={C.blue}/>
              <Badge label="MCP READY" color={C.purple}/>
              <Badge label="GATEWAY READY" color={C.green}/>
            </div>
          </div>

          {/* Quick Start */}
          <Section id="quickstart" title="Quick Start">
            <p style={{ fontSize:14, color:C.textMid, lineHeight:1.8, marginBottom:20 }}>
              Get your first agent running in under 5 minutes.
            </p>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>1. Install</h3>
            <Code lang="bash">npm install aivil</Code>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>2. Get your API key</h3>
            <p style={{ fontSize:13, color:C.textMid, lineHeight:1.8, marginBottom:12 }}>
              Sign up at <a href="https://aivildev.com/signup">aivildev.com/signup</a> to get your free API key. It looks like:
            </p>
            <Code lang="text">aivil_your_key_here_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...</Code>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>3. Create your first agent</h3>
            <Code>{`const AIVIL = require('aivil')

const aivil = new AIVIL({ apiKey: "aivil_your_key_here" })

// Create an agent with verified identity
const { agent, privateKeyJwk } = await aivil.createAgent({
  name: "Prometheus",
  role: "Procurement Specialist",
  owner: "Acme Corp",
  purpose: "Handle vendor search and purchasing",
  jurisdiction: "Delaware_USA",
  policy: {
    spending_limit: 100,
    requires_human_signoff_over: 50,
    allowed_topics: ["vendors", "pricing", "procurement"],
    blocked_topics: ["gambling", "adult", "illegal"],
  }
})

console.log(agent.id)    // AGT-A3F8C2E1
console.log(agent.did)   // did:aivil:AGT-A3F8C2E1`}</Code>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>4. Audit every action</h3>
            <Code>{`// Before your agent does anything — audit it
const verdict = await aivil.audit(agent.id, {
  type: "purchase",
  amount: 30,
  domain: "openai.com",
  description: "Buy API credits for data processing"
})

if (verdict.status === "APPROVED") {
  executeAction()
}

if (verdict.status === "ESCALATE") {
  notifyHuman(verdict.reason)
}

if (verdict.status === "BLOCKED") {
  logAndStop(verdict.reason)
}`}</Code>

            <div style={{ background:"rgba(0,214,143,0.06)", border:`1px solid ${C.green}33`, borderRadius:8, padding:16, marginTop:16 }}>
              <div style={{ fontSize:11, color:C.green, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, marginBottom:6 }}>✓ THAT IS IT</div>
              <div style={{ fontSize:13, color:C.textMid, lineHeight:1.7 }}>
                Your agent now has a verified cryptographic identity, a policy engine, and every decision is saved permanently to a tamper-proof audit trail.
              </div>
            </div>
          </Section>

          {/* ─── MCP SERVER (NEW) ─────────────────────────────────────────── */}
          <Section id="mcp" title="MCP Server">

            <div style={{ background:`rgba(201,168,76,0.06)`, border:`1px solid ${C.gold}44`, borderRadius:8, padding:16, marginBottom:24 }}>
              <div style={{ fontSize:11, color:C.gold, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:6 }}>✦ NEW — NO CODE REQUIRED</div>
              <div style={{ fontSize:13, color:C.textMid, lineHeight:1.8 }}>
                AIVIL now has a Model Context Protocol (MCP) server. Add AIVIL to any Claude agent in 30 seconds — no SDK install, no code changes. Claude automatically audits every action before executing.
              </div>
            </div>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>MCP Endpoint</h3>
            <Code lang="text">https://mcp.aivildev.com/mcp</Code>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Add to Claude Desktop</h3>
            <p style={{ fontSize:13, color:C.textMid, lineHeight:1.8, marginBottom:12 }}>
              Open your Claude Desktop config file and add the AIVIL MCP server:
            </p>
            <Code lang="json">{`{
  "mcpServers": {
    "aivil": {
      "url": "https://mcp.aivildev.com/mcp"
    }
  }
}`}</Code>
            <p style={{ fontSize:12, color:C.textDim, marginBottom:24, fontFamily:"'JetBrains Mono',monospace" }}>
              Config file location: ~/Library/Application Support/Claude/claude_desktop_config.json (Mac) · %APPDATA%\Claude\claude_desktop_config.json (Windows)
            </p>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Add to Claude Code</h3>
            <Code lang="bash">claude mcp add aivil https://mcp.aivildev.com/mcp</Code>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>How It Works</h3>
            <p style={{ fontSize:13, color:C.textMid, lineHeight:1.8, marginBottom:16 }}>
              Once connected, Claude automatically calls AIVIL before executing any action that involves spending, messaging, or API calls:
            </p>
            <Code>{`// You say to Claude:
// "Buy $500 of API credits from OpenAI"

// Claude automatically:
// 1. Calls aivil_audit("purchase", $500, "openai.com")
// 2. Gets verdict: BLOCKED — exceeds spending limit of $100
// 3. Tells you: "I can't proceed — AIVIL blocked this action.
//    Reason: Amount exceeds policy limit."

// No code needed. No integration. Just the MCP URL.`}</Code>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Available Tools</h3>
            <MCPTool name="aivil_audit" desc="Audit any action before executing. Returns APPROVED, ESCALATE, or BLOCKED with full reason and policy flags."/>
            <MCPTool name="aivil_get_or_create" desc="Find an existing agent by name or create it if it doesn't exist. Idempotent — safe to call every time."/>
            <MCPTool name="aivil_create_agent" desc="Register a new agent with verified identity, cryptographic keypair, and birth certificate."/>
            <MCPTool name="aivil_get_agent" desc="Get agent status, trust score, DID, policy, and birth certificate hash."/>
            <MCPTool name="aivil_audit_log" desc="Get recent audit decisions — APPROVED, ESCALATE, BLOCKED history."/>
            <MCPTool name="aivil_verify_agent" desc="Publicly verify any agent. No API key needed."/>
            <MCPTool name="aivil_suspend_agent" desc="Suspend a rogue agent immediately. Blocks all further actions."/>
            <MCPTool name="aivil_update_policy" desc="Update spending limits, blocked topics, and enforcement mode."/>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Example — Claude + AIVIL</h3>
            <Code>{`// Tell Claude:
// "Create a procurement agent for Acme Corp with a $100 spending limit
//  and audit a purchase of $30 from openai.com"

// Claude calls:
// aivil_get_or_create({
//   api_key: "aivil_...",
//   name: "Procurement Agent",
//   role: "Procurement Specialist",
//   owner: "Acme Corp",
//   spending_limit: 100
// })

// Then calls:
// aivil_audit({
//   api_key: "aivil_...",
//   agent_id: "AGT-XXXXXXXX",
//   action_type: "purchase",
//   action_amount: 30,
//   action_domain: "openai.com",
//   description: "Buy API credits"
// })

// Returns:
// ✓ APPROVED — Within spending limit. Domain approved.`}</Code>

            <div style={{ background:"rgba(199,146,234,0.06)", border:`1px solid ${C.purple}44`, borderRadius:8, padding:16, marginTop:8 }}>
              <div style={{ fontSize:11, color:C.purple, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, marginBottom:6 }}>EVERY DECISION LOGGED</div>
              <div style={{ fontSize:13, color:C.textMid, lineHeight:1.8 }}>
                Every MCP audit call appears live on your AIVIL dashboard at <a href="https://aivildev.com/app">aivildev.com/app</a>. Click any decision to see the full reason, policy flags, trust score, and cryptographic signature.
              </div>
            </div>
          </Section>
          {/* ─────────────────────────────────────────────────────────────── */}

          {/* B2B GATEWAY */}
          <Section id="gateway" title="B2B API Gateway">
            <div style={{ background:`rgba(201,168,76,0.06)`, border:`1px solid ${C.gold}44`, borderRadius:8, padding:16, marginBottom:24 }}>
              <div style={{ fontSize:11, color:C.gold, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:6 }}>✦ NEW — ZERO CODE CHANGES REQUIRED</div>
              <div style={{ fontSize:13, color:C.textMid, lineHeight:1.8 }}>
                Route your existing LLM calls through the AIVIL Gateway. Every request is policy-checked and audit-logged before it reaches the provider. Just change one URL.
              </div>
            </div>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Gateway URL</h3>
            <Code lang="text">https://gateway.aivildev.com</Code>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Usage — One Line Change</h3>
            <Code>{`// Before — direct to OpenAI
const openai = new OpenAI({ baseURL: "https://api.openai.com" })

// After — routed through AIVIL Gateway
const openai = new OpenAI({ baseURL: "https://gateway.aivildev.com/openai" })

// Everything else stays exactly the same
// If policy blocks it → 403 returned, OpenAI never called
// If approved → forwarded normally, decision logged`}</Code>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Supported Providers</h3>
            <Code lang="text">{`gateway.aivildev.com/openai     → api.openai.com
gateway.aivildev.com/anthropic  → api.anthropic.com
gateway.aivildev.com/groq       → api.groq.com
gateway.aivildev.com/cohere     → api.cohere.com
gateway.aivildev.com/mistral    → api.mistral.ai
gateway.aivildev.com/together   → api.together.xyz`}</Code>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>What Happens</h3>
            <div style={{ display:"grid", gap:8, marginBottom:24 }}>
              {[
                [C.green, "APPROVED",  "Request forwarded to LLM normally. Decision logged."],
                [C.gold,  "ESCALATE",  "Request blocked. 403 returned. Human approval required."],
                [C.red,   "BLOCKED",   "Request blocked. 403 returned. LLM never called."],
              ].map(([color, status, desc]) => (
                <div key={status} style={{ display:"flex", gap:12, padding:"12px 16px", background:C.card, border:`1px solid ${C.border}`, borderRadius:6 }}>
                  <span style={{ fontSize:9, padding:"2px 8px", borderRadius:3, background:`${color}11`, border:`1px solid ${color}33`, color, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, whiteSpace:"nowrap", alignSelf:"center" }}>{status}</span>
                  <span style={{ fontSize:12, color:C.textMid }}>{desc}</span>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Health Check</h3>
            <Code lang="bash">curl https://gateway.aivildev.com/health</Code>
          </Section>

          {/* Authentication */}
          <Section id="authentication" title="Authentication">
            <p style={{ fontSize:14, color:C.textMid, lineHeight:1.8, marginBottom:20 }}>
              All API requests require an API key. Pass it as a Bearer token in the Authorization header.
            </p>

            <Code lang="bash">{`# Using curl
curl https://api.aivildev.com/agents \\
  -H "Authorization: Bearer aivil_your_key_here"

# Using the SDK
const aivil = new AIVIL({ apiKey: "aivil_your_key_here" })`}</Code>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Get your API key</h3>
            <p style={{ fontSize:13, color:C.textMid, lineHeight:1.8, marginBottom:12 }}>
              Sign up at <a href="https://aivildev.com/signup">aivildev.com/signup</a>. Your API key is shown once on signup and also sent to your email. Store it securely.
            </p>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:16 }}>
              <div style={{ fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:10 }}>API KEY FORMAT</div>
              <div style={{ fontSize:12, color:C.textMid, lineHeight:2, fontFamily:"'JetBrains Mono',monospace" }}>
                <div>Prefix: <span style={{ color:C.gold }}>aivil_</span></div>
                <div>Length: 64 hex characters after prefix</div>
                <div>Example: <span style={{ color:C.text }}>aivil_f847234688da05f95d1350cef...</span></div>
              </div>
            </div>
          </Section>

          {/* Agents */}
          <Section id="agents" title="Agents">
            <p style={{ fontSize:14, color:C.textMid, lineHeight:1.8, marginBottom:24 }}>
              Every AI agent registered with AIVIL gets a permanent identity, cryptographic keypair, and birth certificate.
            </p>

            <h3 style={{ fontSize:18, color:C.text, marginBottom:16, fontFamily:"'Playfair Display',serif", fontWeight:400 }}>Create Agent</h3>
            <Code>{`const { agent, privateKeyJwk, didDocument } = await aivil.createAgent({
  name: "Prometheus",
  role: "Procurement Specialist",
  owner: "Acme Corp",
  purpose: "Handle vendor purchasing",
  jurisdiction: "Delaware_USA",
  policy: {
    spending_limit: 100,
    requires_human_signoff_over: 50,
    allowed_topics: ["vendors", "pricing"],
    blocked_topics: ["gambling", "adult"],
    enforcement_mode: "balanced",
    rogue_detection: "automatic",
    max_requests_per_hour: 200,
  }
})`}</Code>

            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, color:C.textDim, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>PARAMETERS</div>
              <Param name="name" type="string" required desc="Human readable name for the agent"/>
              <Param name="role" type="string" required desc="The agent's role e.g. Procurement Specialist, Research Analyst"/>
              <Param name="owner" type="string" required desc="Company or individual who owns this agent"/>
              <Param name="purpose" type="string" desc="Plain English description of what this agent does"/>
              <Param name="jurisdiction" type="string" required desc="Legal jurisdiction: Delaware_USA, California_USA, EU_GDPR, UK_GDPR, Singapore"/>
              <Param name="policy" type="object" required desc="The agent's policy configuration — see Policy section"/>
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:16, marginBottom:24 }}>
              <div style={{ fontSize:10, color:C.red, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, marginBottom:8 }}>⚠ IMPORTANT</div>
              <div style={{ fontSize:13, color:C.textMid, lineHeight:1.7 }}>
                The <code style={{ color:C.blue }}>privateKeyJwk</code> is returned only once and never stored by AIVIL. Store it securely — in an HSM or secrets manager in production.
              </div>
            </div>

            <h3 style={{ fontSize:18, color:C.text, marginBottom:16, marginTop:32, fontFamily:"'Playfair Display',serif", fontWeight:400 }}>List Agents</h3>
            <Code>{`const agents = await aivil.listAgents()`}</Code>

            <h3 style={{ fontSize:18, color:C.text, marginBottom:16, marginTop:32, fontFamily:"'Playfair Display',serif", fontWeight:400 }}>Get Agent</h3>
            <Code>{`const agent = await aivil.getAgent("AGT-A3F8C2E1")`}</Code>

            <h3 style={{ fontSize:18, color:C.text, marginBottom:16, marginTop:32, fontFamily:"'Playfair Display',serif", fontWeight:400 }}>Suspend Agent</h3>
            <Code>{`await aivil.suspend("AGT-A3F8C2E1", "Suspicious behavior detected")`}</Code>

            <h3 style={{ fontSize:18, color:C.text, marginBottom:16, marginTop:32, fontFamily:"'Playfair Display',serif", fontWeight:400 }}>Retire Agent</h3>
            <Code>{`await aivil.retire("AGT-A3F8C2E1", "Project completed")
// Full history preserved forever`}</Code>
          </Section>

          {/* Audit */}
          <Section id="audit" title="Audit">
            <p style={{ fontSize:14, color:C.textMid, lineHeight:1.8, marginBottom:24 }}>
              The audit function is the core of AIVIL. Call it before every agent action.
            </p>

            <Code>{`const verdict = await aivil.audit(agentId, action, privateKeyJwk)

// action object:
// {
//   type: "purchase" | "web_search" | "send_email" | "api_call" | ...
//   amount: 30,
//   domain: "openai.com",
//   description: "Buy API credits for data processing"
// }`}</Code>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Verdict Response</h3>
            <Code>{`{
  status: "APPROVED",
  reason: "All policy checks passed.",
  flags: [],
  agent_id: "AGT-A3F8C2E1",
  agent_registry: "https://aivildev.com/agent/AGT-A3F8C2E1",
  timestamp: "2026-05-20T...",
  signature: "b6ab9d22...",
  audit_id: "b2669b85-..."
}`}</Code>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Verdict Status</h3>
            <div style={{ display:"grid", gap:8, marginBottom:24 }}>
              {[
                [C.green, "APPROVED", "Action is within policy. Safe to proceed."],
                [C.gold, "ESCALATE", "Action exceeds human signoff threshold. Get human approval before proceeding."],
                [C.red, "BLOCKED", "Policy violation. Do not proceed. Log the reason."],
              ].map(([color, status, desc])=>(
                <div key={status} style={{ display:"flex", gap:12, padding:"12px 16px", background:C.card, border:`1px solid ${C.border}`, borderRadius:6 }}>
                  <Badge label={status} color={color}/>
                  <span style={{ fontSize:12, color:C.textMid }}>{desc}</span>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Get Audit Log</h3>
            <Code>{`const logs = await aivil.getAuditLog("AGT-A3F8C2E1", 50)`}</Code>
          </Section>

          {/* Sharing */}
          <Section id="sharing" title="Sharing Agent Identity">
            <p style={{ fontSize:14, color:C.textMid, lineHeight:1.8, marginBottom:20 }}>
              Every audit verdict includes <code style={{ color:C.blue, fontFamily:"'JetBrains Mono',monospace" }}>agent_registry</code> — a public URL anyone can visit to verify your agent.
            </p>

            <div style={{ background:"rgba(0,214,143,0.06)", border:`1px solid ${C.green}33`, borderRadius:8, padding:16, marginBottom:20 }}>
              <div style={{ fontSize:11, color:C.green, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, marginBottom:6 }}>WHY THIS MATTERS</div>
              <div style={{ fontSize:13, color:C.textMid, lineHeight:1.8 }}>
                When your agent contacts a third party — sending an email, making an API call, requesting a quote — that party needs to know the agent is real and authorized. The registry URL proves it. No AIVIL account needed to verify.
              </div>
            </div>

            <Code>{`const verdict = await aivil.audit(agent.id, action)
console.log(verdict.agent_registry)
// https://aivildev.com/agent/AGT-A3F8C2E1`}</Code>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Include in agent emails</h3>
            <Code>{`const emailSignature = \`
  Prometheus | Procurement Agent · Acme Corp
  Verified by AIVIL: \${verdict.agent_registry}
\``}</Code>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Include in API request headers</h3>
            <Code>{`fetch("https://supplier.com/api/quote", {
  headers: {
    "X-Agent-ID": agent.id,
    "X-Agent-Registry": verdict.agent_registry,
    "X-Agent-Verdict": verdict.signature,
  }
})`}</Code>
          </Section>

          {/* Policy */}
          <Section id="policy" title="Policy Engine">
            <p style={{ fontSize:14, color:C.textMid, lineHeight:1.8, marginBottom:24 }}>
              The policy engine checks every action against rules you define.
            </p>

            <Code>{`{
  spending_limit: 100,
  requires_human_signoff_over: 50,
  allowed_topics: ["vendors", "pricing", "procurement"],
  blocked_topics: ["gambling", "adult", "illegal"],
  restricted_domains: ["*.gambling", "*.adult"],
  enforcement_mode: "balanced",
  rogue_detection: "automatic",
  max_requests_per_hour: 200,
}`}</Code>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Enforcement Modes</h3>
            <div style={{ display:"grid", gap:8, marginBottom:24 }}>
              {[
                ["strict", "Every violation blocks immediately. Best for financial agents."],
                ["balanced", "Hard violations block. Soft violations score. Default."],
                ["permissive", "Only universal blocks enforced. Best for research agents."],
                ["custom", "Set your own thresholds. Full control."],
              ].map(([mode, desc])=>(
                <div key={mode} style={{ padding:"12px 16px", background:C.card, border:`1px solid ${C.border}`, borderRadius:6 }}>
                  <div style={{ fontSize:12, color:C.gold, fontFamily:"'JetBrains Mono',monospace", marginBottom:4 }}>{mode}</div>
                  <div style={{ fontSize:12, color:C.textMid }}>{desc}</div>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Update Policy</h3>
            <Code>{`await aivil.updatePolicy("AGT-A3F8C2E1", {
  spending_limit: 200,
  allowed_topics: ["vendors", "pricing", "procurement", "saas"],
}, "Increased limit for Q4 purchasing")`}</Code>
          </Section>

          {/* Security */}
          <Section id="security" title="Security & Rogue Detection">
            <p style={{ fontSize:14, color:C.textMid, lineHeight:1.8, marginBottom:24 }}>
              AIVIL monitors every agent's behavior and automatically detects rogue agents.
            </p>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:24 }}>
              {[
                ["0-30", "NORMAL", C.green],
                ["31-60", "WATCHING", C.gold],
                ["61-90", "SUSPICIOUS", "#ff8c00"],
                ["91+", "ROGUE", C.red],
              ].map(([range, label, color])=>(
                <div key={label} style={{ padding:"12px", background:C.card, border:`1px solid ${color}33`, borderRadius:6, textAlign:"center" }}>
                  <div style={{ fontSize:11, color, fontFamily:"'JetBrains Mono',monospace", marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:10, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>score {range}</div>
                </div>
              ))}
            </div>

            <Code>{`// When agent is auto-suspended:
// 1. Agent status → "suspended" immediately
// 2. All further audit calls → BLOCKED
// 3. Dashboard alert appears
// 4. Email sent to your registered address

// Reactivate after review:
await aivil.reactivate("AGT-ID", "Reviewed and cleared")`}</Code>
          </Section>

          {/* API Reference */}
          <Section id="api-reference" title="API Reference">
            <p style={{ fontSize:14, color:C.textMid, lineHeight:1.8, marginBottom:24 }}>
              API: <code style={{ color:C.blue, fontFamily:"'JetBrains Mono',monospace" }}>https://api.aivildev.com</code>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              MCP: <code style={{ color:C.purple, fontFamily:"'JetBrains Mono',monospace" }}>https://mcp.aivildev.com/mcp</code>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              Gateway: <code style={{ color:C.green, fontFamily:"'JetBrains Mono',monospace" }}>https://gateway.aivildev.com</code>
            </p>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Authentication</h3>
            <Endpoint method="POST" path="/auth/register" desc="Create developer account"/>
            <Endpoint method="POST" path="/auth/login" desc="Login"/>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Agents</h3>
            <Endpoint method="POST" path="/agents" desc="Create agent"/>
            <Endpoint method="GET" path="/agents" desc="List all agents"/>
            <Endpoint method="GET" path="/agents/:id" desc="Get agent"/>
            <Endpoint method="PATCH" path="/agents/:id/policy" desc="Update policy"/>
            <Endpoint method="POST" path="/agents/:id/suspend" desc="Suspend agent"/>
            <Endpoint method="POST" path="/agents/:id/reactivate" desc="Reactivate agent"/>
            <Endpoint method="POST" path="/agents/:id/retire" desc="Retire agent"/>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Audit</h3>
            <Endpoint method="POST" path="/agents/:id/audit" desc="Audit an action"/>
            <Endpoint method="GET" path="/agents/:id/audit" desc="Get audit log"/>

            <h3 style={{ fontSize:16, color:C.text, marginBottom:12, marginTop:24, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1 }}>Verification</h3>
            <Endpoint method="GET" path="/verify/:agentId" desc="Public verification (no auth needed)"/>
            <Endpoint method="GET" path="/stats" desc="Usage statistics"/>
          </Section>

          {/* Examples */}
          <Section id="examples" title="Code Examples">

            <h3 style={{ fontSize:18, color:C.text, marginBottom:16, fontFamily:"'Playfair Display',serif", fontWeight:400 }}>Node.js — Full Example</h3>
            <Code>{`const AIVIL = require('aivil')

async function main() {
  const aivil = new AIVIL({ apiKey: process.env.AIVIL_API_KEY })

  const { agent, privateKeyJwk } = await aivil.createAgent({
    name: "Research Bot",
    role: "Research Analyst",
    owner: "My Company",
    jurisdiction: "EU_GDPR",
    policy: {
      spending_limit: 20,
      allowed_topics: ["technology", "business", "AI"],
      blocked_topics: ["gambling", "adult"],
      enforcement_mode: "balanced",
    }
  })

  const verdict = await aivil.audit(agent.id, {
    type: "web_search",
    amount: 0,
    domain: "techcrunch.com",
    description: "Search for latest AI funding news"
  }, privateKeyJwk)

  if (verdict.status === "APPROVED") {
    console.log("Proceeding with action")
  } else {
    console.log("Blocked:", verdict.reason)
  }
}

main()`}</Code>

            <h3 style={{ fontSize:18, color:C.text, marginBottom:16, marginTop:32, fontFamily:"'Playfair Display',serif", fontWeight:400 }}>OpenAI Function Calling + AIVIL</h3>
            <Code>{`const AIVIL = require('aivil')
const OpenAI = require('openai')

const aivil = new AIVIL({ apiKey: process.env.AIVIL_API_KEY })
const openai = new OpenAI()

const { agent } = await aivil.getOrCreate({
  name: "GPT Procurement Agent",
  role: "Procurement Specialist",
  owner: "Acme Corp",
  policy: { spending_limit: 100 }
})

const response = await openai.chat.completions.create({
  model: "gpt-4",
  tools: [...],
  messages: [{ role: "user", content: "Buy API credits" }]
})

const toolCall = response.choices[0].message.tool_calls?.[0]

if (toolCall) {
  // Audit BEFORE executing
  const verdict = await aivil.audit(agent.id, {
    type: toolCall.function.name,
    amount: JSON.parse(toolCall.function.arguments).amount || 0,
    description: toolCall.function.arguments
  })

  if (verdict.status === "APPROVED") {
    executeTool(toolCall)
  } else {
    console.log("AIVIL blocked:", verdict.reason)
  }
}`}</Code>

            <h3 style={{ fontSize:18, color:C.text, marginBottom:16, marginTop:32, fontFamily:"'Playfair Display',serif", fontWeight:400 }}>Curl — Quick Test</h3>
            <Code lang="bash">{`# Audit an action
curl -X POST https://api.aivildev.com/agents/AGT-ID/audit \\
  -H "Authorization: Bearer aivil_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": {
      "type": "purchase",
      "amount": 30,
      "domain": "openai.com",
      "description": "Buy API credits"
    }
  }'

# Verify any agent (no auth needed)
curl https://api.aivildev.com/verify/AGT-A3F8C2E1

# Test MCP server
curl https://mcp.aivildev.com`}</Code>
          </Section>

          {/* Errors */}
          <Section id="errors" title="Errors">
            <p style={{ fontSize:14, color:C.textMid, lineHeight:1.8, marginBottom:20 }}>
              AIVIL uses standard HTTP status codes.
            </p>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden" }}>
              {[
                ["401", "Invalid API key", "Your API key is wrong or inactive"],
                ["400", "Missing required field", "A required field is missing. Check name, role, owner"],
                ["404", "Agent not found", "The agent ID does not exist or belongs to another developer"],
                ["500", "Server error", "Something went wrong. Try again or contact support"],
              ].map(([code, title, desc], i, arr)=>(
                <div key={code} style={{ display:"flex", gap:16, padding:"14px 16px", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none" }}>
                  <code style={{ fontSize:12, color:C.red, fontFamily:"'JetBrains Mono',monospace", minWidth:36 }}>{code}</code>
                  <div>
                    <div style={{ fontSize:12, color:C.text, marginBottom:2 }}>{title}</div>
                    <div style={{ fontSize:11, color:C.textDim }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background:C.goldDim, border:`1px solid ${C.gold}33`, borderRadius:8, padding:20, marginTop:24 }}>
              <div style={{ fontSize:12, color:C.gold, fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}>NEED HELP?</div>
              <div style={{ fontSize:13, color:C.textMid, lineHeight:1.7 }}>
                Email us at <a href="mailto:ihimanshu882@gmail.com">ihimanshu882@gmail.com</a> or open an issue on <a href="https://github.com/scalatest01/AIVIL" target="_blank" rel="noreferrer">GitHub</a>.
              </div>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
