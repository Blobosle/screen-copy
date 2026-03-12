type CaptureResult =
  | {
      status: 'success';
      text: string;
    }
  | {
      status: 'cancelled';
    }
  | {
      status: 'error';
      message: string;
    };

const captureButton = document.getElementById('capture-button') as HTMLButtonElement;
const shortcutHint = document.getElementById('shortcut-hint') as HTMLParagraphElement;
const statusNode = document.getElementById('status') as HTMLDivElement;
const previewNode = document.getElementById('preview') as HTMLTextAreaElement;

function debug(message: string, details?: unknown): void {
  if (details === undefined) {
    console.log(`[renderer] ${message}`);
    return;
  }

  console.log(`[renderer] ${message}`, details);
}

function setStatus(kind: 'idle' | 'working' | 'success' | 'error', message: string): void {
  debug('setStatus', { kind, message });
  statusNode.className = `status status-${kind}`;
  statusNode.textContent = message;
}

function applyResult(result: CaptureResult): void {
  debug('applyResult', result);

  if (result.status === 'success') {
    previewNode.value = result.text;
    setStatus('success', 'Text copied to the clipboard.');
    return;
  }

  if (result.status === 'cancelled') {
    setStatus('idle', 'Capture cancelled.');
    return;
  }

  setStatus('error', result.message);
}

async function startCapture(): Promise<void> {
  debug('startCapture called');
  captureButton.disabled = true;
  setStatus('working', 'Waiting for your screenshot selection...');

  try {
    const result = await window.snapText.captureText();
    debug('captureText promise resolved', result);
    applyResult(result);
  } catch (error) {
    debug('captureText promise rejected', error);
    const message = error instanceof Error ? error.message : 'Unexpected capture error.';
    setStatus('error', message);
  } finally {
    captureButton.disabled = false;
    debug('startCapture finished');
  }
}

captureButton.addEventListener('click', () => {
  debug('capture button clicked');
  void startCapture();
});

window.addEventListener('DOMContentLoaded', () => {
  debug('DOMContentLoaded fired');
});

window.snapText.getShortcut().then((shortcut) => {
  debug('getShortcut completed', { shortcut });
  shortcutHint.textContent = shortcut
    ? `Global shortcut: ${shortcut}`
    : 'Global shortcut could not be registered, but the button still works.';
});

window.snapText.onCaptureResult((result) => {
  debug('capture-result event handler fired', result);
  applyResult(result);
  captureButton.disabled = false;
});
