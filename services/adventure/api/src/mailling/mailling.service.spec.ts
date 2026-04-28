import { MaillingService } from '@/mailling/mailling.service';
import { InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock modules
jest.mock('nodemailer');
jest.mock('fs/promises');
jest.mock('path');

describe('MaillingService', () => {
  let service: MaillingService;
  let mockCounter: any;
  let mockSendMail: jest.Mock;
  let mockReadFile: jest.Mock;
  let mockResolve: jest.Mock;

  beforeEach(() => {
    // Mock Prometheus counter
    mockCounter = {
      inc: jest.fn(),
    };

    // Mock nodemailer
    mockSendMail = jest.fn();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    // Mock fs.readFile
    mockReadFile = jest.fn();
    (fs.readFile as jest.Mock) = mockReadFile;

    // Mock path.resolve
    mockResolve = jest.fn((filePath) => filePath);
    (path.resolve as jest.Mock) = mockResolve;

    // Create service instance directly, bypassing NestJS injection
    service = new MaillingService(mockCounter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOTP', () => {
    describe('French locale (fr)', () => {
      it('should send OTP email in French', async () => {
        const htmlTemplate = '<html>{{username}} {{otp}}</html>';
        mockReadFile.mockResolvedValue(htmlTemplate);
        mockSendMail.mockResolvedValue({});

        await service.sendOTP('testuser', 'test@example.com', 123456, 'fr');

        expect(mockResolve).toHaveBeenCalledWith(
          'src/mailling/templates/otp/otpFr.html',
        );
        expect(mockReadFile).toHaveBeenCalledWith(
          'src/mailling/templates/otp/otpFr.html',
          'utf8',
        );

        expect(mockSendMail).toHaveBeenCalledWith({
          to: 'test@example.com',
          from: expect.stringContaining('No Reply'),
          subject: 'Votre code OTP',
          html: expect.stringContaining('testuser'),
        });

        const mailCall = mockSendMail.mock.calls[0][0];
        expect(mailCall.html).toContain('123456');

        expect(mockCounter.inc).toHaveBeenCalledWith({
          type: 'otp',
          status: 'success',
        });
      });
    });

    describe('Spanish locale (es)', () => {
      it('should send OTP email in Spanish', async () => {
        const htmlTemplate = '<html>{{username}} {{otp}}</html>';
        mockReadFile.mockResolvedValue(htmlTemplate);
        mockSendMail.mockResolvedValue({});

        await service.sendOTP('testuser', 'test@example.com', 123456, 'es');

        expect(mockResolve).toHaveBeenCalledWith(
          'src/mailling/templates/otp/otpEs.html',
        );

        expect(mockSendMail).toHaveBeenCalledWith({
          to: 'test@example.com',
          from: expect.stringContaining('No Reply'),
          subject: 'Su código OTP',
          html: expect.stringContaining('testuser'),
        });

        const mailCall = mockSendMail.mock.calls[0][0];
        expect(mailCall.html).toContain('123456');

        expect(mockCounter.inc).toHaveBeenCalledWith({
          type: 'otp',
          status: 'success',
        });
      });
    });

    describe('English locale (default)', () => {
      it('should send OTP email in English by default', async () => {
        const htmlTemplate = '<html>{{username}} {{otp}}</html>';
        mockReadFile.mockResolvedValue(htmlTemplate);
        mockSendMail.mockResolvedValue({});

        await service.sendOTP('testuser', 'test@example.com', 123456, 'en');

        expect(mockResolve).toHaveBeenCalledWith(
          'src/mailling/templates/otp/otpEn.html',
        );

        expect(mockSendMail).toHaveBeenCalledWith({
          to: 'test@example.com',
          from: expect.stringContaining('No Reply'),
          subject: 'Your OTP code',
          html: expect.stringContaining('testuser'),
        });

        const mailCall = mockSendMail.mock.calls[0][0];
        expect(mailCall.html).toContain('123456');

        expect(mockCounter.inc).toHaveBeenCalledWith({
          type: 'otp',
          status: 'success',
        });
      });

      it('should send OTP email in English for unknown locale', async () => {
        const htmlTemplate = '<html>{{username}} {{otp}}</html>';
        mockReadFile.mockResolvedValue(htmlTemplate);
        mockSendMail.mockResolvedValue({});

        await service.sendOTP('testuser', 'test@example.com', 123456, 'de');

        expect(mockResolve).toHaveBeenCalledWith(
          'src/mailling/templates/otp/otpEn.html',
        );

        expect(mockSendMail).toHaveBeenCalledWith({
          to: 'test@example.com',
          from: expect.stringContaining('No Reply'),
          subject: 'Your OTP code',
          html: expect.stringContaining('testuser'),
        });

        const mailCall = mockSendMail.mock.calls[0][0];
        expect(mailCall.html).toContain('123456');
      });
    });

    describe('OTP template replacement', () => {
      it('should replace all placeholders in OTP email', async () => {
        const htmlTemplate =
          '<html><p>Hello {{username}}</p><p>Code: {{otp}}</p></html>';
        mockReadFile.mockResolvedValue(htmlTemplate);
        mockSendMail.mockResolvedValue({});

        await service.sendOTP('john_doe', 'john@example.com', 987654, 'en');

        const mailCall = mockSendMail.mock.calls[0][0];
        expect(mailCall.html).toContain('john_doe');
        expect(mailCall.html).toContain('987654');
        expect(mailCall.html).not.toContain('{{username}}');
        expect(mailCall.html).not.toContain('{{otp}}');
      });

      it('should handle multiple placeholder occurrences', async () => {
        const htmlTemplate =
          '<html>{{username}} {{username}} {{otp}} {{otp}}</html>';
        mockReadFile.mockResolvedValue(htmlTemplate);
        mockSendMail.mockResolvedValue({});

        await service.sendOTP('user', 'test@example.com', 111111, 'en');

        const mailCall = mockSendMail.mock.calls[0][0];
        const userCount = (mailCall.html.match(/user/g) || []).length;
        const otpCount = (mailCall.html.match(/111111/g) || []).length;
        expect(userCount).toBeGreaterThanOrEqual(2);
        expect(otpCount).toBeGreaterThanOrEqual(2);
      });
    });

    describe('OTP error handling', () => {
      it('should throw InternalServerErrorException on file read error', async () => {
        mockReadFile.mockRejectedValue(new Error('File not found'));

        await expect(
          service.sendOTP('testuser', 'test@example.com', 123456, 'en'),
        ).rejects.toThrow(InternalServerErrorException);

        expect(mockCounter.inc).toHaveBeenCalledWith({
          type: 'otp',
          status: 'failure',
        });
      });

      it('should throw InternalServerErrorException on sendMail error', async () => {
        mockReadFile.mockResolvedValue('<html>{{username}} {{otp}}</html>');
        mockSendMail.mockRejectedValue(new Error('SMTP connection failed'));

        await expect(
          service.sendOTP('testuser', 'test@example.com', 123456, 'en'),
        ).rejects.toThrow(InternalServerErrorException);

        expect(mockCounter.inc).toHaveBeenCalledWith({
          type: 'otp',
          status: 'failure',
        });
      });

      it('should include email address in error message', async () => {
        const email = 'failing@example.com';
        mockReadFile.mockRejectedValue(new Error('Template error'));

        try {
          await service.sendOTP('user', email, 123456, 'en');
          fail('Should have thrown');
        } catch (error) {
          expect(error.message).toContain(email);
        }
      });
    });

    describe('OTP logging', () => {
      it('should log verbose message on successful send', async () => {
        mockReadFile.mockResolvedValue('<html>{{username}} {{otp}}</html>');
        mockSendMail.mockResolvedValue({});
        const loggerSpy = jest
          .spyOn(service['logger'], 'verbose')
          .mockImplementation();

        await service.sendOTP('testuser', 'test@example.com', 123456, 'en');

        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('Email send at test@example.com'),
          service['SERVICE_NAME'],
        );

        loggerSpy.mockRestore();
      });

      it('should log error message on failure', async () => {
        mockReadFile.mockRejectedValue(new Error('Template error'));
        const loggerSpy = jest
          .spyOn(service['logger'], 'error')
          .mockImplementation();

        await expect(
          service.sendOTP('testuser', 'test@example.com', 123456, 'en'),
        ).rejects.toThrow();

        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error while send otp code'),
          null,
          service['SERVICE_NAME'],
        );

        loggerSpy.mockRestore();
      });
    });

    describe('OTP SMTP configuration', () => {
      it('should configure SMTP transporter with environment variables', async () => {
        process.env.SMTP_HOST = 'smtp.example.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_SECURE = 'true';
        process.env.SMTP_USER = 'user@example.com';
        process.env.SMTP_PASSWORD = 'password123';

        mockReadFile.mockResolvedValue('<html>{{username}} {{otp}}</html>');
        mockSendMail.mockResolvedValue({});

        await service.sendOTP('testuser', 'test@example.com', 123456, 'en');

        expect(nodemailer.createTransport).toHaveBeenCalledWith({
          host: 'smtp.example.com',
          port: 587,
          secure: true,
          auth: {
            user: 'user@example.com',
            pass: 'password123',
          },
        });
      });
    });
  });

  describe('sendWelcomeEmail', () => {
    describe('Welcome email sending', () => {
      it('should send welcome email', async () => {
        const htmlTemplate =
          '<html>Welcome {{username}}, click here: {{activeLink}}</html>';
        mockReadFile.mockResolvedValue(htmlTemplate);
        mockSendMail.mockResolvedValue({});
        process.env.FRONTEND_URL = 'https://app.example.com';

        await service.sendWelcomeEmail(
          'testuser',
          'test@example.com',
          'activation_token_123',
        );

        expect(mockResolve).toHaveBeenCalledWith(
          'src/mailling/templates/welcome/welcomeEn.html',
        );

        expect(mockSendMail).toHaveBeenCalledWith({
          to: 'test@example.com',
          from: expect.stringContaining('No Reply'),
          subject: 'Welcome aboard',
          html: expect.stringContaining('testuser'),
        });

        const mailCall = mockSendMail.mock.calls[0][0];
        expect(mailCall.html).toContain(
          'https://app.example.com/auth/active/activation_token_123',
        );

        expect(mockCounter.inc).toHaveBeenCalledWith({
          type: 'welcome',
          status: 'success',
        });
      });
    });

    describe('Welcome email template replacement', () => {
      it('should replace username and activeLink placeholders', async () => {
        const htmlTemplate =
          '<html>Hi {{username}}, go to {{activeLink}}</html>';
        mockReadFile.mockResolvedValue(htmlTemplate);
        mockSendMail.mockResolvedValue({});
        process.env.FRONTEND_URL = 'https://app.example.com';

        await service.sendWelcomeEmail(
          'alice',
          'alice@example.com',
          'token_abc',
        );

        const mailCall = mockSendMail.mock.calls[0][0];
        expect(mailCall.html).toContain('alice');
        expect(mailCall.html).toContain(
          'https://app.example.com/auth/active/token_abc',
        );
        expect(mailCall.html).not.toContain('{{username}}');
        expect(mailCall.html).not.toContain('{{activeLink}}');
      });
    });

    describe('Welcome email error handling', () => {
      it('should throw InternalServerErrorException on file read error', async () => {
        mockReadFile.mockRejectedValue(new Error('Template not found'));

        await expect(
          service.sendWelcomeEmail('testuser', 'test@example.com', 'token_123'),
        ).rejects.toThrow(InternalServerErrorException);

        expect(mockCounter.inc).toHaveBeenCalledWith({
          type: 'welcome',
          status: 'failure',
        });
      });

      it('should throw InternalServerErrorException on sendMail error', async () => {
        mockReadFile.mockResolvedValue('<html>Welcome {{username}}</html>');
        mockSendMail.mockRejectedValue(new Error('SMTP failed'));

        await expect(
          service.sendWelcomeEmail('testuser', 'test@example.com', 'token_123'),
        ).rejects.toThrow(InternalServerErrorException);

        expect(mockCounter.inc).toHaveBeenCalledWith({
          type: 'welcome',
          status: 'failure',
        });
      });

      it('should include email address in error message', async () => {
        const email = 'failing@example.com';
        mockReadFile.mockRejectedValue(new Error('Read error'));

        try {
          await service.sendWelcomeEmail('user', email, 'token');
          fail('Should have thrown');
        } catch (error) {
          expect(error.message).toContain(email);
        }
      });
    });

    describe('Welcome email logging', () => {
      it('should log verbose message on successful send', async () => {
        mockReadFile.mockResolvedValue('<html>Welcome {{username}}</html>');
        mockSendMail.mockResolvedValue({});
        const loggerSpy = jest
          .spyOn(service['logger'], 'verbose')
          .mockImplementation();

        await service.sendWelcomeEmail('testuser', 'test@example.com', 'token');

        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('Welcome email sent to test@example.com'),
          service['SERVICE_NAME'],
        );

        loggerSpy.mockRestore();
      });

      it('should log error message on failure', async () => {
        mockReadFile.mockRejectedValue(new Error('Error'));
        const loggerSpy = jest
          .spyOn(service['logger'], 'error')
          .mockImplementation();

        await expect(
          service.sendWelcomeEmail('testuser', 'test@example.com', 'token'),
        ).rejects.toThrow();

        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error while sending welcome email'),
          null,
          service['SERVICE_NAME'],
        );

        loggerSpy.mockRestore();
      });
    });

    describe('Welcome email SMTP configuration', () => {
      it('should configure SMTP transporter with environment variables', async () => {
        process.env.SMTP_HOST = 'smtp.example.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_SECURE = 'false';
        process.env.SMTP_USER = 'user@example.com';
        process.env.SMTP_PASSWORD = 'password123';
        process.env.FRONTEND_URL = 'https://app.example.com';

        mockReadFile.mockResolvedValue('<html>Welcome {{username}}</html>');
        mockSendMail.mockResolvedValue({});

        await service.sendWelcomeEmail('testuser', 'test@example.com', 'token');

        expect(nodemailer.createTransport).toHaveBeenCalledWith(
          expect.objectContaining({
            host: 'smtp.example.com',
            port: 587,
            auth: {
              user: 'user@example.com',
              pass: 'password123',
            },
          }),
        );
      });
    });

    describe('Active link generation', () => {
      it('should generate correct active link with frontend URL', async () => {
        mockReadFile.mockResolvedValue('<html>{{activeLink}}</html>');
        mockSendMail.mockResolvedValue({});
        process.env.FRONTEND_URL = 'https://example.com';

        await service.sendWelcomeEmail('user', 'test@example.com', 'my_token');

        const mailCall = mockSendMail.mock.calls[0][0];
        expect(mailCall.html).toContain(
          'https://example.com/auth/active/my_token',
        );
      });
    });
  });
});
