import { createManifest } from "./manifest/create";

const manifest = createManifest("./test.txt");

console.log(JSON.stringify(manifest, null, 2));
