# Lattice

Lattice is a secure CLI-based file sharing system inspired by BitTorrent.

It converts large files into compact metadata files (`.lattice`) that can be shared privately,
allowing files to be streamed, verified, and downloaded safely.

## Features

- Streaming file transfer (no RAM blowups)
- SHA-256 integrity verification
- Explicit user consent before download
- TCP-based seeder/downloader
- Progress bar for large files
- Handles multi-GB files safely

## Example

```bash
lattice create bigfile.bin
lattice seed bigfile.bin
lattice validate bigfile.bin.lattice
lattice download bigfile.bin.lattice
