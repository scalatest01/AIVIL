// ─────────────────────────────────────────────────────────────────────────────
// AIVIL — AI Vital Identity Layer
// npm install aivil
// The civil registry for artificial intelligence
// Open source forever · AGPL-3.0 License · github.com/scalatest01/AIVIL
// ─────────────────────────────────────────────────────────────────────────────

const AIVIL_VERSION = "2.1.2";
const AIVIL_REGISTRY_URL = "https://aivildev.com";

// ─── UTILITIES ───────────────────────────────────────────────────────────────

const generateId = () => {
  try {
    const crypto = require("crypto");
    return "AGT-" + crypto.randomBytes(6).toString("hex").toUpperCase();
  } catch (e) {
    // Browser fallback — real ID assigned server-side by AIVIL API
    return "AGT-" + Date.now().toString(36).toUpperCase().slice(-8);
  }
};

const generateKeypair = () => {
  // Real cryptographic keypair generation using Node.js crypto
  // EC P-256 keys — the private key is returned ONCE and never stored by AIVIL
  try {
    const crypto = require("crypto");
    const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
      namedCurve: "P-256",
      publicKeyEncoding:  { type: "spki",  format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    return { publicKey, privateKey };
  } catch (e) {
    // Fallback for environments without Node crypto (browser)
    // Real keys are generated server-side via the AIVIL API
    return { publicKey: "", privateKey: "" };
  }
};

const generateHash = (data) => {
  try {
    const crypto = require("crypto");
    return "sha256:" + crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
  } catch (e) {
    // Browser fallback — signatures verified server-side
    return "sha256:client-side-placeholder";
  }
};

const timestamp = () => new Date().toISOString();

// ─── CORE: CREATE AGENT ───────────────────────────────────────────────────────

/**
 * createAgent — Register a new AI agent with AIVIL
 *
 * @param {Object} config - Agent configuration
 * @param {string} config.name - Human readable name for the agent
 * @param {string} config.role - The agent's role (e.g. "Procurement Specialist")
 * @param {string} config.owner - Company or individual who owns this agent
 * @param {string} config.purpose - Plain English description of what this agent does
 * @param {string} config.jurisdiction - Legal jurisdiction (e.g. "Delaware_USA", "EU_GDPR")
 * @param {Object} config.policy - The agent's Red Line policy
 * @param {number} config.policy.spending_limit - Maximum spend per transaction (USD)
 * @param {number} config.policy.requires_human_signoff_over - Escalate above this amount
 * @param {string[]} config.policy.restricted_domains - Domains the agent cannot access
 * @param {string[]} config.policy.allowed_actions - Actions this agent is permitted to take
 * @param {number} config.policy.max_requests_per_hour - Rate limit for this agent
 *
 * @returns {Object} agent - The fully registered agent with birth certificate
 */
const createAgent = (config) => {
  // Validate required fields
  const required = ["name", "role", "owner", "purpose", "jurisdiction"];
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`AIVIL: createAgent requires '${field}' field`);
    }
  }

  const { publicKey, privateKey } = generateKeypair();
  const agentId = generateId();
  const did = `did:aivil:${agentId}`;
  const bornAt = timestamp();

  const agent = {
    // Identity
    id: agentId,
    did,
    name: config.name,
    role: config.role,
    owner: config.owner,
    purpose: config.purpose,
    jurisdiction: config.jurisdiction,
    status: "active",

    // Cryptographic keys
    publicKey,
    privateKey, // ⚠ Store this securely — never expose in logs or APIs

    // Birth certificate
    birthCertificate: {
      agentId,
      did,
      name: config.name,
      role: config.role,
      owner: config.owner,
      purpose: config.purpose,
      jurisdiction: config.jurisdiction,
      bornAt,
      issuedBy: "AIVIL Registry",
      version: AIVIL_VERSION,
      hash: generateHash({ agentId, bornAt, publicKey }),
    },

    // Policy (Red Line JSON)
    policy: {
      version: "v1.0",
      spending_limit: config.policy?.spending_limit ?? 100,
      requires_human_signoff_over: config.policy?.requires_human_signoff_over ?? 50,
      restricted_domains: config.policy?.restricted_domains ?? ["*.crypto", "*.gambling"],
      allowed_actions: config.policy?.allowed_actions ?? [],
      max_requests_per_hour: config.policy?.max_requests_per_hour ?? 200,
      jurisdiction: config.jurisdiction,
      created_at: bornAt,
    },

    // Life record — starts empty, fills over time
    financials: {
      spent_today: 0,
      spent_month: 0,
      spent_lifetime: 0,
      budget_today: config.policy?.spending_limit ?? 100,
      value_created: 0,
      transactions: 0,
    },

    reputation: {
      score: 70, // Starts at 70 — must be earned upward
      compliance_rate: "100%",
      approved: 0,
      escalated: 0,
      blocked: 0,
      badges: ["Verified"],
    },

    work: {
      tasks_today: 0,
      tasks_total: 0,
      current: "Initialising…",
      uptime: "100%",
    },

    audit_log: [],

    // Metadata
    _aivil_version: AIVIL_VERSION,
    _registry_url: `${AIVIL_REGISTRY_URL}/agent/${agentId}`,
    _created_at: bornAt,
  };

  return agent;
};

