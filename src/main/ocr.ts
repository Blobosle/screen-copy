import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

let latexAbortController: AbortController | null = null;
export let isAborted: boolean = false;

/*
 * Finds the path to the ocr swift helper and it obtains the output
 */
export async function recognizeTextFromImage(filePath: string): Promise<string> {
    let helperPath = path.resolve(process.cwd(), "build/native/ocr-helper");

    if (!existsSync(helperPath)) {
        helperPath = path.join(process.resourcesPath, "ocr-helper");
    }

    const { stdout, stderr } = await execFileAsync(helperPath, [filePath]);

    if (stderr.trim()) {
        throw new Error(stderr.trim());
    }

    return stdout.trim();
}

/*
 * Finds the path to the model and gets the output
 */
export async function recognizeLatexfromImage(filePath: string): Promise<string> {
    let modelPath = path.resolve(process.cwd(), "dist/latex-ocr-helper/latex-ocr-helper");

    if (!existsSync(modelPath)) {
        modelPath = path.join(process.resourcesPath, "latex-ocr-helper", "latex-ocr-helper");
    }

    const controller = new AbortController();
    latexAbortController = controller;


    const { stdout } = await execFileAsync(modelPath, [filePath], { signal: controller.signal });

    if (latexAbortController === controller) {
        latexAbortController = null;
    }

    /* The issue is that a version diff warning messes up copy command */
    // if (stderr.trim()) {
    //     throw new Error(stderr.trim());
    // }

    return stdout.trim();
}

/*
 * Callback to abort the latex model processing
 */
export function abortRecognizeLatex(): void {
    latexAbortController?.abort();
    isAborted = true;
}

/*
 * Function to set the aborted flag externally
 */
export function setAbortFalse() {
    isAborted = false;
}
