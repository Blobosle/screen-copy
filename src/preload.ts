import { contextBridge, ipcRenderer } from 'electron';
import type { CaptureResult } from './shared/types.js';
function debug(message: string, details?: unknown): void {
  if (details === undefined) {
    console.log(`[preload] ${message}`);
    return;
  }

  console.log(`[preload] ${message}`, details);
}

contextBridge.exposeInMainWorld('snapText', {
  captureText: async (): Promise<CaptureResult> => {
    debug('captureText called from renderer');
    const result = await ipcRenderer.invoke('capture-text');
    debug('captureText resolved', result);
    return result;
  },
  getShortcut: async (): Promise<string | null> => {
    debug('getShortcut called from renderer');
    const shortcut = await ipcRenderer.invoke('get-shortcut');
    debug('getShortcut resolved', { shortcut });
    return shortcut;
  },
  onCaptureResult: (listener: (result: CaptureResult) => void): void => {
    debug('onCaptureResult listener registered');
    ipcRenderer.on('capture-result', (_event, result: CaptureResult) => {
      debug('capture-result event received from main', result);
      listener(result);
    });
  }
});
