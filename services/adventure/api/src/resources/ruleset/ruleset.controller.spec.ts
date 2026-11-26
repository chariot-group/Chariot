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
    (['findAll', 'findByKey', 'findById', 'findEntries'] as const).forEach(
      (method) => expect(isAdminRoute(method)).toBe(false),
    );
  });

  it('failure: a non-admin reading passes isAdmin=false to the service', async () => {
    const rulesetService = { findById: jest.fn() };
    const controller = new RulesetController(
      rulesetService as never,
      {} as never,
    );
    const id = {} as never;

    await controller.findById(
      { user: { keycloakId: 'u', realm_access: { roles: ['user'] } } },
      id,
    );

    expect(rulesetService.findById).toHaveBeenCalledWith(id, false);
  });
});
