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