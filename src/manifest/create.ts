import type { LatticeManifest } from "./types";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// here we are defining the chunk size
const CHUNK_SIZE = 256 * 1024; // 256 KB 

// small helper function to compute sha256
function sha256(data: Buffer): string {
    return crypto.createHash("sha256").update(data).digest("hex");
}

// creates our manifest
export function createManifest(
    filePath: string,
    trackerHost: string = "127.0.0.1",
    trackerPort: number = 9000
) : LatticeManifest {
    
    const stat = fs.statSync(filePath); // get file stats

    if (!stat.isFile()) {
        throw new Error("Provided Path isn't a file.");
    }

    const fileBuffer = fs.readFileSync(filePath); // read the entire file

    const chunks: string[] = []; // to hold chunk hashes

    // splitting file into equal chunks and hashing each

    for (let offset = 0; offset < fileBuffer.length; offset += CHUNK_SIZE) {
        
        const chunk = fileBuffer.subarray(offset, offset + CHUNK_SIZE);
        const chunkHash = sha256(chunk);
        chunks.push(`sha256:${chunkHash}`);
    }

    const fileHash = `sha256:${sha256(fileBuffer)}`; // hash of the entire file

    // constructing the manifest object

    const manifest: LatticeManifest = {
        version: 1,
        name: path.basename(filePath),
        size: fileBuffer.length,
        chunkSize: CHUNK_SIZE,
        fileHash,
        chunks,
        tracker: {
            host: trackerHost,
            port: trackerPort
        }
    };

    return manifest;

}