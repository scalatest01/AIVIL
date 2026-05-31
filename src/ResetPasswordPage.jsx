import { useState, useEffect } from "react";

const API = "https://api.aivildev.com";

const C = {
  bg:"#04060c", card:"#080c14", border:"#151f30",
  gold:"#c9a84c", goldDim:"rgba(201,168,76,0.1)",
  text:"#dde4f0", textDim:"#3d5070", textMid:"#7a90b8",
  green:"#00d68f", red:"#ff4d6a",
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState("");
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    // Extract token from URL hash
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    const accessToken = params.get("access_token");
    const type = params.get("type");

    if (accessToken && type === "recovery") {
      setToken(accessToken);
      setValidToken(true);
    }
  }, []);

  const handleReset = async () => {
    if (!password) { setError("Password required"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }

    setLoading(true); setError("");

    try {
      // Route through AIVIL API — no client-side Supabase keys needed
      const res = await fetch(`${API}/auth/update-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setSuccess(true);
    } catch(e) {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=JetBrains+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        input::placeholder { color: #2a3a5a; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 440, animation: "fadeUp 0.4s ease" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: C.gold, letterSpacing: 4, marginBottom: 6 }}>AIVIL</div>
          <div style={{ fontSize: 10, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 3 }}>AI VITAL IDENTITY LAYER</div>
        </div>

        {/* Invalid token */}
        {!validToken && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: C.red, marginBottom: 8 }}>Invalid Reset Link</div>
            <div style={{ fontSize: 12, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", marginBottom: 24, lineHeight: 1.8 }}>
              This reset link is invalid or has expired.<br/>
              Reset links expire after 1 hour.
            </div>
            <a href="/signup" style={{ color: C.gold, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", textDecoration: "none" }}>
              Request a new reset link →
            </a>
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 32, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: C.green, marginBottom: 8 }}>Password updated</div>
            <div style={{ fontSize: 12, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", marginBottom: 24, lineHeight: 1.8 }}>
              Your password has been successfully updated.
            </div>
            <a href="/app" style={{ background: C.gold, color: C.bg, padding: "10px 24px", borderRadius: 4, fontSize: 10, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, textDecoration: "none" }}>
              GO TO DASHBOARD →
            </a>
          </div>
        )}

        {/* Reset form */}
        {validToken && !success && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 32 }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: C.text, marginBottom: 4 }}>Set New Password</div>
            <div style={{ fontSize: 11, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", marginBottom: 28 }}>Choose a strong password for your account</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>NEW PASSWORD</div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                style={{ width: "100%", background: "#030508", border: `1px solid ${C.border}`, borderRadius: 5, outline: "none", color: C.text, fontSize: 13, padding: "10px 14px", fontFamily: "'JetBrains Mono',monospace" }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: C.textDim, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>CONFIRM PASSWORD</div>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleReset()}
                placeholder="Repeat password"
                style={{ width: "100%", background: "#030508", border: `1px solid ${C.border}`, borderRadius: 5, outline: "none", color: C.text, fontSize: 13, padding: "10px 14px", fontFamily: "'JetBrains Mono',monospace" }}
              />
            </div>

            {error && (
              <div style={{ background: "rgba(255,59,92,0.08)", border: "1px solid rgba(255,59,92,0.2)", borderRadius: 4, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: C.red, fontFamily: "'JetBrains Mono',monospace" }}>
                {error}
              </div>
            )}

            <button onClick={handleReset} disabled={loading} style={{ width: "100%", background: loading ? C.border : C.gold, border: "none", borderRadius: 5, color: loading ? C.textDim : C.bg, padding: "12px", cursor: loading ? "not-allowed" : "pointer", fontSize: 11, letterSpacing: 2, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
              {loading ? "UPDATING…" : "UPDATE PASSWORD →"}
            </button>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 10, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1 }}>
          Every agent. Verified. Accountable. Alive.
        </div>
      </div>
    </div>
  );
}
