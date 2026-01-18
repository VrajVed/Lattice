import fs from "fs";
import type { LatticeManifest } from "./types";

// helper to throw invalid errors
function invalid(reason: string): never {
    throw new Error(`Invalid .lattice file: ${reason}`);
}

// helper to validate sha256 format
function isValidSha256(hash: string): boolean {
    return /^sha256:[a-f0-9]{64}$/.test(hash);
}

/**
 * Validate the already-parsed JSON object and return a typed LatticeManifest.
 * Throws via invalid(...) on any problem.
 */


export function validateManifest(data: unknown): LatticeManifest {
    if (typeof data !== "object" || data === null) {
        invalid("root is not an object");
    }

    const m = data as Record<string, unknown>;

    if (m.version !== 1) {
        invalid("unsupported or missing version (expected 1)");
    }

    if (typeof m.name !== "string") {
        invalid("name must be a string");
    }

    if (typeof m.size !== "number" || m.size <= 0 || !Number.isSafeInteger(m.size)) {
        invalid("size must be a positive safe integer");
    }

    if (typeof m.chunkSize !== "number" || m.chunkSize <= 0 || !Number.isSafeInteger(m.chunkSize)) {
        invalid("chunkSize must be a positive safe integer");
    }

    if (typeof m.fileHash !== "string" || !isValidSha256(m.fileHash)) {
        invalid("fileHash must be a valid sha256 hash (format: sha256:<64 hex chars>)");
    }

    if (!Array.isArray(m.chunks) || m.chunks.length === 0) {
        invalid("chunks must be a non-empty array");
    }

    // Validate each chunk hash format
    for (const chunk of m.chunks) {
        if (typeof chunk !== "string" || !isValidSha256(chunk)) {
            invalid("each chunk must be a valid sha256 hash (format: sha256:<64 hex chars>)");
        }
    }

    if (typeof m.tracker !== "object" || m.tracker === null) {
        invalid("tracker must be an object");
    }

    const t = m.tracker as Record<string, unknown>;
    if (typeof t.host !== "string") {
        invalid("tracker.host must be a string");
    }
    if (typeof t.port !== "number" || !Number.isSafeInteger(t.port) || t.port <= 0 || t.port > 65535) {
        invalid("tracker.port must be a valid port number");
    }

    // Semantic consistency: chunk count must equal ceil(size / chunkSize)
    const size = m.size as number;
    const chunkSize = m.chunkSize as number;
    const expectedChunks = Math.ceil(size / chunkSize);

    if (m.chunks.length !== expectedChunks) {
        invalid(`chunk count (${m.chunks.length}) does not match expected count (${expectedChunks}) for size ${size} and chunkSize ${chunkSize}`);
    }

    // All checks passed — assert the type for callers
    return m as unknown as LatticeManifest;
}

/**
 * Read a .lattice file from disk, parse JSON, and validate it.
 * Returns a guaranteed-correct LatticeManifest or throws.
 */
export function parseManifest(filePath: string): LatticeManifest {
    let raw: string;
    try {
        raw = fs.readFileSync(filePath, "utf-8");
    } catch {
        invalid("cannot read file");
    }

    let data: unknown;
    try {
        data = JSON.parse(raw);
    } catch {
        invalid("file is not valid JSON");
    }

    // Delegate to validator which will throw on issues
    return validateManifest(data);
}