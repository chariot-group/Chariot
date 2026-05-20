import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    {
        settings: {
            react: { version: "19.0.0" },
        },
    },
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        rules: {
            "@typescript-eslint/no-explicit-any": "warn",
            "prefer-const": "warn",
        },
    },
    globalIgnores(["node_modules/", ".next/"]),
]);

export default eslintConfig;
