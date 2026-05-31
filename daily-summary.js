require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

const sendDailySummary = async () => {
  console.log("Running daily summary...");

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: developers } = await supabase
    .from("developers")
    .select("id, email, name");

  if (!developers?.length) {
    console.log("No developers found");
    return;
  }

  for (const dev of developers) {
    const { data: logs } = await supabase
      .from("audit_log")
      .select("verdict, action_amount, action_domain, agent_id, created_at")
      .eq("developer_id", dev.id)
      .gte("created_at", yesterday.toISOString())
      .lte("created_at", today.toISOString());

    if (!logs?.length) {
      console.log(`No activity for ${dev.email} — skipping`);
      continue;
    }

    const approved = logs.filter(l => l.verdict === "APPROVED").length;
    const blocked = logs.filter(l => l.verdict === "BLOCKED").length;
    const escalated = logs.filter(l => l.verdict === "ESCALATE").length;
    const totalSpent = logs.reduce((sum, l) => sum + parseFloat(l.action_amount || 0), 0);

    const blockedReasons = {};
    logs.filter(l => l.verdict === "BLOCKED").forEach(l => {
      const d = l.action_domain || "unknown";
      blockedReasons[d] = (blockedReasons[d] || 0) + 1;
    });

    const topBlocked = Object.entries(blockedReasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([domain, count]) => `${domain} (${count}x)`)
      .join(", ");

    const approvalRate = Math.round((approved / logs.length) * 100);

    await resend.emails.send({
      from: "AIVIL <noreply@payloai.com>",
      to: dev.email,
      subject: `Your AI agents yesterday — ${logs.length} decisions, ${approvalRate}% approved`,
      html: `
        <div style="font-family:monospace;background:#04060c;color:#dde4f0;padding:40px;max-width:600px;">
          <div style="color:#c9a84c;font-size:22px;letter-spacing:4px;margin-bottom:4px;">AIVIL</div>
          <div style="color:#3d5070;font-size:10px;letter-spacing:3px;margin-bottom:32px;">DAILY AGENT REPORT</div>

          <div style="color:#7a90b8;font-size:12px;margin-bottom:24px;">
            ${new Date(yesterday).toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:28px;">
            <div style="background:#0a0e18;border:1px solid #151f30;border-radius:6px;padding:16px;text-align:center;">
              <div style="font-size:32px;color:#dde4f0;font-weight:300;">${logs.length}</div>
              <div style="font-size:10px;color:#3d5070;letter-spacing:2px;margin-top:4px;">TOTAL DECISIONS</div>
            </div>
            <div style="background:#0a0e18;border:1px solid #151f30;border-radius:6px;padding:16px;text-align:center;">
              <div style="font-size:32px;color:#c9a84c;font-weight:300;">$${totalSpent.toFixed(2)}</div>
              <div style="font-size:10px;color:#3d5070;letter-spacing:2px;margin-top:4px;">TOTAL SPENT</div>
            </div>
          </div>

          <div style="background:#0a0e18;border:1px solid #151f30;border-radius:6px;padding:16px;margin-bottom:24px;">
            <div style="font-size:10px;color:#3d5070;letter-spacing:2px;margin-bottom:12px;">VERDICT BREAKDOWN</div>
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
              <div style="width:${approvalRate}%;height:6px;background:#00d68f;border-radius:3px;min-width:4px;"></div>
              <div style="width:${Math.round((blocked/logs.length)*100)}%;height:6px;background:#ff4d6a;border-radius:3px;min-width:${blocked?4:0}px;"></div>
              <div style="width:${Math.round((escalated/logs.length)*100)}%;height:6px;background:#c9a84c;border-radius:3px;min-width:${escalated?4:0}px;"></div>
            </div>
            <div style="font-size:12px;color:#7a90b8;line-height:2;">
              <span style="color:#00d68f;">✓ ${approved} approved</span> &nbsp;
              <span style="color:#ff4d6a;">✕ ${blocked} blocked</span> &nbsp;
              <span style="color:#c9a84c;">⚠ ${escalated} escalated</span>
            </div>
          </div>

          ${blocked > 0 ? `
          <div style="background:#0a0e18;border:1px solid #ff4d6a33;border-radius:6px;padding:16px;margin-bottom:24px;">
            <div style="font-size:10px;color:#ff4d6a;letter-spacing:2px;margin-bottom:8px;">TOP BLOCKED</div>
            <div style="font-size:12px;color:#7a90b8;">${topBlocked}</div>
          </div>
          ` : ""}

          <a href="https://aivildev.com/app" style="display:block;text-align:center;background:#c9a84c;color:#04060c;padding:12px;border-radius:4px;text-decoration:none;font-size:11px;letter-spacing:2px;font-weight:700;margin-bottom:24px;">
            VIEW FULL AUDIT LOG →
          </a>

          <div style="color:#3d5070;font-size:10px;text-align:center;line-height:2;">
            AIVIL · Every agent. Verified. Accountable. Alive.<br>
            aivildev.com · You are receiving this because you have an AIVIL account
          </div>
        </div>
      `,
    });

    console.log(`Daily summary sent to ${dev.email}`);
  }

  console.log("Daily summary complete");
};

sendDailySummary().catch(console.error);
