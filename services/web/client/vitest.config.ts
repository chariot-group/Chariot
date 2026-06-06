import { defineConfig } from "vitest/config";
import path from "node:path";

const ASSET_EXTENSIONS = /\.(svg|png|jpe?g|gif|webp|ico|css|scss|sass|less|woff2?|ttf|otf|eot)$/;

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@public": path.resolve(__dirname, "./public"),
    },
  },
  plugins: [
    {
      name: "chariot-mock-assets",
      enforce: "pre",
      resolveId(source) {
        if (ASSET_EXTENSIONS.test(source)) {
          return "\0virtual:chariot-mock-asset";
        }
        return null;
      },
      load(id) {
        if (id === "\0virtual:chariot-mock-asset") {
          return 'export default "";';
        }
        return null;
      },
    },
  ],
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    globals: false,
    setupFiles: [],
  },
});
