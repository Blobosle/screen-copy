import { app } from 'electron';
import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const LOGGING_ENABLED = false;

function getLogPath(): string {
  const logsDir = path.join(app.getPath('userData'), 'logs');
  mkdirSync(logsDir, { recursive: true });
  return path.join(logsDir, 'snaptext.log');
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function log(scope: string, message: string, details?: unknown): void {
  if (!LOGGING_ENABLED) {
    return;
  }

  const timestamp = new Date().toISOString();
  const suffix = details === undefined ? '' : ` ${safeStringify(details)}`;
  const line = `[${timestamp}] [${scope}] ${message}${suffix}`;

  console.log(line);

  try {
    appendFileSync(getLogPath(), `${line}\n`, 'utf8');
  } catch (error) {
    console.error('[logger] failed to write log file', error);
  }
}

export function logError(scope: string, message: string, error: unknown): void {
  if (error instanceof Error) {
    log(scope, message, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return;
  }

  log(scope, message, { value: String(error) });
}

export function getLogFilePath(): string {
  return getLogPath();
}
