import { useState, ReactNode } from "react";
import { formatAcceleratorForDisplay } from "@renderer/lib/accelerators";
import { StatusState } from "@shared/types"
import { useLoad } from "@renderer/settings/hooks/useLoad";
import { useListener } from "@renderer/settings/hooks/useListener";
import { Sidebar } from "@renderer/settings/components/sidebar/Sidebar";
import { General } from "@renderer/settings/components/general/General";
import { History } from "@renderer/settings/components/history/History";

type settingTab = "general" | "history";

export function Settings() {
    const [shortcut, setShortcut] = useState<string>("⌘⇧Y");
    const [isLoading, setIsLoading] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [isTab, setTab] = useState<settingTab>("general");
    const [status, setStatus] = useState<StatusState>({
        kind: "idle",
        message: "Click the shortcut field to change it."
    });

    useLoad(setShortcut, setStatus, setIsLoading);
    useListener(isListening, setIsListening, setStatus, setShortcut);

    const onStartListening = (): void => {
        setIsListening(true);
        setStatus({
            kind: "idle",
            message: "Press the new shortcut now. Press Escape to cancel."
        });
    };

    /*
     * TODO: Add scalability for more than the screenshot shortcut
     */
    const onReset = (): void => {
        setIsListening(false);

        void (async () => {
            try {
                const result = await window.screenCopy.resetShortcut();
                setShortcut(formatAcceleratorForDisplay(result.screenshotShortcut));
            } catch (error) {
                setStatus({
                    kind: "error",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Could not reset the shortcut."
                });
            }
        })();
    };

    const onTabChange = (newtab: string): void => {
        setTab(newtab as settingTab);
    }

    const onTabRender = (): ReactNode => {
        switch (isTab) {
            case "general":
                return <General
                    shortcut={shortcut}
                    isLoading={isLoading}
                    isListening={isListening}
                    status={status}
                    onStartListening={onStartListening}
                    onReset={onReset}
                />;
            case "history":
                return <History />
            default:
                console.log("LOG: [Settings.tsx:onTabChange] Default on tab switch reached");
                return <General
                    shortcut={shortcut}
                    isLoading={isLoading}
                    isListening={isListening}
                    status={status}
                    onStartListening={onStartListening}
                    onReset={onReset}
                />;
        }
    }

    return (
        <main className="grid h-screen grid-cols-4">
            <Sidebar onTabChange={onTabChange} />

            {onTabRender()}
        </main >
    );
}
