#!/usr/bin/env bun

import fs from "fs";
import path from "path";
import { createManifest } from "./manifest/create";
import { parseManifest } from "./manifest/parse";
import { startSeeder } from "./peer/seeder";


// get arguments from command line
const args = process.argv.slice(2);

// simple help message
if (args.length === 0 ) {
    console.log("Usage:");
    console.log("lattice create <file>");
    process.exit(0);
}

const command = args[0];

// handle 'create' command

if (command === "create") {

    // check for file path argument
    const filePath = args[1];

    if (!filePath) {
        console.error("Error: Missing File Path");
        console.error("Usage: lattice create <file>");
        process.exit(1);
    }

    // attempt to create manifest
    try {
        const manifest = createManifest(filePath);
        const outputPath = filePath + ".lattice";

        fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

        console.log(`Created ${path.basename(outputPath)}`);
    } catch (error) {
        console.error("Failed to create manifest.");
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    }

    process.exit(0);
}

/// this is the validation comomand

if (command === "validate") {
    const filePath = args[1];


    if (!filePath) {
        console.error("Error: Mising File Path");
        console.error("Usage: lattice validate <file>.lattice");
        process.exit(1);
    }

    try {
        const manifest = parseManifest(filePath);

        console.log("Manifest is valid:");
        console.log(`Name: ${manifest.name}`);
        console.log(`Size: ${manifest.size} bytes`);
        console.log(`Chunks: ${manifest.chunks.length}`);
        console.log(`Tracker: ${manifest.tracker.host}:${manifest.tracker.port}`);


        process.exit(0);
    
    } catch (error ) {
        console.error("Invalid manifest:");
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    }

}





console.error(`Unknown command: ${command}`);
process.exit(1);