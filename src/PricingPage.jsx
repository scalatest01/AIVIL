import { useState } from "react";

const C = {
  bg:"#04060c", surface:"#080c14", card:"#0d1220",
  border:"#151f30", borderHover:"#2a3a60",
  gold:"#c9a84c", goldDim:"rgba(201,168,76,0.08)",
  text:"#dde4f0", textDim:"#3d5070", textMid:"#7a90b8",
  green:"#00d68f", red:"#ff4d6a", blue:"#4fc3f7",
};

// Stripe price IDs — replace with your real Stripe price IDs after creating products
const STRIPE_LINKS = {
  pro: "https://buy.stripe.com/fZucN5bH84an4ME5rNcMM01",
  enterprise: "https://buy.stripe.com/8x200j8uWayLa6YaM7cMM00",
};

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "forever",
    tagline: "Start building",
    color: C.textMid,
    features: [
      { text: "5 agents", included: true },
      { text: "1,000 audits / month", included: true },
      { text: "Real cryptographic identity", included: true },
      { text: "Policy engine", included: true },
      { text: "Dashboard access", included: true },
      { text: "Community support", included: true },
      { text: "Webhook notifications", included: false },
      { text: "Priority support", included: false },
      { text: "Custom policy templates", included: false },
      { text: "SLA guarantee", included: false },
    ],
    cta: "Get Started Free",
    ctaLink: "https://aivildev.com/signup",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    period: "month",
    tagline: "For serious builders",
    color: C.gold,
    features: [
      { text: "50 agents", included: true },
      { text: "50,000 audits / month", included: true },
      { text: "Real cryptographic identity", included: true },
      { text: "Policy engine", included: true },
      { text: "Dashboard access", included: true },
      { text: "Email support", included: true },
      { text: "Webhook notifications", included: true },
      { text: "Full audit history export", included: true },
      { text: "Custom policy templates", included: false },
      { text: "SLA guarantee", included: false },
    ],
    cta: "Start Pro",
    ctaLink: STRIPE_LINKS.pro,
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    period: "month",
    tagline: "For teams and companies",
    color: C.blue,
    features: [
      { text: "Unlimited agents", included: true },
      { text: "Unlimited audits", included: true },
      { text: "Real cryptographic identity", included: true },
      { text: "Policy engine", included: true },
      { text: "Dashboard access", included: true },
      { text: "Priority support", included: true },
      { text: "Webhook notifications", included: true },
      { text: "Full audit history export", included: true },
      { text: "Custom policy templates", included: true },
      { text: "SLA guarantee", included: true },
    ],
    cta: "Start Enterprise",
    ctaLink: STRIPE_LINKS.enterprise,
    highlight: false,
  },
];

