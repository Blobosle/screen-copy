import { build } from 'esbuild';
import { cpSync, mkdirSync } from 'node:fs';

mkdirSync('dist/renderer', { recursive: true });

await build({
    entryPoints: ['src/renderer/App.tsx'],
    bundle: true,
    outfile: 'dist/renderer/renderer.js',
    platform: 'browser',
    format: 'iife',
    jsx: 'automatic',
    sourcemap: true,
    target: ['chrome114']
});

cpSync('src/renderer/index.html', 'dist/renderer/index.html');
cpSync('src/renderer/style.css', 'dist/renderer/style.css');
