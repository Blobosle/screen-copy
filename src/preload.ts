import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings, CaptureResult } from './shared/types.js';

const api = {
    captureText: async (): Promise<CaptureResult> => {
        const result = await ipcRenderer.invoke('capture-text');
        return result;
    },
    getSettings: async (): Promise<AppSettings> => {
        const settings = await ipcRenderer.invoke('get-settings');
        return settings;
    },
    getShortcut: async (): Promise<string | null> => {
        const shortcut = await ipcRenderer.invoke('get-shortcut');
        return shortcut;
    },
    setShortcut: async (shortcut: string): Promise<void> => {
        const result = await ipcRenderer.invoke('set-shortcut', shortcut);
        return result;
    },
    resetShortcut: async (): Promise<void> => {
        const result = await ipcRenderer.invoke('reset-shortcut');
        return result;
    },
    onCaptureResult: (listener: (result: CaptureResult) => void): void => {
        ipcRenderer.on('capture-result', (_event, result: CaptureResult) => {
            listener(result);
        });
    }
};

contextBridge.exposeInMainWorld('screenCopy', api);
