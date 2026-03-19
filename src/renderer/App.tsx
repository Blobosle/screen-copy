import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Settings } from './settings/Settings';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Missing #root element');
}

createRoot(rootElement).render(
    <StrictMode>
        <Settings />
    </StrictMode>
);
