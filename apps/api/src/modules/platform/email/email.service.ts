import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  webUrl(path: string) {
    const base = (this.config.get<string>('CORS_ORIGIN') ?? '')
      .split(',')[0]
      .trim()
      .replace(/\/$/, '');
    return `${base}${path}`;
  }

  private html(text: string) {
    const body = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(
        /(https?:\/\/[^\s&]+(?:&amp;[^\s&]+)*)/g,
        '<a href="$1" style="color:#111">$1</a>',
      )
      .replace(/\n/g, '<br>');
    return `<div style="max-width:560px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">
<img src="${this.webUrl('/logo-email.png')}" alt="Inside" width="120" style="display:block;margin:0 auto 24px">
<p>${body}</p>
</div>`;
  }

  async send(to: string, subject: string, text: string) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('EMAIL_FROM');
    if (this.config.get<string>('NODE_ENV') === 'test') return false;
    if (!apiKey || !from) {
      this.logger.warn(`Email not configured; skipped "${subject}"`);
      return false;
    }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          text,
          html: this.html(text),
        }),
      });
      if (!res.ok) {
        this.logger.error(
          `Email "${subject}" failed: ${res.status} ${await res.text()}`,
        );
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(`Email "${subject}" failed: ${String(error)}`);
      return false;
    }
  }
}
