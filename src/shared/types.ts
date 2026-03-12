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
