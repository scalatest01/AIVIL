import { useState } from "react";

const API = "https://api.aivildev.com";

const C = {
  bg:"#04060c", card:"#080c14", border:"#151f30",
  gold:"#c9a84c", goldDim:"rgba(201,168,76,0.1)",
  text:"#dde4f0", textDim:"#3d5070", textMid:"#7a90b8",
  green:"#00d68f", red:"#ff4d6a",
};

export default function DevPortal() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email:"", password:"", name:"", company:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const up = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const reset = (m) => { setMode(m); setError(""); };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.name) {
      setError("Name, email and password are required");
      return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      setResult(data);
      setMode("success");
    } catch(e) {
      setError("Cannot connect to AIVIL server. Please try again.");
    } finally { setLoading(false); }
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError("Email and password required");
      return;
    }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      setResult(data);
      setMode("dashboard");
    } catch(e) {
      setError("Cannot connect to AIVIL server. Please try again.");
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!form.email) { setError("Email required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send reset email"); return; }
      setMode("reset-sent");
    } catch(e) {
      setError("Cannot connect to server.");
    } finally { setLoading(false); }
  };

  const inp = (key, label, type = "text", placeholder = "") => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={form[key]}
        onChange={e => up(key, e.target.value)}
        onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : mode === "forgot" ? handleForgotPassword() : handleRegister())}
        placeholder={placeholder}
        style={{ width: "100%", background: "#030508", border: `1px solid ${C.border}`, borderRadius: 5, outline: "none", color: C.text, fontSize: 13, padding: "10px 14px", fontFamily: "'JetBrains Mono',monospace" }}
      />
    </div>
  );

  const ErrorBox = () => error ? (
    <div style={{ background: "rgba(255,59,92,0.08)", border: "1px solid rgba(255,59,92,0.2)", borderRadius: 4, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.red, fontFamily: "'JetBrains Mono',monospace" }}>
      {error}
    </div>
  ) : null;

  const Btn = ({ label, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", background: disabled ? C.border : C.gold, border: "none", borderRadius: 5, color: disabled ? C.textDim : C.bg, padding: "12px", cursor: disabled ? "not-allowed" : "pointer", fontSize: 11, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, marginBottom: 16 }}>
      {label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=JetBrains+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        input::placeholder { color: #2a3a5a; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 460, animation: "fadeUp 0.4s ease" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: C.gold, letterSpacing: 4, marginBottom: 6 }}>AIVIL</div>
          <div style={{ fontSize: 10, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 3 }}>AI VITAL IDENTITY LAYER</div>
        </div>

        {/* LOGIN */}
        {mode === "login" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 32 }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: C.text, marginBottom: 4 }}>Welcome back</div>
            <div style={{ fontSize: 11, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", marginBottom: 28 }}>Sign in to your developer account</div>
            {inp("email", "EMAIL", "email", "you@company.com")}
            {inp("password", "PASSWORD", "password", "••••••••")}
            <ErrorBox/>
            <Btn label={loading ? "SIGNING IN…" : "SIGN IN →"} onClick={handleLogin} disabled={loading}/>
            <div style={{ textAlign: "center", fontSize: 12, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", marginBottom: 8 }}>
              No account?{" "}
              <span onClick={() => reset("register")} style={{ color: C.gold, cursor: "pointer" }}>Create one</span>
            </div>
            <div style={{ textAlign: "center", fontSize: 11, color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>
              <span onClick={() => reset("forgot")} style={{ color: C.textDim, cursor: "pointer" }}>Forgot password?</span>
            </div>
          </div>
        )}

        {/* REGISTER */}
        {mode === "register" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 32 }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: C.text, marginBottom: 4 }}>Create account</div>
            <div style={{ fontSize: 11, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", marginBottom: 28 }}>Get your AIVIL API key instantly</div>
            {inp("name", "YOUR NAME", "text", "Himanshu")}
            {inp("company", "COMPANY (OPTIONAL)", "text", "Acme Corp")}
            {inp("email", "EMAIL", "email", "you@company.com")}
            {inp("password", "PASSWORD", "password", "Min 8 characters")}
            <ErrorBox/>
            <Btn label={loading ? "CREATING ACCOUNT…" : "CREATE ACCOUNT →"} onClick={handleRegister} disabled={loading}/>
            <div style={{ textAlign: "center", fontSize: 12, color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>
              Already have an account?{" "}
              <span onClick={() => reset("login")} style={{ color: C.gold, cursor: "pointer" }}>Sign in</span>
            </div>
          </div>
        )}

        {/* FORGOT PASSWORD */}
        {mode === "forgot" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 32 }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: C.text, marginBottom: 4 }}>Reset Password</div>
            <div style={{ fontSize: 11, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", marginBottom: 28 }}>Enter your email and we will send a reset link</div>
            {inp("email", "EMAIL", "email", "you@company.com")}
            <ErrorBox/>
            <Btn label={loading ? "SENDING…" : "SEND RESET LINK →"} onClick={handleForgotPassword} disabled={loading}/>
            <div style={{ textAlign: "center", fontSize: 11, color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>
              <span onClick={() => reset("login")} style={{ color: C.gold, cursor: "pointer" }}>← Back to sign in</span>
            </div>
          </div>
        )}

        {/* RESET SENT */}
        {mode === "reset-sent" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: C.green, marginBottom: 8 }}>Check your email</div>
            <div style={{ fontSize: 12, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", marginBottom: 24, lineHeight: 1.8 }}>
              We sent a password reset link to<br/>
              <span style={{ color: C.text }}>{form.email}</span>
            </div>
            <span onClick={() => reset("login")} style={{ color: C.gold, cursor: "pointer", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>
              ← Back to sign in
            </span>
          </div>
        )}

        {/* SUCCESS — show API key */}
        {mode === "success" && result && (
          <div style={{ background: C.card, border: `1px solid ${C.gold}44`, borderRadius: 10, padding: 32 }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: C.green, marginBottom: 4 }}>Account created</div>
              <div style={{ fontSize: 11, color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>Welcome to AIVIL, {result.developer?.name}</div>
            </div>
            <div style={{ background: "#030508", border: `1px solid ${C.gold}33`, borderRadius: 6, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: C.gold, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 10 }}>YOUR API KEY</div>
              <div style={{ fontSize: 11, color: C.text, fontFamily: "'JetBrains Mono',monospace", wordBreak: "break-all", lineHeight: 1.6, marginBottom: 12 }}>
                {result.api_key}
              </div>
              <button onClick={() => copy(result.api_key)} style={{ background: copied ? `${C.green}22` : C.goldDim, border: `1px solid ${copied ? C.green : C.gold}44`, borderRadius: 4, color: copied ? C.green : C.gold, padding: "7px 16px", cursor: "pointer", fontSize: 10, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace" }}>
                {copied ? "✓ COPIED" : "COPY KEY"}
              </button>
            </div>
            <div style={{ background: "rgba(255,59,92,0.06)", border: "1px solid rgba(255,59,92,0.2)", borderRadius: 5, padding: 12, marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: C.red, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.7 }}>
                ⚠ Save this key now. It will not be shown again. We also sent it to your email.
              </div>
            </div>
            <div style={{ background: "#030508", border: `1px solid ${C.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 2, marginBottom: 10 }}>QUICK START</div>
              <pre style={{ fontSize: 11, color: "#4fc3f7", fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.8, overflowX: "auto" }}>{`npm install aivil

const AIVIL = require('aivil')
const aivil = new AIVIL({ 
  apiKey: "${result.api_key?.slice(0, 20)}..." 
})

const { agent } = await aivil.createAgent({
  name: "My Agent",
  role: "Procurement",
  owner: "My Company",
  jurisdiction: "Delaware_USA",
  policy: { spending_limit: 100 }
})

const verdict = await aivil.audit(agent.id, {
  type: "purchase", amount: 30,
  domain: "openai.com",
  description: "Buy API credits"
})

console.log(verdict.status) // APPROVED`}</pre>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <a href="https://aivildev.com/app" style={{ flex: 1, background: C.gold, border: "none", borderRadius: 5, color: C.bg, padding: "11px", cursor: "pointer", fontSize: 11, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, textAlign: "center", textDecoration: "none" }}>
                OPEN DASHBOARD →
              </a>
              <a href="https://aivildev.com/docs" style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 5, color: C.textMid, padding: "11px 20px", cursor: "pointer", fontSize: 11, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", textDecoration: "none" }}>
                DOCS
              </a>
            </div>
          </div>
        )}

        {/* DASHBOARD after login */}
        {mode === "dashboard" && result && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` }}/>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: C.text }}>
                Welcome back, {result.developer?.name}
              </div>
            </div>
            <div style={{ background: "#030508", border: `1px solid ${C.border}`, borderRadius: 6, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>SIGNED IN AS</div>
              <div style={{ fontSize: 12, color: C.textMid, fontFamily: "'JetBrains Mono',monospace" }}>{result.developer?.email}</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <a href="https://aivildev.com/app" style={{ flex: 1, background: C.gold, border: "none", borderRadius: 5, color: C.bg, padding: "11px", fontSize: 11, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, textAlign: "center", textDecoration: "none" }}>
                OPEN DASHBOARD →
              </a>
              <button onClick={() => { setMode("login"); setResult(null); setForm({ email:"", password:"", name:"", company:"" }); }} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 5, color: C.textDim, padding: "11px 20px", cursor: "pointer", fontSize: 11, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace" }}>
                SIGN OUT
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 10, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>
          Every agent. Verified. Accountable. Alive.
        </div>
      </div>
    </div>
  );
}
