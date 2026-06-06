// jest.config.ts
import { Config } from 'jest';

const config: Config = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    transformIgnorePatterns: [
        '/node_modules/(?!(jose|jwks-rsa)/)',
    ],
    transform: {
        '^.+\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
};

export default config;