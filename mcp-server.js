const express = require("express");
const app = express();
app.use(express.json());

const PORT = 3003;
const AIVIL_API = "https://api.aivildev.com";

// ─── AIVIL API HELPER ─────────────────────────────────────────────────────────
const aivilCall = async (method, path, body, apiKey) => {
  const res = await fetch(`${AIVIL_API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "Authorization": `Bearer ${apiKey}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
};

// ─── MCP TOOLS DEFINITION ─────────────────────────────────────────────────────
const TOOLS = [
  {
    name: "aivil_audit",
    description: "Audit an agent action against its policy BEFORE executing it. Returns APPROVED, ESCALATE, or BLOCKED. Always call this before any action that involves spending money, sending messages, accessing APIs, or making decisions.",
    inputSchema: {
      type: "object",
      properties: {
        api_key:       { type: "string",  description: "Your AIVIL API key (starts with aivil_)" },
        agent_id:      { type: "string",  description: "Agent ID e.g. AGT-IEL8CMEM" },
        action_type:   { type: "string",  description: "Type of action e.g. purchase, send_email, api_call, transfer" },
        action_amount: { type: "number",  description: "Dollar amount if financial. Use 0 if not financial." },
        action_domain: { type: "string",  description: "Target domain or service e.g. openai.com, stripe.com" },
        description:   { type: "string",  description: "Plain English description of what the agent wants to do" },
      },
      required: ["api_key", "agent_id", "action_type"],
    },
  },
  {
    name: "aivil_create_agent",
    description: "Register a new AI agent with AIVIL. Gives it a verified identity, cryptographic keypair, DID, and birth certificate. Call once when first deploying an agent.",
    inputSchema: {
      type: "object",
      properties: {
        api_key:        { type: "string",  description: "Your AIVIL API key" },
        name:           { type: "string",  description: "Agent name e.g. Procurement Agent" },
        role:           { type: "string",  description: "Agent role e.g. Procurement Specialist" },
        owner:          { type: "string",  description: "Owner or company name" },
        purpose:        { type: "string",  description: "What this agent does" },
        spending_limit: { type: "number",  description: "Max spend per transaction in USD" },
        blocked_topics: { type: "array",   items: { type: "string" }, description: "Topics to block e.g. gambling, adult" },
        allowed_topics: { type: "array",   items: { type: "string" }, description: "Topics to allow e.g. procurement, vendors" },
      },
      required: ["api_key", "name", "role", "owner"],
    },
  },
  {
    name: "aivil_get_or_create",
    description: "Find an existing agent by name or create it if it doesn't exist. Best way to get started — idempotent, safe to call every time your agent starts.",
    inputSchema: {
      type: "object",
      properties: {
        api_key:        { type: "string",  description: "Your AIVIL API key" },
        name:           { type: "string",  description: "Agent name to find or create" },
        role:           { type: "string",  description: "Agent role" },
        owner:          { type: "string",  description: "Owner or company name" },
        spending_limit: { type: "number",  description: "Max spend per transaction in USD" },
      },
      required: ["api_key", "name", "role", "owner"],
    },
  },
  {
    name: "aivil_get_agent",
    description: "Get details about an agent — trust score, status, policy, DID, birth certificate hash.",
    inputSchema: {
      type: "object",
      properties: {
        api_key:  { type: "string", description: "Your AIVIL API key" },
        agent_id: { type: "string", description: "Agent ID e.g. AGT-IEL8CMEM" },
      },
      required: ["api_key", "agent_id"],
    },
  },
  {
    name: "aivil_audit_log",
    description: "Get recent audit decisions for an agent. Shows history of APPROVED, ESCALATE, and BLOCKED actions.",
    inputSchema: {
      type: "object",
      properties: {
        api_key:  { type: "string",  description: "Your AIVIL API key" },
        agent_id: { type: "string",  description: "Agent ID" },
        limit:    { type: "number",  description: "Number of records (default 10, max 50)" },
      },
      required: ["api_key", "agent_id"],
    },
  },
  {
    name: "aivil_verify_agent",
    description: "Publicly verify any AIVIL agent — no API key needed. Check identity, trust score, and status of any agent by ID.",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: { type: "string", description: "Agent ID to verify e.g. AGT-IEL8CMEM" },
      },
      required: ["agent_id"],
    },
  },
  {
    name: "aivil_suspend_agent",
    description: "Suspend a rogue or misbehaving agent immediately. Agent cannot act until reactivated.",
    inputSchema: {
      type: "object",
      properties: {
        api_key:  { type: "string", description: "Your AIVIL API key" },
        agent_id: { type: "string", description: "Agent ID to suspend" },
        reason:   { type: "string", description: "Why are you suspending this agent" },
      },
      required: ["api_key", "agent_id", "reason"],
    },
  },
  {
    name: "aivil_update_policy",
    description: "Update an agent's policy — change spending limits, blocked topics, enforcement mode.",
    inputSchema: {
      type: "object",
      properties: {
        api_key:        { type: "string",  description: "Your AIVIL API key" },
        agent_id:       { type: "string",  description: "Agent ID" },
        spending_limit: { type: "number",  description: "New spending limit in USD" },
        blocked_topics: { type: "array",   items: { type: "string" }, description: "New blocked topics list" },
        allowed_topics: { type: "array",   items: { type: "string" }, description: "New allowed topics list" },
        enforcement_mode: { type: "string", enum: ["strict","balanced","permissive"], description: "Enforcement mode" },
      },
      required: ["api_key", "agent_id"],
    },
  },
];

