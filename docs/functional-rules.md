# Règles Fonctionnelles - Projet Chariot

Ce document centralise toutes les règles fonctionnelles du projet Chariot.  
Chaque règle possède un identifiant unique et doit être testée.

---

## FR-001 : Standardisation du système de logs

**Règle** : Utiliser exclusivement le logger Winston avec injection NestJS et contexte explicite.

**Obligations** :
- Injection via `private readonly logger = new Logger(ClassName.name)`
- Niveaux appropriés : `debug`, `info`, `warn`, `error` (avec stack trace)
- Logger les événements critiques : auth, démarrage, erreurs

**Interdictions** :
- Utiliser `console.log`, `console.error`, `console.warn`, `console.debug`
- Logger des mots de passe, tokens complets ou données sensibles

**Références** : `services/adventure/api/src/logger/winston.logger.ts` | `docs/logger.md`