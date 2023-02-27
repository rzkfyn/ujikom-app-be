import { createTransport, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import 'dotenv/config';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SENDER,
  SMTP_USER,
  SMTP_PASSWORD,
  CMSAPPBASEURL
} = process.env;

class MailService {
  private transporter: Transporter<SMTPTransport.SentMessageInfo>;

  constructor() {
    this.transporter = createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD
      }
    } as SMTPTransport.Options);
  }

  public sendMail = async ({ to, subject, text, html }: {
    to: string, subject: string, text?: string | undefined, html?: string | undefined
  }) => {
    await this.transporter.sendMail({ 
      from: `No Reply <${SMTP_SENDER}>`, to, subject, text, html
    });
  };

  public sendEmailVerificationCode = async ({ to, username, verificationCode }: {
    to: string, username: string, verificationCode: string
  }) => {
    await this.sendMail({
      to,
      subject: 'Email Verification Code',
      // text: `Hello ${username}!\n\nuse this code to verify your email: ${verificationCode}`,
      html: `<div><a href="${CMSAPPBASEURL}/verifyemail/${verificationCode}">Click this link to verify your email<a><div>`
    });
  };
}

export default MailService;