const FAQS = [
  {
    q: "Can I change plans at any time?",
    a: "Yes. Upgrade or downgrade at any time. Changes take effect immediately. No lock-in contracts."
  },
  {
    q: "What happens if I exceed my audit limit?",
    a: "We will notify you when you reach 80% of your limit. Additional audits are paused until the next month or you upgrade. Your agents stay active."
  },
  {
    q: "Is the free plan really free forever?",
    a: "Yes. The free plan has no time limit. You can build and test AIVIL indefinitely. Upgrade when you need more agents or audits."
  },
  {
    q: "Do you store my private keys?",
    a: "Never. Private keys are generated client-side and returned to you once. AIVIL only stores the public key. You are responsible for securing your private key."
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit cards and debit cards via Stripe. Bank transfers available for Enterprise plans on request."
  },
  {
    q: "Can I get a refund?",
    a: "Yes. Contact us within 14 days of payment for a full refund. No questions asked."
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const getPrice = (price) => {
    if (price === 0) return 0;
    return annual ? Math.floor(price * 0.8) : price;
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
            Simple, honest pricing.
          </h1>
          <p style={{ fontSize:16, color:C.textMid, maxWidth:500, margin:"0 auto 32px", lineHeight:1.8 }}>
            Start free. Upgrade when you need more. No hidden fees. No lock-in. Cancel anytime.
          </p>

          {/* Annual toggle */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:12, background:C.card, border:`1px solid ${C.border}`, borderRadius:40, padding:"8px 20px" }}>
            <span style={{ fontSize:12, color:annual?C.textDim:C.text, fontFamily:"'JetBrains Mono',monospace" }}>Monthly</span>
            <div onClick={()=>setAnnual(!annual)} style={{ width:44, height:24, background:annual?C.gold:C.border, borderRadius:12, cursor:"pointer", position:"relative", transition:"background 0.2s" }}>
              <div style={{ width:18, height:18, background:"#fff", borderRadius:"50%", position:"absolute", top:3, left:annual?23:3, transition:"left 0.2s" }}/>
            </div>
            <span style={{ fontSize:12, color:annual?C.text:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>Annual</span>
            {annual && <span style={{ fontSize:10, color:C.green, background:`${C.green}11`, border:`1px solid ${C.green}33`, padding:"2px 8px", borderRadius:10, fontFamily:"'JetBrains Mono',monospace" }}>SAVE 20%</span>}
          </div>
        </div>

        {/* PRICING CARDS */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, maxWidth:1100, margin:"0 auto 80px", padding:"0 40px" }}>
          {PLANS.map((plan, i) => (
            <div key={plan.id} style={{ background:plan.highlight?`linear-gradient(135deg, #0d1220 0%, #111828 100%)`:C.card, border:`1px solid ${plan.highlight?C.gold+"66":C.border}`, borderRadius:12, padding:"32px 28px", position:"relative", animation:`fadeUp ${0.3 + i*0.1}s ease`, display:"flex", flexDirection:"column" }}>

              {plan.highlight && (
                <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:C.gold, color:C.bg, fontSize:9, letterSpacing:3, padding:"4px 16px", borderRadius:20, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, whiteSpace:"nowrap" }}>
                  MOST POPULAR
                </div>
              )}

              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:11, color:plan.color, fontFamily:"'JetBrains Mono',monospace", letterSpacing:3, marginBottom:8 }}>{plan.name.toUpperCase()}</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:4 }}>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:48, color:C.text, fontWeight:400 }}>
                    {plan.price === 0 ? "Free" : `$${getPrice(plan.price)}`}
                  </span>
                  {plan.price > 0 && <span style={{ fontSize:13, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>/ {plan.period}</span>}
                </div>
                {plan.price > 0 && annual && (
                  <div style={{ fontSize:11, color:C.green, fontFamily:"'JetBrains Mono',monospace" }}>
                    Save ${(plan.price - getPrice(plan.price)) * 12}/year
                  </div>
                )}
                <div style={{ fontSize:12, color:C.textDim, marginTop:4 }}>{plan.tagline}</div>
              </div>

              <div style={{ flex:1, marginBottom:28 }}>
                {plan.features.map((f, fi) => (
                  <div key={fi} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:fi<plan.features.length-1?`1px solid ${C.border}33`:"none" }}>
                    <span style={{ fontSize:12, color:f.included?C.green:C.textDim, flexShrink:0 }}>
                      {f.included ? "✓" : "—"}
                    </span>
                    <span style={{ fontSize:12, color:f.included?C.textMid:C.textDim }}>{f.text}</span>
                  </div>
                ))}
              </div>

              <a href={plan.ctaLink} style={{ display:"block", textAlign:"center", background:plan.highlight?C.gold:plan.price===0?"transparent":C.surface, border:plan.price===0?`1px solid ${C.border}`:"none", color:plan.highlight?C.bg:plan.price===0?C.textMid:C.text, padding:"12px", borderRadius:6, fontSize:11, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, textDecoration:"none", cursor:"pointer" }}>
                {plan.cta} →
              </a>
            </div>
          ))}
        </div>

        {/* COMPARISON TABLE */}
        <div style={{ maxWidth:900, margin:"0 auto 80px", padding:"0 40px" }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:36, color:C.text, fontWeight:400, textAlign:"center", marginBottom:8 }}>Compare plans</h2>
          <div style={{ width:40, height:2, background:C.gold, margin:"0 auto 40px", borderRadius:1 }}/>

          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
            {/* Header */}
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", padding:"16px 24px", borderBottom:`1px solid ${C.border}`, background:C.surface }}>
              <div style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2 }}>FEATURE</div>
              {PLANS.map(p => (
                <div key={p.id} style={{ fontSize:11, color:p.color, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2, textAlign:"center" }}>{p.name.toUpperCase()}</div>
              ))}
            </div>

            {[
              ["Agents", "5", "50", "Unlimited"],
              ["Audits / month", "1,000", "50,000", "Unlimited"],
              ["Cryptographic identity", "✓", "✓", "✓"],
              ["Policy engine", "✓", "✓", "✓"],
              ["Dashboard", "✓", "✓", "✓"],
              ["Audit history", "30 days", "Full", "Full"],
              ["Webhooks", "—", "✓", "✓"],
              ["Support", "Community", "Email", "Priority"],
              ["Policy templates", "—", "—", "✓"],
              ["SLA guarantee", "—", "—", "✓"],
              ["Custom jurisdiction", "—", "—", "✓"],
            ].map(([feature, free, pro, enterprise], i) => (
              <div key={feature} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", padding:"14px 24px", borderBottom:`1px solid ${C.border}33`, background:i%2===0?"transparent":C.surface+"44" }}>
                <div style={{ fontSize:13, color:C.text }}>{feature}</div>
                {[free, pro, enterprise].map((val, vi) => (
                  <div key={vi} style={{ fontSize:12, color:val==="✓"?C.green:val==="—"?C.textDim:C.textMid, textAlign:"center", fontFamily:"'JetBrains Mono',monospace" }}>{val}</div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* TRUST SECTION */}
        <div style={{ maxWidth:900, margin:"0 auto 80px", padding:"0 40px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
            {[
              ["🔒", "Secure by default", "Real EC P-256 cryptography. Private keys never stored. Every decision signed."],
              ["⚡", "Up in 5 minutes", "npm install aivil and you are live. No infrastructure setup needed."],
              ["🌍", "Open source forever", "MIT license. Full source on GitHub. No vendor lock-in. Ever."],
            ].map(([icon, title, desc])=>(
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
              Start for free today.
            </h2>
            <p style={{ fontSize:14, color:C.textMid, marginBottom:28, lineHeight:1.8 }}>
              No credit card required. Your first 5 agents and 1,000 audits are on us. Forever.
            </p>
            <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
              <a href="/signup" style={{ background:C.gold, color:C.bg, padding:"13px 28px", borderRadius:5, fontSize:11, letterSpacing:2, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, textDecoration:"none" }}>
                GET API KEY FREE →
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
