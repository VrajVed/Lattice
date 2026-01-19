import net from "net";
import fs from "fs";
import path from "path";
import { renderProgress } from "./renderProgress";

export function downloadFromPeer(
    host: string,
    port: number,
    outputPath: string,
    expectedSize?: number
) {
    return new Promise<void>((resolve, reject) => {


        const socket = net.createConnection({host, port});

        const fileStream = fs.createWriteStream(outputPath);

        let recieved = 0;
        let buffer = "";
        let streaming = false;

        socket.on("connect", () => {
            socket.write("HELLO\n");
        });
        socket.on("data", data => {
            if (!streaming) {
                buffer += data.toString("utf8");

                const newlineIndex = buffer.indexOf("\n");

                if (newlineIndex === -1) {
                    return;
                }

                const line = buffer.slice(0, newlineIndex).trim();
                buffer = buffer.slice(newlineIndex + 1);

                if (line !== "OK") {
                    socket.destroy();
                    fileStream.destroy();
                    reject(new Error("Handshake failed"));
                    return;
                }
                

                // Handshake successful, request file

                streaming = true;
                socket.write("GET\n");

                // If extra bytes are arrived after OK\n, then treat them as file data

                if (buffer.length > 0) {
                    fileStream.write(Buffer.from(buffer, "utf8"));
                    buffer = "";
                }

                return;
            }

            recieved += data.length;
            fileStream.write(data);

            if (expectedSize) {
                renderProgress(recieved, expectedSize);
            }

        });

        socket.on("end", () => {
            fileStream.end();
            if (expectedSize) {
                process.stdout.write("\n");
            }
            resolve();
        });

        socket.on("error", err => {
            fileStream.destroy();
            reject(err);
        });

        fileStream.on("error", err => {
            socket.destroy();
            reject(err);
        });
    });
}