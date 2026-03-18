import fs from "node:fs/promises";
import path from "node:path";
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
} from "electron";
import { log, logError } from "./logger.js";
import { captureInteractiveScreenshot, deleteIfExists, ScreenshotCancelledError } from "./screenshot.js";
import { recognizeTextFromImage } from "./ocr.js";
import type { AppSettings, CaptureResult } from "../shared/types.js";

const DEFAULT_SHORTCUT = "CommandOrControl+Shift+Y";
const DEFAULT_SETTINGS: AppSettings = {
    screenshotShortcut: DEFAULT_SHORTCUT,
    imageShortcut: "",
};

const IS_DEV = !app.isPackaged;
// const IS_DEV = false;
const SETTINGS_PATH = path.join(app.getPath("userData"), "settings.json");
const PRELOAD_PATH = path.join(__dirname, "../preload.js");
const RENDERER_PATH = path.join(__dirname, "../renderer/index.html");

/* State variables */
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let registeredShortcut: string | null = null;
let captureInFlight: Promise<CaptureResult> | null = null;
let appSettings: AppSettings = { ...DEFAULT_SETTINGS };

if (process.platform === "darwin") {
    app.setActivationPolicy("accessory");
}

/*
 * Loading settings type AppSettings from settings.json
 */
async function loadSettings(): Promise<AppSettings> {
    try {
        const raw = await fs.readFile(SETTINGS_PATH, "utf8");
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        const settings: AppSettings = { ...DEFAULT_SETTINGS, ...parsed };

        for (const i of Object.keys(settings) as Array<keyof AppSettings>) {
            if (settings[i].trim().length === 0) {
                settings[i] = DEFAULT_SETTINGS[i];
            }
            else {
                settings[i] = settings[i].trim();
            }

            if (!globalShortcut.register(settings[i], handleShortcutTriggered)) {
                console.log("ERROR: [main.ts:applyShortcut()] Shortcut could not be registered");
            }
        }

        return settings;
    }
    catch (error) {
        logError("main", "failed to load settings", error);
    }

    return { ...DEFAULT_SETTINGS };
}

/*
 * Write settings.json file with settings to persist between sessions
 */
async function writeSettings(): Promise<void> {
    try {
        await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
        await fs.writeFile(SETTINGS_PATH, JSON.stringify(appSettings, null, 4), "utf8");
    } catch (error) {
        logError("main", "failed to persist settings", error);
    }
}

/*
 * Initializing tray icon "SC" and appropriate menu options
 */
