import type { AppSettings, CaptureResult } from '../shared/types';

declare global {
    interface Window {
        screenCopy: {
            captureText: () => Promise<CaptureResult>;
            getShortcut: () => Promise<string | null>;
            getSettings: () => Promise<AppSettings>;
            setShortcut: (shortcut: string) => Promise<boolean>;
            onCaptureResult: (listener: (result: CaptureResult) => void) => void;
        };
    }
}

export { };
