import fs from 'node:fs/promises';
import path from 'node:path';
import {
    app,
    BrowserWindow,
    clipboard,
    dialog,
    globalShortcut,
    ipcMain,
    Menu,
    Tray,
    nativeImage,
    systemPreferences
} from 'electron';
import { getLogFilePath, log, logError } from './logger.js';
import { captureInteractiveScreenshot, deleteIfExists, ScreenshotCancelledError } from './screenshot.js';
import { recognizeTextFromImage } from './ocr.js';
import type { AppSettings, CaptureResult, ShortcutUpdateResult } from '../shared/types.js';

const DEFAULT_SHORTCUT = 'CommandOrControl+Shift+Y';
const DEFAULT_SETTINGS: AppSettings = {
    screenshotShortcut: DEFAULT_SHORTCUT
};

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let registeredShortcut: string | null = null;
let captureInFlight: Promise<CaptureResult> | null = null;
let appSettings: AppSettings = { ...DEFAULT_SETTINGS };
let isQuitting = false;

if (process.platform === 'darwin') {
    app.setActivationPolicy('accessory');
}

function getSettingsPath(): string {
    return path.join(app.getPath('userData'), 'settings.json');
}

async function loadSettings(): Promise<AppSettings> {
    try {
        const raw = await fs.readFile(getSettingsPath(), 'utf8');
        const parsed = JSON.parse(raw) as Partial<AppSettings>;

        return {
            screenshotShortcut:
                typeof parsed.screenshotShortcut === 'string' && parsed.screenshotShortcut.trim().length > 0
                    ? parsed.screenshotShortcut.trim()
                    : DEFAULT_SETTINGS.screenshotShortcut
        };
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            logError('main', 'failed to load settings file', error);
        }

        return { ...DEFAULT_SETTINGS };
    }
}

async function persistSettings(): Promise<void> {
    try {
        const settingsPath = getSettingsPath();
        await fs.mkdir(path.dirname(settingsPath), { recursive: true });
        await fs.writeFile(settingsPath, JSON.stringify(appSettings, null, 2), 'utf8');
        log('main', 'settings persisted', { settingsPath, appSettings });
    } catch (error) {
        logError('main', 'failed to persist settings', error);
    }
}

function createTrayImage() {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
            <rect x="5.5" y="3.5" width="8" height="9" rx="1.5" fill="none" stroke="black" stroke-width="1.5"/>
            <rect x="3.5" y="5.5" width="8" height="9" rx="1.5" fill="none" stroke="black" stroke-width="1.5"/>
        </svg>
    `.trim();

    const image = nativeImage.createFromDataURL(
        `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    );

    image.setTemplateImage(true);
    return image.resize({ width: 18, height: 18 });
}

function ensureTray(): Tray {
    if (tray) {
        return tray;
    }

    tray = new Tray(createTrayImage());
    tray.setToolTip('ScreenCopy');

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open Settings',
            click: () => {
                void showSettingsWindow();
            }
        },
        { type: 'separator' },
        {
            label: 'Quit ScreenCopy',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        void showSettingsWindow();
    });

    return tray;
}

function createWindow(): BrowserWindow {
    log('main', 'creating browser window');

    const window = new BrowserWindow({
        width: 760,
        height: 460,
        minWidth: 760,
        minHeight: 460,
        resizable: false,
        maximizable: false,
        fullscreenable: false,
        show: false,
        title: 'ScreenCopy',
        backgroundColor: '#ececec',
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

    window.on('close', (event) => {
        if (isQuitting) {
            return;
        }

        event.preventDefault();
        void hideSettingsWindow();
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

function ensureWindow(): BrowserWindow {
    if (!mainWindow || mainWindow.isDestroyed()) {
        mainWindow = createWindow();
    }

    return mainWindow;
}

async function showSettingsWindow(): Promise<void> {
    const window = ensureWindow();

    if (process.platform === 'darwin') {
        app.setActivationPolicy('regular');
        await app.dock?.show();
    }

    if (window.isMinimized()) {
        window.restore();
    }

    window.show();
    app.focus();
    window.focus();
}

async function hideSettingsWindow(): Promise<void> {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
        mainWindow.hide();
    }

    if (process.platform === 'darwin') {
        app.dock?.hide();
        app.setActivationPolicy('accessory');
    }
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
                    'Screen Recording access is blocked for ScreenCopy. Open System Settings → Privacy & Security → Screen & System Audio Recording, allow the app, then reopen it.'
            } satisfies CaptureResult;
        }

        let screenshotPath: string | null = null;

        try {
            if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
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
        }
    })();

    const result = await captureInFlight;
    captureInFlight = null;
    log('main', 'runCaptureFlow resolved', result);
    broadcastCaptureResult(result);
    return result;
}

