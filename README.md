# SnapText

SnapText is a minimal macOS desktop app that lets you draw a screenshot region, runs OCR on the captured image, deletes the image immediately, and copies only the recognized text to the clipboard.

## Stack

- Electron + TypeScript for the desktop app shell
- Native macOS `screencapture` for the interactive region selection
- A tiny Swift helper using Apple's Vision framework for OCR

## What it does

1. Opens an interactive screenshot selection on macOS.
2. Saves the capture to a temporary file.
3. Runs OCR with the built-in Vision framework.
4. Deletes the temporary image.
5. Copies the recognized text to the clipboard.

## Project structure

```text
src/
  main/
    main.ts          Electron main process
    ocr.ts           Invokes the Swift OCR helper
    screenshot.ts    Invokes macOS screencapture
  renderer/
    index.html       Minimal UI
    renderer.ts      UI behavior
    styles.css       Minimal styling
  shared/
    types.ts         Shared IPC result types
native/
  ocr.swift          Vision-based OCR helper
scripts/
  build-swift-helper.mjs
  clean.mjs
  copy-static.mjs
```

## Requirements

- macOS
- Xcode Command Line Tools installed
- Node.js and npm

Install Command Line Tools if needed:

```bash
xcode-select --install
```

## Install

```bash
npm install
```

## Run in development

```bash
npm run dev
```

## Build the app

```bash
npm run dist
```

Artifacts are written to:

```text
release/
```

## Screen Recording permission

The first time you use screen capture, macOS may ask for Screen Recording access. If access is denied, enable it in:

```text
System Settings → Privacy & Security → Screen & System Audio Recording
```

Then reopen the app.

## Notes

- The screenshot is not kept as app output.
- A temporary PNG is created only long enough for OCR, then removed.
- The recognized text is written to the clipboard.
- The default global shortcut is `CommandOrControl+Shift+Y`.

## Packaging and signing

`electron-builder` is configured for a basic macOS ZIP and DMG build. For distribution outside your own machine, add your Apple Developer signing and notarization settings before shipping.
