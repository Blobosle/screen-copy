import type { CaptureResult } from '../shared/types';

declare global {
  interface Window {
    snapText: {
      captureText: () => Promise<CaptureResult>;
      getShortcut: () => Promise<string | null>;
      onCaptureResult: (listener: (result: CaptureResult) => void) => void;
    };
  }
}

export {};
