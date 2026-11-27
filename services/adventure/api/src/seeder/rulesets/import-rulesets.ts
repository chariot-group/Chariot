import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { RulesetImportModule } from '@/seeder/rulesets/ruleset-import.module';
import { RulesetImportService } from '@/seeder/rulesets/ruleset-import.service';
import { loadSeeds } from '@/seeder/rulesets/ruleset-seed.loader';

/**
 * npm run ruleset:import [-- --key=dnd5e-2014] [-- --dry-run]
 * @see FR-ruleset-character-builder — Seed import
 */
const CONTEXT = 'RULESET_IMPORT';

export function parseArgs(argv: string[]) {
  const keyArg = argv.find((a) => a.startsWith('--key='));
  return {
    key: keyArg ? keyArg.slice('--key='.length) : undefined,
    dryRun: argv.includes('--dry-run'),
  };
}

async function main() {
  const { key, dryRun } = parseArgs(process.argv.slice(2));
  const seeds = loadSeeds().filter((s) => !key || s.ruleset.key === key);
  if (seeds.length === 0) {
    throw new Error(key ? `No seed found for key "${key}"` : 'No seed found');
  }

  const app = await NestFactory.createApplicationContext(RulesetImportModule, {
    logger: ['error', 'warn', 'log'],
  });
  let failed = false;
  try {
    const importer = app.get(RulesetImportService);
    for (const seed of seeds) {
      try {
        const r = await importer.importSeed(seed, { dryRun });
        Logger.log(
          `${r.key} v${r.version}: ${r.status} (${r.entries} entries)`,
          CONTEXT,
        );
      } catch (error) {
        failed = true;
        Logger.error(
          `${seed.ruleset.key} v${seed.ruleset.version}: ${(error as Error).message}`,
          undefined,
          CONTEXT,
        );
      }
    }
  } finally {
    await app.close();
  }
  if (failed) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error) => {
    Logger.error((error as Error).message, undefined, CONTEXT);
    process.exitCode = 1;
  });
}
