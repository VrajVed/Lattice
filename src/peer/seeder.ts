import net from "net";
import fs from "fs";
import path from "path";

const CHUNK_SIZE = 256 * 1024; // 256 KB    

export function startSeeder(
    filePath: string,
    port: number = 9000
) {

    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const fd = fs.openSync(filePath, "r");

    const server = net.createServer(socket => {
        let buffer = Buffer.alloc(0);

        socket.on("data", data => {
            // Accumulate incoming data as Buffer
            buffer = Buffer.concat([buffer, Buffer.from(data)]);

            let newlineIndex: number;

            // Process complete lines from buffer
            while ((newlineIndex = buffer.indexOf(0x0a)) !== -1) {
                const line = buffer.subarray(0, newlineIndex).toString("utf8").trim();
                buffer = buffer.subarray(newlineIndex + 1);

                if (line === "HELLO") {
                    socket.write("OK\n");
                    continue;
                }

                // chunk request handling 
                if (line.startsWith("{")) {
                    
                    let message: any;
                    try {
                        message = JSON.parse(line);
                    } catch {
                        socket.destroy();
                        return;
                    }

                    if (message.type !== "request" || typeof message.chunk !== "number") {
                        socket.destroy();
                        return;
                    }

                    const chunkIndex = message.chunk;
                    const offset = chunkIndex * CHUNK_SIZE;

                    const chunkBuffer = Buffer.alloc(CHUNK_SIZE);
                    const bytesRead = fs.readSync (
                        fd,
                        chunkBuffer,
                        0,
                        CHUNK_SIZE,
                        offset
                    );

                    if (bytesRead <= 0) {
                        socket.destroy();
                        return;
                    }

                    //sending the header 

                    socket.write(
                        JSON.stringify({
                            type: "data",
                            chunk: chunkIndex,
                            size: bytesRead
                        }) + "\n"
                    );

                    // send the raw bytes
                    socket.write(chunkBuffer.subarray(0, bytesRead));

                    continue;
                }


                else {
                    socket.destroy();
                    return;
                }
            }
        });

        socket.on("error", () => {
            socket.destroy();
        });
    });

    server.listen(port, () => {
        console.log(`Seeder listening on port ${port} serving file ${path.basename(filePath)}`);
    });

    return server;
}