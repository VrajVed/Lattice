import fs from "fs";
import path from "path";
import { startSeeder } from "../peer/seeder";
import { downloadFromPeer } from "../peer/downloader";


const SOURCE = "./test.txt";
const PORT = 9100;

const DOWNLOAD_DIR = "./downloads";
const OUTPUT = path.join(DOWNLOAD_DIR, "test.txt");

fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

// start seeder
startSeeder(SOURCE, PORT);

// give seeder time to start
setTimeout(async () => {
    try {
        await downloadFromPeer("127.0.0.1", PORT, OUTPUT);

        const original = fs.readFileSync(SOURCE, "utf8");
        const downloaded = fs.readFileSync(OUTPUT, "utf8");

        if (original !== downloaded) {
            throw new Error("Downloaded file does not match source");
        }

        console.log("✅ Seeder + Downloader sanity check passed");
        process.exit(0);
    } catch (err) {
        console.error("❌ Sanity check failed");
        console.error(err);
        process.exit(1);
    }
}, 300);
