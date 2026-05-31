// ─────────────────────────────────────────────────────────────────────────────
// AIVIL — AI Vital Identity Layer  v2.2.0
// npm install aivil
// The civil registry for artificial intelligence
// Open source forever · AGPL-3.0 · github.com/scalatest01/AIVIL
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

const AIVIL_VERSION   = "2.2.0";
const DEFAULT_API     = "https://api.aivildev.com";
const DEFAULT_TIMEOUT = 8000;
const MAX_RETRIES     = 2;

// ─── STARTUP MESSAGE ─────────────────────────────────────────────────────────
if (!process.env.AIVIL_KEY && !process.env.AIVIL_API_KEY) {
  console.log(
    "\n  ╔════════════════════════════════════════╗" +
    "\n  ║           AIVIL v" + AIVIL_VERSION + "               ║" +
    "\n  ║   The Civil Registry for AI Agents    ║" +
    "\n  ╠════════════════════════════════════════╣" +
    "\n  ║                                        ║" +
    "\n  ║  ⚠  NO API KEY DETECTED               ║" +
    "\n  ║                                        ║" +
    "\n  ║  Get your free key in 30 seconds:     ║" +
    "\n  ║  → https://aivildev.com/signup        ║" +
    "\n  ║                                        ║" +
    "\n  ╚════════════════════════════════════════╝\n"
  );
}

// ─── CUSTOM ERRORS ────────────────────────────────────────────────────────────
class AIVILError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name   = "AIVILError";
    this.code   = code   || "UNKNOWN";
    this.status = status || 500;
  }
}

class AIVILTimeoutError extends AIVILError {
  constructor(ms) {
    super(`AIVIL request timed out after ${ms}ms`, "TIMEOUT", 408);
    this.name = "AIVILTimeoutError";
  }
}

class AIVILAuthError extends AIVILError {
  constructor(msg) {
    super(msg || "Invalid API key. Check aivildev.com/app", "AUTH_ERROR", 401);
    this.name = "AIVILAuthError";
  }
}

class AIVILPlanError extends AIVILError {
  constructor(msg) {
    super(msg || "Plan limit reached. Upgrade at aivildev.com/pricing", "PLAN_LIMIT", 403);
    this.name        = "AIVILPlanError";
    this.upgradeUrl  = "https://aivildev.com/pricing";
  }
}

// ─── FETCH WITH TIMEOUT ───────────────────────────────────────────────────────
const fetchWithTimeout = async (url, opts, timeout) => {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    if (e.name === "AbortError") throw new AIVILTimeoutError(timeout);
    throw e;
  }
};

// ─── MAIN CLASS ───────────────────────────────────────────────────────────────
class AIVIL {
  /**
   * @param {Object} config
   * @param {string} config.apiKey           - Your AIVIL API key (aivil_...)
   * @param {string} [config.baseUrl]        - Custom API URL (default: api.aivildev.com)
   * @param {number} [config.timeout=8000]   - Request timeout in ms
   * @param {number} [config.retries=2]      - Retry attempts on network errors
   * @param {string} [config.fallback]       - "escalate"|"approve"|"block" if AIVIL unreachable
   * @param {boolean}[config.debug=false]    - Log all requests
   */
  constructor(config = {}) {
    this.apiKey   = config.apiKey
      || process.env.AIVIL_API_KEY
      || process.env.AIVIL_KEY
      || "";
    this.baseUrl  = (config.baseUrl || DEFAULT_API).replace(/\/$/, "");
    this.timeout  = config.timeout  || DEFAULT_TIMEOUT;
    this.retries  = config.retries  ?? MAX_RETRIES;
    this.fallback = config.fallback || "escalate";
    this._debug   = config.debug    || false;
    this._log     = this._debug ? (...a) => console.log("[AIVIL]", ...a) : () => {};

    if (!this.apiKey) {
      throw new AIVILAuthError(
        "No API key provided.\n" +
        "  Get your free key at: https://aivildev.com/signup\n" +
        "  Then: new AIVIL({ apiKey: 'aivil_your_key' })"
      );
    }
  }

