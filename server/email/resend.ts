/**
 * Resend Email Integration
 *
 * Email sending functionality using Resend API.
 * Requires RESEND_API_KEY environment variable.
 *
 * @see https://resend.com/docs
 */

import { Resend } from 'resend';

// Initialize Resend client (null if no API key)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Email send options
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Email send result
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  if (!resend) {
    console.warn('Resend API key not configured. Email not sent.');
    return {
      success: false,
      error: 'Email service not configured. Set RESEND_API_KEY environment variable.',
    };
  }

  try {
    const fromAddress = options.from || process.env.RESEND_FROM_EMAIL || 'noreply@nextmethod.ai';

    const result = await resend.emails.send({
      from: fromAddress,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error sending email';
    console.error('Email send error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!resend;
}

/**
 * Email template helpers
 */
export function wrapInTemplate(content: string, options?: { footer?: string }): string {
  const footer = options?.footer || 'Sent with NextMethod';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .content {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
    }
    .footer {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    ${footer}
  </div>
</body>
</html>
`;
}
