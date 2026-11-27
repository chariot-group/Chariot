# Ruleset `dnd5e-2014`

Seed of the D&D 5e (2014) character builder, imported as a **published** ruleset.
See **FR-ruleset-character-builder** in `docs/functional-rules.md`.

- `ruleset.json`: meta, builder pages (`flow`), formulas, projection to the `Player` sheet and the engine declarations (`counters`, `levels`, `attachments`, `collections`).
- Import: `npm run ruleset:import` (options `-- --key=dnd5e-2014`, `-- --dry-run`), with `CHARIOT_MONGO_URL` set.
  To publish a change, raise `version` in `ruleset.json`: a published version is never modified.
- `entries/*.json`: catalog entries, one file per family. `dnd5e-2014.seed.spec.ts` checks every file
  against the DTOs and the integrity rules (keys unique across types, parents and grant targets resolve).

## How the seed drives the generic engine

The engine (`services/web/client/src/lib/rulesetEngine/`) knows nothing about D&D: everything below is data.
Expressions are JSON Logic. Besides field and formula ids, they read these roots:

| Root                                                                                                                                                                                      | Produced by                                                  | Content                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `state.entries.<fieldId>`, `state.choices.<grantId>`, `state.selected.<type>`                                                                                                             | engine (generic)                                             | Entry chosen in a field (array outside its repeated page), entries chosen through a grant, every selected or attached entry of a type                                                |
| `state.labels.<path>`                                                                                                                                                                     | engine (generic)                                             | Any state list of keys (or `{ key \| label }` objects) resolved to labels in the user's locale                                                                                       |
| `state.page.<path>`                                                                                                                                                                       | engine (generic)                                             | What the effects of the current page produced (feat spells, subclass cantrip of this level)                                                                                          |
| `state.classes`                                                                                                                                                                           | counter `classes` (`class` + `levelClass`)                   | `{ keys, distinct, total, of: { <classKey>: classLevel } }`                                                                                                                          |
| `state.sheetClasses`, `state.sheetAbilities`, `state.sheetActions`                                                                                                                        | collections                                                  | `class[]`, `abilities[]` (counter and rest reset) and attack `actions[]` of the `Player` sheet                                                                                       |
| `state.abilityBonuses.<ability>`                                                                                                                                                          | `add` effects                                                | Racial, ASI and feat bonuses                                                                                                                                                         |
| `state.skills.<skillKey>`                                                                                                                                                                 | `set` / `max` effects                                        | Mastery: 1 half, 2 proficient, 3 expertise                                                                                                                                           |
| `state.savingThrows.<ability>`                                                                                                                                                            | `set` effects                                                | `true` when proficient                                                                                                                                                               |
| `state.speed.*`, `state.size`, `state.senses`, `state.resistances`, `state.immunities`                                                                                                    | race and class effects                                       | A subrace `set` replaces the race value                                                                                                                                              |
| `state.languages`, `state.proficiencies.<armors\|weapons\|tools>`                                                                                                                         | `grant` effects                                              | Granted entry keys                                                                                                                                                                   |
| `state.equipment`, `state.attackWeapons`, `state.gold`                                                                                                                                    | pack, options and background effects                         | `{ key \| label, quantity }` items, weapon keys turned into attacks, background purse                                                                                                |
| `state.spellcasting.<classKey>.*`                                                                                                                                                         | class effects, Eldritch Knight and Arcane Trickster features | `ability`, `preparation`, `casterProgression` (`full`, `half`, `halfUp`, `third`, `pact`), `slots`, `cantripsKnown`, `spellsKnown`, `maxSpellLevelByLevel` (index = class level − 1) |
| `state.spells.<group>`                                                                                                                                                                    | engine (generic), `spellSelect` fields                       | Chosen spells grouped by `spellGroup`: class key, `innate` (racial cantrip) or `feat`                                                                                                |
| `state.racialSpells`, `state.racialCantrip`, `state.subclassSpells`, `state.subclassCantrip`, `state.featSpell`, `state.featSpellcasting`                                                 | effects                                                      | Racial and feat spells to pick or to look up in the Codex                                                                                                                            |
| `ruleset.data`                                                                                                                                                                            | `ruleset.json`                                               | `experienceByLevel`, `multiclassSlots` (full-caster table), `spellcastingAbilityByClass`                                                                                             |
| `state.classOptions`, `state.fightingStyles.*`, `state.unarmoredDefense`, `state.jackOfAllTrades`, `state.breathWeapon`, `state.hitPointBonusPerLevel`, `state.passivePerceptionBonus`, … | effects                                                      | Class, race and feat specifics                                                                                                                                                       |
| `repeat.index`                                                                                                                                                                            | engine                                                       | Character level gained on a level-up page                                                                                                                                            |
| `context.mode`, `context.currentLevel`, `context.targetLevel`                                                                                                                             | engine                                                       | Builder context (`creation` or `levelUp`)                                                                                                                                            |
| `self`, `option`, `item`                                                                                                                                                                  | engine                                                       | Entry concerned (effect, grant, value, declaration), candidate option, collection element; each exposes `level`, `values`, `parent`, `children`                                      |