  // ─── HTTP WITH RETRY ──────────────────────────────────────────────────────
  async _request(method, path, body, attempt = 0) {
    this._log(`${method} ${path} (attempt ${attempt + 1})`);
    const url  = `${this.baseUrl}${path}`;
    const opts = {
      method,
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
        "User-Agent":    `aivil-sdk/${AIVIL_VERSION}`,
      },
    };
    if (body) opts.body = JSON.stringify(body);

    let res, data;
    try {
      res = await fetchWithTimeout(url, opts, this.timeout);
    } catch (e) {
      // Retry on network/timeout errors
      if (attempt < this.retries && (e instanceof AIVILTimeoutError || e.code === "ECONNREFUSED" || e.code === "ENOTFOUND")) {
        this._log(`Retrying in 1s... (${attempt + 1}/${this.retries})`);
        await new Promise(r => setTimeout(r, 1000));
        return this._request(method, path, body, attempt + 1);
      }
      throw new AIVILError(`Cannot connect to AIVIL (${e.message}). Check your internet connection.`, "NETWORK_ERROR");
    }

    try {
      data = await res.json();
    } catch (e) {
      throw new AIVILError(`Server returned non-JSON (status ${res.status})`, "PARSE_ERROR", res.status);
    }

    if (res.status === 401) throw new AIVILAuthError(data.error);
    if (res.status === 403) throw new AIVILPlanError(data.error);
    if (!res.ok) throw new AIVILError(data.error || `HTTP ${res.status}`, "API_ERROR", res.status);

