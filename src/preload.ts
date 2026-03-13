import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings, CaptureResult, ShortcutUpdateResult } from './shared/types.js';

function debug(_message: string, _details?: unknown): void {}

const api = {
    captureText: async (): Promise<CaptureResult> => {
        debug('captureText called from renderer');
        const result = await ipcRenderer.invoke('capture-text');
        debug('captureText resolved', result);
        return result;
    },
    getSettings: async (): Promise<AppSettings> => {
        debug('getSettings called from renderer');
        const settings = await ipcRenderer.invoke('get-settings');
        debug('getSettings resolved', settings);
        return settings;
    },
    getShortcut: async (): Promise<string | null> => {
        debug('getShortcut called from renderer');
        const shortcut = await ipcRenderer.invoke('get-shortcut');
        debug('getShortcut resolved', { shortcut });
        return shortcut;
    },
    setShortcut: async (shortcut: string): Promise<ShortcutUpdateResult> => {
        debug('setShortcut called from renderer', { shortcut });
        const result = await ipcRenderer.invoke('set-shortcut', shortcut);
        debug('setShortcut resolved', result);
        return result;
    },
    resetShortcut: async (): Promise<ShortcutUpdateResult> => {
        debug('resetShortcut called from renderer');
        const result = await ipcRenderer.invoke('reset-shortcut');
        debug('resetShortcut resolved', result);
        return result;
    },
    onCaptureResult: (listener: (result: CaptureResult) => void): void => {
        debug('onCaptureResult listener registered');
        ipcRenderer.on('capture-result', (_event, result: CaptureResult) => {
            debug('capture-result event received from main', result);
            listener(result);
        });
    }
};

contextBridge.exposeInMainWorld('screenCopy', api);
