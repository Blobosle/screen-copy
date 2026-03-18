import React from 'react';
import { formatAcceleratorForDisplay, keyboardEventToAccelerator } from '../lib/accelerators';

type StatusState =
    | { kind: 'idle'; message: string }
    | { kind: 'success'; message: string }
    | { kind: 'error'; message: string };

function SidebarItem(props: { label: string; active?: boolean }): React.JSX.Element {
    return (
        <div
            className={[
                'rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium',
                props.active ? 'bg-black/[0.06] text-neutral-900' : 'text-neutral-500'
            ].join(' ')}
        >
            {props.label}
        </div>
    );
}

export function SettingsWindow(): React.JSX.Element {
    const [shortcut, setShortcut] = React.useState<string>('⌘⇧Y');
    const [isLoading, setIsLoading] = React.useState(true);
    const [isListening, setIsListening] = React.useState(false);
    const [status, setStatus] = React.useState<StatusState>({
        kind: 'idle',
        message: 'Click the shortcut field to change it.'
    });

    React.useEffect(() => {
        let cancelled = false;

        void (async () => {
            try {
                const settings = await window.screenCopy.getSettings();

                if (!cancelled) {
                    setShortcut(formatAcceleratorForDisplay(settings.screenshotShortcut));
                    setStatus({
                        kind: 'idle',
                        message: 'Click the shortcut field to change it.'
                    });
                }
            } catch (error) {
                if (!cancelled) {
                    setStatus({
                        kind: 'error',
                        message:
                            error instanceof Error
                                ? error.message
                                : 'Could not load the current shortcut.'
                    });
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    React.useEffect(() => {
        if (!isListening) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent): void => {
            event.preventDefault();
            event.stopPropagation();

            if (event.key === 'Escape') {
                setIsListening(false);
                setStatus({
                    kind: 'idle',
                    message: 'Shortcut change cancelled.'
                });
                return;
            }

            const accelerator = keyboardEventToAccelerator(event);

            if (!accelerator) {
                setStatus({
                    kind: 'error',
                    message: 'Use a letter, number, function key, or arrow key with at least one modifier.'
                });
                return;
            }

            setIsListening(false);

            void (async () => {
                try {
                    const result = await window.screenCopy.setShortcut(accelerator);

                    setShortcut(formatAcceleratorForDisplay(accelerator.trim()));

                    if (result === true) {
                        setStatus({
                            kind: 'success',
                            message: 'Shortcut updated.'
                        });
                        return;
                    }

                    setStatus({
                        kind: 'error',
                        message: 'Error in updating the shortcut'
                    });
                } catch (error) {
                    setStatus({
                        kind: 'error',
                        message:
                            error instanceof Error
                                ? error.message
                                : 'Could not update the shortcut.'
                    });
                }
            })();
        };

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [isListening]);

    const onStartListening = (): void => {
        setIsListening(true);
        setStatus({
            kind: 'idle',
            message: 'Press the new shortcut now. Press Escape to cancel.'
        });
    };

    const onReset = (): void => {
        setIsListening(false);

        void (async () => {
            try {
                const result = await window.screenCopy.resetShortcut();
                setShortcut(formatAcceleratorForDisplay(result.screenshotShortcut));
            } catch (error) {
                setStatus({
                    kind: 'error',
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Could not reset the shortcut.'
                });
            }
        })();
    };

    return (
        <main className="h-screen bg-[#ececec] text-neutral-900">
            <div className="grid h-full grid-cols-[176px_minmax(0,1fr)]">
                <aside className="border-r border-black/10 bg-[#f5f5f5] px-4 py-5">
                    <div className="mb-5">
                        <div className="text-[12px] font-semibold tracking-[0.01em] text-neutral-900">
                            ScreenCopy
                        </div>
                        <div className="mt-0.5 text-[11px] text-neutral-500">Preferences</div>
                    </div>

                    <nav className="space-y-1">
                        <SidebarItem label="General" active />
                    </nav>
                </aside>

                <section className="bg-white px-8 py-7">
                    <div className="max-w-[680px]">
                        <header>
                            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-neutral-900">
                                Keyboard Shortcut
                            </h1>
                            <p className="mt-1 text-[13px] leading-5 text-neutral-500">
                                Choose the global shortcut used to start a screenshot and copy detected
                                text to the clipboard.
                            </p>
                        </header>

                        <div className="mt-8 border-t border-black/10">
                            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-black/10 py-4">
                                <div className="pr-4">
                                    <div className="text-[13px] font-medium text-neutral-900">
                                        Screenshot shortcut
                                    </div>
                                    <div className="mt-1 text-[12px] leading-5 text-neutral-500">
                                        Click the shortcut value to rebind it.
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={onStartListening}
                                    className={[
                                        'min-w-[132px] rounded-[6px] border px-3 py-1.5 text-[12px] font-medium',
                                        'border-black/15 bg-[#f7f7f7] text-neutral-900',
                                        'hover:bg-[#f1f1f1] active:bg-[#ebebeb]'
                                    ].join(' ')}
                                >
                                    {isLoading ? 'Loading…' : isListening ? 'Type shortcut…' : shortcut}
                                </button>

                                <button
                                    type="button"
                                    onClick={onReset}
                                    className="rounded-[6px] border border-black/15 bg-[#f7f7f7] px-3 py-1.5 text-[12px] font-medium text-neutral-800 hover:bg-[#f1f1f1] active:bg-[#ebebeb]"
                                >
                                    Reset to Default
                                </button>
                            </div>
                        </div>

                        <p
                            className={[
                                'mt-3 text-[12px]',
                                status.kind === 'error'
                                    ? 'text-red-600'
                                    : status.kind === 'success'
                                        ? 'text-neutral-700'
                                        : 'text-neutral-500'
                            ].join(' ')}
                        >
                            {status.message}
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
