import { useEffect, Dispatch, SetStateAction } from "react";

export function useHistory(
    setEntry: Dispatch<SetStateAction<string[]>>,
    setClear: Dispatch<SetStateAction<boolean>>,
    clear: boolean
): void {
    useEffect(() => {
        let cancelled = false;

        void (async () => {
            const ret = await window.screenCopy.getHistory();

            if (!cancelled) {
                setEntry(ret.history);
            }
        })();

        return () => {
            cancelled = true;
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
                setEntry(ret.history);
            }
        })();

        return () => {
            cancelled = true;
        }
    }, [clear])
}

