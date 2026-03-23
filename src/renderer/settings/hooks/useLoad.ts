import { useEffect, Dispatch, SetStateAction } from "react";
import { StatusState } from "../../../shared/types";
import { formatAcceleratorForDisplay } from "../../lib/accelerators";

export function useLoad(
    setShortcut: Dispatch<SetStateAction<Record<string, string>>>,
    setStatus: Dispatch<SetStateAction<StatusState>>,
    setIsLoading: Dispatch<SetStateAction<boolean>>): void {

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            try {
                const settings = await window.screenCopy.getSettings();

                if (!cancelled) {
                    setShortcut({
                        screenshotShortcut: formatAcceleratorForDisplay(settings.screenshotShortcut),
                        latexShortcut: formatAcceleratorForDisplay(settings.latexShortcut)
                    });

                    setStatus({
                        kind: "idle",
                        message: "Click the shortcut field to change it."
                    });
                }
            } catch (error) {
                if (!cancelled) {
                    setStatus({
                        kind: "error",
                        message:
                            error instanceof Error
                                ? error.message
                                : "Could not load the current shortcut."
                    });
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);
}
