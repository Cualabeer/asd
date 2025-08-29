import fetch from "node-fetch";

export const sendSlackAlert = async (message) => {
  const { SLACK_WEBHOOK_URL } = process.env;

  if (!SLACK_WEBHOOK_URL) {
    console.warn("⚠️ Slack alert skipped: Missing SLACK_WEBHOOK_URL in environment variables.");
    return;
  }

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
    console.log("💬 Slack alert sent");
  } catch (err) {
    console.error(`❌ Failed to send Slack alert: ${err.message}`);
  }
};