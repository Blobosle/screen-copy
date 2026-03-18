import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function getHelperPath(): string {
    const devPath = path.resolve(process.cwd(), 'build/native/ocr-helper');
    if (existsSync(devPath)) {
        return devPath;
    }

    return path.join(process.resourcesPath, 'ocr-helper');
}

export async function recognizeTextFromImage(filePath: string): Promise<string> {
    const helperPath = getHelperPath();
    const { stdout, stderr } = await execFileAsync(helperPath, [filePath]);

    if (stderr.trim()) {
        throw new Error(stderr.trim());
    }

    return stdout.trim();
}
