# Ruleset `dnd5e-2014`

Seed of the D&D 5e (2014) character builder, imported as a **published** ruleset.
See **FR-ruleset-character-builder** in `docs/functional-rules.md`.

- `ruleset.json`: meta, builder pages (`flow`), formulas and projection to the `Player` sheet.
- Import: `npm run ruleset:import` (options `-- --key=dnd5e-2014`, `-- --dry-run`), with `CHARIOT_MONGO_URL` set.
  To publish a change, raise `version` in `ruleset.json`: a published version is never modified.
- `entries/*.json`: catalog entries, one file per family. `dnd5e-2014.seed.spec.ts` checks every file
  against the DTOs and the integrity rules (keys unique across types, parents and grant targets resolve).

## Conventions expected from the builder engine

Expressions are JSON Logic. Besides field and formula ids, they read these roots:

| Root                                                                                                   | Content                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `state.entries.<fieldId>`                                                                              | Selected entry (or entries) of a select field, `data` included                                                                                                                 |
| `state.abilityBonuses.<ability>`                                                                       | Sum of `add` effects on ability scores (race, ASI, feats)                                                                                                                      |
| `state.skills.<skillKey>`                                                                              | Skill mastery: 1 half, 2 proficient, 3 expertise (highest wins)                                                                                                                |
| `state.savingThrows.<ability>`                                                                         | `true` when proficient                                                                                                                                                         |
| `state.speed.<walk\|climb\|swim\|fly\|burrow>`, `state.size`, `state.senses`                           | Set by the race                                                                                                                                                                |
| `state.languages`, `state.proficiencies.<armors\|weapons\|tools>`                                      | Granted entry keys                                                                                                                                                             |
| `state.resistances`, `state.senses`                                                                    | Granted damage-type keys and `{ key, value }` senses (a subrace `set` replaces the race value)                                                                                 |
| `state.racialSpells`, `state.racialCantrip`                                                            | Innate racial spells (name for the Codex lookup, level, ability, uses) and racial cantrip to pick                                                                              |
| `state.breathWeapon`, `state.hitPointBonusPerLevel`                                                    | Dragonborn breath weapon, hill dwarf toughness                                                                                                                                 |
| `state.labels.*`                                                                                       | Same lists resolved to labels in the user's locale (projection)                                                                                                                |
| `state.spellcasting.*`                                                                                 | `ability`, `preparation` (`known`, `prepared`, `spellbook`), `preparedLevel` (`full`/`half`), `cantripsKnown[]`, `spellsKnown[]`, `maxSpellLevelByLevel[]` (index = level − 1) |
| `state.multiclassing`                                                                                  | `true` while applying the effects and grants of a class taken as second class (multiclass proficiencies only)                                                                  |
| `state.classOptions`, `state.fightingStyles.*`                                                         | Chosen class options (fighting styles, metamagic, invocations, infusions, favored enemies and terrains)                                                                        |
| `state.unarmoredDefense`, `state.jackOfAllTrades`, `state.immunities`                                  | Barbarian/monk AC, bard half proficiency on non-proficient skills (mastery 1), monk poison immunity                                                                            |
| `state.classKeys`, `state.classCount`, `state.classLevels.<classKey>`                                  | Classes taken so far                                                                                                                                                           |
| `state.multiclassEligible`                                                                             | Class keys whose multiclass prerequisites are met (current and new class)                                                                                                      |
| `state.sheetClasses`, `state.sheetAbilities`, `state.sheetActions`, `state.sheetSpellcasting`          | Sheet-shaped arrays built by the engine                                                                                                                                        |
| `repeat.index`                                                                                         | Character level being gained on a level-up page                                                                                                                                |
| `repeat.classLevel`, `repeat.hitDie`, `repeat.newCantrips`, `repeat.newSpells`, `repeat.maxSpellLevel` | Values of the class gaining the level                                                                                                                                          |
| `context.mode`, `context.currentLevel`, `context.targetLevel`                                          | Builder context (`creation` or `levelUp`)                                                                                                                                      |
| `option`                                                                                               | Candidate entry while an `optionsFilter` is evaluated                                                                                                                          |

- Outside its repeated page, a repeated field id (`hitPoints`, `levelClass`…) resolves to the **array** of its values.
- `{repeat.index}` inside a translated text is replaced by the value.
- Children are attached automatically: `racial-trait` to its race or subrace, `class-feature` to its class and
  `subclass-feature` to its subclass when `level` ≤ the class level, `background-feature` to its background.
- Grant `effects` are applied once per chosen option, `{key}` being replaced by the option key.
- Effects of attached children (traits, features) apply like the parent's effects.
- Grants of attached children (class and subclass features) are offered on the page where their `level` is reached
  (class page at level 1, level-up page afterwards), like the grants of the parent.
- `state.subclassSpells` lists always-prepared or bonus spells (domain, oath, circle, patron, specialist…) as
  `{ name, classLevel }`, looked up in the Codex by name; `state.subclassCantrip` asks for a cantrip of another class list.
- A subclass feature that sets `spellcasting.*` (eldritch knight, arcane trickster) gives spellcasting to a class without it.
- Option entries chosen through grants (`maneuver`, `elemental-discipline`, `totem-*`, `hunters-prey`, `druid-land`,
  `dragon-ancestor`, `armor-model`…) become sheet abilities like features.
- `data.uses.count` of a feature is either an array indexed by class level − 1 or a JSON Logic expression
  (e.g. `1 + charismaModifier`); `reset` is `short` or `long`. It feeds the counter of the sheet ability.
- Spell slot tables are in `data.spellcasting.slots` of each class (index = class level − 1, 9 spell levels);
  warlock slots (`pactMagic`) reset on a short rest.
- Backgrounds carry `data.suggestions` (personality traits, ideals, bonds, flaws) offered by the matching text fields
  (`config.suggestionsFrom`); the player can pick one or write freely.
- `state.equipment` lists `{ key | label, quantity }` items (class pack, chosen options, background); `state.labels.equipment`
  is the text written to `treasure.equipment`. `state.attackWeapons` lists weapon keys suggested as sheet attack actions.
  `state.gold` sums the background purse (`treasure.gp`).
- `state.featSpell` (Magic Initiate, Ritual Caster) asks for spells of another class list; `state.passivePerceptionBonus`
  comes from the Observant feat.
- Every derived value is a **suggestion** the player can change; no value is ever rolled by Chariot
  (the player enters the result of physical dice).
