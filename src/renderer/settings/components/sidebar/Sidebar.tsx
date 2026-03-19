import { useState } from "react";
import { SidebarItem } from "@renderer/settings/components/sidebar/SidebarItem";

export function Sidebar(props: { onTabChange: (tab: string) => void; }) {
    const [isActive, setActive] = useState<string>("general");

    const onTabClick = (newTab: string): void => {
        setActive(newTab);
        props.onTabChange(newTab);
    }
    return (
        <section className="border-r col-span-1 border-black/10 bg-separator px-4 py-5">
            <div className="text-[20px] font-semibold text-black select-none">
                ScreenCopy
            </div>

            <nav className="flex flex-col gap-1 justify-start space-y-0.5 pt-5">
                <SidebarItem label="General" id="general" active={isActive === "general"} onClick={onTabClick} />
                <SidebarItem label="History" id="history" active={isActive === "history"} onClick={onTabClick} />
            </nav>
        </section>
    );
}
