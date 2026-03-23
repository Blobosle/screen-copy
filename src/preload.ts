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
    onHistoryUpdated: (listener: (history: HistoryRecord) => void): (() => void) => {
        const wrapped = (_event: Electron.IpcRendererEvent, history: HistoryRecord) => {
            listener(history);
        };

        ipcRenderer.on("history-updated", wrapped);

        return () => {
            ipcRenderer.removeListener("history-updated", wrapped);
        };
    },
    onCaptureResult: (listener: (result: CaptureResult) => void): void => {
        ipcRenderer.on("capture-result", (_event, result: CaptureResult) => {
            listener(result);
        });
    }
};

contextBridge.exposeInMainWorld("screenCopy", api);
