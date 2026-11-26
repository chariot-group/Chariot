import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserProfileDto } from '@/resources/user/dto/update-user-profile.dto';

describe('UpdateUserProfileDto', () => {
  it('should accept valid firstName', async () => {
    const dto = new UpdateUserProfileDto();
    dto.firstName = 'John';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid lastName', async () => {
    const dto = new UpdateUserProfileDto();
    dto.lastName = 'Doe';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid email', async () => {
    const dto = new UpdateUserProfileDto();
    dto.email = 'john.doe@example.com';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept all fields together', async () => {
    const dto = new UpdateUserProfileDto();
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.email = 'john.doe@example.com';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept empty dto (all fields optional)', async () => {
    const dto = new UpdateUserProfileDto();

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept single-letter firstName and lastName', async () => {
    const dto = new UpdateUserProfileDto();
    dto.firstName = 'J';
    dto.lastName = 'D';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject empty firstName and lastName', async () => {
    const dto = new UpdateUserProfileDto();
    dto.firstName = '';
    dto.lastName = '';

    const errors = await validate(dto);
    expect(errors.map((e) => e.property).sort()).toEqual([
      'firstName',
      'lastName',
    ]);
    expect(errors[0].constraints?.minLength).toContain('must not be empty');
  });

  it('should reject invalid email format', async () => {
    const dto = new UpdateUserProfileDto();
    dto.email = 'invalid-email';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isEmail');
    expect(errors[0].constraints?.isEmail).toContain('valid email');
  });

  it('should reject email without domain', async () => {
    const dto = new UpdateUserProfileDto();
    dto.email = 'user@';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject email without @', async () => {
    const dto = new UpdateUserProfileDto();
    dto.email = 'userexample.com';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject firstName that is not a string', async () => {
    const dto = new UpdateUserProfileDto();
    (dto as any).firstName = 123;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should reject lastName that is not a string', async () => {
    const dto = new UpdateUserProfileDto();
    (dto as any).lastName = 123;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should accept firstName with exactly 2 characters', async () => {
    const dto = new UpdateUserProfileDto();
    dto.firstName = 'Jo';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept lastName with exactly 2 characters', async () => {
    const dto = new UpdateUserProfileDto();
    dto.lastName = 'Do';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept long names', async () => {
    const dto = new UpdateUserProfileDto();
    dto.firstName = 'Jean-Philippe';
    dto.lastName = 'De La Fontaine';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept names with special characters', async () => {
    const dto = new UpdateUserProfileDto();
    dto.firstName = "O'Brien";
    dto.lastName = 'Müller';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid email with subdomain', async () => {
    const dto = new UpdateUserProfileDto();
    dto.email = 'user@mail.example.com';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid email with plus sign', async () => {
    const dto = new UpdateUserProfileDto();
    dto.email = 'user+test@example.com';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid preferredLocale', async () => {
    const dto = new UpdateUserProfileDto();
    dto.preferredLocale = 'es';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid preferredLocale', async () => {
    const dto = new UpdateUserProfileDto();
    dto.preferredLocale = 'de' as 'fr';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('preferredLocale');
  });

  describe('FR-user-profile-keycloak — person name rules', () => {
    const run = (plain: Record<string, unknown>) =>
      validate(plainToInstance(UpdateUserProfileDto, plain));

    it('nominal: accepts accents, apostrophes, hyphens and spaces', async () => {
      const errors = await run({
        firstName: 'Jean-Pierre',
        lastName: "de l'Étoile",
      });
      expect(errors).toHaveLength(0);
    });

    it('edge: measures length after trimming and accepts 50 characters', async () => {
      expect(await run({ firstName: `  ${'a'.repeat(50)}  ` })).toHaveLength(0);
    });

    it('edge: rejects 51 characters and doubled separators', async () => {
      expect(
        (await run({ lastName: 'a'.repeat(51) })).map((e) => e.property),
      ).toEqual(['lastName']);
      expect(await run({ firstName: 'Jean--Pierre' })).toHaveLength(1);
      expect(await run({ firstName: '-Jean' })).toHaveLength(1);
    });

    it.each(['Jean2', 'J@ne', '', '   ', '<b>x</b>'])(
      'failure: rejects %p on the offending field',
      async (value) => {
        const errors = await run({ firstName: value });
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('firstName');
      },
    );
  });
});
