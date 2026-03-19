import { SidebarItem } from "@renderer/settings/components/sidebar/SidebarItem";

export function Sidebar() {
    return (
        <section className="border-r col-span-1 border-black/10 bg-separator px-4 py-5">
            <div className="text-[20px] font-semibold text-black select-none">
                ScreenCopy
            </div>

            <nav className="space-y-0.5 pt-5">
                <SidebarItem label="General" active />
                <SidebarItem label="History" />
            </nav>
        </section>
    );
}
