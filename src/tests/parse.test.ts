import { parseManifest } from "../manifest/parse";

try {
    const manifest = parseManifest("./test.txt.lattice");

    console.log("Manifest validated successfully");
    console.log("Name:", manifest.name);
    console.log("Size:", manifest.size);
    console.log("Chunks:", manifest.chunks.length);
    console.log("Tracker:", `${manifest.tracker.host}:${manifest.tracker.port}`);
} catch (err) {
    console.error("Validation failed:");
    console.error(err instanceof Error ? err.message : err);
}
