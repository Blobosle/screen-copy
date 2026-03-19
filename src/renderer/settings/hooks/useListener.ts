import { useEffect, Dispatch, SetStateAction } from 'react';
import { StatusState } from '../../../shared/types';
import { formatAcceleratorForDisplay, keyboardEventToAccelerator } from '../../lib/accelerators';

export function useListener(
    isListening: boolean,
    setIsListening: Dispatch<SetStateAction<boolean>>,
    setStatus: Dispatch<SetStateAction<StatusState>>,
    setShortcut: Dispatch<SetStateAction<string>>
): void {
    useEffect(() => {
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
}

