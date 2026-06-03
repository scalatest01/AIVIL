# AIVIL — AI Vital Identity Layer

> The civil registry for artificial intelligence.

Give every AI agent a **verified identity**, **spending controls**, and a **tamper-proof audit trail**.

[![npm version](https://img.shields.io/npm/v/aivil)](https://npmjs.com/package/aivil)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Install

```bash
npm install aivil
```

## Quick Start

```js
const AIVIL = require('aivil')

const aivil = new AIVIL({ apiKey: process.env.AIVIL_API_KEY })

// Get or create agent — safe to call on every startup
const { agent } = await aivil.getOrCreate({
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

// Audit BEFORE every action
const verdict = await aivil.audit(agent.id, {
  type: "purchase",
  amount: 30,
  domain: "openai.com",
  description: "Buy API credits for data processing"
})

if (verdict.status === "APPROVED")  executeAction()
if (verdict.status === "ESCALATE")  notifyHuman(verdict.reason)
if (verdict.status === "BLOCKED")   logAndStop(verdict.reason)
```

## Features

- **Verified identity** — Every agent gets a real EC P-256 keypair + W3C DID
- **Policy engine** — Spending limits, blocked domains, allowed topics
- **Audit trail** — Every decision logged, HMAC-signed, tamper-proof
- **Live dashboard** — See every decision in real time at aivildev.com/app
- **MCP support** — Zero-code Claude integration via mcp.aivildev.com/mcp
- **Rogue detection** — Auto-suspend agents that violate policy repeatedly
- **Fallback mode** — Never crashes your agent if AIVIL is unreachable

## Configuration

```js
const aivil = new AIVIL({
  apiKey:   process.env.AIVIL_API_KEY,   // required
  timeout:  8000,                         // ms (default: 8000)
  retries:  2,                            // retry attempts (default: 2)
  fallback: "escalate",                   // if unreachable: "escalate"|"approve"|"block"
  debug:    false,                        // log all requests
})
```

## Error Handling

```js
const { AIVILAuthError, AIVILPlanError, AIVILTimeoutError } = require('aivil')

try {
  const verdict = await aivil.audit(agent.id, action)
} catch (e) {
  if (e instanceof AIVILAuthError)    console.error("Invalid API key")
  if (e instanceof AIVILPlanError)    console.error("Plan limit —", e.upgradeUrl)
  if (e instanceof AIVILTimeoutError) console.error("Request timed out")
}
```

## MCP Server (Claude)

Add to Claude Desktop config — zero code required:

```json
{
  "mcpServers": {
    "aivil": { "url": "https://mcp.aivildev.com/mcp" }
  }
}
```

## Links

- **Docs:** https://aivildev.com/docs
- **Dashboard:** https://aivildev.com/app
- **Sign up free:** https://aivildev.com/signup
- **GitHub:** https://github.com/scalatest01/AIVIL

## License

MIT — Free to use. If you run it as a hosted service, open source your changes.  
Commercial license available: ihimanshu882@gmail.com
