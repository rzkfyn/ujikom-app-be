import { createTransport, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

const {
  SMTP_SERVER,
  SMTP_PORT,
  SMTP_SENDER,
  SMTP_USER,
  SMTP_PASSWORD
} = process.env;

class MailService {
  private transport: Transporter<SMTPTransport.SentMessageInfo>;

  public constructor() {
    this.transport = createTransport({
      host: SMTP_SERVER,
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
    return await this.transport.sendMail({ 
      from: `No Reply ${SMTP_SENDER}`, to, subject, text, html
    });
  };
}

export default MailService;
