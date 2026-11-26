import { computeAccountStatus } from '@/resources/user/dto/sub/account-status.dto';

// @see FR-user-profile-keycloak: Irregular account regularization
describe('computeAccountStatus', () => {
  it('nominal: a regular account has no invalid field', () => {
    expect(
      computeAccountStatus({ firstName: 'Jean-Pierre', lastName: "O'Neil" }),
    ).toEqual({ invalidFields: [] });
  });

  it('edge: valid names that only need case or spacing cleanup are not irregular', () => {
    expect(
      computeAccountStatus({ firstName: '  JEAN  ', lastName: 'li' }),
    ).toEqual({ invalidFields: [] });
  });

  it('edge: lists only the offending field', () => {
    expect(computeAccountStatus({ firstName: 'Jean', lastName: '1' })).toEqual({
      invalidFields: ['lastName'],
    });
  });

  it('failure: missing or empty names are irregular', () => {
    expect(computeAccountStatus({ lastName: '   ' })).toEqual({
      invalidFields: ['firstName', 'lastName'],
    });
  });
});