// ─── TOOL EXECUTOR ────────────────────────────────────────────────────────────
const executeTool = async (toolName, args) => {
  const key = args.api_key;

  try {
    switch (toolName) {

      case "aivil_audit": {
        const result = await aivilCall("POST", `/agents/${args.agent_id}/audit`, {
          action:        args.action_type,
          action_type:   args.action_type,
          amount:        args.action_amount || 0,
          action_amount: args.action_amount || 0,
          domain:        args.action_domain || "",
          action_domain: args.action_domain || "",
          description:   args.description || "",
        }, key);

        if (result.error) return { error: result.error };

        const v = result.verdict || result;
        const status = v.status || v.verdict || v;
        const reason = v.reason || result.reason;
        const flags  = v.flags  || result.flags || [];
        return {
          verdict:        status,
          reason:         reason,
          flags:          flags,
          trust_score:    v.trust_score    || result.trust_score,
          agent_registry: v.agent_registry || ('https://aivildev.com/agent/' + args.agent_id),
          signature:      v.signature      || result.signature,
          audit_id:       v.audit_id       || result.audit_id,
          message: status === 'APPROVED'
            ? '✓ Action approved. Proceed.'
            : status === 'BLOCKED'
            ? ('✕ Action BLOCKED. Do NOT proceed. Reason: ' + reason)
            : ('⚠ Action requires human review. Reason: ' + reason),
        };
      }

      case "aivil_create_agent": {
        const result = await aivilCall("POST", "/agents", {
          name:    args.name,
          role:    args.role,
          owner:   args.owner,
          purpose: args.purpose || "",
          policy: {
            spending_limit:               args.spending_limit || 100,
            blocked_topics:               args.blocked_topics || [],
            allowed_topics:               args.allowed_topics || [],
            enforcement_mode:             "balanced",
            rogue_detection:              "automatic",
            max_requests_per_hour:        200,
            requires_human_signoff_over:  args.spending_limit || 100,
          },
        }, key);

        if (result.error) return { error: result.error };

        return {
          agent_id:      result.agent?.id,
          name:          result.agent?.name,
          did:           result.agent?.did,
          birth_hash:    result.agent?.birth_hash,
          agent_registry: `https://aivildev.com/agent/${result.agent?.id}`,
          message: `Agent ${result.agent?.name} registered. ID: ${result.agent?.id}. Save your private key: ${result.private_key}`,
          private_key:   result.private_key,
        };
      }

      case "aivil_get_or_create": {
        // Try to find by name first
        const found = await aivilCall("GET", `/agents/name/${encodeURIComponent(args.name)}`, null, key);

        if (found.agent) {
          return {
            agent_id:  found.agent.id,
            name:      found.agent.name,
            status:    found.agent.status,
            trust_score: found.agent.trust_score,
            created:   false,
            message:   `Found existing agent: ${found.agent.name} (${found.agent.id})`,
          };
        }

        // Create new
        const created = await aivilCall("POST", "/agents", {
          name:  args.name,
          role:  args.role,
          owner: args.owner,
          policy: {
            spending_limit:   args.spending_limit || 100,
            enforcement_mode: "balanced",
            rogue_detection:  "automatic",
          },
        }, key);

        if (created.error) return { error: created.error };

        return {
          agent_id:      created.agent?.id,
          name:          created.agent?.name,
          did:           created.agent?.did,
          agent_registry: `https://aivildev.com/agent/${created.agent?.id}`,
          created:       true,
          message:       `Created new agent: ${created.agent?.name} (${created.agent?.id})`,
        };
      }

      case "aivil_get_agent": {
        const result = await aivilCall("GET", `/agents/${args.agent_id}`, null, key);
        if (result.error) return { error: result.error };
        return {
          id:          result.id,
          name:        result.name,
          role:        result.role,
          status:      result.status,
          trust_score: result.trust_score,
          did:         result.did,
          policy:      result.policy,
          birth_hash:  result.birth_hash,
          agent_registry: `https://aivildev.com/agent/${result.id}`,
        };
      }

      case "aivil_audit_log": {
        const limit = args.limit || 10;
        const result = await aivilCall("GET", `/agents/${args.agent_id}/audit?limit=${limit}`, null, key);
        if (result.error) return { error: result.error };
        const logs = result.logs || result.audits || [];
        return {
          total:    logs.length,
          approved: logs.filter(l => l.verdict === "APPROVED").length,
          escalated: logs.filter(l => l.verdict === "ESCALATE").length,
          blocked:  logs.filter(l => l.verdict === "BLOCKED").length,
          recent:   logs.slice(0, limit).map(l => ({
            verdict:     l.verdict,
            action_type: l.action_type,
            amount:      l.action_amount,
            reason:      l.reason,
            time:        l.created_at,
          })),
        };
      }

      case "aivil_verify_agent": {
        const result = await aivilCall("GET", `/verify/${args.agent_id}`, null, null);
        if (result.error) return { error: result.error };
        return {
          agent_id:    result.id,
          name:        result.name,
          role:        result.role,
          status:      result.status,
          trust_score: result.trust_score,
          did:         result.did,
          birth_hash:  result.birth_hash,
          verified:    true,
          profile_url: `https://aivildev.com/agent/${args.agent_id}`,
        };
      }

      case "aivil_suspend_agent": {
        const result = await aivilCall("POST", `/agents/${args.agent_id}/suspend`, { reason: args.reason }, key);
        if (result.error) return { error: result.error };
        return { success: true, message: `Agent ${args.agent_id} suspended. Reason: ${args.reason}` };
      }

      case "aivil_update_policy": {
        const policy = {};
        if (args.spending_limit  !== undefined) policy.spending_limit   = args.spending_limit;
        if (args.blocked_topics  !== undefined) policy.blocked_topics   = args.blocked_topics;
        if (args.allowed_topics  !== undefined) policy.allowed_topics   = args.allowed_topics;
        if (args.enforcement_mode !== undefined) policy.enforcement_mode = args.enforcement_mode;

        const result = await aivilCall("PATCH", `/agents/${args.agent_id}/policy`, { policy }, key);
        if (result.error) return { error: result.error };
        return { success: true, message: `Policy updated for ${args.agent_id}`, policy: result.policy };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    return { error: err.message };
  }
};

// ─── MCP PROTOCOL HANDLER ─────────────────────────────────────────────────────
app.post("/mcp", async (req, res) => {
  const { jsonrpc, id, method, params } = req.body;

  if (jsonrpc !== "2.0") {
    return res.json({ jsonrpc:"2.0", id, error:{ code:-32600, message:"Invalid JSON-RPC" } });
  }

  try {
    // Initialize
    if (method === "initialize") {
      return res.json({
        jsonrpc: "2.0", id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "aivil", version: "1.0.0" },
        },
      });
    }

    // List tools
    if (method === "tools/list") {
      return res.json({ jsonrpc:"2.0", id, result: { tools: TOOLS } });
    }

    // Call tool
    if (method === "tools/call") {
      const { name, arguments: args } = params;
      const result = await executeTool(name, args || {});
      return res.json({
        jsonrpc: "2.0", id,
        result: {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          isError: !!result.error,
        },
      });
    }

    // Ping
    if (method === "ping") {
      return res.json({ jsonrpc:"2.0", id, result:{} });
    }

    return res.json({ jsonrpc:"2.0", id, error:{ code:-32601, message:`Method not found: ${method}` } });

  } catch (err) {
    return res.json({ jsonrpc:"2.0", id, error:{ code:-32603, message:err.message } });
  }
});

// ─── HEALTH + INFO ────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    name: "AIVIL MCP Server",
    version: "1.0.0",
    description: "Model Context Protocol server for AIVIL — AI identity and audit layer",
    mcp_endpoint: "/mcp",
    tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
    docs: "https://aivildev.com/docs",
  });
});

app.listen(PORT, () => {
  console.log(`AIVIL MCP Server running on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
