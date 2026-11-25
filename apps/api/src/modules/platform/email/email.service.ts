import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {}

  /** Sends through Resend. Returns false (and logs) when it is not configured or the send fails. */
  async send(to: string, subject: string, html: string): Promise<boolean> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('EMAIL_FROM');
    if (!apiKey || !from) {
      this.logger.warn(
        'RESEND_API_KEY or EMAIL_FROM is not set; email not sent',
      );
      return false;
    }
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, html }),
      });
      if (!response.ok) {
        this.logger.error(`Resend rejected the email (${response.status})`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(`Email send failed: ${String(error)}`);
      return false;
    }
  }
}
