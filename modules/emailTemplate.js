/**
 * emailTemplate.js
 * Generates a premium branded HTML email matching Xcelarate Studio's design system.
 * Design: dark black bg, Xcelarate logo (inline SVG), purple→blue gradient header,
 *         red #FF6B6B accent, Satoshi/Inter typography, responsive.
 */

/**
 * Build the full HTML email string.
 * @param {{ subject: string, email_body: string, business_name: string }} opts
 * @returns {string} Full HTML email
 */
export function buildEmailHtml({ subject, email_body, business_name }) {
  // Convert plain-text newlines → HTML line breaks
  const bodyHtml = email_body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0a0a0c;font-family:'Inter','Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Email wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0a0a0c;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);background-color:#111114;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a0a2e 0%,#0d0d20 50%,#0a0a1a 100%);padding:40px 40px 36px;text-align:center;position:relative;">
              
              <!-- Gradient blob (table-safe: using a border trick) -->
              <div style="position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:300px;height:300px;background:radial-gradient(circle,rgba(140,80,255,0.25) 0%,transparent 70%);pointer-events:none;"></div>

              <!-- Xcelarate SVG Logo -->
              <div style="margin-bottom:20px;display:inline-block;">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="52" height="52" style="display:block;">
                  <path d="M 72 20 L 52 40 L 52 60 L 72 80" stroke="#FF6B6B" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M 28 20 L 48 40 L 48 60 L 28 80" stroke="#16161D" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" transform="translate(6,6)"/>
                  <path d="M 28 20 L 48 40 L 48 60 L 28 80" stroke="#5064FF" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>

              <!-- Studio Label -->
              <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.45);">Xcelarate AI Studio</p>

              <!-- Subject line as hero heading -->
              <h1 style="margin:0;font-size:26px;font-weight:800;line-height:1.2;color:#ffffff;letter-spacing:-0.5px;">${subject}</h1>

              <!-- Gradient divider -->
              <div style="margin:28px auto 0;height:2px;width:80px;background:linear-gradient(90deg,#8C50FF,#5064FF);border-radius:2px;"></div>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="padding:36px 40px 32px;background-color:#111114;">
              <p style="margin:0 0 24px;font-size:16px;line-height:1.75;color:#d4d4d8;">${bodyHtml}</p>

              <!-- Subtle divider -->
              <div style="height:1px;background:rgba(255,255,255,0.06);margin:0 0 28px;"></div>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius:50px;background:linear-gradient(135deg,#8C50FF,#5064FF);">
                    <a href="mailto:growth@xcelaratestudio.space?subject=Re: ${encodeURIComponent(subject)}"
                       style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;border-radius:50px;">
                      Reply to Rounak →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background-color:#0d0d10;padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#ffffff;">Rounak Paul</p>
                    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);">Founder · Xcelarate AI Studio</p>
                  </td>
                  <td align="right" valign="middle">
                    <a href="https://xcelaratestudio.space" style="font-size:12px;color:#8C50FF;text-decoration:none;font-weight:500;">xcelaratestudio.space</a>
                  </td>
                </tr>
              </table>

              <!-- Anti-spam / unsubscribe note -->
              <p style="margin:16px 0 0;font-size:11px;color:rgba(255,255,255,0.22);line-height:1.6;">
                You're receiving this because your work caught our attention. This is a genuine, human-written outreach — not spam. 
                If you'd prefer not to hear from us, simply reply with "unsubscribe".
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

        <!-- Bottom brand -->
        <p style="margin:20px 0 0;font-size:11px;color:rgba(255,255,255,0.18);text-align:center;letter-spacing:0.1em;">POWERED BY XCELARATE AI STUDIO</p>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Convert an HTML email body to a plain-text fallback.
 * @param {string} email_body
 * @returns {string}
 */
export function buildEmailText(email_body) {
  return [
    email_body,
    "",
    "──",
    "Rounak Paul | Founder, Xcelarate AI Studio",
    "growth@xcelaratestudio.space | https://xcelaratestudio.space",
    "",
    "If you'd prefer not to hear from us, reply with 'unsubscribe'.",
  ].join("\n");
}
