import { Test, TestingModule } from '@nestjs/testing';
import { StripeController } from '@/resources/stripe/stripe.controller';
import { StripeService } from '@/resources/stripe/stripe.service';
import { Request, Response } from 'express';

describe('StripeController - handleWebhook', () => {
  let controller: StripeController;
  let stripeService: { verifySignature: jest.Mock; handleEvent: jest.Mock };
  let loggerErrorSpy: jest.SpyInstance;

  interface RawRequest extends Request {
    rawBody: Buffer;
  }

  beforeEach(async () => {
    stripeService = {
      verifySignature: jest.fn(),
      handleEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        { provide: StripeService, useValue: stripeService },
      ],
    }).compile();

    controller = module.get<StripeController>(StripeController);

    loggerErrorSpy = jest
      .spyOn((controller as any).logger, 'error')
      .mockImplementation(() => { });
  });

  it('should verify signature and handle event successfully', async () => {
    const mockEvent = { id: 'evt_123', type: 'checkout.session.completed' };
    stripeService.verifySignature.mockReturnValue(mockEvent);

    const req = {
      rawBody: Buffer.from('some raw body'),
    } as RawRequest;

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status } as unknown as Response;

    await controller['handleWebhook'](req, res, 'sig_test');

    expect(stripeService.verifySignature).toHaveBeenCalledWith(req.rawBody, 'sig_test');
    expect(stripeService.handleEvent).toHaveBeenCalledWith(mockEvent);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ received: true });
  });

  it('should return 400 and log error if signature verification fails', async () => {
    const error = new Error('Invalid signature');
    stripeService.verifySignature.mockImplementation(() => {
      throw error;
    });

    const req = {
      rawBody: Buffer.from('bad body'),
    } as unknown as Request;

    const send = jest.fn();
    const status = jest.fn(() => ({ send }));
    const res = { status } as unknown as Response;

    await controller['handleWebhook'](req, res, 'bad_sig');

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Webhook signature verification failed'),
      error,
      'StripeController',
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(send).toHaveBeenCalledWith(expect.stringContaining('Webhook signature verification failed'));
  });
});