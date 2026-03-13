import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile, ExecFileException } from 'node:child_process';
import { promisify } from 'node:util';
import { log, logError } from './logger';

const execFileAsync = promisify(execFile);

export class ScreenshotCancelledError extends Error {
    constructor() {
        super('Screenshot capture was cancelled.');
        this.name = 'ScreenshotCancelledError';
    }
}

export async function captureInteractiveScreenshot(): Promise<string> {
    const filePath = path.join(os.tmpdir(), `screencopy-${randomUUID()}.png`);
    log('screenshot', 'starting interactive screencapture', { filePath });

    try {
        const result = await execFileAsync('screencapture', ['-i', '-x', filePath]);
        log('screenshot', 'screencapture finished', {
            stdout: result.stdout,
            stderr: result.stderr
        });

        const stats = await fs.stat(filePath).catch((error) => {
            logError('screenshot', 'failed to stat screenshot file after capture', error);
            return null;
        });

        log('screenshot', 'post-capture file stats', {
            exists: Boolean(stats),
            size: stats?.size ?? null
        });

        if (!stats || stats.size === 0) {
            log('screenshot', 'capture treated as cancelled because file was missing or empty');
            throw new ScreenshotCancelledError();
        }

        return filePath;
    } catch (error) {
        logError('screenshot', 'screencapture threw', error);
        await fs.rm(filePath, { force: true }).catch((rmError) => {
            logError('screenshot', 'failed to remove temporary screenshot after error', rmError);
        });

        const maybeExecError = error as ExecFileException | undefined;
        if (maybeExecError?.code === 1 || maybeExecError?.signal === 'SIGTERM') {
            log('screenshot', 'mapping execFile failure to ScreenshotCancelledError', {
                code: maybeExecError.code,
                signal: maybeExecError.signal
            });
            throw new ScreenshotCancelledError();
        }

        throw error;
    }
}

export async function deleteIfExists(filePath: string): Promise<void> {
    log('screenshot', 'deleting temporary file', { filePath });
    await fs.rm(filePath, { force: true }).catch((error) => {
        logError('screenshot', 'failed to delete temporary file', error);
    });
}
