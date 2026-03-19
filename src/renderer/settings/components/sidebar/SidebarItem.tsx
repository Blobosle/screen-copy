export function SidebarItem(props: { label: string; active?: boolean }) {
    return (
        <div
            className={[
                'rounded-[3px] px-2.5 py-1.5 text-[14px] font-medium',
                props.active ? 'bg-black/[0.06] text-neutral-900' : 'text-neutral-500 hover:bg-black/[0.02]'
            ].join(' ')}
        >
            {props.label}
        </div>
    );
}
