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
        body: JSON.stringify({ from, to, subject, text }),
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
