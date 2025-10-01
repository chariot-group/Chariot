import Stripe from 'stripe';
import { StripeService } from '@/resources/stripe/stripe.service';
import { UserService } from '@/resources/user/user.service';
import { Test, TestingModule } from '@nestjs/testing';
import { MaillingService } from '@/mailling/mailling.service';

describe('StripeService - verifySignature', () => {
  let stripeService: StripeService;
  let stripeMock: { webhooks: { constructEvent: jest.Mock } };

  const mockUserService = {} as UserService;
  const mockMaillingService = {} as MaillingService;

  beforeEach(() => {
    stripeMock = {
      webhooks: {
        constructEvent: jest.fn(),
      },
    };

    // On mocke la clé secrète Stripe (utilisée dans la méthode)
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';

    // On instancie le service normalement
    stripeService = new StripeService(mockUserService, mockMaillingService);

    // On injecte le mock de stripe
    (stripeService as any).stripe = stripeMock;
  });

  it('should call stripe.webhooks.constructEvent with correct args and return the event', () => {
    const mockPayload = Buffer.from('{"type":"event"}');
    const mockSignature = 'sig_test_123';
    const mockEvent = { id: 'evt_123', type: 'checkout.session.completed' };

    stripeMock.webhooks.constructEvent.mockReturnValue(mockEvent);

    const result = stripeService.verifySignature(mockPayload, mockSignature);

    expect(stripeMock.webhooks.constructEvent).toHaveBeenCalledWith(
      mockPayload,
      mockSignature,
      'whsec_test',
    );

    expect(result).toBe(mockEvent);
  });
});

describe('StripeService - handleEvent', () => {
  let service: StripeService;
  let userService: Partial<UserService>;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerLogSpy: jest.SpyInstance;

  beforeEach(async () => {
    userService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        { provide: UserService, useValue: userService },
        { provide: MaillingService, useValue: { sendWelcomeEmail: jest.fn() } },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);

    loggerErrorSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => { });
    loggerLogSpy = jest.spyOn((service as any).logger, 'log').mockImplementation(() => { });
  });

  it('should call handleCheckoutSessionCompleted when event is checkout.session.completed', async () => {
    const event: Stripe.Event = {
      id: 'evt_1',
      object: 'event',
      api_version: null,
      created: 0,
      data: {
        object: {} as Stripe.Checkout.Session,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'checkout.session.completed',
    };

    const spy = jest
      .spyOn(service as any, 'handleCheckoutSessionCompleted')
      .mockResolvedValue(undefined);

    await service.handleEvent(event);

    expect(spy).toHaveBeenCalledWith(event.data.object);
  });

  it('should call handleSubscriptionUpdated when event is customer.subscription.updated', async () => {
    const event: Stripe.Event = {
      id: 'evt_2',
      object: 'event',
      api_version: null,
      created: 0,
      data: {
        object: {} as Stripe.Subscription,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'customer.subscription.updated',
    };

    const spy = jest
      .spyOn(service as any, 'handleSubscriptionUpdated')
      .mockResolvedValue(undefined);

    await service.handleEvent(event);

    expect(spy).toHaveBeenCalledWith(event.data.object);
  });

  it('should log error for unhandled event type', async () => {
    const event: Stripe.Event = {
      id: 'evt_3',
      object: 'event',
      api_version: null,
      created: 0,
      data: {
        object: {} as any,
      },
      livemode: false,
      pending_webhooks: 0,
      request: null,
      type: 'invoice.paid',
    };

    await expect(service.handleEvent(event)).resolves.toBeUndefined();

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      `📦 Event non géré : ${event.type}`,
      null,
      (service as any).SERVICE_NAME,
    );
  });
});

