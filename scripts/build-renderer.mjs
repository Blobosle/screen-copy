import { build } from 'esbuild';

await build({
    entryPoints: ['src/renderer/main.tsx'],
    bundle: true,
    outfile: 'dist/renderer/renderer.js',
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    sourcemap: true,
    target: ['chrome114']
});
