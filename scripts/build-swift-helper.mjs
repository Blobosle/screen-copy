import { chmodSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

mkdirSync('build/native', { recursive: true });

const result = spawnSync(
  'xcrun',
  [
    'swiftc',
    'native/ocr.swift',
    '-O',
    '-framework',
    'AppKit',
    '-framework',
    'CoreGraphics',
    '-framework',
    'Vision',
    '-o',
    'build/native/ocr-helper'
  ],
  { stdio: 'inherit' }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

chmodSync('build/native/ocr-helper', 0o755);
