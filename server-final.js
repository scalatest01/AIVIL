require("dotenv").config();
const { sendRogueAlert, sendWelcomeEmail } = require("./email");

const express = require("express");
const cors    = require("cors");
const crypto  = require("crypto");
const { subtle } = crypto.webcrypto;
const { createClient } = require("@supabase/supabase-js");
const rateLimit = require("express-rate-limit");

// ─── REQUIRED ENV — FAIL FAST ─────────────────────────────────────────────────
const SIGNING_SECRET = process.env.AIVIL_SIGNING_SECRET;
if (!SIGNING_SECRET) {
  console.error("FATAL: AIVIL_SIGNING_SECRET not set. Run: echo \"AIVIL_SIGNING_SECRET=$(openssl rand -hex 32)\" >> .env");
  process.exit(1);
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error("FATAL: SUPABASE_URL or SUPABASE_SERVICE_KEY not set.");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const API_BASE      = process.env.API_URL      || "https://api.aivildev.com";
const REGISTRY_BASE = process.env.REGISTRY_URL || "https://aivildev.com";

const app = express();
app.set("trust proxy", 1);

// Stripe webhook needs raw body BEFORE express.json()
app.use("/webhooks/stripe", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "256kb" }));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "https://aivildev.com",
  "https://www.aivildev.com",
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"]
    : []),
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // SDK / curl / server-to-server
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
const makeLimiter = (windowMs, max, message) => rateLimit({
  windowMs, max,
  message: { error: message },
  keyGenerator: (req) => req.headers.authorization || req.ip || "unknown",
  standardHeaders: true, legacyHeaders: false,
  validate: { xForwardedForHeader: false, ipKeyGenerator: false },
  skip: (req) => req.path === "/webhooks/stripe",
});

const generalLimiter = makeLimiter(15 * 60 * 1000, 300, "Too many requests. Please slow down.");
const auditLimiter   = makeLimiter(60 * 1000,       100, "Audit rate limit exceeded.");
const authLimiter    = makeLimiter(60 * 60 * 1000,  10,  "Too many auth attempts. Try again later.");
const registerLimiter = makeLimiter(60 * 60 * 1000, 5,   "Too many registrations from this IP. Try again in 1 hour.");

app.use(generalLimiter);

// ─── PLAN LIMITS ──────────────────────────────────────────────────────────────
const PLAN_LIMITS = {
  free:       { agents: 5,        audits_per_month: 1000 },
  pro:        { agents: 50,       audits_per_month: 50000 },
  enterprise: { agents: Infinity, audits_per_month: Infinity },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const validStr = (v, max) => typeof v === "string" && v.length > 0 && v.length <= max;

// Real SHA-256 hash
const realHash = async (data) => {
  const encoded = new TextEncoder().encode(typeof data === "string" ? data : JSON.stringify(data));
  const buf = await subtle.digest("SHA-256", encoded);
  return "sha256:" + Buffer.from(buf).toString("hex");
};

// Verify ECDSA signature from agent
const verifyAgentSignature = async (data, signature, publicKeyJwk) => {
  try {
    const key = await subtle.importKey("jwk", publicKeyJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    const encoded = new TextEncoder().encode(typeof data === "string" ? data : JSON.stringify(data));
    return await subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, Buffer.from(signature, "base64"), encoded);
  } catch { return false; }
};

// Real HMAC countersignature — requires secret, no fallback
const signVerdict = async (verdict) => {
  const hash = await realHash(verdict);
  return crypto.createHmac("sha256", SIGNING_SECRET).update(hash).digest("hex");
};

// Cryptographically secure agent ID with collision retry
const generateAgentId = async () => {
  for (let i = 0; i < 5; i++) {
    const id = `AGT-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
    const { data } = await supabase.from("agents").select("id").eq("id", id).single();
    if (!data) return id; // no collision
  }
  throw new Error("Failed to generate unique agent ID");
};

// Policy version as ISO timestamp — no parseInt bug
const nextPolicyVersion = () => `v-${new Date().toISOString()}`;

const buildDIDDocument = (agentId, publicKeyJwk, bornAt) => ({
  "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/suites/jws-2020/v1"],
  id: `did:aivil:${agentId}`,
  verificationMethod: [{
    id: `did:aivil:${agentId}#key-1`, type: "JsonWebKey2020",
    controller: `did:aivil:${agentId}`, publicKeyJwk,
  }],
  authentication:        [`did:aivil:${agentId}#key-1`],
  assertionMethod:       [`did:aivil:${agentId}#key-1`],
  capabilityInvocation:  [`did:aivil:${agentId}#key-1`],
  service: [{ id: `did:aivil:${agentId}#aivil-registry`, type: "AIVILRegistry", serviceEndpoint: `${API_BASE}/verify/${agentId}` }],
  created: bornAt, updated: bornAt,
});

