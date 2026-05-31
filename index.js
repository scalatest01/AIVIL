// ─────────────────────────────────────────────────────────────────────────────
// AIVIL — AI Vital Identity Layer
// npm install aivil
// The civil registry for artificial intelligence
// Open source forever · AGPL-3.0 License · github.com/scalatest01/AIVIL
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

const AIVIL_VERSION  = "2.1.4";
const DEFAULT_API    = "https://api.aivildev.com";
const REGISTRY_BASE  = "https://aivildev.com";

// ─── SHOW STARTUP MESSAGE ─────────────────────────────────────────────────────
if (!process.env.AIVIL_KEY && !process.env.AIVIL_API_KEY) {
  console.log(`
  ╔════════════════════════════════════════╗
  ║           AIVIL v${AIVIL_VERSION}                ║
  ║   The Civil Registry for AI Agents    ║
  ╠════════════════════════════════════════╣
  ║                                        ║
  ║  ⚠  NO API KEY DETECTED               ║
  ║                                        ║
  ║  Try it instantly (demo mode):         ║
  ║  const aivil = new AIVIL({            ║
  ║    apiKey: "aivil_demo"               ║
  ║  })                                    ║
  ║                                        ║
  ║  Get your free key in 30 seconds:     ║
  ║  → https://aivildev.com/signup        ║
  ║                                        ║
  ╚════════════════════════════════════════╝
`);
}

// ─── MAIN CLASS ───────────────────────────────────────────────────────────────
class AIVIL {
  constructor(config = {}) {
    this.apiKey  = config.apiKey
      || process.env.AIVIL_API_KEY
      || process.env.AIVIL_KEY
      || "";
    this.baseUrl = config.baseUrl || DEFAULT_API;

    if (!this.apiKey) {
      throw new Error(
        "\n\n  AIVIL: No API key provided.\n" +
        "  Get your free key at: https://aivildev.com/signup\n" +
        "  Then use: new AIVIL({ apiKey: 'aivil_your_key' })\n"
      );
    }
  }

