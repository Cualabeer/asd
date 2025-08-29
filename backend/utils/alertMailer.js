import nodemailer from "nodemailer";

export const sendEmailAlert = async (subject, message) => {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, ALERT_EMAIL_RECIPIENT } = process.env;

  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !ALERT_EMAIL_RECIPIENT) {
    console.warn("⚠️ Email alert skipped: Missing email configuration in environment variables.");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT),
      secure: false,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"Mobile Mechanic Alerts" <${EMAIL_USER}>`,
      to: ALERT_EMAIL_RECIPIENT,
      subject,
      text: message,
    });

    console.log(`📧 Email alert sent: ${subject}`);
  } catch (err) {
    console.error(`❌ Failed to send email alert: ${err.message}`);
  }
};