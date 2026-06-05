import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default [
    {
        ignores: ["dist/**", "coverage/**", "node_modules/**", ".eslintrc.js"],
    },
    {
        files: ["{src,apps,libs,test}/**/*.ts"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
                sourceType: "module",
            },
            globals: {
                describe: "readonly",
                it: "readonly",
                expect: "readonly",
                jest: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": tsEslintPlugin,
            prettier: prettierPlugin,
        },
        rules: {
            ...tsEslintPlugin.configs.recommended.rules,
            "prettier/prettier": "error",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-explicit-any": "error",
        },
    },
    eslintConfigPrettier,
];
