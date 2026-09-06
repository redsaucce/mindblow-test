"""
MindBlow transactional email templates.

Email HTML has to be self-contained (table layout, inline styles) since
most clients (Gmail especially) strip <style> blocks, external stylesheets,
and JS. See inline comments for client-specific fallbacks (Outlook VML,
font fallback stack, etc).
"""


def _base_layout(*, preheader: str, body_html: str) -> str:
    """Wraps content in the shared MindBlow header/footer shell."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>MindBlow</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700&display=swap');
  /* Gmail strips this block entirely and falls back to the inline
     Helvetica/Arial stack below — expected, not a bug. Apple Mail,
     Outlook.com, and most other webmail/desktop clients honor it. */
</style>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f5; font-family:'DM Sans', Helvetica, Arial, sans-serif;">

  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
    {preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f5; padding:40px 0;">
    <tr>
      <td align="center">

        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px; max-width:90%; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.04);">

          <!-- Header band -->
          <tr>
            <td style="background-color:#059669; padding:24px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:'Plus Jakarta Sans', Helvetica, Arial, sans-serif; font-size:20px; font-weight:700; color:#ffffff; letter-spacing:-0.02em; vertical-align:middle;">
                    MindBlow
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body (content injected here) -->
          <tr>
            <td style="padding:36px 32px 12px 32px;">
              {body_html}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <div style="border-top:1px solid #e5e7eb;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px; line-height:1.6; color:#9ca3af; text-align:center;">
                    If you didn't request this, you can safely ignore this email.<br />
                    &copy; 2026 MindBlow &mdash; AI-powered quiz generation.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>"""


def render_magic_link_email(*, link: str, expire_minutes: int) -> str:
    """Branded sign-in / magic-link email."""
    body = f"""
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-family:'Plus Jakarta Sans', Helvetica, Arial, sans-serif; font-size:22px; font-weight:700; color:#111827; text-align:center; padding-top:8px; padding-bottom:10px;">
          Sign in to MindBlow
        </td>
      </tr>
      <tr>
        <td style="font-size:15px; line-height:1.6; color:#4b5563; text-align:center; padding-bottom:28px;">
          Click the button below to securely sign in. This link is only valid for the next {expire_minutes} minutes.
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:16px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="border-radius:10px; background-color:#059669; background-image:linear-gradient(135deg, #059669, #15803d);">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{link}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="20%" fillcolor="#059669" stroke="f">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Sign in to MindBlow</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a href="{link}"
                   style="display:inline-block; padding:14px 36px; font-family:'DM Sans', Helvetica, Arial, sans-serif; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:10px;">
                  Sign in to MindBlow
                </a>
                <!--<![endif]-->
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-bottom:20px;">
          <span style="display:inline-block; background-color:#ecfdf5; color:#047857; font-size:12px; font-weight:600; padding:5px 14px; border-radius:999px;">
            &#9201; Expires in {expire_minutes}:00
          </span>
        </td>
      </tr>
      <tr>
        <td style="font-size:13px; line-height:1.5; color:#9ca3af; text-align:center; padding-bottom:4px;">
          Or copy and paste this link into your browser:
        </td>
      </tr>
      <tr>
        <td style="font-size:12px; line-height:1.5; color:#047857; text-align:center; word-break:break-all; padding-bottom:8px;">
          {link}
        </td>
      </tr>
    </table>
    """
    return _base_layout(
        preheader=f"Your MindBlow sign-in link is ready — it expires in {expire_minutes} minutes.",
        body_html=body,
    )


def render_announcement_email(*, subject: str, message_html: str) -> str:
    """Branded general-purpose announcement email."""
    body = f"""
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="font-family:'Plus Jakarta Sans', Helvetica, Arial, sans-serif; font-size:22px; font-weight:700; color:#111827; text-align:center; padding-top:8px; padding-bottom:16px;">
          {subject}
        </td>
      </tr>
      <tr>
        <td style="font-size:15px; line-height:1.6; color:#4b5563; text-align:center; padding-bottom:16px;">
          {message_html}
        </td>
      </tr>
    </table>
    """
    return _base_layout(preheader=subject, body_html=body)