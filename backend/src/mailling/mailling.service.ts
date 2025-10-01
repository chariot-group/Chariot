import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class MaillingService {
  private readonly SERVICE_NAME = MaillingService.name;
  private readonly logger = new Logger(this.SERVICE_NAME);

  async sendOTP(username: string, email: string, otp: number, local: string) {
    try {
      let transporter: nodemailer.Transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Boolean(process.env.SMTP_SECURE),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      let infos: { subjetct: string; template: string } = null;
      switch (local) {
        case 'fr':
          infos = {
            subjetct: 'Votre code OTP',
            template: 'otpFr',
          };
          break;
        case 'es':
          infos = {
            subjetct: 'Su código OTP',
            template: 'otpEs',
          };
          break;
        default:
          infos = {
            subjetct: 'Your OTP code',
            template: 'otpEn',
          };
          break;
      }

      const html = await fs.readFile(
        path.resolve(`src/mailling/templates/otp/${infos.template}.html`),
        'utf8',
      );

      await transporter.sendMail({
        to: email,
        from: `"No Reply" <${process.env.RECEIVER_EMAIL}>`,
        subject: infos.subjetct,
        html: html
          .replaceAll('{{username}}', username)
          .replaceAll('{{otp}}', otp.toString()),
      });

      this.logger.verbose(
        `Email send at ${email} in ${local}`,
        this.SERVICE_NAME,
      );
    } catch (error) {
      const message = `Error while send otp code at ${email}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }

  async sendWelcomeEmail(username: string, email: string, activeLink: string) {
    try {
      let transporter: nodemailer.Transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Boolean(process.env.SMTP_SECURE),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      let infos: { subjetct: string; template: string } = {
        subjetct: 'Welcome aboard',
        template: 'welcomeEn',
      };

      const html = await fs.readFile(
        path.resolve(`src/mailling/templates/welcome/${infos.template}.html`),
        'utf8',
      );

      await transporter.sendMail({
        to: email,
        from: `"No Reply" <${process.env.RECEIVER_EMAIL}>`,
        subject: infos.subjetct,
        html: html
          .replaceAll('{{username}}', username)
          .replaceAll('{{activeLink}}', `${process.env.FRONTEND_URL}/auth/active/${activeLink}`),
      });

      this.logger.verbose(
        `Welcome email sent to ${email} in default language (en)`,
        this.SERVICE_NAME,
      );
    } catch (error) {
      const message = `Error while sending welcome email to ${email}: ${error.message}`;
      this.logger.error(message, null, this.SERVICE_NAME);
      throw new InternalServerErrorException(message);
    }
  }
}
