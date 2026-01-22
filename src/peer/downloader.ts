import net from "net";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { renderProgress } from "../renderProgress";
import { loadState, saveState } from "../storage/downloadState";
import type { DownloadState } from "../manifest/types";
import { request } from "http";

const CHUNK_SIZE = 256 * 1024; // 256 KB

export function downloadFromPeer(
    host: string,
    port: number,
    outputPath: string,
    manifest: {
        fileHash: string,
        chunks: string[],
        size: number
    }
) {
    return new Promise<void>((resolve, reject) => {

        const totalChunks = Math.ceil( manifest.size / CHUNK_SIZE );
        const statePath = `${outputPath}.lattice.state.json`;

        const downloadState : DownloadState = loadState(statePath, {
            fileHash: manifest.fileHash,
            chunkSize: CHUNK_SIZE,
            totalChunks
        });


        const fd = fs.openSync(outputPath, "a+");
        const socket = net.createConnection({host, port});

        let buffer = Buffer.alloc(0);
        let awaitingChunkHeader = true;
        let currentChunkIndex = 0;
        let expectedBytes = 0;

        socket.on("connect", () => {
            socket.write("HELLO\n");
        });  


        socket.on("data", data => {

            data = Buffer.from(data);
            buffer = Buffer.concat([buffer, data]); 

            while (true) {
                if (awaitingChunkHeader) {
                    const newline = buffer.indexOf(0x0a);

                    if(newline === -1 ) {
                        return;
                    }

                    const line = buffer.subarray(0, newline).toString("utf8").trim();
                    buffer = buffer.subarray(newline + 1);

                    if (line === "OK") {
                        requestNextChunk();
                        continue;
                    }


                    const header = JSON.parse(line);
                    if (header.type !== "data") {
                        reject(new Error("Invalid Response"));
                        socket.destroy();
                        return;
                    }

                    currentChunkIndex = header.chunk;
                    expectedBytes = header.size;
                    awaitingChunkHeader = false;
                }

                if (buffer.length < expectedBytes) {
                    return;
                }

                const chunkData = buffer.subarray(0, expectedBytes);
                buffer = buffer.subarray(expectedBytes);

                handleChunk(currentChunkIndex, chunkData);

                awaitingChunkHeader = true;
                expectedBytes = 0;
            }

            function requestNextChunk() {
                
                const next = findNextMissingChunk();
                if (next === null) {
                    fs.closeSync(fd);
                    socket.end();
                    fs.unlinkSync(statePath);
                    resolve();
                    return;
                }

                socket.write(JSON.stringify({
                    type: "request",
                    chunk: next
                }) + "\n");
            }

            function handleChunk(index: number, data:Buffer) {
                
                const expectedHash = manifest.chunks[index]?.replace("sha256:", "");
                const actualHash = crypto.createHash("sha256").update(data).digest("hex");

                if (actualHash !== expectedHash) {
                    reject(new Error(`Hash mismatch on chunk ${index}`));
                    socket.destroy();
                    return;
                }

                const offset = index * CHUNK_SIZE;
                fs.writeSync(fd, data, 0, data.length, offset);

                downloadState.completed.push(index);
                saveState(statePath, downloadState);

                renderProgress(
                    downloadState.completed.length,
                    totalChunks
                );


                requestNextChunk();
            }

            function findNextMissingChunk(): number | null {
                for(let i = 0 ; i < totalChunks; i++) {
                    if (!downloadState.completed.includes(i)) {
                        return i;
                    }
                }

                return null;
            }

        });

        

        socket.on("error", err => {
            reject(err);
        });

    });
}