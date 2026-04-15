import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts", "src/react/index.tsx"],
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: false,
    treeshake: true,
    external: ["react"],
});
