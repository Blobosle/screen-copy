export type CaptureResult =
    | {
        status: 'success';
        text: string;
    }
    | {
        status: 'cancelled';
    }
    | {
        status: 'error';
        message: string;
    };

export interface AppSettings {
screenshotShortcut: string;
}

export type ShortcutUpdateResult =
    | {
        status: 'success';
        shortcut: string;
    }
    | {
        status: 'error';
        shortcut: string;
        message: string;
    };
