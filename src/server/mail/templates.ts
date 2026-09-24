export type EmailMessage = { to: string; subject: string; text: string; html: string };

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

function render(options: {
  to: string;
  subject: string;
  greeting: string;
  paragraphs: string[];
  action: { label: string; url: string };
  closing: string;
}): EmailMessage {
  const { to, subject, greeting, paragraphs, action, closing } = options;
  const text = [
    greeting,
    "",
    ...paragraphs.flatMap((p) => [p, ""]),
    `${action.label}: ${action.url}`,
    "",
    closing,
    "",
    "BizConnect Rwanda",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#fdfaf6;font-family:Arial,Helvetica,sans-serif;color:#1a1208;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e4d8c8;border-radius:12px;padding:32px;">
    <p style="margin:0 0 24px;font-weight:bold;color:#c8410a;">BizConnect Rwanda</p>
    <p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
    ${paragraphs.map((p) => `<p style="margin:0 0 16px;line-height:1.5;">${escapeHtml(p)}</p>`).join("\n    ")}
    <p style="margin:24px 0;">
      <a href="${escapeHtml(action.url)}" style="display:inline-block;background:#c8410a;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px;">${escapeHtml(action.label)}</a>
    </p>
    <p style="margin:0 0 16px;font-size:13px;color:#5e4330;line-height:1.5;">If the button doesn't work, copy this link into your browser:<br><span style="word-break:break-all;">${escapeHtml(action.url)}</span></p>
    <p style="margin:24px 0 0;font-size:13px;color:#5e4330;">${escapeHtml(closing)}</p>
  </div>
</body>
</html>`;

  return { to, subject, text, html };
}

export function verificationEmail(user: { email: string; name: string }, url: string) {
  return render({
    to: user.email,
    subject: "Confirm your email for BizConnect Rwanda",
    greeting: `Muraho ${user.name},`,
    paragraphs: [
      "Thanks for creating an account. Please confirm this is your email address so you can sign in.",
      "The link works for 24 hours.",
    ],
    action: { label: "Confirm my email", url },
    closing: "If you didn't create an account, you can ignore this email.",
  });
}

export function resetPasswordEmail(user: { email: string; name: string }, url: string) {
  return render({
    to: user.email,
    subject: "Reset your BizConnect Rwanda password",
    greeting: `Muraho ${user.name},`,
    paragraphs: [
      "Someone asked to reset the password for your account. If it was you, choose a new password below.",
      "The link works for 1 hour. Once you've set a new password, any other signed-in devices are signed out.",
    ],
    action: { label: "Choose a new password", url },
    closing: "If you didn't ask for this, you can ignore this email. Your password won't change.",
  });
}

export function existingAccountEmail(user: { email: string; name: string }, siteUrl: string) {
  return render({
    to: user.email,
    subject: "Someone tried to register with your email",
    greeting: `Muraho ${user.name},`,
    paragraphs: [
      "Someone just tried to create a new BizConnect Rwanda account with this email address, but you already have one.",
      "If it was you, sign in instead. If you've forgotten your password, you can reset it from the sign-in page.",
    ],
    action: { label: "Sign in", url: new URL("/login", siteUrl).toString() },
    closing:
      "If it wasn't you, no action is needed. Nobody can use your account without your password.",
  });
}
