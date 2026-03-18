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
    imageShortcut: string;
}