    return data;
  }

  // ─── CREATE AGENT ────────────────────────────────────────────────────────
  /**
   * Register a new AI agent with verified identity, DID, and policy engine.
   * @param {Object} config
   * @param {string} config.name         - Agent name
   * @param {string} config.role         - Agent role
   * @param {string} config.owner        - Owner name or company
   * @param {string} config.purpose      - What this agent does
   * @param {string} config.jurisdiction - "Delaware_USA"|"EU_GDPR"|"UK_GDPR"|"Singapore"
   * @param {Object} config.policy       - Policy rules
   * @returns {Promise<{agent, privateKeyJwk, warning}>}
   */
  async createAgent(config) {
    const required = ["name", "role", "owner", "jurisdiction"];
    for (const f of required) {
      if (!config[f]) throw new AIVILError(`createAgent requires '${f}'`, "MISSING_FIELD");
    }
    const data = await this._request("POST", "/agents", config);
    if (data.warning) console.warn(`[AIVIL] ⚠ ${data.warning}`);
    return { agent: data.agent, privateKeyJwk: data.agent?.private_key || null, warning: data.warning };
  }

  // ─── GET OR CREATE ────────────────────────────────────────────────────────
  /**
   * Find existing agent by name or create it. Safe to call on every startup.
   * @param {Object} config - Same as createAgent
   * @returns {Promise<{agent, created}>}
   */
  async getOrCreate(config) {
    if (!config.name) throw new AIVILError("getOrCreate requires config.name", "MISSING_FIELD");
    try {
      const data = await this._request("GET", `/agents/name/${encodeURIComponent(config.name)}`);
      if (data.agent) { this._log(`Found: ${data.agent.id}`); return { agent: data.agent, created: false }; }
    } catch (e) { /* not found — create */ }
    const { agent } = await this.createAgent(config);
    this._log(`Created: ${agent.id}`);
    return { agent, created: true };
  }

  // ─── LIST AGENTS ─────────────────────────────────────────────────────────
  /** @returns {Promise<Array>} */
  async listAgents() {
    const data = await this._request("GET", "/agents");
    return data.agents || [];
  }

  // ─── GET AGENT ───────────────────────────────────────────────────────────
  /** @param {string} agentId @returns {Promise<Object>} */
  async getAgent(agentId) {
    const data = await this._request("GET", `/agents/${agentId}`);
    return data.agent;
  }

  // ─── AUDIT ───────────────────────────────────────────────────────────────
  /**
   * Audit an agent action BEFORE executing it.
   * Every decision is logged to your dashboard in real time.
   *
   * @param {string} agentId
   * @param {Object} action
   * @param {string} action.type        - "purchase"|"web_search"|"send_email"|"api_call"|...
   * @param {number} action.amount      - USD amount (0 if not financial)
   * @param {string} action.domain      - Target domain e.g. "openai.com"
   * @param {string} action.description - Plain English description
   * @param {Object} [opts]
   * @param {string} [opts.fallback]    - Override fallback: "escalate"|"approve"|"block"
   * @returns {Promise<{status, reason, flags, signature, audit_id, trust_score, agent_registry}>}
   *
   * @example
   * const v = await aivil.audit(agent.id, {
   *   type: "purchase", amount: 50,
   *   domain: "openai.com", description: "Buy API credits"
   * })
   * if (v.status === "APPROVED")  proceed()
   * if (v.status === "ESCALATE")  notifyHuman(v.reason)
   * if (v.status === "BLOCKED")   stop(v.reason)
   */
  async audit(agentId, action, opts = {}) {
    const fallback = opts.fallback || this.fallback;
    try {
      const data = await this._request("POST", `/agents/${agentId}/audit`, { action });
      return data.verdict;
    } catch (e) {
      // Fallback if AIVIL is unreachable — never crash the agent
      if (e instanceof AIVILTimeoutError || e.code === "NETWORK_ERROR") {
        console.warn(`[AIVIL] ⚠ Unreachable. Fallback: ${fallback.toUpperCase()}`);
        return {
          status:    fallback.toUpperCase(),
          reason:    `AIVIL temporarily unreachable. Fallback: ${fallback}`,
          flags:     ["AIVIL_FALLBACK", "SERVICE_UNREACHABLE"],
          agent_id:  agentId,
          timestamp: new Date().toISOString(),
          fallback:  true,
        };
      }
      throw e;
    }
  }

  // ─── AUDIT LOG ───────────────────────────────────────────────────────────
  /**
   * @param {string} agentId
   * @param {number} [limit=50]
   * @param {string} [before] - ISO timestamp cursor
   * @returns {Promise<Array>}
   */
  async getAuditLog(agentId, limit = 50, before = null) {
    let path = `/agents/${agentId}/audit?limit=${Math.min(limit, 200)}`;
    if (before) path += `&before=${encodeURIComponent(before)}`;
    const data = await this._request("GET", path);
    return data.logs || [];
  }

  // ─── UPDATE POLICY ────────────────────────────────────────────────────────
  /**
   * Update agent policy. Can only be changed once every 24 hours.
   * @param {string} agentId
   * @param {Object} policy
   * @param {string} [reason]
   */
  async updatePolicy(agentId, policy, reason = "Policy update") {
    const data = await this._request("PATCH", `/agents/${agentId}/policy`, { policy, change_reason: reason });
    return data.policy;
  }

  // ─── SUSPEND ─────────────────────────────────────────────────────────────
  async suspend(agentId, reason = "Suspended by developer") {
    return this._request("POST", `/agents/${agentId}/suspend`, { reason });
  }

  // ─── REACTIVATE ──────────────────────────────────────────────────────────
  async reactivate(agentId, reason = "Human review completed") {
    return this._request("POST", `/agents/${agentId}/reactivate`, { reason });
  }

  // ─── RETIRE ──────────────────────────────────────────────────────────────
  async retire(agentId, reason = "Retired by developer") {
    return this._request("POST", `/agents/${agentId}/retire`, { reason });
  }

  // ─── VERIFY (PUBLIC) ─────────────────────────────────────────────────────
  async verify(agentId) {
    const res = await fetchWithTimeout(`${this.baseUrl}/verify/${agentId}`, {}, this.timeout);
    return res.json();
  }

  // ─── STATS ───────────────────────────────────────────────────────────────
  async stats() {
    const data = await this._request("GET", "/stats");
    return data.stats;
  }
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────
module.exports              = AIVIL;
module.exports.AIVIL        = AIVIL;
module.exports.default      = AIVIL;
module.exports.VERSION      = AIVIL_VERSION;
module.exports.AIVILError        = AIVILError;
module.exports.AIVILTimeoutError = AIVILTimeoutError;
module.exports.AIVILAuthError    = AIVILAuthError;
module.exports.AIVILPlanError    = AIVILPlanError;
