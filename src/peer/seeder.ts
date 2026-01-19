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

        socket.on("data", data => {
            buffer += data.toString("utf8");

            if (buffer.trim() === "GET") {
                const stream = fs.createReadStream(filePath)
                stream.pipe(socket);

                stream.on("end", () => {
                    socket.end();
                });

                stream.on("error", () => {
                    socket.destroy();
                });
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