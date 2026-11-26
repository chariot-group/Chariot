import type UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import {
  buildUserNameCleanupReport,
  planUserNameCleanup,
  runUserNameCleanup,
} from '@/scripts/user-names-cleanup/user-names-cleanup';

const user = (
  id: string,
  firstName?: string,
  lastName?: string,
  extra: Partial<UserRepresentation> = {},
): UserRepresentation => ({
  id,
  username: `u-${id}`,
  email: `${id}@example.com`,
  firstName,
  lastName,
  ...extra,
});

describe('FR-user-profile-keycloak — user names cleanup script', () => {
  describe('planUserNameCleanup', () => {
    it('nominal: plans case and whitespace fixes', () => {
      const plan = planUserNameCleanup(user('1', '  JEAN-pierre ', 'dupont'));
      expect(plan.status).toBe('fixable');
      expect(plan.changes).toEqual({
        firstName: 'Jean-Pierre',
        lastName: 'Dupont',
      });
    });

    it('edge: already normalized names are ok, service accounts skipped', () => {
      expect(planUserNameCleanup(user('1', 'Jean', 'Dupont')).status).toBe(
        'ok',
      );
      expect(
        planUserNameCleanup(
          user('2', '1', '1', { serviceAccountClientId: 'chariot-app' }),
        ).status,
      ).toBe('skipped');
    });

    it('failure: flags invalid and missing names without proposing a value', () => {
      const plan = planUserNameCleanup(user('1', 'Jean2', undefined));
      expect(plan.status).toBe('irregular');
      expect(plan.issues).toEqual({
        firstName: 'invalid',
        lastName: 'missing',
      });
      expect(plan.changes).toEqual({});
    });

    it('edge: an irregular account keeps its safe change only as a proposal', () => {
      const plan = planUserNameCleanup(user('1', 'JEAN', '1'));
      expect(plan.status).toBe('irregular');
      expect(plan.changes).toEqual({ firstName: 'Jean' });
    });
  });

  describe('runUserNameCleanup', () => {
    const users = [
      user('1', 'JEAN', 'DUPONT'),
      user('2', 'Jean', 'Dupont'),
      user('3', 'JEAN', '1'),
      user('4', 'élise', 'martin'),
    ];
    const listUsers = (first: number, max: number) =>
      Promise.resolve(users.slice(first, first + max));

    it('nominal (dry run): never writes, counts every user across pages', async () => {
      const updateUser = jest.fn();
      const result = await runUserNameCleanup(
        { listUsers, updateUser },
        { apply: false, pageSize: 2 },
      );
      expect(updateUser).not.toHaveBeenCalled();
      expect(result.counts).toMatchObject({
        total: 4,
        ok: 1,
        fixable: 2,
        irregular: 1,
        fixed: 0,
      });
      expect(result.plans.map((p) => p.keycloakId)).toEqual(['1', '3', '4']);
    });

    it('nominal (apply): fixes only fixable accounts, never irregular ones', async () => {
      const updateUser = jest.fn().mockResolvedValue(undefined);
      const result = await runUserNameCleanup(
        { listUsers, updateUser },
        { apply: true, pageSize: 3 },
      );
      expect(updateUser.mock.calls).toEqual([
        ['1', { firstName: 'Jean', lastName: 'Dupont' }],
        ['4', { firstName: 'Élise', lastName: 'Martin' }],
      ]);
      expect(result.counts.fixed).toBe(2);
    });

    it('failure: a rejected update is reported and does not stop the run', async () => {
      const updateUser = jest
        .fn()
        .mockRejectedValueOnce(new Error('400 Bad Request'))
        .mockResolvedValue(undefined);
      const result = await runUserNameCleanup(
        { listUsers, updateUser },
        { apply: true },
      );
      expect(result.counts.fixed).toBe(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].plan.keycloakId).toBe('1');
      expect(result.failed[0].error).toBe('400 Bad Request');
    });
  });

  describe('buildUserNameCleanupReport', () => {
    it('lists one row per affected field with its applied state', async () => {
      const result = await runUserNameCleanup(
        {
          listUsers: (first) =>
            Promise.resolve(
              first === 0
                ? [user('1', 'JEAN', 'Dupont'), user('2', 'Jean', '=1+1')]
                : [],
            ),
          updateUser: jest.fn().mockResolvedValue(undefined),
        },
        { apply: true },
      );
      const lines = buildUserNameCleanupReport(result, true).trim().split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[1]).toBe(
        '"1","u-1","1@example.com","fixable","firstName","JEAN","Jean","","yes"',
      );
      // formula injection is neutralized
      expect(lines[2]).toBe(
        '"2","u-2","2@example.com","irregular","lastName","\'=1+1","","invalid","no"',
      );
    });
  });
});
