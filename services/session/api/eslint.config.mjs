import globals from "globals";
import tseslint from "typescript-eslint";
import pluginPrettier from "eslint-plugin-prettier";
import configPrettier from "eslint-config-prettier";

export default [
    {
        ignores: [".eslintrc.js"],
    },
    {
        files: ["{src,apps,libs,test}/**/*.ts"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: "tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
                sourceType: "module",
            },
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin,
            prettier: pluginPrettier,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            ...configPrettier.rules,
            "@typescript-eslint/explicit-module-boundary-types": "off",
        },
    },
];
