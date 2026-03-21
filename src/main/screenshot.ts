import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile, ExecFileException } from 'node:child_process';
import { promisify } from 'node:util';

/* Make the callback execFile a promise */
const execFileAsync = promisify(execFile);

/*
 * Custom error handling for cancelled screenshot
 */
export class ScreenshotCancelledError extends Error {
    constructor() {
        super('Screenshot capture was cancelled.');
        this.name = 'ScreenshotCancelledError';
    }
}

/*
 * Capture handler that stores screenshot taken in tmp
 */
export async function captureInteractiveScreenshot(): Promise<string> {
    const filePath = path.join(os.tmpdir(), `screencopy-${randomUUID()}.png`);

    try {
        await execFileAsync('screencapture', ['-i', '-x', filePath]);

        const stats = await fs.stat(filePath);

        if (!stats || stats.size === 0) {
            console.log("ERROR: [screenshot.ts: captureInteractiveScreenshot()] capture treated as cancelled because file was missing or empty");
            throw new ScreenshotCancelledError();
        }

        return filePath;
    } catch (error) {
        console.log("LOG: [screenshot.ts: captureInteractiveScreenshot()] Screenshot capture was catched", error);

        await deleteIfExists(filePath);

        const maybeExecError = error as ExecFileException | undefined;
        if (maybeExecError?.code === 1 || maybeExecError?.signal === 'SIGTERM') {
            console.log("ERROR: [screenshot.ts: captureInteractiveScreenshot()] Mapping execFile failure to ScreenshotCancelledError");
            throw new ScreenshotCancelledError();
        }

        if (maybeExecError?.code === 'ENOENT') {
            throw new ScreenshotCancelledError();
        }

        throw error;
    }
}

/*
 * Deletion helper function for removing temporary failed screenshots
 */
export async function deleteIfExists(filePath: string): Promise<void> {
    await fs.rm(filePath, { force: true }).catch((error) => {
        console.log("ERROR: [screenshot.ts: deleteIfExists()] Failed to delete temporary file", error);
    });
}
