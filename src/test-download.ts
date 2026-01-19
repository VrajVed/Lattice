import { downloadFromPeer } from "./peer/downloader";

await downloadFromPeer("127.0.0.1", 9000 , "./downloaded_test.txt");
console.log("Download finished");
