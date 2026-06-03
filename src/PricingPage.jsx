import { useState } from "react";

const C = {
  bg:"#04060c", surface:"#080c14", card:"#0d1220",
  border:"#151f30", borderHover:"#2a3a60",
  gold:"#c9a84c", goldDim:"rgba(201,168,76,0.08)",
  text:"#dde4f0", textDim:"#3d5070", textMid:"#7a90b8",
  green:"#00d68f", red:"#ff4d6a", blue:"#4fc3f7",
};

const FAQS = [
  {
    q: "Is AIVIL really free?",
    a: "Yes. AIVIL is completely free right now. You get 5 agents and 1,000 audits per month at no cost, no credit card required. We are in early access and focused on building the best product for developers."
  },
  {
    q: "What happens when I hit 1,000 audits?",
    a: "Your agents stay active but additional audits are paused until the next month resets. You will receive an email notification at 80% usage so you are never surprised."
  },
  {
    q: "Will it stay free forever?",
    a: "The free tier will always exist. When we introduce paid plans, existing free users will be grandfathered in. We will give plenty of notice before any changes."
  },
  {
    q: "Do you store my private keys?",
    a: "Never. Private keys are generated per agent and returned to you once. AIVIL only stores the public key. You are responsible for securing your private key."
  },
  {
    q: "What is coming next?",
    a: "Higher limits, team accounts, webhook notifications, audit history export, and enterprise compliance features. Join the waitlist to be first in line."
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleWaitlist = () => {
    if (email) setSubmitted(true);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #04060c; }
        ::-webkit-scrollbar-thumb { background: #151f30; border-radius: 2px; }
      `}</style>

      {/* NAV */}
      <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:"rgba(4,6,12,0.95)", backdropFilter:"blur(20px)", borderBottom:`1px solid ${C.border}`, padding:"14px 48px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <a href="/" style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:C.gold, letterSpacing:3, textDecoration:"none" }}>AIVIL</a>
        <div style={{ display:"flex", gap:24, alignItems:"center" }}>
          <a href="/docs" style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, textDecoration:"none" }}>Docs</a>
          <a href="https://github.com/scalatest01/AIVIL" target="_blank" rel="noreferrer" style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, textDecoration:"none" }}>GitHub</a>
          <a href="/app" style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, textDecoration:"none" }}>Dashboard</a>
          <a href="/signup" style={{ background:C.gold, color:C.bg, padding:"7px 16px", borderRadius:4, fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, textDecoration:"none" }}>GET STARTED →</a>
        </div>
      </div>

      <div style={{ paddingTop:100, paddingBottom:80 }}>

        {/* HERO */}
        <div style={{ textAlign:"center", padding:"0 20px 64px", animation:"fadeUp 0.5s ease" }}>
          <div style={{ fontSize:11, color:C.gold, fontFamily:"'JetBrains Mono',monospace", letterSpacing:4, marginBottom:16 }}>PRICING</div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:52, color:C.text, fontWeight:400, lineHeight:1.15, marginBottom:16 }}>
            Free while we build.<br/>
            <span style={{ fontStyle:"italic", color:C.gold }}>Simple forever.</span>
          </h1>
          <p style={{ fontSize:16, color:C.textMid, maxWidth:500, margin:"0 auto", lineHeight:1.8 }}>
            AIVIL is in early access. Everything is free right now while we build the best AI agent compliance platform on earth.
          </p>
        </div>

        {/* SINGLE PLAN CARD */}
        <div style={{ maxWidth:480, margin:"0 auto 80px", padding:"0 20px" }}>
          <div style={{ background:C.card, border:`1px solid ${C.gold}66`, borderRadius:16, padding:"40px 36px", position:"relative", animation:"fadeUp 0.4s ease", textAlign:"center" }}>

            <div style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)", background:C.gold, color:C.bg, fontSize:9, letterSpacing:3, padding:"5px 18px", borderRadius:20, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, whiteSpace:"nowrap" }}>
              EARLY ACCESS
            </div>

            <div style={{ fontSize:11, color:C.gold, fontFamily:"'JetBrains Mono',monospace", letterSpacing:3, marginBottom:12 }}>FREE</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:64, color:C.text, fontWeight:400, lineHeight:1, marginBottom:4 }}>$0</div>
            <div style={{ fontSize:12, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", marginBottom:32 }}>no credit card · no commitment</div>

            <div style={{ display:"grid", gap:8, marginBottom:32, textAlign:"left" }}>
              {[
                ["5 agents", "Create and manage up to 5 AI agents"],
                ["1,000 audits / month", "Policy checks, verdicts, and audit logs"],
                ["Real cryptographic identity", "EC P-256 keypairs, W3C DIDs, birth certificates"],
                ["Full policy engine", "Spending limits, domain rules, topic filters"],
                ["Live dashboard", "Real-time audit feed and agent monitoring"],
                ["MCP server", "Zero-code Claude integration"],
                ["API access", "Full REST API + npm SDK + Python SDK"],
                ["MIT license", "Use it anywhere, build anything on top"],
              ].map(([title, desc]) => (
                <div key={title} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:`1px solid ${C.border}33` }}>
                  <span style={{ color:C.green, fontSize:14, flexShrink:0, marginTop:1 }}>✓</span>
                  <div>
                    <div style={{ fontSize:13, color:C.text, marginBottom:2 }}>{title}</div>
                    <div style={{ fontSize:11, color:C.textDim }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <a href="/signup" style={{ display:"block", background:C.gold, color:C.bg, padding:"14px", borderRadius:6, fontSize:11, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, textDecoration:"none", cursor:"pointer" }}>
              GET STARTED FREE →
            </a>
            <div style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", marginTop:10 }}>
              Takes 2 minutes · No credit card
            </div>
          </div>
        </div>

        {/* COMING SOON */}
        <div style={{ maxWidth:700, margin:"0 auto 80px", padding:"0 40px" }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, color:C.text, fontWeight:400, textAlign:"center", marginBottom:8 }}>
            More coming soon
          </h2>
          <div style={{ width:40, height:2, background:C.gold, margin:"0 auto 32px", borderRadius:1 }}/>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[
              ["Higher limits", "50+ agents, 50,000+ audits for growing teams"],
              ["Team accounts", "Multiple developers on one organization"],
              ["Webhook notifications", "Real-time alerts to Slack, Discord, email"],
              ["Audit history export", "Download full audit logs as CSV or JSON"],
              ["Enterprise compliance", "SSO, SLA, dedicated support, SOC2 docs"],
              ["LangGraph + CrewAI adapters", "Native integration with major agent frameworks"],
            ].map(([title, desc]) => (
              <div key={title} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"16px 18px" }}>
                <div style={{ fontSize:12, color:C.gold, fontFamily:"'JetBrains Mono',monospace", marginBottom:4 }}>{title}</div>
                <div style={{ fontSize:11, color:C.textDim, lineHeight:1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WAITLIST */}
        <div style={{ maxWidth:520, margin:"0 auto 80px", padding:"0 20px" }}>
          <div style={{ background:C.goldDim, border:`1px solid ${C.gold}33`, borderRadius:12, padding:"36px 32px", textAlign:"center" }}>
            <div style={{ fontSize:11, color:C.gold, fontFamily:"'JetBrains Mono',monospace", letterSpacing:3, marginBottom:12 }}>PAID PLANS</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:C.text, fontWeight:400, marginBottom:10 }}>
              Join the waitlist
            </h2>
            <p style={{ fontSize:13, color:C.textMid, lineHeight:1.8, marginBottom:24 }}>
              When we launch paid plans, waitlist members get first access and a permanent discount. No spam. One email when it launches.
            </p>
            {!submitted ? (
              <div style={{ display:"flex", gap:8 }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleWaitlist()}
                  placeholder="your@email.com"
                  style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, borderRadius:4, outline:"none", color:C.text, fontSize:12, padding:"10px 14px", fontFamily:"'JetBrains Mono',monospace" }}
                />
                <button onClick={handleWaitlist} style={{ background:C.gold, border:"none", borderRadius:4, color:C.bg, padding:"10px 20px", cursor:"pointer", fontSize:10, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, whiteSpace:"nowrap" }}>
                  JOIN →
                </button>
              </div>
            ) : (
              <div style={{ background:`${C.green}11`, border:`1px solid ${C.green}33`, borderRadius:6, padding:"14px", fontSize:13, color:C.green, fontFamily:"'JetBrains Mono',monospace" }}>
                ✓ You are on the list. We will email you first.
              </div>
            )}
          </div>
        </div>

        {/* TRUST */}
        <div style={{ maxWidth:900, margin:"0 auto 80px", padding:"0 40px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
            {[
              ["🔒", "Secure by default", "Real EC P-256 cryptography. Private keys never stored. Every decision cryptographically signed."],
              ["⚡", "Up in 5 minutes", "npm install aivil and you are live. No infrastructure setup. No credit card."],
              ["🌍", "MIT license", "Full source on GitHub. Use it anywhere. Build anything on top. No vendor lock-in. Ever."],
            ].map(([icon, title, desc]) => (
              <div key={title} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"24px 20px", textAlign:"center" }}>
                <div style={{ fontSize:28, marginBottom:12 }}>{icon}</div>
                <div style={{ fontSize:14, color:C.text, marginBottom:8 }}>{title}</div>
                <div style={{ fontSize:12, color:C.textDim, lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth:700, margin:"0 auto 80px", padding:"0 40px" }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:36, color:C.text, fontWeight:400, textAlign:"center", marginBottom:8 }}>
            Frequently asked
          </h2>
          <div style={{ width:40, height:2, background:C.gold, margin:"0 auto 40px", borderRadius:1 }}/>

          {FAQS.map((faq, i) => (
            <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, marginBottom:8, overflow:"hidden" }}>
              <div onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{ padding:"18px 20px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:14, color:C.text }}>{faq.q}</span>
                <span style={{ fontSize:16, color:C.gold, fontFamily:"'JetBrains Mono',monospace", flexShrink:0 }}>
                  {openFaq===i?"−":"+"}
                </span>
              </div>
              {openFaq===i && (
                <div style={{ padding:"0 20px 18px", fontSize:13, color:C.textMid, lineHeight:1.8, borderTop:`1px solid ${C.border}` }}>
                  <div style={{ paddingTop:14 }}>{faq.a}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* BOTTOM CTA */}
        <div style={{ textAlign:"center", padding:"0 20px" }}>
          <div style={{ background:C.goldDim, border:`1px solid ${C.gold}33`, borderRadius:16, padding:"48px 40px", maxWidth:600, margin:"0 auto" }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:36, color:C.text, fontWeight:400, marginBottom:12 }}>
              Start building today.
            </h2>
            <p style={{ fontSize:14, color:C.textMid, marginBottom:28, lineHeight:1.8 }}>
              Free. No credit card. No commitment. Your first 5 agents and 1,000 audits are waiting.
            </p>
            <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
              <a href="/signup" style={{ background:C.gold, color:C.bg, padding:"13px 28px", borderRadius:5, fontSize:11, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, textDecoration:"none" }}>
                GET STARTED FREE →
              </a>
              <a href="/docs" style={{ background:"transparent", border:`1px solid ${C.border}`, color:C.textMid, padding:"13px 28px", borderRadius:5, fontSize:11, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", textDecoration:"none" }}>
                READ DOCS
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div style={{ borderTop:`1px solid ${C.border}`, padding:"24px 48px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:C.gold, letterSpacing:3 }}>AIVIL</div>
        <div style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>
          Questions? <a href="mailto:ihimanshu882@gmail.com" style={{ color:C.gold }}>ihimanshu882@gmail.com</a>
        </div>
      </div>
    </div>
  );
}
