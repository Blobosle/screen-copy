import { rmSync } from 'node:fs';

for (const target of ['dist', 'build/native']) {
    rmSync(target, { recursive: true, force: true });
}