const generateApiKey = () => {
  const key  = "aivil_" + crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return { key, hash, prefix: key.slice(0, 12) };
};

const hashApiKey = (key) => crypto.createHash("sha256").update(key).digest("hex");

// Safe domain matching — no regex, no ReDoS
const domainMatches = (pattern, domain) => {
  if (!domain) return false;
  if (pattern.startsWith("*.")) return domain.endsWith(pattern.slice(1));
  return domain === pattern;
};

// Safely parse action amount — no strings/NaN/negative
const parseAmount = (v) => {
  const n = Number(v);
  return (Number.isFinite(n) && n >= 0) ? n : 0;
};

// ─── WEBHOOK FIRE (must be before audit route) ────────────────────────────────
const fireWebhook = async (developerId, event, data) => {
  try {
    const { data: dev } = await supabase.from("developers").select("webhook_url, webhook_events").eq("id", developerId).single();
    if (!dev?.webhook_url) return;
    if (dev.webhook_events && !dev.webhook_events.includes(event)) return;
    await fetch(dev.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-AIVIL-Event": event },
      body: JSON.stringify({ event, data, timestamp: new Date().toISOString() }),
      signal: AbortSignal.timeout(5000),
    }).catch(e => console.error("Webhook failed:", e.message));
  } catch (e) { console.error("Webhook error:", e.message); }
};

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
const requireApiKey = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing API key. Use: Authorization: Bearer aivil_your_key" });
  const keyHash = hashApiKey(auth.replace("Bearer ", ""));
  const { data: keyData, error } = await supabase.from("api_keys").select("*, developers(*)").eq("key_hash", keyHash).eq("is_active", true).single();
  if (error || !keyData) return res.status(401).json({ error: "Invalid API key" });
  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyData.id);
  req.developer   = keyData.developers;
  req.developerId = keyData.developer_id;
  next();
};

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ name: "AIVIL API", version: "1.0.2", status: "live" }));

app.get("/test", async (req, res) => {
  const { error } = await supabase.from("agents").select("count").limit(1);
  res.json(error ? { db: "error", error: error.message } : { db: "connected", status: "ok" });
});

// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post("/auth/register", registerLimiter, authLimiter, async (req, res) => {
  const { email, password, name, company } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  if (!validStr(email, 200) || !validStr(password, 128)) return res.status(400).json({ error: "Invalid input" });

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (authError) return res.status(400).json({ error: authError.message });

  const { data: dev, error: devError } = await supabase.from("developers").insert({ id: authData.user.id, email, name, company }).select().single();
  if (devError) {
    await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {});
    return res.status(500).json({ error: devError.message });
  }

  const { key, hash, prefix } = generateApiKey();
  const { error: keyError } = await supabase.from("api_keys").insert({ developer_id: dev.id, key_hash: hash, key_prefix: prefix, name: "Default Key" });
  if (keyError) return res.status(500).json({ error: "Failed to create API key" });

  try { sendWelcomeEmail(email, name, key); } catch (e) { console.error("Welcome email failed:", e.message); }

  res.json({
    success: true,
    developer: { id: dev.id, email: dev.email, name: dev.name },
    api_key: key,
    message: "Save your API key — it will not be shown again",
  });
});

