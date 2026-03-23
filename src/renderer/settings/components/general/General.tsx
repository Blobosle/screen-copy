import { StatusState } from "@shared/types";

export function General({
    shortcut,
    isLoading,
    isListening,
    status,
    onStartListening,
    onReset,
    skey,
}: {
    shortcut: Record<string, string>;
    isLoading: boolean;
    isListening: boolean;
    status: StatusState;
    onStartListening: (arg: string) => void;
    onReset: () => void;
    skey: string,
}) {
    return (
        <section className="col-span-3 bg-white px-8 py-7">
            <header>
                <h1 className="text-[22px] font-semibold text-black">
                    Keyboard Shortcuts
                </h1>
                <p className="mt-1 text-[14px] leading-5 text-neutral-500">
                    Choose the global shortcut used to start any screenshotting feature
                </p>
            </header>

            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-black/10 py-4">
                <p className="pr-4 text-[14px] font-regular text-black">
                    Copy shortcut
                </p>

                <button
                    onClick={() => onStartListening("screenshotShortcut")}
                    className={
                        "rounded-[4px] border border-black/15 px-3 py-1.5 text-[12px] font-regular text-black hover:border-black"
                    }
                >
                    {isLoading ? "" : isListening && skey === "screenshotShortcut" ? "Type a shortcut" : shortcut.screenshotShortcut}
                </button>

                <button
                    onClick={onReset}
                    className={
                        "rounded-[4px] border border-black/15 px-3 py-1.5 text-[12px] font-regular text-black hover:border-black"
                    }
                >
                    Reset to Default
                </button>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-black/10 py-4">
                <p className="pr-4 text-[14px] font-regular text-black">
                    Latex shortcut
                </p>

                <button
                    onClick={() => onStartListening("latexShortcut")}
                    className={
                        "rounded-[4px] border border-black/15 px-3 py-1.5 text-[12px] font-regular text-black hover:border-black"
                    }
                >
                    {isLoading ? "" : isListening && skey === "latexShortcut" ? "Type a shortcut" : shortcut.latexShortcut}
                </button>

                <button
                    onClick={onReset}
                    className={
                        "rounded-[4px] border border-black/15 px-3 py-1.5 text-[12px] font-regular text-black hover:border-black"
                    }
                >
                    Reset to Default
                </button>
            </div>


            <p
                className={[
                    "mt-3 text-[12px]",
                    status.kind === "error"
                        ? "text-red-600"
                        : status.kind === "success"
                            ? "text-neutral-700"
                            : "text-neutral-500"
                ].join(" ")}
            >
                {status.message}
            </p>
        </section>
    );
}
