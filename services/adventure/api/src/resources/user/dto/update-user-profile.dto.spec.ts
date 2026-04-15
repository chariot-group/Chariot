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

  it('should reject firstName with less than 2 characters', async () => {
    const dto = new UpdateUserProfileDto();
    dto.firstName = 'J';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('minLength');
    expect(errors[0].constraints?.minLength).toContain('at least 2 characters');
  });

  it('should reject lastName with less than 2 characters', async () => {
    const dto = new UpdateUserProfileDto();
    dto.lastName = 'D';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('minLength');
    expect(errors[0].constraints?.minLength).toContain('at least 2 characters');
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
});