app.post("/auth/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });
  const { data: dev } = await supabase.from("developers").select("*").eq("id", data.user.id).single();
  res.json({ success: true, token: data.session.access_token, developer: dev });
});

app.post("/auth/reset-password", authLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: "https://aivildev.com/reset-password" });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, message: "Password reset email sent" });
});

// ─── AGENTS ───────────────────────────────────────────────────────────────────
app.post("/agents", requireApiKey, async (req, res) => {
  const { name, role, owner, purpose, jurisdiction, policy, public_key_jwk, public_key_hex } = req.body;
  if (!name || !role || !owner) return res.status(400).json({ error: "name, role, and owner required" });
  if (!validStr(name, 100) || !validStr(role, 100) || !validStr(owner, 100)) return res.status(400).json({ error: "name, role, owner must be 1–100 characters" });
  if (purpose && (typeof purpose !== "string" || purpose.length > 1000)) return res.status(400).json({ error: "purpose must be under 1000 characters" });

  // Enforce plan agent limit
  const plan  = req.developer?.plan || "free";
  const limit = PLAN_LIMITS[plan]?.agents ?? PLAN_LIMITS.free.agents;
  if (limit !== Infinity) {
    const { count } = await supabase.from("agents").select("id", { count: "exact", head: true }).eq("developer_id", req.developerId);
    if (count !== null && count >= limit) return res.status(403).json({ error: `Agent limit reached for ${plan} plan (${limit}). Upgrade at https://aivildev.com/pricing` });
  }

  const agentId = await generateAgentId();
  const did     = `did:aivil:${agentId}`;
  const bornAt  = new Date().toISOString();

  let publicKeyPem, birthHash;
  if (public_key_jwk) {
    birthHash = await realHash({ agentId, did, name, role, owner, publicKeyHex: public_key_hex || "", bornAt });
  } else {
    const { publicKey } = crypto.generateKeyPairSync("ec", {
      namedCurve: "P-256",
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    publicKeyPem = publicKey;
    birthHash = await realHash({ agentId, did, name, role, owner, bornAt });
  }

  const policyVersion = "v1.0";
  const agentPolicy = {
    version: policyVersion,
    spending_limit: policy?.spending_limit ?? 100,
    requires_human_signoff_over: policy?.requires_human_signoff_over ?? 50,
    allowed_topics: policy?.allowed_topics ?? [],
    blocked_topics: policy?.blocked_topics ?? [],
    restricted_domains: policy?.restricted_domains ?? ["*.gambling", "*.adult"],
    allowed_actions: policy?.allowed_actions ?? [],
    enforcement_mode: policy?.enforcement_mode ?? "balanced",
    rogue_detection: policy?.rogue_detection ?? "automatic",
    max_requests_per_hour: policy?.max_requests_per_hour ?? 200,
    jurisdiction: jurisdiction || "Delaware_USA",
  };

  const { data: agent, error } = await supabase.from("agents").insert({
    id: agentId, did, developer_id: req.developerId,
    name, role, owner, purpose,
    jurisdiction: jurisdiction || "Delaware_USA",
    public_key: publicKeyPem || JSON.stringify(public_key_jwk || {}),
    public_key_jwk: public_key_jwk || null,
    birth_hash: birthHash,
    policy: agentPolicy,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });

  const { error: phError } = await supabase.from("policy_history").insert({
    agent_id: agentId, version: policyVersion, policy: agentPolicy,
    changed_by: req.developerId, change_reason: "Initial policy",
  });
  if (phError) console.error("Policy history insert failed:", phError.message);

  res.json({
    success: true,
    agent: {
      id: agent.id, did: agent.did, name: agent.name, role: agent.role, owner: agent.owner, status: agent.status,
      public_key: publicKeyPem || public_key_hex || "",
      birth_certificate: { agent_id: agentId, did, name, born_at: bornAt, hash: birthHash, issued_by: "AIVIL Registry", cryptography: "ECDSA P-256" },
      did_document: public_key_jwk ? buildDIDDocument(agentId, public_key_jwk, bornAt) : null,
      policy: agentPolicy,
      registry_url: `${REGISTRY_BASE}/agent/${agentId}`,
    },
    warning: "Store your private key securely. AIVIL does not store it.",
  });
});

app.get("/agents", requireApiKey, async (req, res) => {
  const { data: agents, error } = await supabase.from("agents").select("*").eq("developer_id", req.developerId).order("born_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, agents, count: agents.length });
});

app.get("/agents/name/:name", requireApiKey, async (req, res) => {
  const { data: agent } = await supabase.from("agents").select("*").eq("developer_id", req.developerId).eq("name", req.params.name).single();
  if (!agent) return res.status(404).json({ error: "Agent not found" });
  res.json({ success: true, agent });
});

app.get("/agents/:id", requireApiKey, async (req, res) => {
  const { data: agent, error } = await supabase.from("agents").select("*").eq("id", req.params.id).eq("developer_id", req.developerId).single();
  if (error || !agent) return res.status(404).json({ error: "Agent not found" });
  res.json({ success: true, agent });
});

app.patch("/agents/:id/policy", requireApiKey, async (req, res) => {
  const { policy, change_reason } = req.body;
  if (!policy || typeof policy !== "object") return res.status(400).json({ error: "policy object required" });

  const { data: agent } = await supabase.from("agents").select("policy, policy_updated_at").eq("id", req.params.id).eq("developer_id", req.developerId).single();
  if (!agent) return res.status(404).json({ error: "Agent not found" });

  // 24-hour change lock — enforced server-side
  if (agent.policy_updated_at) {
    const hoursSince = (Date.now() - new Date(agent.policy_updated_at).getTime()) / 36e5;
    if (hoursSince < 24) return res.status(429).json({ error: `Policy can only be changed once every 24 hours. Try again in ${Math.ceil(24 - hoursSince)} hour(s).` });
  }

  const newPolicy = { ...agent.policy, ...policy, version: nextPolicyVersion() };
  const now = new Date().toISOString();

  await supabase.from("policy_history").update({ active_to: now }).eq("agent_id", req.params.id).is("active_to", null);
  const { error: phErr } = await supabase.from("policy_history").insert({ agent_id: req.params.id, version: newPolicy.version, policy: newPolicy, changed_by: req.developerId, change_reason: change_reason || "Policy update" });
  if (phErr) console.error("Policy history insert failed:", phErr.message);

  const { error: updateErr } = await supabase.from("agents").update({ policy: newPolicy, policy_updated_at: now }).eq("id", req.params.id);
  if (updateErr) return res.status(500).json({ error: updateErr.message });

  res.json({ success: true, policy: newPolicy });
});

app.post("/agents/:id/suspend", requireApiKey, async (req, res) => {
  const { reason } = req.body;
  const { data, error } = await supabase.from("agents").update({ status: "suspended" }).eq("id", req.params.id).eq("developer_id", req.developerId).select("id").single();
  if (error || !data) return res.status(404).json({ error: "Agent not found or not yours" });

  // Audit log — only if ownership confirmed
  await supabase.from("audit_log").insert({
    agent_id: req.params.id, developer_id: req.developerId,
    action_type: "SUSPEND", action_description: reason || "Manual suspension",
    verdict: "BLOCKED", reason: reason || "Manually suspended by developer",
    flags: ["MANUALLY_SUSPENDED"],
    trust_score: 0,
    signature: crypto.createHmac("sha256", SIGNING_SECRET).update(`suspend:${req.params.id}:${Date.now()}`).digest("hex"),
  });
  res.json({ success: true, message: "Agent suspended" });
});

app.post("/agents/:id/reactivate", requireApiKey, async (req, res) => {
  const { reason } = req.body;
  const { data: agent } = await supabase.from("agents").select("id, status").eq("id", req.params.id).eq("developer_id", req.developerId).single();
  if (!agent) return res.status(404).json({ error: "Agent not found or not yours" });
  if (agent.status === "retired") return res.status(400).json({ error: "Retired agents cannot be reactivated" });

  await supabase.from("agents").update({ status: "active", trust_score: 50 }).eq("id", req.params.id);
  await supabase.from("audit_log").insert({
    agent_id: req.params.id, developer_id: req.developerId,
    action_type: "REACTIVATE", action_description: reason || "Manual reactivation",
    verdict: "APPROVED", reason: reason || "Human review completed. Agent reactivated.",
    flags: ["MANUALLY_REACTIVATED"], trust_score: 50,
    signature: crypto.createHmac("sha256", SIGNING_SECRET).update(`reactivate:${req.params.id}:${Date.now()}`).digest("hex"),
  });
  res.json({ success: true, message: "Agent reactivated. Trust score reset to 50." });
});

app.post("/agents/:id/retire", requireApiKey, async (req, res) => {
  const { data, error } = await supabase.from("agents").update({ status: "retired", retired_at: new Date().toISOString() }).eq("id", req.params.id).eq("developer_id", req.developerId).select("id").single();
  if (error || !data) return res.status(404).json({ error: "Agent not found or not yours" });
  res.json({ success: true, message: "Agent retired. Full history preserved." });
});

// ─── AUDIT ────────────────────────────────────────────────────────────────────
app.post("/agents/:id/audit", auditLimiter, requireApiKey, async (req, res) => {

  // ── Monthly quota check ──
  const devPlan     = req.developer?.plan || "free";
  const monthlyLimit = PLAN_LIMITS[devPlan]?.audits_per_month;
  if (monthlyLimit && monthlyLimit !== Infinity) {
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const { count: auditCount } = await supabase.from("audit_log").select("id", { count: "exact", head: true }).eq("developer_id", req.developerId).gte("created_at", startOfMonth.toISOString());
    if (auditCount !== null && auditCount >= monthlyLimit) {
      return res.status(429).json({ error: `Monthly audit limit reached (${monthlyLimit.toLocaleString()}). Upgrade at https://aivildev.com/pricing`, plan: devPlan, limit: monthlyLimit, used: auditCount });
    }
  }

  // ── Accept both nested { action:{...} } and flat fields ──
  let { action } = req.body;
  if (!action && (req.body.type || req.body.action_type)) {
    action = {
      type:        req.body.type || req.body.action_type || "unknown",
      amount:      req.body.amount      ?? req.body.action_amount      ?? 0,
      domain:      req.body.domain      || req.body.action_domain      || "",
      description: req.body.description || "",
    };
  }
  if (!action || typeof action !== "object" || Array.isArray(action)) return res.status(400).json({ error: "action must be an object" });
  if (action.description && action.description.length > 2000) return res.status(400).json({ error: "action.description too long (max 2000)" });

  const amount = parseAmount(action.amount);

  const { data: agent, error } = await supabase.from("agents").select("*").eq("id", req.params.id).eq("developer_id", req.developerId).single();
  if (error || !agent) return res.status(404).json({ error: "Agent not found" });

  if (agent.status !== "active") return res.json({
    success: true,
    verdict: { status: "BLOCKED", reason: `Agent is ${agent.status}.`, flags: ["AGENT_NOT_ACTIVE"], agent_id: agent.id, timestamp: new Date().toISOString(), signature_status: "not_provided" }
  });

  // ── Optional ECDSA signature verification ──
  let signatureStatus = "not_provided";
  if (action.agent_signature) {
    if (!agent.public_key_jwk) {
      signatureStatus = "no_key_on_file";
    } else {
      try {
        const jwk = typeof agent.public_key_jwk === "string" ? JSON.parse(agent.public_key_jwk) : agent.public_key_jwk;
        const actionHash = await realHash({ agentId: agent.id, action: { ...action, agent_signature: undefined }, timestamp: action.signed_at });
        const ok = await verifyAgentSignature(actionHash, action.agent_signature, jwk);
        if (!ok) {
          const tv = { status: "BLOCKED", reason: "Agent signature verification failed. Possible tampering.", flags: ["INVALID_SIGNATURE", "POSSIBLE_TAMPERING"], agent_id: agent.id, timestamp: new Date().toISOString(), signature_status: "failed" };
          tv.signature = await signVerdict({ status: tv.status, agent_id: agent.id, timestamp: tv.timestamp, flags: tv.flags });
          return res.json({ success: true, verdict: tv });
        }
        signatureStatus = "verified";
      } catch { signatureStatus = "error"; }
    }
  }

  // ── Policy checks ──
  const policy   = agent.policy || {};
  const flags    = [];
  let   status   = "APPROVED";
  let   reason   = "";
  const descLower = (action.description || "").toLowerCase();

  // 1. Universal blocks (hardcoded — cannot be overridden by policy)
  const UNIVERSAL_KEYWORDS = ["adult", "porn", "illegal", "piracy", "impersonate"];
  const universalMatch = UNIVERSAL_KEYWORDS.find(k => descLower.includes(k));
  if (universalMatch) {
    status = "BLOCKED"; flags.push("UNIVERSAL_BLOCK");
    reason = `Universal block: "${universalMatch}" is prohibited for all agents.`;

  // 2. Restricted domains
  } else if ((policy.restricted_domains || []).some(p => domainMatches(p, action.domain))) {
    status = "BLOCKED"; flags.push("RESTRICTED_DOMAIN");
    reason = `Domain "${action.domain}" is restricted by policy.`;

  // 3. Cumulative daily spend check — prevents 10x $90 bypassing $100 limit
  } else if (amount > 0) {
    const today      = new Date().toISOString().split("T")[0];
    const lastDay    = agent.last_audit_date ? String(agent.last_audit_date).split("T")[0] : null;
    const spentToday = lastDay === today ? parseFloat(agent.spent_today || 0) : 0;
    const projectedSpend = spentToday + amount;

    if (projectedSpend > (policy.spending_limit ?? 100)) {
      status = "BLOCKED"; flags.push("EXCEEDS_DAILY_LIMIT");
      reason = `This $${amount} action would bring daily spend to $${projectedSpend.toFixed(2)}, exceeding the $${policy.spending_limit ?? 100} limit.`;
    } else if (amount > (policy.requires_human_signoff_over ?? 50)) {
      status = "ESCALATE"; flags.push("NEEDS_SIGNOFF");
      reason = `$${amount} requires human approval (threshold: $${policy.requires_human_signoff_over ?? 50}).`;
    } else {
      const blockedMatch = (policy.blocked_topics || []).find(t => descLower.includes(String(t).toLowerCase()));
      if (blockedMatch) { status = "BLOCKED"; flags.push("BLOCKED_TOPIC"); reason = `Topic "${blockedMatch}" is blocked.`; }
      else if ((policy.allowed_topics || []).length > 0) {
        const allowed = policy.allowed_topics.some(t => descLower.includes(String(t).toLowerCase()));
        if (!allowed) { status = "BLOCKED"; flags.push("NOT_IN_ALLOWED_TOPICS"); reason = `Outside allowed topics: ${policy.allowed_topics.join(", ")}.`; }
      }
    }
  } else {
    // Non-financial action — check topics only
    const blockedMatch = (policy.blocked_topics || []).find(t => descLower.includes(String(t).toLowerCase()));
    if (blockedMatch) { status = "BLOCKED"; flags.push("BLOCKED_TOPIC"); reason = `Topic "${blockedMatch}" is blocked.`; }
    else if ((policy.allowed_topics || []).length > 0) {
      const allowed = policy.allowed_topics.some(t => descLower.includes(String(t).toLowerCase()));
      if (!allowed) { status = "BLOCKED"; flags.push("NOT_IN_ALLOWED_TOPICS"); reason = `Outside allowed topics: ${policy.allowed_topics.join(", ")}.`; }
    }
  }

  if (status === "APPROVED") reason = "All policy checks passed.";

  // ── Rogue detection (use ?? so trust 0 is respected) ──
  const currentTrust   = agent.trust_score ?? 70;
  const newTrustScore  = status === "BLOCKED" ? Math.max(0, currentTrust - 2) : currentTrust;
  const newBlockedCount = (agent.blocked_count || 0) + (status === "BLOCKED" ? 1 : 0);
  const rogueScore     = 100 - newTrustScore;
  let autoSuspended    = false;

  if (rogueScore >= 91 && policy.rogue_detection !== "manual") {
    autoSuspended = true;
    await supabase.from("agents").update({ status: "suspended", trust_score: newTrustScore, blocked_count: newBlockedCount }).eq("id", agent.id);
    flags.push("AUTO_SUSPENDED_ROGUE");
  }

  // ── AIVIL countersignature ──
  const verdictTimestamp = new Date().toISOString();
  const aivilSignature   = await signVerdict({ status, agent_id: agent.id, timestamp: verdictTimestamp, flags });

  // ── Save audit log (check error) ──
  const today   = verdictTimestamp.split("T")[0];
  const lastDay = agent.last_audit_date ? String(agent.last_audit_date).split("T")[0] : null;
  const spentTodayBase = lastDay === today ? parseFloat(agent.spent_today || 0) : 0;

  const { data: logEntry, error: logErr } = await supabase.from("audit_log").insert({
    agent_id: agent.id, developer_id: req.developerId,
    action_type: action.type || "unknown",
    action_domain: action.domain || "",
    action_amount: amount,
    action_description: action.description || "",
    verdict: status, reason, flags,
    trust_score: newTrustScore,
    signature: aivilSignature,
    jurisdiction: agent.jurisdiction,
  }).select().single();
  if (logErr) console.error("Audit log insert failed:", logErr.message);

  // ── Update agent stats (only if not already suspended above) ──
  if (!autoSuspended) {
    const updates = { last_audit_date: verdictTimestamp };
    if (status === "APPROVED" && amount > 0) {
      updates.spent_today    = spentTodayBase + amount;
      updates.spent_lifetime = parseFloat(agent.spent_lifetime || 0) + amount;
      updates.transactions   = (agent.transactions || 0) + 1;
      updates.approved_count = (agent.approved_count || 0) + 1;
    } else if (status === "APPROVED") {
      updates.approved_count = (agent.approved_count || 0) + 1;
    } else if (status === "ESCALATE") {
      updates.escalated_count = (agent.escalated_count || 0) + 1;
    } else if (status === "BLOCKED") {
      updates.blocked_count = newBlockedCount;
      updates.trust_score   = newTrustScore;
    }
    const { error: statsErr } = await supabase.from("agents").update(updates).eq("id", agent.id);
    if (statsErr) console.error("Agent stats update failed:", statsErr.message);
  }

  // ── Fire webhooks and alerts ──
  if (status === "BLOCKED")  fireWebhook(req.developerId, "audit.blocked",  { agent_id: agent.id, agent_name: agent.name, verdict: status, reason, flags, audit_id: logEntry?.id });
  if (autoSuspended) {
    fireWebhook(req.developerId, "agent.suspended", { agent_id: agent.id, agent_name: agent.name, reason: "Auto-suspended: rogue score exceeded threshold" });
    try { if (typeof sendRogueAlert === "function" && req.developer?.email) sendRogueAlert(req.developer.email, agent.name, agent.id); } catch (e) { console.error("Rogue alert failed:", e.message); }
  }

  res.json({
    success: true,
    verdict: {
      status, reason, flags,
      agent_id: agent.id,
      agent_registry: `${REGISTRY_BASE}/agent/${agent.id}`,
      trust_score: newTrustScore,
      timestamp: verdictTimestamp,
      signature: aivilSignature,
      signature_status: signatureStatus,
      audit_id: logEntry?.id,
      auto_suspended: autoSuspended,
      ...(autoSuspended && { suspension_notice: "Agent auto-suspended. Human review required." }),
    }
  });
});

app.get("/agents/:id/audit", requireApiKey, async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit) || 50, 200);
  const before = req.query.before;
  let query = supabase.from("audit_log").select("*").eq("agent_id", req.params.id).eq("developer_id", req.developerId).order("created_at", { ascending: false }).limit(limit);
  if (before) query = query.lt("created_at", before);
  const { data: logs, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, logs });
});

