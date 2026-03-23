import { MathJax } from "better-react-mathjax";
import { Copy } from "lucide-react";

function toMathJaxString(latex: string, displayMode = true): string {
    return displayMode ? `\\[${latex}\\]` : `\\(${latex}\\)`;
}

export function HistoryEntry(prop: { entry: string, latex: boolean }) {
    const onCopy = async () => {
        await navigator.clipboard.writeText(prop.entry);
    }

    return (
        <div className="py-2 px-3 mb-3 bg-separator">
            <div className="flex justify-between items-center rounded-[5px]">
                <p className="text-black/70 text-nowrap truncate">
                    {prop.entry}
                </p>

                <button
                    className="flex items-center justify-center rounded-4xl h-9 w-9 shrink-0 hover:bg-black/5 cursor-pointer active:scale-90 transition-transform duration-100"
                    onClick={onCopy}>
                    <Copy size={20} />
                </button>

            </div>

            {prop.latex ? (
                <div className="pointer-events-none">
                    <MathJax>{toMathJaxString(prop.entry)}</MathJax>
                </div>
            ) : null}
        </div>
    );
}
