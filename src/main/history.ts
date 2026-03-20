import fs from "node:fs/promises";
import path from "node:path";
import { app } from "electron";
import { HistoryRecord } from "@shared/types";

const HISTORY_PATH = path.join(app.getPath("userData"), "history.json");

let appHistory: HistoryRecord = { history: [] };

/*
 * Loads history from history.json and returns it
 */
async function loadHistory(): Promise<HistoryRecord> {
    try {
        const raw = await fs.readFile(HISTORY_PATH, "utf8");
        const parsed = JSON.parse(raw) as Partial<HistoryRecord>;
        const history: HistoryRecord = { ...{ history: [] }, ...parsed };

        return history;
    }
    catch (error) {
        console.log("ERROR: [history.ts:loadHistory] History failed and catched", error);
    }

    return { history: [] };
}

/*
 * Writes to history.json the current contents of appHistory
 */
async function writeHistory(): Promise<void> {
    try {
        await fs.mkdir(path.dirname(HISTORY_PATH), { recursive: true });
        await fs.writeFile(HISTORY_PATH, JSON.stringify(appHistory, null, 4), "utf8");
    } catch (error) {
        console.log("ERROR: [history.ts:writeHistory] Writting catched", error);
    }
}

/*
 * Handler for adding a new entry into the history
 * Entries are capped at 10
 */
export async function addHistoryEntry(entry: string): Promise<void> {
    appHistory = await loadHistory();

    appHistory.history = [
        entry,
        ...appHistory.history.filter(item => item !== entry)
    ].slice(0, 10);

    await writeHistory();
}

/*
 * Interface for obtaining history
 */
export async function getHistory(): Promise<HistoryRecord> {
    appHistory = await loadHistory();
    return appHistory;
}

/*
 * Initialization function for history
 */
export async function initHistory(): Promise<void> {
    await fs.mkdir(path.dirname(HISTORY_PATH), { recursive: true });
}

/*
 * Function to clear the history
 */
export async function clearHistory(): Promise<void> {
    appHistory = { history: [] };
    await writeHistory();
}
