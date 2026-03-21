import { Copy } from "lucide-react";

export function HistoryEntry(prop: { entry: string }) {
    const onCopy = async () => {
        await navigator.clipboard.writeText(prop.entry);
    }

    return (
        <div className="flex justify-between items-center rounded-[5px] bg-separator py-2 px-3 mb-3">
            <p className="text-black/70 text-nowrap truncate">
                {prop.entry}
            </p>

            <button
                className="flex items-center justify-center rounded-4xl h-9 w-9 shrink-0 hover:bg-black/5 cursor-pointer active:scale-90 transition-transform duration-100"
                onClick={onCopy}>
                <Copy size={20} />
            </button>
        </div>
    );
}
