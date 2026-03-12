import path from 'node:path';
import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  globalShortcut,
  ipcMain,
  systemPreferences
} from 'electron';
import { getLogFilePath, log, logError } from './logger.js';
import { captureInteractiveScreenshot, deleteIfExists, ScreenshotCancelledError } from './screenshot.js';
import { recognizeTextFromImage } from './ocr.js';
import type { CaptureResult } from '../shared/types.js';

const DEFAULT_SHORTCUT = 'CommandOrControl+Shift+Y';

let mainWindow: BrowserWindow | null = null;
let registeredShortcut: string | null = null;
let captureInFlight: Promise<CaptureResult> | null = null;

function createWindow(): BrowserWindow {
  log('main', 'creating browser window');

  const window = new BrowserWindow({
    width: 440,
    height: 520,
    resizable: false,
    title: 'SnapText',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const rendererPath = path.join(__dirname, '../renderer/index.html');
  log('main', 'loading renderer file', { rendererPath });
  void window.loadFile(rendererPath);

  window.webContents.on('did-finish-load', () => {
    log('main', 'renderer finished loading');
  });

  window.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    log('renderer-console', message, { level, line, sourceId });
  });

  window.on('show', () => log('main', 'window shown'));
  window.on('hide', () => log('main', 'window hidden'));
  window.on('focus', () => log('main', 'window focused'));
  window.on('blur', () => log('main', 'window blurred'));
  window.on('closed', () => {
    log('main', 'window closed');
    mainWindow = null;
  });

  return window;
}

function broadcastCaptureResult(result: CaptureResult): void {
  log('main', 'broadcasting capture result', result);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('capture-result', result);
  }
}

function getScreenAccessStatus(): string {
  const status = systemPreferences.getMediaAccessStatus('screen');
  log('main', 'screen access status checked', { status });
  return status;
}

async function runCaptureFlow(): Promise<CaptureResult> {
  log('main', 'runCaptureFlow called', {
    captureInFlight: Boolean(captureInFlight),
    hasMainWindow: Boolean(mainWindow),
    mainWindowVisible: mainWindow?.isVisible() ?? null,
    mainWindowFocused: mainWindow?.isFocused() ?? null
  });

  if (captureInFlight) {
    log('main', 'reusing in-flight capture promise');
    return captureInFlight;
  }

  captureInFlight = (async () => {
    const accessStatus = getScreenAccessStatus();
    if (accessStatus === 'denied' || accessStatus === 'restricted') {
      log('main', 'capture blocked by screen access status', { accessStatus });
      return {
        status: 'error',
        message:
          'Screen Recording access is blocked for SnapText. Open System Settings → Privacy & Security → Screen & System Audio Recording, allow the app, then reopen it.'
      } satisfies CaptureResult;
    }

    let screenshotPath: string | null = null;
    const wasVisible = mainWindow ? mainWindow.isVisible() : false;

    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        log('main', 'hiding main window before interactive screenshot');
        mainWindow.hide();
      }

      screenshotPath = await captureInteractiveScreenshot();
      log('main', 'interactive screenshot finished', { screenshotPath });

      const text = await recognizeTextFromImage(screenshotPath);
      log('main', 'OCR result ready', {
        textLength: text.length,
        preview: text.slice(0, 120)
      });

      if (!text) {
        log('main', 'OCR completed but returned empty text');
        return {
          status: 'error',
          message: 'No text was detected in the selected area.'
        } satisfies CaptureResult;
      }

      clipboard.writeText(text);
      log('main', 'clipboard updated', { textLength: text.length });
      return {
        status: 'success',
        text
      } satisfies CaptureResult;
    } catch (error) {
      if (error instanceof ScreenshotCancelledError) {
        log('main', 'capture flow resolved as cancelled');
        return { status: 'cancelled' } satisfies CaptureResult;
      }

      logError('main', 'capture flow failed', error);
      const message = error instanceof Error ? error.message : 'Unexpected OCR error.';
      return {
        status: 'error',
        message
      } satisfies CaptureResult;
    } finally {
      if (screenshotPath) {
        await deleteIfExists(screenshotPath);
      }

      if (mainWindow && !mainWindow.isDestroyed() && wasVisible) {
        log('main', 'restoring main window after capture');
        mainWindow.show();
        mainWindow.focus();
      }
    }
  })();

  const result = await captureInFlight;
  captureInFlight = null;
  log('main', 'runCaptureFlow resolved', result);
  broadcastCaptureResult(result);
  return result;
}

function registerShortcut(): void {
  log('main', 'registering global shortcut', { shortcut: DEFAULT_SHORTCUT });

  const ok = globalShortcut.register(DEFAULT_SHORTCUT, () => {
    log('main', 'global shortcut triggered');
    void runCaptureFlow().then(async (result) => {
      if (result.status === 'error' && (!mainWindow || !mainWindow.isFocused())) {
        log('main', 'showing error dialog from global shortcut path', { message: result.message });
        await dialog.showMessageBox({
          type: 'error',
          title: 'SnapText',
          message: result.message
        });
      }
    });
  });

  registeredShortcut = ok ? DEFAULT_SHORTCUT : null;
  log('main', 'global shortcut registration completed', { ok, registeredShortcut });
}

const gotLock = app.requestSingleInstanceLock();
log('main', 'single instance lock result', { gotLock });
if (!gotLock) {
  app.quit();
}

app.on('second-instance', () => {
  log('main', 'second instance detected');
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  } else {
    mainWindow = createWindow();
  }
});

app.whenReady().then(() => {
  log('main', 'app ready', {
    userData: app.getPath('userData'),
    logFile: getLogFilePath(),
    platform: process.platform,
    versions: process.versions
  });

  mainWindow = createWindow();
  registerShortcut();

  app.on('activate', () => {
    log('main', 'app activate event');
    if (!mainWindow) {
      mainWindow = createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log('main', 'window-all-closed event');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  log('main', 'will-quit event');
  globalShortcut.unregisterAll();
});

ipcMain.handle('capture-text', async (): Promise<CaptureResult> => {
  log('ipc', 'capture-text invoked from renderer');
  const result = await runCaptureFlow();

  if (result.status === 'error' && mainWindow?.isFocused() !== true) {
    log('ipc', 'showing error dialog for renderer request', { message: result.message });
    await dialog.showMessageBox({
      type: 'error',
      title: 'SnapText',
      message: result.message
    });
  }

  log('ipc', 'capture-text returning result to renderer', result);
  return result;
});

ipcMain.handle('get-shortcut', async (): Promise<string | null> => {
  log('ipc', 'get-shortcut invoked', { registeredShortcut });
  return registeredShortcut;
});
