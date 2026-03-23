import type { AppSettings, CaptureResult, HistoryRecord } from '@shared/types';

declare global {
    interface Window {
        screenCopy: {
            captureText: () => Promise<CaptureResult>;
            getShortcut: () => Promise<string | null>;
            getSettings: () => Promise<AppSettings>;
            getHistory: () => Promise<HistoryRecord>;
            setShortcut: (shortcutType: string, shortcut: string) => Promise<boolean>;
            resetShortcut: () => Promise<AppSettings>;
            clearHistory: () => Promise<HistoryRecord>;
            onCaptureResult: (listener: (result: CaptureResult) => void) => void;
        };
    }
}

export { };
