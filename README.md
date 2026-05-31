# 🛡️ Policy Engine

> **AI agents are like kids — they work hard but don't know right from wrong. Policy Engine is the parent that sets the rules, controls the spending, and makes sure they don't do anything they shouldn't.**

---

## The Problem

You've built an AI agent. It's smart, fast, and works 24/7.
 
But it has no idea that:
- It shouldn't spend $2,000 on a software subscription without asking
- It shouldn't touch a crypto exchange API
- It shouldn't delete customer data without human approval
- It needs to follow different rules in Europe vs the US

Right now, most developers handle this with custom code hacked together for each project. There's no standard. No shared tooling. Every team reinvents the same safety layer from scratch.

**Policy Engine is that standard.**

---

## How It Works

Think of your system like a family:

- 👨‍💼 **The Developer** — the father. Goes to work, builds things, makes money.
- 🤖 **The Agent** — the kid. Works hard but doesn't know right from wrong.
- 🛡️ **Policy Engine** — the mother. Sets the rules, watches what the kids do, and steps in when they're about to do something they shouldn't.

Every time an agent wants to take an action, it checks with Policy Engine first.

Policy Engine looks at the rules and returns one of three answers:

| Verdict | Meaning |
|---|---|
| ✅ **APPROVED** | Go ahead. Everything checks out. |
| ⚠️ **ESCALATE** | Stop. A human needs to review this first. |
| ❌ **BLOCKED** | Absolutely not. This violates the rules. |

---

## The Policy File

Every agent gets a **Red-Line JSON** — a simple file that defines exactly what it's allowed to do:

```json
{
  "role": "Procurement_Agent",
  "spending_limit": 100.00,
  "restricted_domains": ["*.crypto", "*.gambling"],
  "requires_human_signoff_over": 50.00,
  "legal_jurisdiction": "Delaware_USA",
  "allowed_actions": ["search_vendor", "request_quote", "submit_po"],
  "max_requests_per_hour": 200
}
```

That's it. No complex configuration. No infrastructure to manage. Just a JSON file that your agent reads before it acts.

---

## Real Examples

**Agent wants to buy $30 of API credits**
```
✅ APPROVED — under spending limit, domain not restricted, action allowed
```

**Agent wants to buy an $80 software license**
```
⚠️ ESCALATE — over the $50 human signoff threshold. Waiting for approval.
```

**Agent tries to call a crypto exchange API**
```
❌ BLOCKED — *.crypto is a restricted domain. Action never executes.
```

**Agent tries to delete customer records**
```
⚠️ ESCALATE — data deletion requires human signoff regardless of amount.
```

---

## Why This Matters Now

AI agents are being deployed by thousands of companies today. Most have **zero standardized controls** on what those agents are allowed to do.

This is the same moment as the early internet — everyone building fast, nobody thinking about what happens when it goes wrong.

Policy Engine is the safety layer the agent ecosystem needs before it can be trusted with real responsibility.

---

## Live Demo

Try the interactive Policy Engine — build a policy, fire test actions, and watch the AI Auditor make real decisions:

👉 **[Try the Demo →](https://aivil-lake.vercel.app/)**

---

## Getting Started

```bash
npm install policy-engine
```

```javascript
import { audit } from 'policy-engine'

const policy = {
  role: "Procurement_Agent",
  spending_limit: 100.00,
  restricted_domains: ["*.crypto", "*.gambling"],
  requires_human_signoff_over: 50.00,
}

const action = {
  type: "purchase",
  amount: 30,
  domain: "openai.com",
  description: "Buy API credits"
}

const verdict = await audit(policy, action)
// { status: "APPROVED", reasoning: "...", flags: [] }
```

---

## Roadmap

- [x] Policy definition standard (Red-Line JSON)
- [x] AI-powered Auditor Agent
- [x] Interactive demo
- [ ] npm package
- [ ] Persistent audit log
- [ ] Agent Identity Registry
- [ ] Budget ledger (cumulative spend tracking)
- [ ] Human escalation webhooks
- [ ] Multi-agent trust handshake

---

## Philosophy

Policy Engine is and will always be **open source**.

Agent identity and spending controls are too important to be owned by one company. This should be a community standard — like HTTP, like OAuth — not a product.

If you're building AI agents and have opinions about how this should work, open an issue. This gets better when more people who feel the problem help shape the solution.

---

## Contributing

This project is in early development. The best contribution right now is feedback.

- Are you building agents? **[Tell us what controls you need →](#)**
- Found a bug? **Open an issue**
- Want to contribute code? **PRs welcome — read CONTRIBUTING.md first**

---

## Documentation
Full docs at [aivildev.com/docs](https://aivildev.com/docs)

## License

AIVIL is open source under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).

**What this means:**
- ✅ Free to use personally and internally
- ✅ Free to build AI agents with AIVIL
- ✅ Free to modify and contribute back
- ⚠️ If you run AIVIL as a hosted service, you must open source your changes

**Commercial License**

If you need to use AIVIL in a proprietary product or hosted service
without the AGPL obligations — a commercial license is available.

Contact: ihimanshu882@gmail.com

---

*AIVIL — Every agent. Verified. Accountable. Alive.*
*[aivildev.com](https://aivildev.com)*

*Built for---who are building the machine economy — and want to make sure it doesn't go sideways.*
