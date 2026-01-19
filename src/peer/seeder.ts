import net from "net";
import fs from "fs";
import path from "path";

export function startSeeder(
    filePath: string,
    port: number = 9000
) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const server = net.createServer(socket => {
        let buffer = "";
        let streaming = false;


        socket.on("data", data => {

            if (streaming) {
                return;
            }

            buffer += data.toString("utf8");

            let newlineIndex;
            while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
                const line = buffer.slice(0, newlineIndex).trim();
                buffer = buffer.slice(newlineIndex + 1);

                if (line === "HELLO") {
                    socket.write("OK\n");
                }

                else if (line === "GET") {
                    streaming = true;

                    const stream = fs.createReadStream(filePath)
                    stream.pipe(socket);

                    stream.on("end", () => {
                        socket.end();
                    });

                    stream.on("error", () => {
                        socket.destroy();
                    });
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