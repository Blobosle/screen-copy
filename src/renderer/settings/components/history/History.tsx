import { HistoryEntry } from "@renderer/settings/components/history/HistoryEntry";

export function History() {
    return (
        <section className="col-span-3 bg-white px-8 py-7">
            <h1 className="font-semibold text-[22px] text-black">History</h1>

            <div className="mt-5">
                <HistoryEntry entry="Halo" />
            </div>
        </section>
    );
}
