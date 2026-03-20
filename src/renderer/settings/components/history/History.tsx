import { HistoryEntry } from "@renderer/settings/components/history/HistoryEntry";
import { useHistory } from "@renderer/settings/hooks/useHistory";
import { useState } from "react";

export function History() {
    const [entry, setEntry] = useState<string[]>([]);

    useHistory(setEntry);

    return (
        <section className="col-span-3 bg-white px-8 py-7">
            <h1 className="font-semibold text-[22px] text-black">History</h1>

            <div className={entry.length === 0 ? "mt-1" : "mt-5"}>
                {entry.length === 0 ? (
                    <p className="text-[14px] text-black/50">History of your screenshot copies will be seen here.</p>
                ) : (
                    entry.map((entry) => (
                        <HistoryEntry entry={entry} />
                    ))
                )}
            </div>
        </section>
    );
}
