import { join } from 'path';
import { CLASS } from '@/resources/character/player/constants/class.constant';
import {
  loadSeed,
  loadSeeds,
  seedContentHash,
  validateSeed,
} from '@/seeder/rulesets/ruleset-seed.loader';

/** @see FR-ruleset-character-builder — Seed `dnd5e-2014` */

const seed = loadSeed(join(__dirname, 'dnd5e-2014'));
const { ruleset, entries } = seed;

describe('FR-ruleset-character-builder — dnd5e-2014 seed', () => {
  it('nominal: the seed passes the DTO, integrity and cross-entry checks', () => {
    expect(validateSeed(seed)).toEqual([]);
    expect(ruleset).toMatchObject({
      key: 'dnd5e-2014',
      gameSystem: 'DND_5E',
      version: 1,
    });
  });

  it('nominal: the seed folder is discovered by the import loader', () => {
    expect(loadSeeds().map((s) => s.ruleset.key)).toContain('dnd5e-2014');
  });

  it('nominal: offers the 13 Chariot classes, each with subclasses and a starting pack', () => {
    const classes = entries.filter((e) => e.type === 'class');
    expect(classes.map((c) => c.data?.sheetName).sort()).toEqual(
      [...CLASS].sort(),
    );
    const missing = classes
      .filter(
        (c) =>
          !entries.some(
            (e) => e.type === 'subclass' && e.parentKey === c.key,
          ) ||
          !entries.some(
            (e) => e.type === 'equipment-pack' && e.parentKey === c.key,
          ),
      )
      .map((c) => c.key);
    expect(missing).toEqual([]);
  });

  it('edge: the content hash is stable and ignores the entry order', () => {
    const reversed = { ...seed, entries: [...entries].reverse() };
    expect(seedContentHash(reversed)).toBe(seedContentHash(seed));
  });

  it('failure guard: every subclass belongs to a class and has features', () => {
    const classKeys = new Set(
      entries.filter((e) => e.type === 'class').map((e) => e.key),
    );
    const broken = entries
      .filter((e) => e.type === 'subclass')
      .filter(
        (s) =>
          !classKeys.has(s.parentKey) ||
          !entries.some(
            (e) => e.type === 'subclass-feature' && e.parentKey === s.key,
          ),
      )
      .map((s) => s.key);
    expect(broken).toEqual([]);
  });

  it('failure: duplicated keys, unknown parents and grant targets are reported', () => {
    const broken = {
      ...seed,
      entries: [
        ...entries,
        { ...entries[0] },
        {
          type: 'subrace',
          key: 'orphan',
          parentKey: 'nope',
          label: { en: 'X' },
        },
        {
          type: 'race',
          key: 'ghost-race',
          label: { en: 'Ghost' },
          grants: [
            { id: 'g', kind: 'choose', count: 1, from: { type: 'ghost' } },
          ],
        },
      ],
    };
    const errors = validateSeed(broken);
    expect(errors).toEqual(
      expect.arrayContaining([
        `entry key "${entries[0].key}" is duplicated`,
        'subrace/orphan parentKey "nope" is unknown',
        'race/ghost-race grant "g" targets unknown type "ghost"',
      ]),
    );
  });
});