`dnd5e-2014.seed.spec.ts` fails when an expression reads a `state.*` root that no effect, counter, collection or
generic state produces, or a `repeat.*` value other than `repeat.index`.

### Declarations (`ruleset.json`)

- `counters`: `classes` counts `class` and `levelClass`, so `state.classes.of.<class>` is the class level.
- `levels`: `class` and `class-feature` → level of the class (`self.key` / `self.parentKey`); `subclass` → level of its
  class; `subclass-feature` → level of the class of its subclass (`self.parent.parentKey`). A grant with a `level`
  (ASI, subclass, maneuvers…) is offered on the page where its owner reaches it.
- `attachments`: `racial-trait` → race and subrace, `class-feature` → class, `subclass-feature` → subclass,
  `background-feature` → background. Children apply their effects and offer their grants once their `level` is reached.
- `collections`: `sheetClasses` (class entries), `sheetAbilities` (traits, features, feats and options chosen through
  grants), `sheetActions` (keys of `state.attackWeapons` resolved to weapon entries), `casterClasses`,
  `sheetSpellcasting`, `innateSpells`, `sheetInnateSpellcasting` and `sheetFeatSpellcasting` (see Spellcasting).
- Level-up page values come from formulas read on the page: `levelClassLevel`, `levelHitDie`, `levelNewCantrips`,
  `levelNewSpells`, `levelMaxSpellLevel`.

### Entry conventions

- First class vs multiclass: effects and grants test `self.field` (`"class"` for the first class, `"levelClass"` for a
  class taken on a level-up page), e.g. a class gives all its proficiencies only as first class.
- `values.multiclassAllowed` holds the multiclass prerequisite of a class; the `levelClass` validation requires it for
  the current and the new class, and at most two distinct classes.
- `values.usesCount` gives the uses of a limited feature (an expression, or `data.usesByLevel` indexed by
  `self.level - 1`); `data.uses.reset` is `short` or `long` (`shortRestFromLevel` for bardic inspiration).
- Steps may declare `cards` (`{ id, title, description?, fields[] }`) grouping fields in one titled card: « Classe et niveau », « Personnalité », « Identité », « Apparence », « Histoire ».
- Every grant has a translated `description` (what the choice is and implies) shown under its title.
- Every grant has a translated `label` naming the choice (« Sous-race », « Compétences »…); an optional `default` suggests options (a grant offering no more options than its count is pre-selected anyway).
- `abilityAllocation` `config.totals` maps each ability to its `computed` total field of the page, shown in the same row (base, bonus, total).
- Grant `effects` are applied once per chosen option, `{key}` being replaced by the option key. A repeatable option
  (same ASI at levels 4 and 8) offers its nested grants again.
- Spell slot tables are in `data.spellcasting.slots` of each class (index = class level − 1, 9 spell levels);
  warlock slots (`pactMagic`) reset on a short rest.
- Text fields with `config.multiline` are long texts (textarea in the builder UI). Backgrounds carry `data.suggestions` (personality traits, ideals, bonds, flaws) offered by the matching text fields
  (`config.suggestionsFrom`); the player can pick one or write freely.
- Every derived value is a **suggestion** the player can change; no value is ever rolled by Chariot
  (the player enters the result of physical dice).

### Spellcasting

- Each spellcasting class sets `state.spellcasting.<classKey>` (Eldritch Knight and Arcane Trickster set it for the
  fighter and the rogue, with the third-caster slot table). Formulas `classSpellcasting` (first class, spells page) and
  `levelSpellcasting` (class gaining the level) read it.
- Spells to choose are suggestions: known casters follow `spellsKnown`, prepared casters `max(1, modifier + level)`
  (half casters use half their level), the wizard spellbook its `spellsKnown` table.
- `sheetSpellcasting` writes one `spellcasting[]` block per spellcasting class: ability, save DC (8 + proficiency +
  modifier), attack bonus, the spells of its group and `spellSlotsByLevel` only for the spell levels holding a chosen
  spell (FR-magic-spell-level-categories).
- With two non-warlock spellcasting classes, `casterLevel` adds full levels, half levels rounded down (artificer
  rounded up) and third levels rounded down; the slots of `ruleset.data.multiclassSlots` at that level go on the
  first spellcasting block only (`sharedSlotsClass`). Warlock pact slots always stay on the warlock block.
- `sheetInnateSpellcasting` adds an innate block for the racial cantrip and the racial spells reached at the character
  level (`innateSpells`); `sheetFeatSpellcasting` adds a block per spell feat (Magic Initiate, Ritual Caster) with the
  ability of the chosen class list.
