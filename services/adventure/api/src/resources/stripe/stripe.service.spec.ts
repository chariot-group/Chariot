import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from '@/resources/stripe/stripe.service';
import { UserService } from '@/resources/user/user.service';

jest.mock('@/resources/user/user.service', () => ({
  UserService: class UserService {
    addTokens = jest.fn();
  },
}));

describe('StripeService', () => {
  let service: StripeService;
  let userService: UserService;

  beforeEach(async () => {
    process.env.STRIPE_SECRET_KEY =
      process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
    process.env.STRIPE_WEBHOOK_SECRET =
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: UserService,
          useClass: UserService,
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add tokens based on purchased quantity for checkout.session.completed', async () => {
    const stripeClient = (service as any).stripe;

    jest.spyOn(stripeClient.webhooks, 'constructEvent').mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: {
            userId: 'user-1',
            tokenAmount: '100',
          },
        },
      },
    } as any);

    jest
      .spyOn(stripeClient.checkout.sessions, 'listLineItems')
      .mockResolvedValue({
        data: [{ quantity: 3 }],
      } as any);

    await service.handleWebhook(Buffer.from('payload'), 'sig_test');

    expect(userService.addTokens).toHaveBeenCalledWith('user-1', 300);
  });

  it('should fallback to quantity 1 when checkout session has no id', async () => {
    const stripeClient = (service as any).stripe;

    jest.spyOn(stripeClient.webhooks, 'constructEvent').mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: {
            userId: 'user-2',
            tokenAmount: '50',
          },
        },
      },
    } as any);

    await service.handleWebhook(Buffer.from('payload'), 'sig_test');

    expect(userService.addTokens).toHaveBeenCalledWith('user-2', 50);
  });
});