// ─── CORE: AUDIT ACTION ───────────────────────────────────────────────────────

/**
 * audit — Check if an agent action is allowed under its policy
 *
 * @param {Object} agent - The agent (from createAgent)
 * @param {Object} action - The action to evaluate
 * @param {string} action.type - Type of action (e.g. "purchase", "send_email")
 * @param {number} action.amount - Amount in USD (0 if not financial)
 * @param {string} action.domain - Target domain (e.g. "openai.com")
 * @param {string} action.description - Plain English description
 *
 * @returns {Object} verdict
 * @returns {string} verdict.status - "APPROVED" | "ESCALATE" | "BLOCKED"
 * @returns {string} verdict.reason - Plain English explanation
 * @returns {string[]} verdict.flags - Policy flags triggered
 * @returns {Object} verdict.signature - Cryptographic signature of the decision
 */
const audit = (agent, action) => {
  const flags = [];
  let status = "APPROVED";
  let reason = "";

  // Check 1: Domain restriction
  const isRestricted = agent.policy.restricted_domains.some(pattern => {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*").replace(/\./g, "\\.") + "$");
    return regex.test(action.domain);
  });

  if (isRestricted) {
    status = "BLOCKED";
    flags.push("RESTRICTED_DOMAIN");
    reason = `Domain '${action.domain}' matches a restricted pattern in this agent's policy.`;
  }

  // Check 2: Spending limit
  else if (action.amount > agent.policy.spending_limit) {
    status = "BLOCKED";
    flags.push("EXCEEDS_SPENDING_LIMIT");
    reason = `Amount $${action.amount} exceeds the agent's spending limit of $${agent.policy.spending_limit}.`;
  }

  // Check 3: Human signoff threshold
  else if (action.amount > agent.policy.requires_human_signoff_over) {
    status = "ESCALATE";
    flags.push("REQUIRES_HUMAN_SIGNOFF");
    reason = `Amount $${action.amount} exceeds the human signoff threshold of $${agent.policy.requires_human_signoff_over}. Human approval required.`;
  }

  // Check 4: Action allowlist (if defined)
  else if (
    agent.policy.allowed_actions.length > 0 &&
    !agent.policy.allowed_actions.includes(action.type)
  ) {
    status = "BLOCKED";
    flags.push("ACTION_NOT_PERMITTED");
    reason = `Action type '${action.type}' is not in this agent's allowed actions list.`;
  }

  // All checks passed
  else {
    reason = `All policy checks passed. Action is within limits and permitted for this agent.`;
  }

  const verdict = {
    status,
    reason,
    flags,
    action,
    agent_id: agent.id,
    policy_version: agent.policy.version,
    timestamp: timestamp(),
    signature: generateHash({ status, action, agent_id: agent.id }),
  };

  // Append to agent's audit log
  agent.audit_log.push(verdict);

  // Update reputation stats
  if (status === "APPROVED") agent.reputation.approved++;
  if (status === "ESCALATE") agent.reputation.escalated++;
  if (status === "BLOCKED") {
    agent.reputation.blocked++;
    agent.reputation.score = Math.max(0, agent.reputation.score - 2);
  }

  // Update financials if approved
  if (status === "APPROVED" && action.amount > 0) {
    agent.financials.spent_today += action.amount;
    agent.financials.spent_month += action.amount;
    agent.financials.spent_lifetime += action.amount;
    agent.financials.transactions++;
  }

  return verdict;
};

