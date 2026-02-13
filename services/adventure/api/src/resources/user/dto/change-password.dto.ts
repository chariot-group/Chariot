import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO for user password change
 * @see FR-009: User Password Change
 */
export class ChangePasswordDto {
    @ApiProperty({
        description: 'Current password of the user',
        example: 'CurrentPassword123!',
        required: true,
    })
    @IsString()
    @IsNotEmpty({ message: 'Current password is required' })
    currentPassword: string;

    @ApiProperty({
        description: 'New password (must be at least 8 characters)',
        example: 'NewSecurePassword456!',
        minLength: 8,
        required: true,
    })
    @IsString()
    @MinLength(8, { message: 'New password must be at least 8 characters long' })
    newPassword: string;
}
