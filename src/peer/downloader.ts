import net from "net";
import fs from "fs";
import path from "path";

export function downloadFromPeer(
    host: string,
    port: number,
    outputPath: string
) {
    return new Promise<void>((resolve, reject) => {
        const socket = net.createConnection({host, port}, () => {
            socket.write("GET\n");
        });

        const fileStream = fs.createWriteStream(outputPath);

        socket.on("data", chunk => {
            fileStream.write(chunk);
        });

        socket.on("end", () => {
            fileStream.end();
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