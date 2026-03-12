import React from 'react';

export function App(): React.JSX.Element {
    console.log('[renderer] App rendered');

    return (
        <main className="pt-10 p-6 text-black">
            Hello
        </main>
    );
}
