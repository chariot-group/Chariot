# Functional Rules - Chariot Project

This document centralizes all functional rules for the Chariot project.  
Each rule has a unique identifier and must be tested.

---

## FR-001: Logging System Standardization

**Rule**: Use Winston logger exclusively with NestJS injection and explicit context.

**Requirements**:
- Injection via `private readonly logger = new Logger(ClassName.name)`
- Appropriate levels: `debug`, `info`, `warn`, `error` (with stack trace)
- Log critical events: auth, startup, errors

**Prohibitions**:
- Use `console.log`, `console.error`, `console.warn`, `console.debug`
- Log passwords, complete tokens, or sensitive data

**References**: `services/adventure/api/src/logger/winston.logger.ts` | `docs/logger.md`

---

## FR-002: Character Universal Fields

**Rule**: All character types (Player, NPC, etc.) must include shared narrative and economic fields at the base `Character` level.

**Requirements**:
- `appearance`: age, height, weight, eyes, skin, hair, description
- `background`: personalityTraits, ideals, bonds, flaws, alliesAndOrgs, backstory
- `treasure`: cp, sp, ep, gp, pp, notes
- Exposed in Swagger on all endpoints that accept `Character` derivatives

**Prohibitions**:
- Duplicating these fields in discriminators (e.g., `Player`, `NPC`) when they already exist on `Character`

**Tests**:
- DTO validation accepts these nested structures on `CreateCharacterDto`
- Invalid types in nested DTOs are rejected

**References**:
- `services/adventure/api/src/resources/character/core/schemas/character.schema.ts`
- `services/adventure/api/src/resources/character/core/dto/create-character.dto.ts`

---

## FR-003: D&D Conditions Management

**Rule**: All characters must support D&D 5e standard conditions tracking. Player characters additionally support exhaustion levels.

**Requirements**:

**Standard Conditions** (boolean) - Available for ALL characters (Player & NPC):
- `blinded`: Character is blinded
- `charmed`: Character is charmed
- `deafened`: Character is deafened
- `frightened`: Character is frightened
- `grappled`: Character is grappled
- `incapacitated`: Character is incapacitated
- `invisible`: Character is invisible
- `paralyzed`: Character is paralyzed
- `petrified`: Character is petrified
- `poisoned`: Character is poisoned
- `prone`: Character is prone
- `restrained`: Character is restrained
- `stunned`: Character is stunned
- `unconscious`: Character is unconscious

**Exhaustion** (Player-specific only):
- Type: `exhaustionLevel` (integer, 0-6)
- Only available on Player characters, NOT on NPCs
- Level 0: No exhaustion (default)
- Level 1: Disadvantage on ability checks
- Level 2: Speed halved
- Level 3: Disadvantage on attack rolls and saving throws
- Level 4: Hit point maximum halved
- Level 5: Speed reduced to 0
- Level 6: Death

**Validation Rules**:
- All standard conditions default to `false`
- Standard conditions are available on both Player and NPC
- `exhaustionLevel` is ONLY available on Player schema
- `exhaustionLevel` must be an integer between 0 and 6 (inclusive)
- `exhaustionLevel` defaults to 0 for Players
- Invalid exhaustion levels must be rejected

**Prohibitions**:
- Setting exhaustion level on NPCs
- Setting exhaustion level outside 0-6 range
- Using non-boolean values for standard conditions

**Tests**:
- DTO validation accepts valid conditions structure for all characters
- Player DTO accepts exhaustionLevel
- NPC DTO does NOT accept exhaustionLevel
- Invalid exhaustion levels are rejected for Players
- Conditions can be created, updated, and retrieved
- Default values are correctly applied

**References**:
- `services/adventure/api/src/resources/character/core/schemas/conditions/conditions.schema.ts`
- `services/adventure/api/src/resources/character/core/dto/conditions/conditions.dto.ts`
- `services/adventure/api/src/resources/character/player/schemas/player.schema.ts`
- `services/adventure/api/src/resources/character/player/dto/create-player.dto.ts`