# Tests de capacité (tables + users hors session)

Mesure, **sans palier manuel**, le nombre de tables simultanées et d’users hors session que l’integ tient. Distinct du stress `chariot-all-services.yml`.

**Livrable** (`FR-load-test-capacity`) :

1. **Plafond tables** — dernier palier vert, 0 user hors session, avec min / médiane / max / moyenne de PJ par table
2. **Plafond hors session** — max d’users qui **créent et modifient** campagnes + PJ, pendant ~50 % du plafond tables
3. **Mix recommandé** — 70 % du dernier mix vert (N tables + N × idle-per-table hors session)

## Prérequis

1. Copier `env.example` → `.env` et remplir **integ** + `KEYCLOAK_ADMIN_USER` / `KEYCLOAK_ADMIN_PASSWORD`.
2. `npm install` dans `tools/load-test`.
3. Optionnel : `ADVENTURE_MONGODB_URI` pour purge Mongo au teardown.

## Commande principale

```bash
cd tools/load-test

npm run capacity:discover -- --profile mixed-realistic --max-tables 40 --max-idle 80 --idle-per-table 2
```

Provision → sync sessions → paliers géométriques puis dichotomie → résumé Markdown/JSON → teardown.

| Option | Défaut | Rôle |
| --- | --- | --- |
| `--run-id` | `cap-<timestamp>` | Réutilise un manifest s’il existe déjà |
| `--profile` | `mixed-realistic` | `many-small` (2 PJ), `few-large` (8), `mixed-realistic` (3–8) |
| `--max-tables` | 40 | Taille du pool de tables |
| `--max-idle` | 80 | Pool d’users hors session (écriture) |
| `--idle-per-table` | 2 | Template du mix « normal » |
| `--hold-seconds` | 150 | Maintien d’un palier |
| `--keep` | off | Ne pas teardown à la fin |

Résumé : `reports/capacity-summary-<runId>.md` (et `.json`).

Palier **rouge** si, sur la fenêtre de maintien : p95 `GET /api/user/me` > 1 s, p95 write campagne/PJ > 1 s, 5xx > 1 %, échecs WS > 1 %, VU failed > 1 %.

**Users hors session** : `POST`/`PATCH` campagnes et PJ (pas seulement de la lecture), jamais `session:join`.

Durée typique : plusieurs dizaines de minutes (provision + ~6–12 paliers). Tu peux laisser tourner.

Le maintien (`--hold-seconds`) est **dans le scénario** (WS + writes). Artillery 2 ignore `arrivalRate: 0`, donc il n’y a qu’une phase de montée ; les VU restent le temps du hold.

## Paliers manuels (optionnel)

```bash
npm run capacity:provision -- --run-id 2026-10-26-a --profile mixed-realistic --tables 40 --idle 80
npm run capacity:sync-sessions -- --run-id 2026-10-26-a
npm run capacity:run -- --run-id 2026-10-26-a --tables 10 --idle 20 --report
npm run capacity:teardown -- --run-id 2026-10-26-a
```

Smoke (1 table, 1 idle, palier 20 s) :

```bash
npm run capacity:smoke
```