describe('StripeService - handleCheckoutSessionCompleted', () => {
  let service: StripeService;
  let userService: Partial<UserService>;
  const sendWelcomeEmailMock = jest.fn();
  let maillingService: Partial<MaillingService> = {
    sendWelcomeEmail: sendWelcomeEmailMock,
  };
  let stripeMock: Partial<any>;
  const logSpy = jest.fn();

  beforeEach(() => {
    userService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    stripeMock = {
      customers: {
        retrieve: jest.fn(),
      },
      subscriptions: {
        retrieve: jest.fn(),
      },
    };

    service = new StripeService(userService as UserService, maillingService as MaillingService);
    (service as any).stripe = stripeMock;
    (service as any).logger = { log: logSpy };
  });

  it('should ignore non-subscription sessions', async () => {
    const session = { mode: 'payment' } as Stripe.Checkout.Session;

    await expect((service as any).handleCheckoutSessionCompleted(session)).resolves.toBeUndefined();
    expect(stripeMock.customers.retrieve).not.toHaveBeenCalled();
  });

  it('should process existing user and add subscription', async () => {
    const customer = { email: 'test@example.com', name: 'John Doe' };
    const user = {
      email: 'test@example.com',
      username: undefined,
      subscriptions: [],
      save: jest.fn(),
      _id: { toString: () => 'user_id_mock' },
    };

    const item = {
      price: {
        product: 'prod_123',
        id: 'price_123',
      },
      current_period_start: 1620000000,
      current_period_end: 1622592000,
    };

    (stripeMock.customers.retrieve as jest.Mock).mockResolvedValue(customer);
    (userService.findByEmail as jest.Mock).mockResolvedValue(user);
    (stripeMock.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      id: 'sub_123',
      items: { data: [item] },
    });

    const session = {
      mode: 'subscription',
      customer: 'cus_123',
      subscription: 'sub_123',
    } as any;

    await (service as any).handleCheckoutSessionCompleted(session);

    expect(user.subscriptions.length).toBe(1);
    expect(user.subscriptions[0]).toMatchObject({
      id: 'sub_123',
      productId: 'prod_123',
      priceId: 'price_123',
    });

    expect(user.save).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Abonnement ajouté à'), expect.any(String));

  });

  it('should create new user with custom field if provided', async () => {
    const customer = { email: 'new@example.com', name: 'Default Name' };
    const mockCreatedUser = {
      data: {
        email: 'new@example.com',
        username: 'CustomName',
        subscriptions: [],
        save: jest.fn(),
        _id: { toString: () => 'user_id_mock' },
      },
    };

    const item = {
      price: {
        product: 'prod_X',
        id: 'price_X',
      },
      current_period_start: 1600000000,
      current_period_end: 1602592000,
    };

    (stripeMock.customers.retrieve as jest.Mock).mockResolvedValue(customer);
    (userService.findByEmail as jest.Mock).mockResolvedValue(null);
    (userService.create as jest.Mock).mockResolvedValue(mockCreatedUser);
    (stripeMock.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      id: 'sub_X',
      items: { data: [item] },
    });

    const session = {
      mode: 'subscription',
      customer: 'cus_X',
      subscription: 'sub_X',
      custom_fields: [{ text: { value: 'CustomName' } }],
    } as any;

    await (service as any).handleCheckoutSessionCompleted(session);

    expect(userService.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'new@example.com',
      username: 'CustomName',
    }));

    expect(mockCreatedUser.data.subscriptions.length).toBe(1);
    expect(mockCreatedUser.data.save).toHaveBeenCalled();

    expect(maillingService.sendWelcomeEmail).toHaveBeenCalledWith(
      'CustomName',
      'new@example.com',
      expect.any(String)
    );
  });

  it('should fallback to customer.name if no custom_fields present', async () => {
    const customer = { email: 'new@example.com', name: 'Fallback Name' };
    const mockUser = {
      data: {
        email: 'new@example.com',
        username: 'Fallback Name',
        subscriptions: [],
        save: jest.fn(),
        _id: { toString: () => 'user_id_mock' },
      },
    };

    (stripeMock.customers.retrieve as jest.Mock).mockResolvedValue(customer);
    (userService.findByEmail as jest.Mock).mockResolvedValue(null);
    (userService.create as jest.Mock).mockResolvedValue(mockUser);
    (stripeMock.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      id: 'sub_fallback',
      items: { data: [{ price: { id: 'price', product: 'prod' }, current_period_start: 1, current_period_end: 2 }] },
    });

    const session = {
      mode: 'subscription',
      customer: 'cus_F',
      subscription: 'sub_fallback',
    } as any;

    await (service as any).handleCheckoutSessionCompleted(session);

    expect(userService.create).toHaveBeenCalledWith(expect.objectContaining({
      username: 'Fallback Name',
    }));

    expect(mockUser.data.save).toHaveBeenCalled();

    expect(maillingService.sendWelcomeEmail).toHaveBeenCalledWith(
      'Fallback Name',
      'new@example.com',
      expect.any(String)
    );
  });
});

