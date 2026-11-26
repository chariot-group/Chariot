import { ApiProperty } from '@nestjs/swagger';
import { isValidPersonName } from '@/common/person-name/person-name';

export const PERSON_NAME_FIELDS = ['firstName', 'lastName'] as const;
export type PersonNameField = (typeof PERSON_NAME_FIELDS)[number];

/**
 * Conditions of the account gate, computed server-side from the current
 * Keycloak values (never inferred from the token).
 * @see FR-user-profile-keycloak: Irregular account regularization
 */
export class AccountStatusDto {
  @ApiProperty({
    description:
      'Profile fields that violate the person name rules and must be corrected by the user',
    enum: PERSON_NAME_FIELDS,
    isArray: true,
    example: ['lastName'],
  })
  invalidFields: PersonNameField[];
}

export function computeAccountStatus(keycloakUser: {
  firstName?: string;
  lastName?: string;
}): AccountStatusDto {
  return {
    invalidFields: PERSON_NAME_FIELDS.filter(
      (field) => !isValidPersonName(keycloakUser[field]),
    ),
  };
}
