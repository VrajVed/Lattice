import type { LatticeManifest } from "./types";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import {renderProgress} from "../renderProgress.js";

// here we are defining the chunk size
const CHUNK_SIZE = 256 * 1024; // 256 KB 

// small helper function to compute sha256
function sha256(data: Buffer): string {
    return crypto.createHash("sha256").update(data).digest("hex");
}

// creates our manifest
export async function createManifest(
    filePath: string,
    trackerHost: string = "127.0.0.1",
    trackerPort: number = 9000
) : Promise<LatticeManifest> {
    
    const stat = fs.statSync(filePath); // get file stats

    if (!stat.isFile()) {
        throw new Error("Provided Path isn't a file.");
    }

    const chunks: string[] = []; // to hold chunk hashes
    const fileHasher = crypto.createHash("sha256");

    let buffer = Buffer.alloc(0);
    const stream = fs.createReadStream(filePath);

    // splitting file into equal chunks and hashing each


    await new Promise<void>((resolve, reject) => {
        stream.on("data", data  => {
            renderProgress(stream.bytesRead, stat.size);
            fileHasher.update(data);

            const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
            buffer = Buffer.concat([buffer, chunk]);


            while (buffer.length >= CHUNK_SIZE) {
                const chunk = buffer.subarray(0, CHUNK_SIZE);
                buffer = buffer.subarray(CHUNK_SIZE);

                chunks.push(`sha256:${sha256(chunk)}`);
            }
        });

        stream.on("end", () => {
            // remaining partial chunk
            if (buffer.length > 0) {
                chunks.push(`sha256:${sha256(buffer)}`);
            }
            resolve();
        });

        stream.on("error", err => {
            reject(err);
        });
    });

    // constructing the manifest object

    const manifest: LatticeManifest = {
        version: 1,
        name: path.basename(filePath),
        size: stat.size,
        chunkSize: CHUNK_SIZE,
        fileHash: `sha256:${fileHasher.digest("hex")}`,
        chunks,
        tracker: {
            host: trackerHost,
            port: trackerPort
        }
    };

    return manifest;

}