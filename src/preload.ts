import { contextBridge, ipcRenderer } from "electron";
import type { AppSettings, CaptureResult, HistoryRecord } from "@shared/types.js";

const api = {
    captureText: async (): Promise<CaptureResult> => {
        const result = await ipcRenderer.invoke("capture-text");
        return result;
    },
    getSettings: async (): Promise<AppSettings> => {
        const settings = await ipcRenderer.invoke("get-settings");
        return settings;
    },
    getShortcut: async (): Promise<string | null> => {
        const shortcut = await ipcRenderer.invoke("get-shortcut");
        return shortcut;
    },
    getHistory: async (): Promise<HistoryRecord> => {
        const history = await ipcRenderer.invoke("get-history");
        return history;
    },
    setShortcut: async (shortcutType: string, shortcut: string): Promise<boolean> => {
        const result = await ipcRenderer.invoke("set-shortcut", shortcutType, shortcut);
        return result;
    },
    resetShortcut: async (shortcutType: string): Promise<AppSettings> => {
        const result = await ipcRenderer.invoke("reset-shortcut", shortcutType);
        return result;
    },
    clearHistory: async (): Promise<HistoryRecord> => {
        const result = await ipcRenderer.invoke("clear-history");
        return result;
    },
    onCaptureResult: (listener: (result: CaptureResult) => void): void => {
        ipcRenderer.on("capture-result", (_event, result: CaptureResult) => {
            listener(result);
        });
    }
};

contextBridge.exposeInMainWorld("screenCopy", api);
