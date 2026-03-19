import { useState } from "react";
import { SidebarItem } from "@renderer/settings/components/sidebar/SidebarItem";

export function Sidebar(props: { onTabChange: (tab: string) => void; }) {
    const [isActive, setActive] = useState<string>("general");

    const onTabClick = (newTab: string): void => {
        setActive(newTab);
        props.onTabChange(newTab);
    }
    return (
        <section className="border-r col-span-1 border-black/10 bg-separator py-5">
            <div className="px-4 text-[20px] font-semibold text-black select-none">
                ScreenCopy
            </div>

            <nav className="flex flex-col justify-start pt-5">
                <SidebarItem label="General" id="general" active={isActive === "general"} onClick={onTabClick} />
                <SidebarItem label="History" id="history" active={isActive === "history"} onClick={onTabClick} />
            </nav>
        </section>
    );
}
