import type { PersonNameField, UpdateUserDto, User } from "@/types/user";
import { cleanPersonName } from "@/lib/personName";

/**
 * Steps of the blocking account gate, in display order. The e-mail step joins this list with
 * FR-user-email-verification.
 * @see FR-user-profile-keycloak: Irregular account regularization
 */
export type AccountGateStep = "name";

/**
 * Unmet gate conditions for the loaded user. Fails open: no user yet, a failed fetch or an API
 * response without status never blocks the application (the API stays the real enforcement).
 */
export function getAccountGateSteps(user: User | null | undefined): AccountGateStep[] {
  const steps: AccountGateStep[] = [];
  if (user?.accountStatus?.invalidFields?.length) steps.push("name");
  return steps;
}

/** Offending name fields, in form order. */
export function getInvalidNameFields(user: User | null | undefined): PersonNameField[] {
  const invalid = user?.accountStatus?.invalidFields ?? [];
  return (["firstName", "lastName"] as const).filter((field) => invalid.includes(field));
}

/** Payload of the name step: only the corrected fields, cleaned (the API normalizes the case). */
export function buildNameCorrection(
  values: Partial<Record<PersonNameField, string>>,
  fields: PersonNameField[],
): UpdateUserDto {
  const payload: UpdateUserDto = {};
  for (const field of fields) payload[field] = cleanPersonName(values[field] ?? "");
  return payload;
}
