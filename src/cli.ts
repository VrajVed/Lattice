#!/usr/bin/env bun

import fs from "fs";
import path from "path";
import { createManifest } from "./manifest/create";
import { parseManifest } from "./manifest/parse";
import { startSeeder } from "./peer/seeder";
import { askYesNo } from "./security/yesNo";
import { downloadFromPeer } from "./peer/downloader";


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

else if (command === "validate") {
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

else if (command === "seed") {
    const filePath = args[1];
    const portArg = args[2];
    
    if (!filePath) {
        console.error("Usage: lattice seed <file> [port]");
        process.exit(1);
    }

    const port = portArg ? Number(portArg) : 9000;

    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        console.error("Error: Invalid port number");
        process.exit(1);
    }


    try {
        startSeeder(filePath, port ); 
        console.log("Press Ctrl + C to stop seeding.");
    } catch (error ) {
        console.error("Failed to start seeder:");
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    }

    process.stdin.resume();
    process.exitCode = 0;
}

else if (command === "download") {

    const latticePath = args[1];

    if (!latticePath) {
        console.error("Usage: lattice download <file>.lattice");
        process.exit(1);
    }

    try {
        const manifest = parseManifest(latticePath);
        const host = manifest.tracker.host;
        const port = manifest.tracker.port;

        const outputName = manifest.name;

        console.log("File: ", manifest.name);
        console.log("Size: ", manifest.size, "bytes");
        console.log("From: ", `${host}:${port}`);

        console.log("Warning: Downloading files from untrusted sources can be dangerous.");
        const consent = await askYesNo("Proceed with download? (y/n): ");

        if (!consent) {
            console.log("Aborted.");
            process.exit(0);
        }

        const outputPath = path.resolve(process.cwd(), `Lattice_${outputName}`);

        
        console.log(`Connecting to seeder at ${host}:${port}...`);
        console.log(`Downloading to ${outputPath}...`);

        await downloadFromPeer(host, port, outputPath);

        console.log("Download completed successfully.");
        console.log("Scan the file before opening !");
    } catch (error ) {
        console.error("Download failed:");
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    } 
}


else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}