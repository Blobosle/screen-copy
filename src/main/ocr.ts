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