// ─── VERIFY (PUBLIC — no auth) ────────────────────────────────────────────────
app.get("/verify/:agentId", async (req, res) => {
  const { data: agent, error } = await supabase.from("agents")
    .select("id, did, name, role, owner, jurisdiction, status, trust_score, born_at, public_key, birth_hash")
    .eq("id", req.params.agentId).single();
  if (error || !agent) return res.status(404).json({ verified: false, error: "Agent not found" });
  res.json({
    verified: true, agent_id: agent.id, did: agent.did,
    name: agent.name, role: agent.role, owner: agent.owner,
    status: agent.status, trust_score: agent.trust_score,
    born_at: agent.born_at, public_key: agent.public_key,
    registry_url: `${REGISTRY_BASE}/agent/${agent.id}`,
    birth_hash: agent.birth_hash, jurisdiction: agent.jurisdiction,
    verified_by: "AIVIL Registry", verified_at: new Date().toISOString(),
  });
});

// ─── STATS ────────────────────────────────────────────────────────────────────
app.get("/stats", requireApiKey, async (req, res) => {
  const { data: agents, error } = await supabase.from("agents").select("status, trust_score, spent_lifetime, transactions").eq("developer_id", req.developerId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({
    success: true,
    stats: {
      total_agents:      agents.length,
      active_agents:     agents.filter(a => a.status === "active").length,
      total_spent:       agents.reduce((s, a) => s + parseFloat(a.spent_lifetime || 0), 0),
      total_transactions: agents.reduce((s, a) => s + (a.transactions || 0), 0),
    }
  });
});

// ─── STRIPE WEBHOOK ───────────────────────────────────────────────────────────
app.post("/webhooks/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn("Stripe not configured — skipping webhook");
    return res.json({ received: true });
  }
  let event;
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook error:", err.message);
    return res.status(400).json({ error: "Invalid Stripe signature" });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email   = session.customer_details?.email;
    const plan    = session.metadata?.plan || "pro";
    if (email) {
      const { data: dev } = await supabase.from("developers").select("id").eq("email", email).single();
      if (dev) await supabase.from("developers").update({ plan, stripe_customer_id: session.customer, stripe_subscription_id: session.subscription }).eq("id", dev.id);
    }
  }
  if (event.type === "customer.subscription.deleted") {
    await supabase.from("developers").update({ plan: "free" }).eq("stripe_customer_id", event.data.object.customer);
  }
  res.json({ received: true });
});

