# User Names Cleanup Script

One-off maintenance script that brings existing Keycloak first and last names in line with the person name rules (**FR-user-profile-keycloak**, « Person name rules »).

Source: `services/adventure/api/src/scripts/user-names-cleanup/`

## What it does

The script reads every user of the Keycloak realm (paginated, 100 per page) and classifies each account:

| Status      | Meaning                                                                 | Action with `--apply`        |
| ----------- | ----------------------------------------------------------------------- | ---------------------------- |
| `ok`        | Names are valid and already normalized                                  | None                         |
| `fixable`   | Names are valid but need cleanup or case normalization (`JEAN` → `Jean`) | Names updated in Keycloak    |
| `irregular` | A name is missing or invalid (`1`, `Jean2`, …)                          | **None**: never modified     |
| `skipped`   | Service account                                                         | None                         |

- Invalid data is never modified. Irregular accounts are blocked by the regularization gate at their next login.
- One failed update does not stop the run. Failures are listed in the report, and the process exits with code `1`.
- The script is idempotent: a second run after `--apply` reports `fixable: 0`.

## Options

| Option         | Default                               | Description                                  |
| -------------- | ------------------------------------- | -------------------------------------------- |
| _(none)_       |                                       | Dry run: reads only, writes the report       |
| `--apply`      | off                                   | Writes the `fixable` changes to Keycloak     |
| `--out <file>` | `user-names-report-YYYY-MM-DD.csv`    | Report path, relative to the working dir     |

The Keycloak connection reuses the adventure API environment (`KEYCLOAK_*` variables), so run the script inside the adventure container.

## Run in development

Always start with a dry run, read the report, then apply:

```bash
docker exec chariot-adventure npm run users:names-cleanup
```

```bash
docker exec chariot-adventure npm run users:names-cleanup -- --apply
```

The source is mounted, so the report lands in `services/adventure/api/` on the host.

## Run in production

The production image has no `npm` nor `ts-node`: run the compiled script with `node`. The `/app` directory is not writable by the runtime user, so write the report to `/tmp` and copy it out.

```bash
docker exec <adventure-container> node dist/scripts/user-names-cleanup/run-user-names-cleanup.js --out /tmp/user-names-report.csv
```

```bash
docker cp <adventure-container>:/tmp/user-names-report.csv ./user-names-report.csv
```

After reviewing the report, run again with `--apply` (same `--out`), copy the final report, then delete it from the container.

## The report

CSV, one row per field to fix or invalid field:

`keycloakId, username, email, status, field, currentValue, proposedValue, issue, applied`

- `irregular` rows (`issue` = `missing` or `invalid`) form the exportable list for the regularization mailing.
- Values starting with `= + - @` are prefixed with `'` to prevent formula injection in spreadsheets.

> ⚠️ The report contains personal data (names, e-mails). It is git-ignored (`user-names-report-*.csv`): never commit or share it outside the team, and delete it once the campaign is done.
