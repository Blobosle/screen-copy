const MODIFIER_KEYS = new Set(['Meta', 'Control', 'Alt', 'Shift']);

const SPECIAL_KEY_MAP: Record<string, string> = {
    ' ': 'Space',
    Spacebar: 'Space',
    Enter: 'Enter',
    Return: 'Enter',
    Tab: 'Tab',
    Escape: 'Esc',
    Esc: 'Esc',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Insert: 'Insert',
    Home: 'Home',
    End: 'End',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right'
};

const DISPLAY_MAP: Record<string, string> = {
    CommandOrControl: '⌘',
    Control: '⌃',
    Alt: '⌥',
    Shift: '⇧',
    Enter: '↩',
    Tab: '⇥',
    Esc: '⎋',
    Backspace: '⌫',
    Delete: '⌦',
    Up: '↑',
    Down: '↓',
    Left: '←',
    Right: '→',
    Space: 'Space'
};

function normalizeKey(key: string): string | null {
    if (MODIFIER_KEYS.has(key)) {
        return null;
    }

    if (SPECIAL_KEY_MAP[key]) {
        return SPECIAL_KEY_MAP[key];
    }

    if (/^F\d{1,2}$/i.test(key)) {
        return key.toUpperCase();
    }

    if (key.length === 1) {
        if (/^[a-z]$/i.test(key)) {
            return key.toUpperCase();
        }

        if (/^[0-9]$/.test(key)) {
            return key;
        }
    }

    return null;
}

export function keyboardEventToAccelerator(event: KeyboardEvent): string | null {
    const key = normalizeKey(event.key);

    if (!key) {
        return null;
    }

    const modifiers: string[] = [];

    if (event.metaKey) {
        modifiers.push('CommandOrControl');
    }

    if (event.ctrlKey) {
        modifiers.push('Control');
    }

    if (event.altKey) {
        modifiers.push('Alt');
    }

    if (event.shiftKey) {
        modifiers.push('Shift');
    }

    if (modifiers.length === 0) {
        return null;
    }

    return [...modifiers, key].join('+');
}

export function formatAcceleratorForDisplay(accelerator: string): string {
    return accelerator
        .split('+')
        .map((part) => DISPLAY_MAP[part] ?? part.toUpperCase())
        .join('');
}