function initTray(): void {
    if (tray) {
        return;
    }

    tray = new Tray(nativeImage.createEmpty());

    tray.setTitle("SC");
    tray.setToolTip("ScreenCopy");

    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Settings",
            click: () => {
                void showSettingsWindow();
            }
        },
        { type: "separator" },
        {
            label: "Quit",
            click: () => {
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
}

/*
 * Creating new settings window if no current window exists
 */
function createSettingsWindow(): BrowserWindow {
    if (mainWindow && mainWindow.isDestroyed()) {
        return mainWindow;
    }

    const window = new BrowserWindow({
        width: 760,
        height: 460,
        minWidth: 760,
        minHeight: 460,
        fullscreenable: false,
        show: false,
        title: "ScreenCopy",
        backgroundColor: "#ececec",
        webPreferences: {
            preload: PRELOAD_PATH,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    window.loadFile(RENDERER_PATH);

    window.on("closed", () => {
        mainWindow = null;
    });

    return window;
}

/*
 * Refocuses or calls the createSettingsWindow function to create a new window
 * depending on the current status of the window
 */
async function showSettingsWindow(): Promise<void> {
    if (!mainWindow) {
        mainWindow = createSettingsWindow();
    }

    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }

    mainWindow.show();
}

function broadcastCaptureResult(result: CaptureResult): void {
    log("main", "broadcasting capture result", result);

    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("capture-result", result);
    }
}

function getScreenAccessStatus(): string {
    const status = systemPreferences.getMediaAccessStatus("screen");
    log("main", "screen access status checked", { status });
    return status;
}

async function runCaptureFlow(): Promise<CaptureResult> {
    if (captureInFlight) {
        log("main", "reusing in-flight capture promise");
        return captureInFlight;
    }

    captureInFlight = (async () => {
        const accessStatus = getScreenAccessStatus();

        if (accessStatus === "denied" || accessStatus === "restricted") {
            log("main", "capture blocked by screen access status", { accessStatus });
            return {
                status: "error",
                message:
                    "Screen Recording access is blocked for ScreenCopy. Open System Settings → Privacy & Security → Screen & System Audio Recording, allow the app, then reopen it."
            } satisfies CaptureResult;
        }

        let screenshotPath: string | null = null;

        try {
            if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
                log("main", "hiding main window before interactive screenshot");
                mainWindow.hide();
            }

            screenshotPath = await captureInteractiveScreenshot();
            log("main", "interactive screenshot finished", { screenshotPath });

            const text = await recognizeTextFromImage(screenshotPath);
            log("main", "OCR result ready", {
                textLength: text.length,
                preview: text.slice(0, 120)
            });

            if (!text) {
                log("main", "OCR completed but returned empty text");
                return {
                    status: "error",
                    message: "No text or QR code was detected in the selected area."
                } satisfies CaptureResult;
            }

            clipboard.writeText(text);
            log("main", "clipboard updated", { textLength: text.length });

            return {
                status: "success",
                text
            } satisfies CaptureResult;
        } catch (error) {
            if (error instanceof ScreenshotCancelledError) {
                log("main", "capture flow resolved as cancelled");
                return { status: "cancelled" } satisfies CaptureResult;
            }

            logError("main", "capture flow failed", error);
            const message = error instanceof Error ? error.message : "Unexpected OCR error.";

            return {
                status: "error",
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
    log("main", "runCaptureFlow resolved", result);
    broadcastCaptureResult(result);
    return result;
}

function handleShortcutTriggered(): void {
    log("main", "global shortcut triggered");

    void runCaptureFlow().then(async (result) => {
        if (result.status === "error" && (!mainWindow || !mainWindow.isFocused())) {
            log("main", "showing error dialog from global shortcut path", { message: result.message });
            await dialog.showMessageBox({
                type: "error",
                title: "ScreenCopy",
                message: result.message
            });
        }
    });
}

/*
 * Applies a shortcut change for a specified shortcut key
 */
function applyShortcut(shortcutKey: keyof AppSettings, shortcut: string): boolean {
    if (!shortcutKey || !shortcut) {
        console.log("ERROR: [main.ts:applyShortcut()] Argument is null");
        return false;
    }

    const newShortcut = shortcut.trim();
    const oldShortcut = appSettings[shortcutKey];

    if (newShortcut === oldShortcut || newShortcut.length <= 0) {
        console.log("LOG: [main.ts:applyShortcut()] Shortcut has not changed");
        return false;
    }

    globalShortcut.unregister(oldShortcut);

    if (!globalShortcut.register(newShortcut, handleShortcutTriggered)) {
        console.log("ERROR: [main.ts:applyShortcut()] Shortcut could not be registered");
        return false;
    }

    appSettings[shortcutKey] = shortcut;
    writeSettings();

    return true;
}

/* Makes sure there is only one instance of the app */
if (!app.requestSingleInstanceLock()) { app.quit(); }

/*
 * Handles the case where the app is opened twice
 */
app.on("second-instance", () => {
    showSettingsWindow();
});

/*
 * Initialization function for the app
 */
app.whenReady().then(async () => {
    /* Load settings are the bindings set previously by the user */
    appSettings = await loadSettings();
    /* Load tray icon */
    initTray();

    /* Hide dock icon */
    if (process.platform === "darwin") {
        app.dock?.hide();
    }

    if (IS_DEV) {
        showSettingsWindow();
    }
});

/* Intercepts window closing app quitting procedures */
app.on("window-all-closed", () => { });

/* Cleanup of shortcuts */
app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});

ipcMain.handle("capture-text", async (): Promise<CaptureResult> => {
    const result = await runCaptureFlow();

    if (result.status === "error" && mainWindow?.isFocused() !== true) {
        log("ipc", "showing error dialog for renderer request", { message: result.message });
        await dialog.showMessageBox({
            type: "error",
            title: "ScreenCopy",
            message: result.message
        });
    }

    log("ipc", "capture-text returning result to renderer", result);
    return result;
});

/*
 * TODO: Handle multiple shortcuts
 */
ipcMain.handle("get-shortcut", async (): Promise<string | null> => {
    return appSettings.screenshotShortcut;
});

/*
 * TODO: Handle multiple shortcuts
 */
ipcMain.handle("get-settings", async (): Promise<AppSettings> => {
    return {
        ...appSettings,
        screenshotShortcut: appSettings.screenshotShortcut
    };
});

/*
 * TODO: Handle specific shortcut sets
 */
ipcMain.handle("set-shortcut", async (_event, shortcut: string): Promise<boolean> => {
    return applyShortcut("screenshotShortcut", shortcut);
});

/*
 * TODO: Handle specific shortcut resets
 */
ipcMain.handle("reset-shortcut", async (): Promise<void> => {
    appSettings = { ...DEFAULT_SETTINGS };
});
