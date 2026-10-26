# Tests de capacité (tables parallèles)

Mesure le nombre de **tables simultanées** (MJ + PJs connectés), distinct du stress `chariot-all-services.yml`.

## Prérequis

1. Copier `env.example` → `.env` et remplir **integ** + `KEYCLOAK_ADMIN_USER` / `KEYCLOAK_ADMIN_PASSWORD`.
2. `npm install` dans `tools/load-test`.
3. Optionnel : `ADVENTURE_MONGODB_URI` pour purge Mongo au teardown.

## Profils

| Profil | PJs / table |
| --- | --- |
| `many-small` | 2 (min) |
| `few-large` | 8 (max) |
| `mixed-realistic` | 3–8 (tirage à la provision, fixé dans le manifest) |

## Commandes

```bash
cd tools/load-test

npm run capacity:provision -- --run-id 2026-10-26-a --profile mixed-realistic --tables 40
npm run capacity:sync-sessions -- --run-id 2026-10-26-a

trap 'npm run capacity:teardown -- --run-id 2026-10-26-a' EXIT

# Palier : N premières tables du manifest (ex. 10 tables many-small = 30 users)
npm run capacity:run -- --run-id 2026-10-26-a --tables 10 --report

npm run capacity:teardown -- --run-id 2026-10-26-a
```

### Paliers suggérés

| Profil | `--tables` (exemples) | Users approx. |
| --- | --- | --- |
| `many-small` (2 PJs) | 10 → 25 → 50 → 100 | 30 → 75 → 150 → 300 |
| `few-large` (8 PJs) | 5 → 10 → 20 → 30 | 45 → 90 → 180 → 270 |
| `mixed-realistic` | viser 100 → 200 → 300 **users** (calculer N avec le manifest) | Σ (1 + PJs) sur les N premières tables |

Chaque palier : phase **ramp** (1 user/s, `maxVusers` = total du palier), puis phase **hold** (`arrivalRate: 0`, pas de VU supplémentaires). Durée maintien : **150 s** par défaut (`--hold-seconds`). Un seul worker Artillery en local (`--count` vaut 1 par défaut) pour l’assignation 1:1 aux comptes du manifest.

Critères « panique » : p95 `/api/user/me` > 1 s, 5xx > 1 %, échecs WS > 1 % (latence HTTP à enrichir côté processor si besoin).

Smoke (1 table, 2 PJs, provision → sync → teardown) :

```bash
npm run capacity:smoke
```

## Manifest

`manifests/manifest-{runId}.json` — comptes, `campaignId`, `sessionCode`, mot de passe du run. **Ne pas committer.**

## Teardown

Leave → close session → DELETE campagne → Mongo (si URI) → suppression utilisateurs Keycloak `loadtest-{runId}-*`.
