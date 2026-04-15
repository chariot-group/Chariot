import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ChangePasswordDto } from '@/resources/user/dto/change-password.dto';

describe('ChangePasswordDto', () => {
  describe('Validation', () => {
    it('should accept valid password change data', async () => {
      const plain = {
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewPassword456!',
      };

      const instance = plainToInstance(ChangePasswordDto, plain);
      const errors = await validate(instance);

      expect(errors).toHaveLength(0);
      expect(instance.currentPassword).toBe(plain.currentPassword);
      expect(instance.newPassword).toBe(plain.newPassword);
    });

    it('should reject empty current password', async () => {
      const plain = {
        currentPassword: '',
        newPassword: 'NewPassword456!',
      };

      const instance = plainToInstance(ChangePasswordDto, plain);
      const errors = await validate(instance);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('currentPassword');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should reject missing current password', async () => {
      const plain = {
        newPassword: 'NewPassword456!',
      };

      const instance = plainToInstance(ChangePasswordDto, plain);
      const errors = await validate(instance);

      expect(errors.length).toBeGreaterThan(0);
      const currentPasswordError = errors.find(
        (e) => e.property === 'currentPassword',
      );
      expect(currentPasswordError).toBeDefined();
    });

    it('should reject new password shorter than 8 characters', async () => {
      const plain = {
        currentPassword: 'CurrentPassword123!',
        newPassword: 'Short1!',
      };

      const instance = plainToInstance(ChangePasswordDto, plain);
      const errors = await validate(instance);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('newPassword');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should accept new password exactly 8 characters', async () => {
      const plain = {
        currentPassword: 'CurrentPassword123!',
        newPassword: 'Pass123!',
      };

      const instance = plainToInstance(ChangePasswordDto, plain);
      const errors = await validate(instance);

      expect(errors).toHaveLength(0);
    });

    it('should reject non-string current password', async () => {
      const plain = {
        currentPassword: 12345,
        newPassword: 'NewPassword456!',
      };

      const instance = plainToInstance(ChangePasswordDto, plain);
      const errors = await validate(instance);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('currentPassword');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should reject non-string new password', async () => {
      const plain = {
        currentPassword: 'CurrentPassword123!',
        newPassword: 12345678,
      };

      const instance = plainToInstance(ChangePasswordDto, plain);
      const errors = await validate(instance);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('newPassword');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });
});
