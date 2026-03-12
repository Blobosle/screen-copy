# ScreenshotCopy for macOS

ScreenshotCopy is a minimal macOS desktop app that lets you draw a screenshot region, runs OCR on the captured image, deletes the image immediately, and copies only the recognized text to the clipboard.

## Stack

- Electron + TypeScript + React for the desktop app shell
- Native macOS `screencapture` for the interactive region selection
- A tiny Swift helper using Apple's Vision framework for OCR

## What it does

1. Opens an interactive screenshot selection on macOS.
2. Saves the capture to a temporary file.
3. Runs OCR with the built-in Vision framework.
4. Deletes the temporary image.
5. Copies the recognized text to the clipboard.

## Requirements

- macOS
- Xcode Command Line Tools installed
- Node.js and npm

Install Command Line Tools if needed:

```bash
xcode-select --install
```

For building the application for development:

```bash
npm install
npm run dev
```

## Screen Recording permission

The first time you use screen capture, macOS may ask for Screen Recording access. If access is denied, enable it in:

```text
System Settings → Privacy & Security → Screen & System Audio Recording
```

Then reopen the app.
