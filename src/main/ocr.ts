import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { log } from './logger';

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
    log('ocr', 'starting OCR helper', { helperPath, filePath });

    const { stdout, stderr } = await execFileAsync(helperPath, [filePath]);

    log('ocr', 'OCR helper completed', {
        stdoutLength: stdout.length,
        stderrLength: stderr.length,
        stderr: stderr.trim() || null
    });

    if (stderr.trim()) {
        throw new Error(stderr.trim());
    }

    return stdout.trim();
}
