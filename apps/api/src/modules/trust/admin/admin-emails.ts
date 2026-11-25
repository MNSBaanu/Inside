import type { ConfigService } from '@nestjs/config';

export function webUrl(config: ConfigService) {
  const explicit = config.get<string>('WEB_URL');
  const origin = config.get<string>('CORS_ORIGIN')?.split(',')[0];
  return (explicit ?? origin ?? 'http://localhost:3000')
    .trim()
    .replace(/\/$/, '');
}

function layout(heading: string, body: string, cta: string, link: string) {
  return `<!doctype html><html><body style="margin:0;background:#FCF9F4;font-family:Arial,Helvetica,sans-serif;color:#1B2422">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#064530;padding:24px 32px;color:#FCF9F4;font-size:22px;font-weight:bold">Inside</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 12px;font-size:22px">${heading}</h1>
<p style="margin:0 0 24px;line-height:1.6;color:#6C7471">${body}</p>
<a href="${link}" style="display:inline-block;background:#064530;color:#FCF9F4;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:bold">${cta}</a>
<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#6C7471">If you were not expecting this, ignore this email.</p>
</td></tr></table></td></tr></table></body></html>`;
}

const safe = (name: string) => name.replace(/[<>&"]/g, '');

export function welcomeEmailHtml(name: string, link: string) {
  return layout(
    `Welcome, ${safe(name)}`,
    'An Inside account has been set up for you. Create your password with this email address to sign in.',
    'Create your password',
    link,
  );
}

export function passwordResetEmailHtml(name: string, link: string) {
  return layout(
    `Reset your password, ${safe(name)}`,
    'An Inside administrator has reset your password and signed you out. Set a new password with this email address to sign in again.',
    'Set a new password',
    link,
  );
}
