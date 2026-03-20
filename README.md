<div align = center>
<img width="200" height="200" alt="mac1024" src="https://github.com/user-attachments/assets/98bcb9b7-3643-45a8-85eb-a47876120ec3" />
</div>

  <div align = center>

<a href="https://github.com/Blobosle/screen-copy/releases/latest">
<img src="https://img.shields.io/badge/download-latest-brightgreen.svg" alt="download">
</a>
<a href="https://www.gnu.org/licenses/gpl-3.0">
    <img src="https://img.shields.io/badge/license-GPL%20v3-blue.svg" alt="license: GPL v3">
</a>
<a href="https://img.shields.io/badge/platform-macOS-ff1493.svg">
    <img src="https://img.shields.io/badge/platform-macOS-ff1493.svg" alt="platform">
</a>

# ScreenCopy

ScreenCopy allows you to copy text and QR codes through taking screenshots on macOS. The application will run OCR on the captured images, delete them, and copy the recognized text/QR code to the clipboard.

</div>

## Requirement for Installation

Given the application is not signed on macOS, when attempting to open the app for the first time you may be unable to do so.

If you encounter this, run the following command after dragging the application into the `/Applications` directory:

```bash
xattr -d com.apple.quarantine /Applications/ScreenCopy.app
```

## Screen Recording Permissions

The first time you use screen capture, macOS may ask for Screen Recording access. If access is denied, enable it in:

```text
System Settings → Privacy & Security → Screen & System Audio Recording
```

Then reopen the app.

## Stack

- Electron + TypeScript + React for the desktop app shell
- Native macOS `screencapture` for the interactive region selection
- A Swift helper using Apple's Vision framework for OCR

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
