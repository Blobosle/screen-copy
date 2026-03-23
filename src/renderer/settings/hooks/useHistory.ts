import { HistoryRecord } from "@shared/types";
import { useEffect, Dispatch, SetStateAction } from "react";

export function useHistory(
    setEntry: Dispatch<SetStateAction<HistoryRecord>>,
    setClear: Dispatch<SetStateAction<boolean>>,
    clear: boolean
): void {
    useEffect(() => {
        let cancelled = false;
        let unsubscribe: (() => void) | undefined;

        void (async () => {
            const ret = await window.screenCopy.getHistory();

            if (!cancelled) {
                setEntry(ret);
            }

            unsubscribe = window.screenCopy.onHistoryUpdated((history) => {
                setEntry(history);
            });
        })();

        return () => {
            cancelled = true;
            unsubscribe?.();
        }
    }, []);

    useEffect(() => {
        if (!clear) {
            return;
        }

        setClear(false);

        let cancelled = false;

        void (async () => {
            const ret = await window.screenCopy.clearHistory();

            if (!cancelled) {
                setEntry(ret);
            }
        })();

        return () => {
            cancelled = true;
        }
    }, [clear])
}

