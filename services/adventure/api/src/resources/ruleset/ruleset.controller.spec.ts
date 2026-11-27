import { IS_ADMIN_KEY } from '@/common/decorators/is-admin.decorator';
import { RulesetController } from '@/resources/ruleset/ruleset.controller';

const isAdminRoute = (method: keyof RulesetController) =>
  Reflect.getMetadata(IS_ADMIN_KEY, RulesetController.prototype[method]) ===
  true;

describe('FR-ruleset-character-builder — RulesetController access', () => {
  it('nominal: every write route requires the admin role', () => {
    (
      [
        'create',
        'update',
        'remove',
        'publish',
        'archive',
        'createVersion',
        'createEntry',
        'updateEntry',
        'removeEntry',
      ] as const
    ).forEach((method) => expect(isAdminRoute(method)).toBe(true));
  });

  it('edge: read routes stay available to any authenticated user', () => {
    (
      [
        'findAll',
        'findByKey',
        'findById',
        'findEntries',
        'findCatalog',
      ] as const
    ).forEach((method) => expect(isAdminRoute(method)).toBe(false));
  });

  it('failure: a non-admin reading passes isAdmin=false to the service', async () => {
    const rulesetService = { findById: jest.fn() };
    const controller = new RulesetController(
      rulesetService as never,
      {} as never,
      {} as never,
    );
    const id = {} as never;

    await controller.findById(
      { user: { keycloakId: 'u', realm_access: { roles: ['user'] } } },
      id,
    );

    expect(rulesetService.findById).toHaveBeenCalledWith(id, false);
  });

  describe('findCatalog', () => {
    const response = () => ({ setHeader: jest.fn(), status: jest.fn() });
    const user = { keycloakId: 'u', realm_access: { roles: ['user'] } };
    const controllerWith = (catalog: object) =>
      new RulesetController(
        {} as never,
        { getCatalog: jest.fn().mockResolvedValue(catalog) } as never,
        {} as never,
      );

    it('nominal: a published catalog is returned with an ETag and an immutable cache', async () => {
      const res = response();
      const result = await controllerWith({
        etag: '"abc"',
        entries: [{ key: 'elf' }],
      }).findCatalog({ user, headers: {} }, res as never, {} as never);

      expect(result).toEqual({
        message: 'Ruleset catalog found',
        data: [{ key: 'elf' }],
      });
      expect(res.setHeader).toHaveBeenCalledWith('ETag', '"abc"');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'private, max-age=31536000, immutable',
      );
    });

    it('edge: a matching If-None-Match answers 304 without body', async () => {
      const res = response();
      const result = await controllerWith({
        etag: '"abc"',
        entries: [],
      }).findCatalog(
        { user, headers: { 'if-none-match': '"abc"' } },
        res as never,
        {} as never,
      );

      expect(result).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(304);
    });

    it('failure guard: a draft catalog is never cached', async () => {
      const res = response();
      await controllerWith({ etag: null, entries: [] }).findCatalog(
        { user, headers: {} },
        res as never,
        {} as never,
      );

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
      expect(res.setHeader).not.toHaveBeenCalledWith('ETag', expect.anything());
    });
  });
});
