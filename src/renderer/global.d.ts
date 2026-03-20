import type { AppSettings, CaptureResult, HistoryRecord } from '@shared/types';

declare global {
    interface Window {
        screenCopy: {
            captureText: () => Promise<CaptureResult>;
            getShortcut: () => Promise<string | null>;
            getSettings: () => Promise<AppSettings>;
            getHistory: () => Promise<HistoryRecord>;
            setShortcut: (shortcut: string) => Promise<boolean>;
            resetShortcut: () => Promise<AppSettings>;
            onCaptureResult: (listener: (result: CaptureResult) => void) => void;
        };
    }
}

export { };
