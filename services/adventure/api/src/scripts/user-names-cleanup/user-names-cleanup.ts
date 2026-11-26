/**
 * One-off cleanup of first / last names stored in Keycloak.
 * Only safe cases (case, whitespace, apostrophes) are fixed; values that need
 * the user's correction are never modified and are listed in the report.
 * @see FR-user-profile-keycloak: Irregular account regularization
 */
import type UserRepresentation from '@keycloak/keycloak-admin-client/lib/defs/userRepresentation';
import {
  isValidPersonName,
  normalizePersonName,
} from '@/common/person-name/person-name';

export const PERSON_NAME_FIELDS = ['firstName', 'lastName'] as const;
export type PersonNameField = (typeof PERSON_NAME_FIELDS)[number];

export type NameIssue = 'missing' | 'invalid';

export type UserNameCleanupStatus =
  /** Names already valid and normalized. */
  | 'ok'
  /** Only safe changes: can be fixed automatically. */
  | 'fixable'
  /** At least one name needs the user's correction. */
  | 'irregular'
  /** Service / internal account, out of scope. */
  | 'skipped';

export interface UserNameCleanupPlan {
  keycloakId: string;
  username: string;
  email: string;
  status: UserNameCleanupStatus;
  /** Safe normalizations. Not applied for an irregular account: Keycloak rejects any update while one name is invalid. */
  changes: Partial<Record<PersonNameField, string>>;
  issues: Partial<Record<PersonNameField, NameIssue>>;
  current: Partial<Record<PersonNameField, string>>;
}

export function planUserNameCleanup(
  user: UserRepresentation,
): UserNameCleanupPlan {
  const plan: UserNameCleanupPlan = {
    keycloakId: user.id ?? '',
    username: user.username ?? '',
    email: user.email ?? '',
    status: 'ok',
    changes: {},
    issues: {},
    current: {},
  };

  if (user.serviceAccountClientId) {
    plan.status = 'skipped';
    return plan;
  }

  for (const field of PERSON_NAME_FIELDS) {
    const value = user[field];
    plan.current[field] = value ?? '';
    if (typeof value !== 'string' || value.trim() === '') {
      plan.issues[field] = 'missing';
    } else if (!isValidPersonName(value)) {
      plan.issues[field] = 'invalid';
    } else {
      const normalized = normalizePersonName(value);
      if (normalized !== value) plan.changes[field] = normalized;
    }
  }

  if (Object.keys(plan.issues).length > 0) plan.status = 'irregular';
  else if (Object.keys(plan.changes).length > 0) plan.status = 'fixable';
  return plan;
}

export interface UserNameCleanupDeps {
  listUsers: (first: number, max: number) => Promise<UserRepresentation[]>;
  updateUser: (
    keycloakId: string,
    changes: Partial<Record<PersonNameField, string>>,
  ) => Promise<void>;
}

export interface UserNameCleanupResult {
  /** Fixable and irregular accounts, in listing order. */
  plans: UserNameCleanupPlan[];
  /** Fixable plans whose update failed (kept in `plans`). */
  failed: { plan: UserNameCleanupPlan; error: string }[];
  counts: Record<UserNameCleanupStatus, number> & {
    total: number;
    fixed: number;
  };
}

export async function runUserNameCleanup(
  deps: UserNameCleanupDeps,
  options: { apply: boolean; pageSize?: number },
): Promise<UserNameCleanupResult> {
  const pageSize = options.pageSize ?? 100;
  const result: UserNameCleanupResult = {
    plans: [],
    failed: [],
    counts: { total: 0, ok: 0, fixable: 0, irregular: 0, skipped: 0, fixed: 0 },
  };

  for (let first = 0; ; first += pageSize) {
    const users = await deps.listUsers(first, pageSize);
    for (const user of users) {
      const plan = planUserNameCleanup(user);
      result.counts.total += 1;
      result.counts[plan.status] += 1;
      if (plan.status === 'fixable' || plan.status === 'irregular') {
        result.plans.push(plan);
      }
      if (options.apply && plan.status === 'fixable') {
        try {
          await deps.updateUser(plan.keycloakId, plan.changes);
          result.counts.fixed += 1;
        } catch (error) {
          result.failed.push({
            plan,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
    if (users.length < pageSize) break;
  }

  return result;
}

/** Neutralizes spreadsheet formulas and escapes quotes. */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export const REPORT_HEADER = [
  'keycloakId',
  'username',
  'email',
  'status',
  'field',
  'currentValue',
  'proposedValue',
  'issue',
  'applied',
];

/**
 * One row per affected field. `applied` is `yes` only when the change was
 * written; irregular accounts are the list to contact (future mailing).
 */
export function buildUserNameCleanupReport(
  result: UserNameCleanupResult,
  applied: boolean,
): string {
  const failedIds = new Set(result.failed.map((f) => f.plan.keycloakId));
  const rows = [REPORT_HEADER.join(',')];
  for (const plan of result.plans) {
    for (const field of PERSON_NAME_FIELDS) {
      const issue = plan.issues[field];
      const proposed = plan.changes[field];
      if (!issue && proposed === undefined) continue;
      const wasApplied =
        applied && plan.status === 'fixable' && !failedIds.has(plan.keycloakId);
      rows.push(
        [
          plan.keycloakId,
          plan.username,
          plan.email,
          plan.status,
          field,
          plan.current[field] ?? '',
          proposed ?? '',
          issue ?? '',
          wasApplied ? 'yes' : 'no',
        ]
          .map(csvCell)
          .join(','),
      );
    }
  }
  return `${rows.join('\n')}\n`;
}
