import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

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
    const modelPath = path.join(process.cwd(), "dist/latex-ocr-helper/latex-ocr-helper");

    const { stdout } = await execFileAsync(modelPath, [filePath]);

    /* The issue is that a version diff warning messes up copy command */
    // if (stderr.trim()) {
    //     throw new Error(stderr.trim());
    // }

    return stdout.trim();
}
