import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StripeController } from '@/resources/stripe/stripe.controller';
import { StripeService } from '@/resources/stripe/stripe.service';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

jest.mock('@/resources/user/user.service', () => ({
  UserService: class UserService {
    addTokens = jest.fn();
  },
}));

describe('StripeController', () => {
  let controller: StripeController;
  let stripeService: { createCheckoutSession: jest.Mock; handleWebhook: jest.Mock };

  beforeEach(async () => {
    stripeService = {
      createCheckoutSession: jest.fn(),
      handleWebhook: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        {
          provide: StripeService,
          useValue: stripeService,
        },
      ],
    }).compile();

    controller = module.get<StripeController>(StripeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create checkout session with authenticated keycloak user id', async () => {
    const dto = {
      packId: 'pack_123',
      displayName: 'Starter Pack',
    };
    const request = { user: { keycloakId: 'kc-user-1' } };
    const expectedResponse = { message: 'ok', data: 'https://stripe.test/session' };

    stripeService.createCheckoutSession.mockResolvedValue(expectedResponse);

    const result = await controller.createCheckout(request, dto);

    expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(dto, 'kc-user-1');
    expect(result).toEqual(expectedResponse);
  });

  it('should throw bad request when webhook raw body is missing', async () => {
    const request = { rawBody: undefined };

    await expect(
      controller.handleWebhook(request as any, 'sig_test'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(stripeService.handleWebhook).not.toHaveBeenCalled();
  });

  it('should mark webhook route as public', () => {
    const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller.handleWebhook);

    expect(isPublic).toBe(true);
  });
});