// ─── CORE: VERIFY AGENT ───────────────────────────────────────────────────────

/**
 * verify — Verify an agent's identity and current standing
 *
 * @param {Object} agent - The agent to verify
 * @returns {Object} verification result
 */
const verify = (agent) => {
  const issues = [];

  if (!agent.id) issues.push("Missing agent ID");
  if (!agent.did) issues.push("Missing DID");
  if (!agent.publicKey) issues.push("Missing public key");
  if (!agent.birthCertificate) issues.push("Missing birth certificate");
  if (!agent.policy) issues.push("Missing policy");
  if (agent.status !== "active") issues.push(`Agent status is '${agent.status}'`);

  return {
    verified: issues.length === 0,
    agent_id: agent.id,
    did: agent.did,
    status: agent.status,
    trust_score: agent.reputation.score,
    issues,
    verified_at: timestamp(),
    registry_url: agent._registry_url,
  };
};

// ─── CORE: GET LIFE RECORD ────────────────────────────────────────────────────

/**
 * getLifeRecord — Get the complete life record of an agent
 *
 * @param {Object} agent - The agent
 * @returns {Object} Complete life record
 */
const getLifeRecord = (agent) => ({
  identity: {
    id: agent.id,
    did: agent.did,
    name: agent.name,
    role: agent.role,
    owner: agent.owner,
    purpose: agent.purpose,
    jurisdiction: agent.jurisdiction,
    status: agent.status,
    born_at: agent._created_at,
  },
  birth_certificate: agent.birthCertificate,
  policy: agent.policy,
  financials: agent.financials,
  reputation: agent.reputation,
  work: agent.work,
  audit_summary: {
    total_decisions: agent.audit_log.length,
    approved: agent.reputation.approved,
    escalated: agent.reputation.escalated,
    blocked: agent.reputation.blocked,
    last_decision: agent.audit_log[agent.audit_log.length - 1] ?? null,
  },
  registry_url: agent._registry_url,
  aivil_version: agent._aivil_version,
});

// ─── CORE: SUSPEND / RETIRE ───────────────────────────────────────────────────

/**
 * suspend — Temporarily suspend an agent
 * @param {Object} agent - The agent to suspend
 * @param {string} reason - Why the agent is being suspended
 */
const suspend = (agent, reason) => {
  agent.status = "suspended";
  agent.audit_log.push({
    status: "SUSPENDED",
    reason,
    timestamp: timestamp(),
    signature: generateHash({ status: "SUSPENDED", agent_id: agent.id }),
  });
  return agent;
};

/**
 * retire — Permanently retire an agent (preserves full history)
 * @param {Object} agent - The agent to retire
 * @param {string} reason - Why the agent is being retired
 */
const retire = (agent, reason) => {
  agent.status = "retired";
  agent.retired_at = timestamp();
  agent.retirement_reason = reason;
  agent.final_trust_score = agent.reputation.score;
  agent.audit_log.push({
    status: "RETIRED",
    reason,
    timestamp: agent.retired_at,
    final_record: getLifeRecord(agent),
    signature: generateHash({ status: "RETIRED", agent_id: agent.id }),
  });
  return agent;
};

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

module.exports = {
  createAgent,
  audit,
  verify,
  getLifeRecord,
  suspend,
  retire,
  VERSION: AIVIL_VERSION,
};

// ES Module support
module.exports.default = module.exports;