describe('StripeService - handleSubscriptionUpdated', () => {
  let service: StripeService;
  let userService: Partial<UserService>;
  let maillingService: Partial<MaillingService>;
  let stripeMock: Partial<any>;
  let logger: any;

  beforeEach(() => {
    userService = {
      findByEmail: jest.fn(),
    };

    stripeMock = {
      customers: {
        retrieve: jest.fn(),
      },
    };

    logger = {
      error: jest.fn(),
      log: jest.fn(),
    };

    service = new StripeService(userService as UserService, maillingService as MaillingService);
    (service as any).stripe = stripeMock;
    (service as any).logger = logger;
  });

  const baseSubscription = {
    id: 'sub_abc',
    customer: 'cus_123',
    items: {
      data: [
        {
          price: {
            id: 'price_1',
            product: 'prod_1',
          },
          current_period_start: 1620000000,
          current_period_end: 1622592000,
        },
      ],
    },
  } as unknown as Stripe.Subscription;

  it('should log and return if user is not found', async () => {
    (stripeMock.customers.retrieve as jest.Mock).mockResolvedValue({ email: 'ghost@example.com' });
    (userService.findByEmail as jest.Mock).mockResolvedValue(null);

    await (service as any).handleSubscriptionUpdated(baseSubscription);

    expect(logger.error).toHaveBeenCalledWith(
      'Utilisateur introuvable pour ghost@example.com',
      null,
      'StripeService',
    );
  });

  it('should update expired_at if matching active subscription found', async () => {
    const now = new Date();
    const user = {
      email: 'user@example.com',
      subscriptions: [
        {
          id: 'sub_old',
          productId: 'prod_1',
          priceId: 'price_1',
          started_at: now,
          expired_at: new Date(now.getTime() + 1000000),
        },
      ],
      save: jest.fn(),
    };

    (stripeMock.customers.retrieve as jest.Mock).mockResolvedValue({ email: user.email });
    (userService.findByEmail as jest.Mock).mockResolvedValue(user);

    await (service as any).handleSubscriptionUpdated(baseSubscription);

    expect(user.subscriptions[0].expired_at.toISOString()).toBe(
      new Date(1622592000 * 1000).toISOString(),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('📦 Prolongation de l\'abonnement actif'),
      'StripeService',
    );
    expect(user.save).toHaveBeenCalled();
  });

  it('should close conflicting and add new subscription if different active one exists', async () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() + 1000000);
    const user = {
      email: 'user@example.com',
      subscriptions: [
        {
          id: 'sub_old',
          productId: 'prod_X',
          priceId: 'price_X',
          started_at: now,
          expired_at: oldDate,
        },
      ],
      save: jest.fn(),
    };

    (stripeMock.customers.retrieve as jest.Mock).mockResolvedValue({ email: user.email });
    (userService.findByEmail as jest.Mock).mockResolvedValue(user);

    await (service as any).handleSubscriptionUpdated(baseSubscription);

    // L’ancien est clôturé
    expect(user.subscriptions[0].expired_at <= new Date()).toBe(true);

    // Le nouveau est ajouté
    const newSub = user.subscriptions.find(s => s.id === 'sub_abc');
    expect(newSub).toBeDefined();
    expect(newSub.productId).toBe('prod_1');
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('📦 Nouvelle souscription enregistrée'),
      'StripeService',
    );
    expect(user.save).toHaveBeenCalled();
  });

  it('should add new subscription if no active one exists', async () => {
    const now = new Date();
    const user = {
      email: 'user@example.com',
      subscriptions: [
        {
          id: 'sub_old',
          productId: 'prod_2',
          priceId: 'price_2',
          started_at: new Date('2022-01-01'),
          expired_at: new Date('2022-12-31'),
        },
      ],
      save: jest.fn(),
    };

    (stripeMock.customers.retrieve as jest.Mock).mockResolvedValue({ email: user.email });
    (userService.findByEmail as jest.Mock).mockResolvedValue(user);

    await (service as any).handleSubscriptionUpdated(baseSubscription);

    expect(user.subscriptions.length).toBe(2);
    expect(user.subscriptions[1].id).toBe('sub_abc');
    expect(user.save).toHaveBeenCalled();
  });
});