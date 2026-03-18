import type { AppSettings, CaptureResult } from '../shared/types';

declare global {
    interface Window {
        snapText: {
            captureText: () => Promise<CaptureResult>;
            getShortcut: () => Promise<string | null>;
            getSettings: () => Promise<AppSettings>;
            setShortcut: (shortcut: string) => Promise<void>;
            onCaptureResult: (listener: (result: CaptureResult) => void) => void;
        };
    }
}

export { };
