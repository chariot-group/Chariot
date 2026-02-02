import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
    @ApiProperty({
        description: 'Keycloak unique identifier',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    keycloakId: string;

    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
    })
    email: string;

    @ApiProperty({
        description: 'Username',
        example: 'john_doe',
    })
    username: string;

    @ApiProperty({
        description: 'User first name',
        example: 'John',
        required: false,
    })
    firstName?: string;

    @ApiProperty({
        description: 'User last name',
        example: 'Doe',
        required: false,
    })
    lastName?: string;

    @ApiProperty({
        description: 'User avatar URL',
        example: 'https://example.com/avatar.jpg',
        pattern: '^https?://.+\\.(jpg|jpeg|png|gif|webp)$',
        required: false,
        nullable: true,
    })
    avatar?: string;
}