// ─── WEBHOOK REGISTRATION ─────────────────────────────────────────────────────
app.post("/webhooks/register", requireApiKey, async (req, res) => {
  const { url, events } = req.body;
  if (!url || !validStr(url, 500)) return res.status(400).json({ error: "Valid url required" });
  let parsed;
  try { parsed = new URL(url); } catch { return res.status(400).json({ error: "url is not valid" }); }
  if (parsed.protocol !== "https:") return res.status(400).json({ error: "Webhook URL must use HTTPS" });
  const h = parsed.hostname.toLowerCase();
  const blocked = ["localhost","127.","0.0.0.0","10.","192.168.","169.254.","::1","[::1]"];
  if (blocked.some(b => h === b || h.startsWith(b))) return res.status(400).json({ error: "Webhook URL cannot be an internal address" });
  const safePorts = ["", "443", "80", "8080", "8443"];
  if (!safePorts.includes(parsed.port)) return res.status(400).json({ error: "Webhook URL uses a non-standard port" });

  await supabase.from("developers").update({
    webhook_url: url,
    webhook_events: events || ["agent.suspended", "audit.blocked"],
  }).eq("id", req.developerId);
  res.json({ success: true, message: "Webhook registered", url });
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`AIVIL API v1.0.2 running on port ${PORT}`));
