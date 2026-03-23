import { CaptureResult } from "@shared/types";
import {
    clipboard,
    systemPreferences,
    dialog,
} from "electron";
import { addHistoryEntry } from "./history";
import { recognizeLatexfromImage } from "./ocr";
import { captureInteractiveScreenshot, deleteIfExists, ScreenshotCancelledError } from "./screenshot.js";
import { mainWindow } from "./main";

let latexInFlight: Promise<CaptureResult> | null = null;

/*
 * Runs screenshot and OCR, returning either the text copied to clipboard or
 * error state
 */
export async function runLatexFlow(): Promise<CaptureResult> {
    if (latexInFlight) {
        return latexInFlight;
    }

    latexInFlight = (async (): Promise<CaptureResult> => {
        const accessStatus = systemPreferences.getMediaAccessStatus("screen");

        if (accessStatus === "denied" || accessStatus === "restricted") {
            return {
                status: "error",
                message:
                    "Screen Recording access is blocked for ScreenCopy. " +
                    "Open System Settings → Privacy & Security → Allow applications " +
                    "to record your screen, allow the app, then reopen it."
            };
        }

        let screenshotPath: string | null = null;

        try {
            if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
                mainWindow.hide();
            }

            /* Screenshot + OCR */
            screenshotPath = await captureInteractiveScreenshot();
            const text = await recognizeLatexfromImage(screenshotPath);

            if (!text) {
                return {
                    status: "error",
                    message: "No text or QR code was detected " +
                        "in the selected area."
                };
            }

            clipboard.writeText(text);
            await addHistoryEntry(text)

            return {
                status: "success",
                text
            };
        }
        catch (error) {
            if (error instanceof ScreenshotCancelledError) {
                return { status: "cancelled" } satisfies CaptureResult;
            }

            const message = error instanceof Error ? error.message :
                "Unexpected OCR error.";

            return {
                status: "error",
                message
            };
        }
        finally {
            if (screenshotPath) {
                await deleteIfExists(screenshotPath);
            }
        }
    })();

    const result = await latexInFlight;
    latexInFlight = null;
    return result;
}

/*
 * Callback to handle screenshot latex shortcut command
 */
export function handleLatexTriggered(): void {
    void runLatexFlow().then(async (result) => {
        if (result.status === "error" && (!mainWindow || !mainWindow.isFocused())) {
            console.log("ERROR: [main.ts:handleLatexTriggered] Result status returned an error", result.message);
        }
    });
}
