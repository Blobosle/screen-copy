export type CaptureResult =
    | { status: 'success'; text: string; }
    | { status: 'cancelled'; }
    | { status: 'error'; message: string; };

export interface AppSettings {
    screenshotShortcut: string;
    latexShortcut: string;
};

export type StatusState =
    | { kind: 'idle'; message: string }
    | { kind: 'success'; message: string }
    | { kind: 'error'; message: string };

export interface HistoryRecord {
    history: string[];
};