  // ─── HTTP HELPER ────────────────────────────────────────────────────────────
  async _request(method, path, body) {
    const fetch = globalThis.fetch || (await import("node-fetch").then(m => m.default).catch(() => {
      throw new Error("AIVIL: fetch is not available. Use Node.js 18+ or install node-fetch.");
    }));

    const url = `${this.baseUrl}${path}`;
    const opts = {
      method,
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
        "User-Agent":    `aivil-sdk/${AIVIL_VERSION}`,
      },
    };
    if (body) opts.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(url, opts);
    } catch (e) {
      throw new Error(`AIVIL: Cannot connect to ${this.baseUrl}. Check your internet connection. (${e.message})`);
    }

    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error(`AIVIL: Server returned non-JSON response (status ${res.status})`);
    }

    if (!res.ok) {
      throw new Error(`AIVIL: ${data.error || `HTTP ${res.status}`}`);
    }

    return data;
  }

  // ─── CREATE AGENT ───────────────────────────────────────────────────────────
  /**
   * Register a new AI agent with AIVIL.
   * Creates a permanent verified identity with cryptographic keypair,
   * DID document, birth certificate, and policy engine.
   *
   * @param {Object} config
   * @param {string} config.name         - Agent name e.g. "Prometheus"
   * @param {string} config.role         - Agent role e.g. "Procurement Specialist"
   * @param {string} config.owner        - Owner name e.g. "Acme Corp"
   * @param {string} config.purpose      - What this agent does
   * @param {string} config.jurisdiction - "Delaware_USA" | "EU_GDPR" | "UK_GDPR" | "Singapore"
   * @param {Object} config.policy       - Policy configuration
   * @returns {Promise<{agent, privateKeyJwk}>}
   */
  async createAgent(config) {
    const data = await this._request("POST", "/agents", config);
    return {
      agent:         data.agent,
      privateKeyJwk: data.agent?.private_key || null,
      warning:       data.warning,
    };
  }

  // ─── GET OR CREATE AGENT ────────────────────────────────────────────────────
  /**
   * Find an existing agent by name or create it if it doesn't exist.
   * Idempotent — safe to call on every startup.
   *
   * @param {Object} config - Same as createAgent
   * @returns {Promise<{agent, created}>}
   */
  async getOrCreate(config) {
    if (!config.name) throw new Error("AIVIL: getOrCreate requires config.name");

    // Try to find existing agent by name
    try {
      const data = await this._request("GET", `/agents/name/${encodeURIComponent(config.name)}`);
      if (data.agent) {
        return { agent: data.agent, created: false };
      }
    } catch (e) {
      // Not found — create it
    }

    const { agent } = await this.createAgent(config);
    return { agent, created: true };
  }

  // ─── LIST AGENTS ────────────────────────────────────────────────────────────
  /**
   * List all agents registered under your API key.
   * @returns {Promise<Array>}
   */
  async listAgents() {
    const data = await this._request("GET", "/agents");
    return data.agents || [];
  }

  // ─── GET AGENT ──────────────────────────────────────────────────────────────
  /**
   * Get a specific agent by ID.
   * @param {string} agentId
   * @returns {Promise<Object>}
   */
  async getAgent(agentId) {
    const data = await this._request("GET", `/agents/${agentId}`);
    return data.agent;
  }

  // ─── AUDIT ──────────────────────────────────────────────────────────────────
  /**
   * Audit an agent action BEFORE executing it.
   * Call this before EVERY action your agent takes.
   * Every decision is logged to your dashboard in real time.
   *
   * @param {string} agentId  - Agent ID e.g. "AGT-A3F8C2E1"
   * @param {Object} action   - The action to audit
   * @param {string} action.type        - "purchase" | "web_search" | "send_email" | "api_call" | ...
   * @param {number} action.amount      - USD amount (0 if not financial)
   * @param {string} action.domain      - Target domain e.g. "openai.com"
   * @param {string} action.description - Plain English description
   * @returns {Promise<{status, reason, flags, signature, audit_id, agent_registry, trust_score}>}
   *
   * @example
   * const verdict = await aivil.audit("AGT-XXX", {
   *   type: "purchase", amount: 50,
   *   domain: "openai.com", description: "Buy API credits"
   * })
   * if (verdict.status === "APPROVED") executeAction()
   * if (verdict.status === "ESCALATE") notifyHuman(verdict.reason)
   * if (verdict.status === "BLOCKED")  logAndStop(verdict.reason)
   */
  async audit(agentId, action) {
    const data = await this._request("POST", `/agents/${agentId}/audit`, { action });
    return data.verdict;
  }

  // ─── GET AUDIT LOG ──────────────────────────────────────────────────────────
  /**
   * Get recent audit decisions for an agent.
   * @param {string} agentId
   * @param {number} limit - Max results (default 50, max 200)
   * @param {string} before - ISO timestamp cursor for pagination
   * @returns {Promise<Array>}
   */
  async getAuditLog(agentId, limit = 50, before = null) {
    let path = `/agents/${agentId}/audit?limit=${limit}`;
    if (before) path += `&before=${encodeURIComponent(before)}`;
    const data = await this._request("GET", path);
    return data.logs || [];
  }

  // ─── UPDATE POLICY ──────────────────────────────────────────────────────────
  /**
   * Update an agent's policy.
   * Note: Can only be changed once every 24 hours.
   * @param {string} agentId
   * @param {Object} policy - Fields to update
   * @param {string} reason - Why you're changing it (logged permanently)
   * @returns {Promise<Object>}
   */
  async updatePolicy(agentId, policy, reason = "Policy update") {
    const data = await this._request("PATCH", `/agents/${agentId}/policy`, { policy, change_reason: reason });
    return data.policy;
  }

  // ─── SUSPEND ────────────────────────────────────────────────────────────────
  /**
   * Suspend an agent. All future audit calls return BLOCKED.
   * @param {string} agentId
   * @param {string} reason
   */
  async suspend(agentId, reason = "Suspended by developer") {
    return this._request("POST", `/agents/${agentId}/suspend`, { reason });
  }

  // ─── REACTIVATE ─────────────────────────────────────────────────────────────
  /**
   * Reactivate a suspended agent after human review.
   * @param {string} agentId
   * @param {string} reason
   */
  async reactivate(agentId, reason = "Human review completed") {
    return this._request("POST", `/agents/${agentId}/reactivate`, { reason });
  }

  // ─── RETIRE ─────────────────────────────────────────────────────────────────
  /**
   * Permanently retire an agent. Cannot be undone.
   * Full audit history preserved forever.
   * @param {string} agentId
   * @param {string} reason
   */
  async retire(agentId, reason = "Retired by developer") {
    return this._request("POST", `/agents/${agentId}/retire`, { reason });
  }

  // ─── VERIFY (PUBLIC) ────────────────────────────────────────────────────────
  /**
   * Publicly verify any agent — no API key needed for this.
   * Useful for third parties to verify an agent's identity.
   * @param {string} agentId
   * @returns {Promise<Object>}
   */
  async verify(agentId) {
    const fetch = globalThis.fetch || (await import("node-fetch").then(m => m.default).catch(() => null));
    if (!fetch) throw new Error("AIVIL: fetch not available");
    const res = await fetch(`${this.baseUrl}/verify/${agentId}`);
    return res.json();
  }

  // ─── STATS ──────────────────────────────────────────────────────────────────
  /**
   * Get usage statistics for your account.
   * @returns {Promise<Object>}
   */
  async stats() {
    const data = await this._request("GET", "/stats");
    return data.stats;
  }
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────
module.exports = AIVIL;
module.exports.AIVIL   = AIVIL;
module.exports.default = AIVIL;
module.exports.VERSION = AIVIL_VERSION;
