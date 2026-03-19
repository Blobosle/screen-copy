export function SidebarItem(props: {
    label: string,
    active?: boolean,
    id: string,
    onClick: (newTab: string) => void,
}) {
    return (
        <button
            className={`rounded-[3px] px-2.5 py-2 text-[14px] font-medium ${props.active ? "bg-black/[0.06] text-black" : "text-neutral-500 hover:bg-black/[0.02]"}`}
            onClick={() => props.onClick(props.id)}
        >
            {props.label}
        </button >
    );
}
