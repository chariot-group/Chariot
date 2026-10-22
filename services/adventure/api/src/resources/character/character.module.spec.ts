import { MODULE_METADATA } from '@nestjs/common/constants';
import { CharacterModule } from '@/resources/character/character.module';
import { NpcModule } from '@/resources/character/npc/npc.module';
import { PlayerModule } from '@/resources/character/player/player.module';

const DISCRIMINATOR_TOKENS = ['playerModel', 'npcModel'] as const;

type ModuleClass = abstract new (...args: never[]) => unknown;

function mongooseProviderTokens(moduleClass: ModuleClass): string[] {
  const imports: unknown[] =
    Reflect.getMetadata(MODULE_METADATA.IMPORTS, moduleClass) ?? [];
  const tokens: string[] = [];

  for (const imported of imports) {
    if (!imported || typeof imported !== 'object' || !('providers' in imported)) {
      continue;
    }
    const providers = (imported as { providers?: unknown[] }).providers ?? [];
    for (const provider of providers) {
      if (!provider || typeof provider !== 'object' || !('provide' in provider)) {
        continue;
      }
      const token = (provider as { provide?: unknown }).provide;
      if (typeof token === 'string') tokens.push(token);
    }
  }

  return tokens;
}

function discriminatorTokens(moduleClass: ModuleClass): string[] {
  return mongooseProviderTokens(moduleClass).filter((token) =>
    (DISCRIMINATOR_TOKENS as readonly string[]).includes(token),
  );
}

describe('Character mongoose discriminators', () => {
  const registered = [
    ...discriminatorTokens(CharacterModule),
    ...discriminatorTokens(NpcModule),
    ...discriminatorTokens(PlayerModule),
  ];

  it('nominal: player and npc are registered once on CharacterModule', () => {
    expect(discriminatorTokens(CharacterModule)).toEqual([
      'playerModel',
      'npcModel',
    ]);
    expect(registered.filter((token) => token === 'playerModel')).toEqual([
      'playerModel',
    ]);
    expect(registered.filter((token) => token === 'npcModel')).toEqual([
      'npcModel',
    ]);
  });

  it('edge: child modules may reuse the base Character model', () => {
    expect(mongooseProviderTokens(NpcModule)).toContain('CharacterModel');
    expect(mongooseProviderTokens(PlayerModule)).toContain('CharacterModel');
  });

  it('failure: child modules do not register player or npc discriminators', () => {
    expect(discriminatorTokens(NpcModule)).toEqual([]);
    expect(discriminatorTokens(PlayerModule)).toEqual([]);
  });
});