function handleShortcutTriggered(): void {
    log('main', 'global shortcut triggered');

    void runCaptureFlow().then(async (result) => {
        if (result.status === 'error' && (!mainWindow || !mainWindow.isFocused())) {
            log('main', 'showing error dialog from global shortcut path', { message: result.message });
            await dialog.showMessageBox({
                type: 'error',
                title: 'ScreenCopy',
                message: result.message
            });
        }
    });
}

function restoreShortcut(previousShortcut: string): void {
    try {
        const restored = globalShortcut.register(previousShortcut, handleShortcutTriggered);
        registeredShortcut = restored ? previousShortcut : null;
        log('main', 'restore shortcut attempted', { previousShortcut, restored, registeredShortcut });
    } catch (error) {
        logError('main', 'failed to restore previous shortcut', error);
        registeredShortcut = null;
    }
}

function applyShortcut(shortcut: string): ShortcutUpdateResult {
    const nextShortcut = shortcut.trim();
    const previousShortcut = registeredShortcut ?? appSettings.screenshotShortcut ?? DEFAULT_SHORTCUT;

    if (!nextShortcut) {
        return {
            status: 'error',
            shortcut: previousShortcut,
            message: 'Shortcut cannot be empty.'
        };
    }

    if (registeredShortcut) {
        globalShortcut.unregister(registeredShortcut);
    }

    try {
        const ok = globalShortcut.register(nextShortcut, handleShortcutTriggered);

        if (!ok) {
            restoreShortcut(previousShortcut);
            return {
                status: 'error',
                shortcut: registeredShortcut ?? previousShortcut,
                message:
                    'That shortcut is unavailable. It may already be used by macOS or another app.'
            };
        }

        registeredShortcut = nextShortcut;
        appSettings = {
            ...appSettings,
            screenshotShortcut: nextShortcut
        };
        void persistSettings();

        log('main', 'shortcut updated', { registeredShortcut });

        return {
            status: 'success',
            shortcut: registeredShortcut
        };
    } catch (error) {
        logError('main', 'shortcut registration threw an error', error);
        restoreShortcut(previousShortcut);

        return {
            status: 'error',
            shortcut: registeredShortcut ?? previousShortcut,
            message: 'That key combination is not supported.'
        };
    }
}

function resetShortcut(): ShortcutUpdateResult {
    appSettings = { ...DEFAULT_SETTINGS };
    return applyShortcut(DEFAULT_SHORTCUT);
}

function registerInitialShortcut(): void {
    const result = applyShortcut(appSettings.screenshotShortcut);

    if (result.status === 'success') {
        return;
    }

    log('main', 'saved shortcut failed, falling back to default', {
        attemptedShortcut: appSettings.screenshotShortcut,
        message: result.message
    });

    appSettings = { ...DEFAULT_SETTINGS };

    const fallbackResult = applyShortcut(DEFAULT_SHORTCUT);
    if (fallbackResult.status === 'error') {
        log('main', 'default shortcut also failed to register', { message: fallbackResult.message });
    }
}

const gotLock = app.requestSingleInstanceLock();
log('main', 'single instance lock result', { gotLock });

if (!gotLock) {
    app.quit();
}

app.on('second-instance', () => {
    log('main', 'second instance detected');
    void showSettingsWindow();
});

app.whenReady().then(async () => {
    app.setName('ScreenCopy');

    log('main', 'app ready', {
        userData: app.getPath('userData'),
        logFile: getLogFilePath(),
        platform: process.platform,
        versions: process.versions
    });

    appSettings = await loadSettings();
    ensureTray();
    registerInitialShortcut();

    if (process.platform === 'darwin') {
        app.dock?.hide();
    }

    app.on('activate', () => {
        log('main', 'app activate event');
        void showSettingsWindow();
    });
});

app.on('before-quit', () => {
    isQuitting = true;
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
            title: 'ScreenCopy',
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

ipcMain.handle('get-settings', async (): Promise<AppSettings> => {
    log('ipc', 'get-settings invoked', { appSettings, registeredShortcut });

    return {
        ...appSettings,
        screenshotShortcut: registeredShortcut ?? appSettings.screenshotShortcut
    };
});

ipcMain.handle('set-shortcut', async (_event, shortcut: string): Promise<ShortcutUpdateResult> => {
    log('ipc', 'set-shortcut invoked', { shortcut });
    const result = applyShortcut(shortcut);
    log('ipc', 'set-shortcut completed', result);
    return result;
});

ipcMain.handle('reset-shortcut', async (): Promise<ShortcutUpdateResult> => {
    log('ipc', 'reset-shortcut invoked');
    const result = resetShortcut();
    log('ipc', 'reset-shortcut completed', result);
    return result;
});
