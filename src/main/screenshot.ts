import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile, ExecFileException } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export class ScreenshotCancelledError extends Error {
    constructor() {
        super('Screenshot capture was cancelled.');
        this.name = 'ScreenshotCancelledError';
    }
}

export async function captureInteractiveScreenshot(): Promise<string> {
    const filePath = path.join(os.tmpdir(), `screencopy-${randomUUID()}.png`);

    try {
        const result = await execFileAsync('screencapture', ['-i', '-x', filePath]);

        const stats = await fs.stat(filePath).catch((error) => {
            console.log("ERROR: [screenshot.ts: captureInteractiveScreenshot()] Failed to stat screenshot file after capture", error);
            return null;
        });

        if (!stats || stats.size === 0) {
            console.log("ERROR: [screenshot.ts: captureInteractiveScreenshot()] capture treated as cancelled because file was missing or empty");
            throw new ScreenshotCancelledError();
        }

        return filePath;
    } catch (error) {
        console.log("ERROR: [screenshot.ts: captureInteractiveScreenshot()] Screenshot capture was catched", error);
        await fs.rm(filePath, { force: true }).catch((rmError) => {
            console.log("ERROR: [screenshot.ts: captureInteractiveScreenshot()] Failed to remove temporary screenshot after error", rmError);
        });

        const maybeExecError = error as ExecFileException | undefined;
        if (maybeExecError?.code === 1 || maybeExecError?.signal === 'SIGTERM') {
            console.log("ERROR: [screenshot.ts: captureInteractiveScreenshot()] Mapping execFile failure to ScreenshotCancelledError");
            throw new ScreenshotCancelledError();
        }

        throw error;
    }
}

export async function deleteIfExists(filePath: string): Promise<void> {
    await fs.rm(filePath, { force: true }).catch((error) => {
        console.log("ERROR: [screenshot.ts: deleteIfExists()] Failed to delete temporary file", error);
    });
}
