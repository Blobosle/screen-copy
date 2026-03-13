import type { AppSettings, CaptureResult, ShortcutUpdateResult } from '../shared/types';

declare global {
    interface Window {
        snapText: {
            captureText: () => Promise<CaptureResult>;
            getShortcut: () => Promise<string | null>;
            getSettings: () => Promise<AppSettings>;
            setShortcut: (shortcut: string) => Promise<ShortcutUpdateResult>;
            onCaptureResult: (listener: (result: CaptureResult) => void) => void;
        };
    }
}

export {};
