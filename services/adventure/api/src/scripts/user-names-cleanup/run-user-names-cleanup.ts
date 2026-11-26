/**
 * Usage (inside the adventure API container):
 *   npm run users:names-cleanup                 # dry run, report only
 *   npm run users:names-cleanup -- --apply      # also fixes safe cases
 *   npm run users:names-cleanup -- --out /tmp/report.csv
 * The report contains e-mail addresses: handle it as personal data.
 * @see FR-user-profile-keycloak: Irregular account regularization
 */
import { writeFileSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { KeycloakService } from '@/resources/user/keycloak.service';
import {
  buildUserNameCleanupReport,
  runUserNameCleanup,
} from '@/scripts/user-names-cleanup/user-names-cleanup';

config();

const CONTEXT = 'USER_NAMES_CLEANUP';

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const outIndex = args.indexOf('--out');
  const out =
    outIndex >= 0 && args[outIndex + 1]
      ? args[outIndex + 1]
      : `user-names-report-${new Date().toISOString().slice(0, 10)}.csv`;

  Logger.log(apply ? 'Mode: APPLY' : 'Mode: DRY RUN (no change)', CONTEXT);

  const keycloak = new KeycloakService(new ConfigService());
  const result = await runUserNameCleanup(
    {
      listUsers: (first, max) => keycloak.listUsers(first, max),
      updateUser: (id, changes) => keycloak.updateUser(id, changes),
    },
    { apply },
  );

  writeFileSync(out, buildUserNameCleanupReport(result, apply), 'utf8');

  const { counts } = result;
  Logger.log(
    `Users: ${counts.total} | ok: ${counts.ok} | fixable: ${counts.fixable} | irregular: ${counts.irregular} | skipped: ${counts.skipped}`,
    CONTEXT,
  );
  if (apply) Logger.log(`Fixed: ${counts.fixed}`, CONTEXT);
  for (const { plan, error } of result.failed) {
    Logger.warn(
      `Update failed for user #${plan.keycloakId}: ${error}`,
      CONTEXT,
    );
  }
  Logger.log(`Report written to ${out}`, CONTEXT);

  if (result.failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  Logger.error(error instanceof Error ? error.stack : String(error), CONTEXT);
  process.exit(1);
});
