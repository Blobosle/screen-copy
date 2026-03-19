import { build } from 'esbuild';
import { cpSync, mkdirSync } from 'node:fs';
import path from 'node:path';

mkdirSync('dist/renderer', { recursive: true });

await build({
    entryPoints: ['src/renderer/App.tsx'],
    bundle: true,
    outfile: 'dist/renderer/renderer.js',
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    sourcemap: true,
    target: ['chrome114'],
    alias: {
        "@renderer": path.resolve("src/renderer"),
        "@shared": path.resolve("src/shared"),
        "@main": path.resolve("src/main"),
    },
});

cpSync('src/renderer/index.html', 'dist/renderer/index.html');
