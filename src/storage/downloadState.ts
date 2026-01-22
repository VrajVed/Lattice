import fs from "fs";
import type { DownloadState } from "../manifest/types";

export function loadState(
    statePath: string,
    expected: Omit<DownloadState, "completed">
) : DownloadState {
    if (!fs.existsSync(statePath)) {
        return {
            ...expected,
            completed: []
        };
    }

    const raw = fs.readFileSync(statePath, "utf8");
    const parsed = JSON.parse(raw) as DownloadState;

    // Validation

    if (
        parsed.fileHash !== expected.fileHash ||
        parsed.totalChunks !== expected.totalChunks ||
        parsed.chunkSize !== expected.chunkSize
    ) {
        throw new Error("State file does not match the manifest"); 
    }

    return parsed;
}

export function saveState(statePath: string, s: DownloadState) {
    fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}